const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { searchPlaces, localAdapter, overpassAdapter, googlePlacesAdapter, ANCHOR_COORDINATES } = require('../services/adapters');

const placesPath = path.join(__dirname, '..', 'data', 'places.json');

function getPlaces() {
  return JSON.parse(fs.readFileSync(placesPath, 'utf8'));
}

/**
 * GET /api/map/markers
 * Returns verified places inside the visible map area or matching filters
 * Query params: west, south, east, north, zoom, limit, types, q, nearLat, nearLng, radius, includeOsm, includeGoogle
 */
router.get('/markers', async (req, res) => {
  try {
    const west = parseFloat(req.query.west);
    const south = parseFloat(req.query.south);
    const east = parseFloat(req.query.east);
    const north = parseFloat(req.query.north);
    const limit = Math.min(10000, Math.max(1, parseInt(req.query.limit) || 3000));
    const typesParam = req.query.types || req.query.type;
    const requestedTypes = typesParam ? typesParam.split(',').map(t => t.trim().toLowerCase()) : [];
    const query = req.query.q || req.query.search || '';
    const nearLat = parseFloat(req.query.nearLat || req.query.lat);
    const nearLng = parseFloat(req.query.nearLng || req.query.lng);
    const radiusKm = parseFloat(req.query.radius || req.query.radiusKm) || 60;
    const includeOsm = req.query.includeOsm === 'true';
    const includeGoogle = req.query.includeGoogle === 'true';
    const district = req.query.district || '';
    const taluk = req.query.taluk || '';
    const offbeatOnly = req.query.offbeat === 'true' || req.query.offbeatOnly === 'true';

    let bounds = null;
    if (!isNaN(west) && !isNaN(south) && !isNaN(east) && !isNaN(north)) {
      if (south >= north) {
        return res.status(400).json({ error: 'Invalid map bounds: south must be less than north' });
      }
      bounds = { west, south, east, north };
    }

    let center = null;
    if (!isNaN(nearLat) && !isNaN(nearLng)) {
      center = { lat: nearLat, lng: nearLng };
    }

    const result = await searchPlaces({
      query,
      bounds,
      center,
      radiusKm,
      categories: requestedTypes,
      district,
      taluk,
      offbeatOnly,
      limit,
      includeOsm,
      includeGoogle
    });

    res.json(result);
  } catch (err) {
    console.error('[Map Markers Error]', err);
    res.status(500).json({ error: 'Failed to retrieve markers', message: err.message });
  }
});

