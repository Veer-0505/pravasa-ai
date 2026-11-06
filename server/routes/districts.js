const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getLiveWeather } = require('../services/weather');
const { isSupabaseEnabled, getSupabaseDestinations } = require('../services/supabase');

const dataDir = path.join(__dirname, '..', 'data');
const districtsFile = path.join(dataDir, 'districts.json');
const districtsDir = path.join(dataDir, 'districts');
const taluksFile = path.join(dataDir, 'taluks.json');
const placesFile = path.join(dataDir, 'places.json');

function readJsonSafe(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`[Districts Route] Error reading ${filePath}:`, err.message);
    return fallback;
  }
}

/**
 * GET /api/districts
 * Returns all 31 districts of Karnataka with metadata, live counts, and top attraction previews
 */
router.get('/', (req, res) => {
  const { division } = req.query;
  let districts = readJsonSafe(districtsFile, []);

  if (division) {
    districts = districts.filter(d => d.division.toLowerCase() === division.toLowerCase());
  }

  res.json({
    ok: true,
    total: districts.length,
    districts
  });
});

/**
 * GET /api/districts/taluks
 * Returns all 230 taluks mapped to their districts
 */
router.get('/taluks/all', (req, res) => {
  const { district } = req.query;
  let taluks = readJsonSafe(taluksFile, []);

  if (district) {
    const q = district.toLowerCase();
    taluks = taluks.filter(t => t.districtName.toLowerCase() === q || t.districtId.toLowerCase() === q);
  }

  res.json({
    ok: true,
    total: taluks.length,
    taluks
  });
});

/**
 * GET /api/districts/:id
 * Dedicated district tourism page data: full overview, destinations categorized, live weather
 */
router.get('/:id', async (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  const districtId = req.params.id.toLowerCase();
  const districts = readJsonSafe(districtsFile, []);
  
  // Find district by id or name
  const district = districts.find(d => 
    d.id.toLowerCase() === districtId || 
    d.name.toLowerCase() === districtId.replace(/_/g, ' ') ||
    d.name.toLowerCase().replace(/\s+/g, '_') === districtId
  );

  if (!district) {
    return res.status(404).json({ error: `District '${districtId}' not found`, available: districts.map(d => d.id) });
  }

  // Read destinations from Supabase PostgreSQL as primary Single Source of Truth
  let destinations = [];
  if (isSupabaseEnabled()) {
    try {
      const sbDest = await getSupabaseDestinations({ district: district.name, isPublished: true });
      if (sbDest && sbDest.length > 0) {
        destinations = sbDest;
      }
    } catch (sbErr) {
      console.warn('[Districts Route] Supabase query fallback:', sbErr.message);
    }
  }

  // Fallback to places.json if Supabase is offline or returned no results
  if (destinations.length === 0) {
    const allPlaces = readJsonSafe(placesFile, []);
    const dName = district.name.toLowerCase();
    const dId = district.id.toLowerCase();
    destinations = allPlaces.filter(p => {
      const pDist = (p.district || '').toLowerCase();
      return pDist === dName || pDist === dId || pDist.replace(/\s+/g, '_') === dId;
    });

    if (destinations.length === 0) {
      const modularFile = path.join(districtsDir, `${district.id}.json`);
      if (fs.existsSync(modularFile)) {
        const modularData = readJsonSafe(modularFile, {});
        destinations = modularData.destinations || [];
      }
    }
  }

  // Fetch live weather for district headquarters
  let weather = null;
  if (district.lat && district.lng) {
    weather = await getLiveWeather(district.lat, district.lng);
  }

  // Compute fresh topSpots dynamically from master places
  const freshTopSpots = destinations.slice(0, 8).map(p => ({
    id: p.id,
    name: p.name,
    nameKannada: p.nameKannada || p.name,
    image: p.image,
    category: Array.isArray(p.category) ? p.category : [p.category || 'heritage'],
    entryFeeINR: p.entryFeeINR || 0,
    avgVisitHours: p.estimatedVisitDuration ? parseInt(p.estimatedVisitDuration) || 2 : 2,
    hiddenGemStatus: p.hiddenGemClassification?.status || (p.offbeat ? 'hidden_gem' : 'popular')
  }));

  // Categorize destinations
  const hiddenGems = destinations.filter(p => {
    const status = p.hiddenGemClassification?.status || '';
    return status === 'hidden_gem' || status === 'lesser_known' || p.offbeat === true;
  });

  const popular = destinations.filter(p => {
    const status = p.hiddenGemClassification?.status || '';
    return status === 'popular' || (!p.offbeat && p.crowdLevel >= 2);
  });

  const heritage = destinations.filter(p => {
    const cat = p.category || [];
    const sub = (p.subcategory || '').toLowerCase();
    return cat.includes('heritage') || cat.includes('monument') || sub.includes('fort') || sub.includes('monument');
  });

  const spiritual = destinations.filter(p => {
    const cat = p.category || [];
    const sub = (p.subcategory || '').toLowerCase();
    return cat.includes('spiritual') || cat.includes('temple') || sub.includes('temple') || sub.includes('basadi') || sub.includes('dargah') || sub.includes('pilgrimage');
  });

  const nature = destinations.filter(p => {
    const cat = p.category || [];
    const sub = (p.subcategory || '').toLowerCase();
    return cat.includes('nature') || cat.includes('waterfall') || cat.includes('scenic') || sub.includes('waterfall') || sub.includes('lake') || sub.includes('sanctuary');
  });

  const adventure = destinations.filter(p => {
    const cat = p.category || [];
    const sub = (p.subcategory || '').toLowerCase();
    return cat.includes('adventure') || sub.includes('trek') || sub.includes('peak') || sub.includes('rafting') || (p.trekkingDifficulty && p.trekkingDifficulty !== 'None');
  });

  const culture = destinations.filter(p => {
    const cat = p.category || [];
    const sub = (p.subcategory || '').toLowerCase();
    return cat.includes('culture') || sub.includes('craft') || sub.includes('village') || sub.includes('food') || sub.includes('market');
  });

  // Generate suggested itineraries based on top spots
  const suggestedRoutes = [
    {
      title: `1-Day Highlights of ${district.name}`,
      titleKannada: `${district.nameKannada} ೧ ದಿನದ ಪ್ರಮುಖ ಪ್ರವಾಸ`,
      duration: "1 Day (8 - 10 hours)",
      stops: destinations.slice(0, 3).map(p => ({
        name: p.name,
        nameKannada: p.nameKannada,
        time: p.estimatedVisitDuration || "2 hours",
        tip: p.safetyInstructions || "Start early morning"
      }))
    },
    {
      title: `2-Day Heritage & Hidden Gems Circuit`,
      titleKannada: `೨ ದಿನಗಳ ಪರಂಪರೆ ಮತ್ತು ಗುಪ್ತ ತಾಣಗಳ ಪ್ರವಾಸ`,
      duration: "2 Days (Weekend Circuit)",
      stops: [
        ...(destinations.slice(0, 2)),
        ...(hiddenGems.slice(0, 2))
      ].map(p => ({
        name: p.name,
        nameKannada: p.nameKannada,
        time: p.estimatedVisitDuration || "2 hours",
        status: p.hiddenGemClassification?.status || "popular"
      }))
    }
  ];

  res.json({
    ok: true,
    district: {
      ...district,
      topSpots: freshTopSpots.length > 0 ? freshTopSpots : (district.topSpots || []),
      attractionCount: destinations.length,
      totalDestinations: destinations.length,
      weather
    },
    counts: {
      total: destinations.length,
      hiddenGems: hiddenGems.length,
      popular: popular.length,
      heritage: heritage.length,
      spiritual: spiritual.length,
      nature: nature.length,
      adventure: adventure.length,
      culture: culture.length
    },
    categories: {
      all: destinations,
      hiddenGems,
      popular,
      heritage,
      spiritual,
      nature,
      adventure,
      culture
    },
    suggestedRoutes
  });
});

