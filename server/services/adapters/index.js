const localAdapter = require('./LocalAdapter');
const overpassAdapter = require('./OverpassAdapter');
const googlePlacesAdapter = require('./GooglePlacesAdapter');
const { parseTourismQuery, ANCHOR_COORDINATES } = require('../queryParser');

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Multi-source spatial search orchestrator
 */
async function searchPlaces({
  query = '',
  bounds = null,
  center = null,
  radiusKm = 60,
  categories = [],
  district = '',
  taluk = '',
  offbeatOnly = false,
  userLocation = null,
  limit = 200,
  offset = 0,
  includeOsm = false,
  includeGoogle = false
} = {}) {
  // 1. Natural Language Parse of search query
  const parsed = parseTourismQuery(query, userLocation || center);

  // If parsed query has a spatial anchor (e.g. "near Mysuru"), use anchor as center
  let effectiveCenter = center;
  let effectiveRadiusKm = radiusKm;
  let effectiveCategories = categories.length > 0 ? [...categories] : [];

  if (parsed.anchor) {
    effectiveCenter = { lat: parsed.anchor.lat, lng: parsed.anchor.lng, name: parsed.anchor.name };
    effectiveRadiusKm = parsed.radiusKm || 60;
  }
  if (parsed.categories && parsed.categories.length > 0) {
    effectiveCategories = Array.from(new Set([...effectiveCategories, ...parsed.categories]));
  }
  const effectiveOffbeat = offbeatOnly || parsed.offbeatOnly;

  // Only apply strict district/taluk boundary filtering if explicitly passed by client
  const effectiveDistrict = district || '';
  const effectiveTaluk = taluk || '';

  // 2. Query Local Verified Database (Authoritative Primary Source)
  const needsEnrichment = (includeOsm && overpassAdapter.isAvailable()) || (includeGoogle && googlePlacesAdapter.isAvailable());
  const localResult = await localAdapter.search({
    query: query,
    parsedQuery: parsed,
    bounds,
    center: effectiveCenter,
    radiusKm: effectiveRadiusKm,
    categories: effectiveCategories,
    district: effectiveDistrict,
    taluk: effectiveTaluk,
    offbeatOnly: effectiveOffbeat,
    limit: needsEnrichment ? limit * 2 : limit,
    offset
  });

  let aggregatedItems = [...localResult.items];

  // 3. Optional live external enrichment (OSM Overpass / Google Places)
  if (includeOsm && overpassAdapter.isAvailable()) {
    try {
      const osmResult = await overpassAdapter.search({
        bounds,
        center: effectiveCenter,
        radiusKm: effectiveRadiusKm,
        limit: 25
      });
      if (osmResult.items && osmResult.items.length > 0) {
        // Filter by categories if specified
        let filteredOsm = osmResult.items;
        if (effectiveCategories.length > 0 && !effectiveCategories.includes('all')) {
          filteredOsm = filteredOsm.filter(p => effectiveCategories.includes(p.place_type));
        }

        // Deduplicate against local items by proximity (< 400m) or exact name match
        for (const osmItem of filteredOsm) {
          const isDup = aggregatedItems.some(localItem => {
            const sameName = localItem.name.toLowerCase() === osmItem.name.toLowerCase();
            const distM = haversineM(localItem.lat, localItem.lng, osmItem.lat, osmItem.lng);
            return sameName || distM < 400;
          });
          if (!isDup) {
            aggregatedItems.push(osmItem);
          }
        }
      }
    } catch (e) {
      // Graceful fallback
    }
  }

  // If user requested Google Places live enrichment and key exists
  if (includeGoogle && googlePlacesAdapter.isAvailable()) {
    try {
      const gResult = await googlePlacesAdapter.search({
        query: parsed.normalizedQuery || query,
        center: effectiveCenter,
        radiusKm: effectiveRadiusKm,
        limit: 20
      });
      if (gResult.items && gResult.items.length > 0) {
        for (const gItem of gResult.items) {
          const isDup = aggregatedItems.some(item => {
            const sameName = item.name.toLowerCase() === gItem.name.toLowerCase();
            const distM = haversineM(item.lat, item.lng, gItem.lat, gItem.lng);
            return sameName || distM < 300;
          });
          if (!isDup) {
            aggregatedItems.push(gItem);
          }
        }
      }
    } catch {}
  }

  // Sort by relevancy and distance (safely handling 0 distanceKm without falsy bug)
  const cleanQ = (query || '').trim().toLowerCase();
  if (effectiveCenter && !isNaN(effectiveCenter.lat) && !isNaN(effectiveCenter.lng)) {
    aggregatedItems = aggregatedItems.map(item => {
      if (item.distanceKm === undefined || item.distanceKm === null) {
        item.distanceKm = Math.round((haversineM(effectiveCenter.lat, effectiveCenter.lng, item.lat, item.lng) / 1000) * 10) / 10;
      }
      return item;
    });
  }

  aggregatedItems.sort((a, b) => {
    if (cleanQ) {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const aExact = aName === cleanQ || (a.nameKannada || '') === cleanQ || (a.aliases || []).some(al => al.toLowerCase() === cleanQ);
      const bExact = bName === cleanQ || (b.nameKannada || '') === cleanQ || (b.aliases || []).some(al => al.toLowerCase() === cleanQ);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = aName.startsWith(cleanQ);
      const bStarts = bName.startsWith(cleanQ);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
    }

    const distA = a.distanceKm !== undefined && a.distanceKm !== null ? a.distanceKm : 9999;
    const distB = b.distanceKm !== undefined && b.distanceKm !== null ? b.distanceKm : 9999;
    return distA - distB;
  });

  const finalItems = aggregatedItems.slice(0, limit);

  return {
    items: finalItems,
    total: needsEnrichment ? aggregatedItems.length : localResult.total,
    parsedQuery: {
      rawQuery: query,
      detectedCategory: parsed.category,
      detectedCategories: parsed.categories,
      detectedAnchor: parsed.anchor ? parsed.anchor.name : null,
      isSpatialSearch: parsed.isSpatialSearch,
      offbeatOnly: effectiveOffbeat
    },
    effectiveCenter,
    sourcesUsed: ['local', ...(includeOsm ? ['osm'] : []), ...(includeGoogle ? ['google'] : [])],
    dataLimitations: 'Contains verified Karnataka places from Local Government Directory (LGD) and Karnataka Tourism. OSM / Google coverage is complementary.'
  };
}

module.exports = {
  localAdapter,
  overpassAdapter,
  googlePlacesAdapter,
  searchPlaces,
  ANCHOR_COORDINATES
};

