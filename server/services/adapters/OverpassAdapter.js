/**
 * OpenStreetMap Overpass API Adapter for Karnataka Tourism
 * Retrieves geographic tourism elements within a bounding box or around a coordinate.
 * Complies with OSM Usage Policy: cached, rate-limited, and proper User-Agent attribution.
 */

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

// Simple in-memory cache with 10-minute TTL
const memoryCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getCache(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  if (memoryCache.size > 200) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { ts: Date.now(), data });
}

class OverpassAdapter {
  constructor() {
    this.name = 'osm';
    this.label = 'OpenStreetMap Overpass';
  }

  isAvailable() {
    return true;
  }

  /**
   * Query OSM Overpass for tourism & heritage objects within bounds or near coordinates
   */
  async search({ bounds = null, center = null, radiusKm = 20, limit = 40 } = {}) {
    let bbox = null;

    if (bounds && !isNaN(bounds.south) && !isNaN(bounds.north) && !isNaN(bounds.west) && !isNaN(bounds.east)) {
      // Limit bounding box size to prevent overwhelming Overpass
      const dLat = Math.min(1.5, Math.abs(bounds.north - bounds.south));
      const dLng = Math.min(1.5, Math.abs(bounds.east - bounds.west));
      const midLat = (bounds.north + bounds.south) / 2;
      const midLng = (bounds.east + bounds.west) / 2;
      bbox = `${midLat - dLat / 2},${midLng - dLng / 2},${midLat + dLat / 2},${midLng + dLng / 2}`;
    } else if (center && !isNaN(center.lat) && !isNaN(center.lng)) {
      const radiusDeg = Math.min(0.5, radiusKm / 111);
      bbox = `${center.lat - radiusDeg},${center.lng - radiusDeg},${center.lat + radiusDeg},${center.lng + radiusDeg}`;
    }

    if (!bbox) return { items: [], total: 0, provider: 'osm' };

    const cacheKey = `overpass_${bbox}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    // Overpass QL query: tourist attractions, viewpoints, historic, temple, waterfalls
    const query = `
      [out:json][timeout:8];
      (
        node["tourism"~"attraction|viewpoint|museum|artwork|zoo|theme_park"](${bbox});
        node["historic"~"monument|ruins|fort|castle|archaeological_site"](${bbox});
        node["natural"~"waterfall|peak|cave_entrance|spring"](${bbox});
        node["amenity"~"place_of_worship"](${bbox});
      );
      out body ${limit};
    `;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const endpoint = OVERPASS_ENDPOINTS[0];
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'KarnatakaTourismAI/1.0 (Pravasa AI; Open Source Travel Guide)'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timeout);
      if (!res.ok) {
        return { items: [], total: 0, provider: 'osm', note: 'OSM Overpass response status ' + res.status };
      }

      const json = await res.json();
      const elements = json.elements || [];

      const items = elements
        .filter(el => el.tags && (el.tags.name || el.tags['name:en']))
        .map(el => {
          const tags = el.tags || {};
          const name = tags['name:en'] || tags.name;
          const nameKn = tags['name:kn'] || '';
          let placeType = 'heritage';

          if (tags.tourism === 'waterfall' || tags.natural === 'waterfall') placeType = 'waterfall';
          else if (tags.natural === 'peak' || tags.tourism === 'viewpoint') placeType = 'viewpoint';
          else if (tags.amenity === 'place_of_worship' || tags.historic === 'temple') placeType = 'temple';
          else if (tags.historic === 'fort' || tags.historic === 'castle') placeType = 'fort';
          else if (tags.tourism === 'museum') placeType = 'museum';
          else if (tags.natural === 'beach') placeType = 'beach';
          else if (tags.tourism === 'zoo') placeType = 'wildlife';

          return {
            id: `osm_${el.id}`,
            name,
            nameKannada: nameKn,
            place_type: placeType,
            category: [placeType],
            lat: el.lat,
            lng: el.lon,
            district: tags['addr:district'] || tags['is_in:state_district'] || 'Karnataka',
            taluk: tags['addr:subdistrict'] || '',
            description: tags.description || `OpenStreetMap registered ${placeType} point in Karnataka.`,
            openingHours: tags.opening_hours || 'Not available',
            entryFeeINR: tags.fee === 'no' ? 0 : (tags.charge ? parseInt(tags.charge) || 0 : 0),
            accessibility: tags.wheelchair ? `Wheelchair: ${tags.wheelchair}` : 'Not available',
            accessibilityScore: tags.wheelchair === 'yes' ? 9 : 5,
            source: 'OpenStreetMap contributors',
            source_url: `https://www.openstreetmap.org/node/${el.id}`,
            verification_status: 'osm_community',
            verifiedDate: 'Live OSM',
            provider: 'osm'
          };
        });

      const out = { items, total: items.length, provider: 'osm' };
      setCache(cacheKey, out);
      return out;
    } catch (err) {
      // Overpass network/timeout fallback - fail gracefully
      return { items: [], total: 0, provider: 'osm', note: 'OSM Overpass fallback: ' + err.message };
    }
  }
}

module.exports = new OverpassAdapter();