/**
 * GET /api/districts/:id/destinations
 * Filterable destination listing within a specific district
 */
router.get('/:id/destinations', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  const districtId = req.params.id.toLowerCase();
  const { category, taluk, hidden_gem, q } = req.query;

  const districts = readJsonSafe(districtsFile, []);
  const district = districts.find(d => d.id === districtId || d.name.toLowerCase() === districtId);
  if (!district) {
    return res.status(404).json({ error: 'District not found' });
  }

  const allPlaces = readJsonSafe(placesFile, []);
  const dName = district.name.toLowerCase();
  const dId = district.id.toLowerCase();
  let destinations = allPlaces.filter(p => {
    const pDist = (p.district || '').toLowerCase();
    return pDist === dName || pDist === dId || pDist.replace(/\s+/g, '_') === dId;
  });

  if (destinations.length === 0) {
    const modularFile = path.join(districtsDir, `${district.id}.json`);
    if (fs.existsSync(modularFile)) {
      destinations = readJsonSafe(modularFile, {}).destinations || [];
    }
  }

  // Filters
  if (taluk) {
    destinations = destinations.filter(p => (p.taluk || '').toLowerCase() === taluk.toLowerCase());
  }

  if (category && category !== 'all') {
    destinations = destinations.filter(p => {
      const cats = Array.isArray(p.category) ? p.category : [p.category];
      return cats.some(c => c && c.toLowerCase() === category.toLowerCase()) || 
             (p.subcategory || '').toLowerCase().includes(category.toLowerCase());
    });
  }

  if (hidden_gem === 'true') {
    destinations = destinations.filter(p => 
      p.hiddenGemClassification?.status === 'hidden_gem' || 
      p.hiddenGemClassification?.status === 'lesser_known' || 
      p.offbeat === true
    );
  }

  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    destinations = destinations.filter(p => 
      (p.name || '').toLowerCase().includes(term) ||
      (p.nameKannada || '').includes(term) ||
      (p.description || '').toLowerCase().includes(term) ||
      (p.taluk || '').toLowerCase().includes(term)
    );
  }

  res.json({
    ok: true,
    district: district.name,
    total: destinations.length,
    destinations
  });
});

module.exports = router;

