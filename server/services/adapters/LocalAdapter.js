const path = require('path');
const fs = require('fs');
const { roadDistanceKm } = require('../distance');
const { isSupabaseEnabled, getSupabaseDestinations } = require('../supabase');

const placesPath = path.join(__dirname, '..', '..', 'data', 'places.json');

function haversineDirect(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

class LocalAdapter {
  constructor() {
    this.name = 'local';
    this.label = 'Pravasa Verified Spatial Directory';
  }

  getPlaces() {
    try {
      return JSON.parse(fs.readFileSync(placesPath, 'utf8'));
    } catch {
      return [];
    }
  }

  /**
   * Search places with spatial bounding box, radius, category, or natural language query
   */
  async search({
    query = '',
    parsedQuery = null,
    bounds = null,
    center = null,
    radiusKm = 60,
    categories = [],
    district = '',
    taluk = '',
    offbeatOnly = false,
    limit = 100,
    offset = 0
  } = {}) {
    let places = null;
    if (isSupabaseEnabled()) {
      try {
        const sbPlaces = await getSupabaseDestinations({ isPublished: true });
        if (sbPlaces && sbPlaces.length > 0) {
          places = sbPlaces;
        }
      } catch (sbErr) {
        console.warn('[LocalAdapter] Supabase fallback to local places.json:', sbErr.message);
      }
    }
    if (!places) {
      places = this.getPlaces();
    }

    // 1. Filter out invalid coordinates
    places = places.filter(p => {
      const lat = p.lat || p.location?.latitude;
      const lng = p.lng || p.location?.longitude;
      return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
    });

    // 2. Filter by bounding box if provided (west, south, east, north)
    if (bounds && !isNaN(bounds.south) && !isNaN(bounds.north) && !isNaN(bounds.west) && !isNaN(bounds.east)) {
      places = places.filter(p => {
        const lat = p.lat || p.location?.latitude;
        const lng = p.lng || p.location?.longitude;
        return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
      });
    }

    // 3. Filter by radial distance from center anchor if provided
    if (center && !isNaN(center.lat) && !isNaN(center.lng)) {
      places = places.map(p => {
        const lat = p.lat || p.location?.latitude;
        const lng = p.lng || p.location?.longitude;
        const distKm = haversineDirect(center.lat, center.lng, lat, lng);
        return {
          ...p,
          distanceKm: Math.round(distKm * 10) / 10,
          roadDistKm: Math.round(roadDistanceKm(center, { lat, lng }) * 10) / 10
        };
      });

      // Filter within radius (default 95km, or matching anchor district or taluk)
      if (radiusKm) {
        places = places.filter(p => {
          const withinRadius = p.distanceKm <= radiusKm;
          const pDist = (p.district || '').toLowerCase();
          const pTaluk = (p.taluk || '').toLowerCase();
          const cName = (center.name || '').toLowerCase();
          const sameDistrict = cName && pDist && (pDist.includes(cName) || cName.includes(pDist));
          const sameTaluk = cName && pTaluk && (pTaluk.includes(cName) || cName.includes(pTaluk));
          return withinRadius || sameDistrict || sameTaluk;
        });
      }

      // Sort by distance from center
      places.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    // Helper for fuzzy phonetic normalization (e.g., thirthahalli <-> tirthahalli)
    const normStr = s => (s || '').toLowerCase().replace(/th/g, 't').replace(/[^a-z0-9]/g, '');

    // 4. Filter by District or Taluk if specified
    if (district) {
      const dLower = district.toLowerCase();
      const dNorm = normStr(district);
      places = places.filter(p => {
        const pDist = (p.district || '').toLowerCase();
        return pDist && (pDist.includes(dLower) || (dLower.length >= 3 && dLower.includes(pDist)) || normStr(pDist).includes(dNorm));
      });
    }
    if (taluk) {
      const tLower = taluk.toLowerCase();
      const tNorm = normStr(taluk);
      places = places.filter(p => {
        const pTaluk = (p.taluk || '').toLowerCase();
        return pTaluk && (pTaluk.includes(tLower) || (tLower.length >= 3 && tLower.includes(pTaluk)) || normStr(pTaluk).includes(tNorm));
      });
    }

    // 5. Filter by Categories
    const activeCats = Array.isArray(categories) ? categories.map(c => c.toLowerCase()) : (categories ? [categories.toLowerCase()] : []);
    if (activeCats.length > 0 && !activeCats.includes('all')) {
      places = places.filter(p => {
        const pType = (p.place_type || '').toLowerCase();
        const pCats = (p.category || []).map(c => c.toLowerCase());
        const pName = (p.name || '').toLowerCase();

        return activeCats.some(c => {
          if (c === 'hidden') return Boolean(p.offbeat);
          if (c === 'lake') {
            return pType === 'lake' || pCats.includes('lake') || pName.includes('lake') || pName.includes('tank') || pName.includes('kere');
          }
          if (c === 'temple') {
            return pType === 'temple' || pType === 'spiritual' || pCats.includes('temple') || pCats.includes('spiritual');
          }
          if (c === 'waterfall') {
            return pType === 'waterfall' || pCats.includes('waterfall') || pName.includes('falls');
          }
          if (c === 'beach') {
            return pType === 'beach' || pCats.includes('beach');
          }
          if (c === 'fort') {
            return pType === 'fort' || pCats.includes('fort') || pName.includes('fort') || pName.includes('kote');
          }
          return pType === c || pCats.includes(c);
        });
      });
    }

    // 6. Filter offbeat / hidden gems if requested
    if (offbeatOnly || parsedQuery?.offbeatOnly) {
      places = places.filter(p => p.offbeat);
    }

    // 7. Text query matching (English & Kannada & aliases with stop-word cleaning)
    const rawQ = (query || '').trim().toLowerCase();
    const cleanQ = rawQ
      .replace(/\b(district|dist|taluk|taluka|tk|city|town|village|place|places|tourist\s+places|in|near|at|around|close\s+to|from|to|ಹತ್ತಿರ|ಜಿಲ್ಲೆ|ತಾಲೂಕು|ನಗರ|ತಾಣಗಳು)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const q = cleanQ || rawQ;

    if (q && (!parsedQuery || !parsedQuery.isSpatialSearch)) {
      const qNorm = normStr(q);
      const tokens = q.split(' ').filter(t => t.length > 2);
      places = places.filter(p => {
        const pName = (p.name || '').toLowerCase();
        const pNameKn = (p.nameKannada || '').toLowerCase();
        const pDist = (p.district || '').toLowerCase();
        const pTaluk = (p.taluk || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        const pType = (p.place_type || '').toLowerCase();
        const pAliases = (p.aliases || []).map(a => a.toLowerCase());

        // 1. Exact or substring match in Name
        if (pName.includes(q) || pNameKn.includes(q) || normStr(pName).includes(qNorm)) return true;

        // 2. District & Taluk match (requires non-empty target)
        if (pDist && (pDist.includes(q) || (q.length >= 3 && q.includes(pDist)) || normStr(pDist).includes(qNorm))) return true;
        if (pTaluk && (pTaluk.includes(q) || (q.length >= 3 && q.includes(pTaluk)) || normStr(pTaluk).includes(qNorm))) return true;

        // 3. Aliases
        if (pAliases.some(a => a.includes(q) || normStr(a).includes(qNorm))) return true;

        // 4. Exact place type
        if (pType && pType === q) return true;

        // 5. Description
        if (pDesc.includes(q)) return true;

        // 6. Token-level check (for multi-word queries)
        if (tokens.length > 0) {
          return tokens.some(t =>
            pName.includes(t) || (pDist && pDist.includes(t)) || (pTaluk && pTaluk.includes(t))
          );
        }
        return false;
      });
    }

    // Intelligent ranking: Boost exact name matches, prefix matches, and alias matches to top
    if (rawQ) {
      places.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aExact = aName === rawQ || (a.nameKannada || '') === rawQ || (a.aliases || []).some(al => al.toLowerCase() === rawQ);
        const bExact = bName === rawQ || (b.nameKannada || '') === rawQ || (b.aliases || []).some(al => al.toLowerCase() === rawQ);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = aName.startsWith(rawQ);
        const bStarts = bName.startsWith(rawQ);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        const aIncludes = aName.includes(rawQ);
        const bIncludes = bName.includes(rawQ);
        if (aIncludes && !bIncludes) return -1;
        if (!aIncludes && bIncludes) return 1;

        if (center && a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        return 0;
      });
    }

    const total = places.length;
    const paginated = places.slice(offset, offset + limit);

    // Format with standard spatial metadata
    const items = paginated.map(p => ({
      id: p.id,
      name: p.name,
      nameKannada: p.nameKannada || '',
      place_type: p.place_type || 'place',
      category: p.category || [p.place_type || 'place'],
      lat: p.lat || p.location?.latitude,
      lng: p.lng || p.location?.longitude,
      district: p.district || '',
      taluk: p.taluk || '',
      division: p.division || '',
      parent_id: p.parent_id || null,
      description: p.description || '',
      shortDescription: p.shortDescription || p.description || '',
      image: p.image || (p.photos?.[0]?.url) || 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Virupaksha_Temple%2C_Hampi.jpg/960px-Virupaksha_Temple%2C_Hampi.jpg',
      imageAttribution: p.imageAttribution || null,
      timeOfDayMedia: p.timeOfDayMedia || null,
      video: p.video || null,
      isPublished: p.isPublished !== undefined ? p.isPublished : true,
      photos: p.photos || [],
      entryFeeINR: p.entryFeeINR || p.visit_info?.entryFeeINR || 0,
      openingHours: p.openingHours || p.visit_info?.openingHours || 'Sunrise to Sunset',
      distanceKm: p.distanceKm,
      crowdLevel: p.crowdLevel || 2,
      offbeat: Boolean(p.offbeat),
      seniorFriendly: Boolean(p.seniorFriendly),
      familyFriendly: Boolean(p.familyFriendly),
      accessibility: p.accessibility || 'Partially accessible. Follow local guidelines.',
      accessibilityScore: p.accessibilityScore || (p.seniorFriendly ? 8 : 6),
      source: p.dataSource || 'Karnataka Tourism / LGD Directory',
      source_url: p.source_url || 'https://karnatakatourism.org',
      verification_status: p.verification_status || 'verified',
      verifiedDate: p.verifiedDate || '2024-01-01',
      provider: 'local'
    }));

    return {
      items,
      total,
      limit,
      offset,
      source: 'local',
      center: center || null,
      bounds: bounds || null
    };
  }

  async getPlaceById(id) {
    let places = null;
    if (isSupabaseEnabled()) {
      try {
        const sbPlaces = await getSupabaseDestinations();
        if (sbPlaces && sbPlaces.length > 0) {
          places = sbPlaces;
        }
      } catch (err) { }
    }
    if (!places) {
      places = this.getPlaces();
    }
    const place = places.find(p => p.id === id || p.aliases?.includes(id));
    if (!place) return null;

    let parentInfo = null;
    if (place.parent_id) {
      const parent = places.find(p => p.id === place.parent_id);
      if (parent) {
        parentInfo = {
          id: parent.id,
          name: parent.name,
          nameKannada: parent.nameKannada,
          place_type: parent.place_type
        };
      }
    }

    return {
      ...place,
      parentInfo,
      provider: 'local',
      verification_status: place.verification_status || 'verified'
    };
  }
}

module.exports = new LocalAdapter();
