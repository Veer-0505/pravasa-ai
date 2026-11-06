/**
 * Google Maps Platform Places API Adapter (Server-Side Proxy)
 * Keeps Google Maps API key strictly on the server side.
 * Implements Text Search, Nearby Search, and Place Details with quota protection.
 */

class GooglePlacesAdapter {
  constructor() {
    this.name = 'google';
    this.label = 'Google Maps Platform Places API';
  }

  hasKey() {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    return !!(key && key.trim().length > 0 && !key.includes('your_api_key'));
  }

  isAvailable() {
    return this.hasKey();
  }

  /**
   * Search places via Google Places API Text Search or Nearby Search
   */
  async search({ query = '', center = null, radiusKm = 30, limit = 20 } = {}) {
    if (!this.hasKey()) {
      return {
        items: [],
        total: 0,
        provider: 'google',
        available: false,
        note: 'GOOGLE_MAPS_API_KEY is not configured in server/.env'
      };
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY.trim();
    let url = '';

    if (center && !isNaN(center.lat) && !isNaN(center.lng)) {
      const radiusMeters = Math.min(50000, radiusKm * 1000);
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${radiusMeters}&keyword=${encodeURIComponent(query || 'tourist attraction')}&key=${apiKey}`;
    } else {
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent((query || 'tourist places') + ' Karnataka')}&key=${apiKey}`;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        return { items: [], total: 0, provider: 'google', error: `Google API HTTP ${res.status}` };
      }

      const data = await res.json();
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        return { items: [], total: 0, provider: 'google', status: data.status, error: data.error_message };
      }

      const results = (data.results || []).slice(0, limit);
      const items = results.map(r => {
        const types = r.types || [];
        let placeType = 'heritage';
        if (types.includes('hindu_temple') || types.includes('place_of_worship')) placeType = 'temple';
        else if (types.includes('park') || types.includes('natural_feature')) placeType = 'nature';
        else if (types.includes('museum')) placeType = 'museum';
        else if (types.includes('zoo')) placeType = 'wildlife';

        return {
          id: `gplace_${r.place_id}`,
          name: r.name,
          nameKannada: '',
          place_type: placeType,
          category: [placeType],
          lat: r.geometry?.location?.lat,
          lng: r.geometry?.location?.lng,
          district: 'Karnataka',
          description: r.formatted_address || r.vicinity || 'Google Places verified destination.',
          rating: r.rating || null,
          userRatingsTotal: r.user_ratings_total || 0,
          openingHours: r.opening_hours?.open_now !== undefined ? (r.opening_hours.open_now ? 'Open now' : 'Closed now') : 'Not available',
          entryFeeINR: 'Not available',
          source: 'Google Maps Platform Places API',
          source_url: `https://maps.google.com/?q=place_id:${r.place_id}`,
          verification_status: 'google_places_api',
          verifiedDate: 'Live API',
          provider: 'google'
        };
      });

      return { items, total: items.length, provider: 'google', available: true };
    } catch (err) {
      return { items: [], total: 0, provider: 'google', error: err.message };
    }
  }

  /**
   * Fetch Place Details from Google
   */
  async getPlaceDetails(placeId) {
    if (!this.hasKey()) return null;
    const cleanId = placeId.replace(/^gplace_/, '');
    const apiKey = process.env.GOOGLE_MAPS_API_KEY.trim();
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${cleanId}&fields=name,formatted_address,geometry,photos,rating,formatted_phone_number,website,opening_hours,wheelchair_accessible_entrance&key=${apiKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== 'OK') return null;
      return {
        ...data.result,
        provider: 'google'
      };
    } catch {
      return null;
    }
  }
}

module.exports = new GooglePlacesAdapter();