/**
 * GET /api/map/search
 * Google Maps-style place discovery with natural query parsing
 * e.g. "temples near Mysuru", "waterfalls near Shivamogga", "hidden places near Hampi"
 */
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || req.query.query || '';
    const nearLat = parseFloat(req.query.lat || req.query.userLat);
    const nearLng = parseFloat(req.query.lng || req.query.userLng);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
    const categories = req.query.category ? req.query.category.split(',').map(c => c.trim()) : [];
    const includeOsm = req.query.includeOsm === 'true';

    let userLocation = null;
    if (!isNaN(nearLat) && !isNaN(nearLng)) {
      userLocation = { lat: nearLat, lng: nearLng };
    }

    const result = await searchPlaces({
      query: q,
      userLocation,
      center: userLocation,
      categories,
      limit,
      includeOsm
    });

    res.json(result);
  } catch (err) {
    console.error('[Map Search Error]', err);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

/**
 * GET /api/map/districts
 * Returns all 31 Karnataka districts with their center coordinates, taluks, and attraction counts
 */
router.get('/districts', (req, res) => {
  const districtsPath = path.join(__dirname, '..', 'data', 'districts.json');
  if (fs.existsSync(districtsPath)) {
    try {
      const districtsList = JSON.parse(fs.readFileSync(districtsPath, 'utf8'));
      return res.json({
        districts: districtsList.map(d => ({
          id: d.id,
          name: d.name,
          district: d.name,
          nameKannada: d.nameKannada || '',
          division: d.division || '',
          lat: d.lat,
          lng: d.lng,
          talukCount: (d.taluks || []).length,
          attractionCount: d.attractionCount || 0,
          taluks: (d.taluks || []).map(t => ({ name: t })),
          description: d.description || ''
        })),
        total: districtsList.length
      });
    } catch (e) {
      console.error('[Map Districts Error]', e);
    }
  }

  const places = getPlaces();
  const districtPlaces = places.filter(p => p.place_type === 'district');

  const list = districtPlaces.map(d => {
    const districtName = d.district || d.name.replace(' District', '');
    const taluksInDistrict = places.filter(p => p.place_type === 'taluk' && p.district?.toLowerCase() === districtName.toLowerCase());
    const attractionsInDistrict = places.filter(p => !['district', 'taluk', 'town', 'village'].includes(p.place_type) && p.district?.toLowerCase() === districtName.toLowerCase());

    return {
      id: d.id,
      name: d.name,
      district: districtName,
      nameKannada: d.nameKannada || '',
      division: d.division || '',
      lat: d.lat,
      lng: d.lng,
      talukCount: taluksInDistrict.length,
      attractionCount: attractionsInDistrict.length,
      taluks: taluksInDistrict.map(t => ({ id: t.id, name: t.name, nameKannada: t.nameKannada, lat: t.lat, lng: t.lng })),
      description: d.description || ''
    };
  });

  res.json({
    districts: list,
    total: list.length
  });
});

/**
 * GET /api/map/coverage
 * Transparent documentation of data sources, verification status, and known limitations
 */
router.get('/coverage', (req, res) => {
  const places = getPlaces();
  const byType = {};
  places.forEach(p => {
    const t = p.place_type || 'other';
    byType[t] = (byType[t] || 0) + 1;
  });

  res.json({
    ok: true,
    totalEntities: places.length,
    byCategory: byType,
    verifiedCoordinatesCount: places.filter(p => p.lat && p.lng).length,
    geofenceBounds: {
      south: 11.5,
      north: 18.6,
      west: 74.0,
      east: 78.6,
      description: 'Strict Karnataka geographical boundaries'
    },
    sources: [
      {
        id: 'local_lgd',
        name: 'Local Government Directory (LGD), Ministry of Panchayati Raj, Govt of India',
        role: 'Authoritative administrative master for 31 districts, taluks, and villages',
        license: 'Open Government Data (OGD) India'
      },
      {
        id: 'karnataka_tourism',
        name: 'Department of Tourism, Government of Karnataka & KSTDC',
        role: 'Verified destination itineraries, ticket fees, timings, and tourist facilities',
        url: 'https://karnatakatourism.org'
      },
      {
        id: 'osm',
        name: 'OpenStreetMap & Overpass API',
        role: 'Supplementary geographic nodes and community-mapped tourism features',
        license: 'Open Database License (ODbL) 1.0',
        active: overpassAdapter.isAvailable()
      },
      {
        id: 'google_places',
        name: 'Google Maps Platform Places API',
        role: 'Commercial live place search proxy (server-side only)',
        configured: googlePlacesAdapter.hasKey()
      }
    ],
    knownLimitations: [
      'Google Maps and OpenStreetMap contain different information; neither source guarantees that every tourist location is listed.',
      'Hidden gems are classified based on footfall criteria (<2/4 crowd level, offbeat tag, nature/archaeological significance); unverified submissions are marked for inspection.',
      'Coordinates are checked against WGS84 Karnataka boundary polygon. Off-boundary records are excluded.',
      'Timings and entry fees are verified from official sources; unavailable fields are explicitly shown as "Not available".'
    ]
  });
});

/**
 * GET /api/map/markers/sample-csv
 * Returns a template CSV for importing verified Karnataka administrative & attraction records
 */
router.get('/sample-csv', (req, res) => {
  const sample = `id,name,nameKannada,place_type,parent_id,district,taluk,latitude,longitude,description,openingHours,entryFeeINR,source_url,verification_status
village_kamalapura,Kamalapura,ಕಮಲಾಪುರ,village,taluk_hospet,Vijayanagara,Hospet,15.3120,76.4750,"Historic village adjacent to Hampi ruins with Archaeological Museum.",Sunrise to Sunset,0,https://lgdirectory.gov.in,verified
fort_bellary,Ballari Fort Upper,ಬಳ್ಳಾರಿ ಮೇಲ್ಕೋಟೆ,fort,dist_ballari,Ballari,Ballari,15.1500,76.9200,"Historic rock fort built on a monolithic hill by Hanumappa Nayaka.",06:00 – 18:00,25,https://karnatakatourism.org,verified
`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="karnataka_places_template.csv"');
  res.send(sample);
});

module.exports = router;
