import { fetchDestinationsFromSupabase, isSupabaseConfigured } from './supabase';

/**
 * Fetch destinations from Supabase PostgreSQL (Single Source of Truth).
 * Falls back to local Express API if Supabase is temporarily unreachable.
 */
export async function fetchPlaces(params = {}) {
  // 1. Direct Supabase Query (Single Central Source of Truth)
  if (isSupabaseConfigured) {
    try {
      const sbPlaces = await fetchDestinationsFromSupabase(params);
      if (sbPlaces && sbPlaces.length > 0) {
        let filtered = sbPlaces;
        if (params.q || params.search) {
          const query = (params.q || params.search).toLowerCase().trim();
          filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.nameKannada && p.nameKannada.includes(query)) ||
            (p.district && p.district.toLowerCase().includes(query)) ||
            (p.taluk && p.taluk.toLowerCase().includes(query)) ||
            (p.description && p.description.toLowerCase().includes(query))
          );
        }
        if (params.category && params.category !== 'all') {
          filtered = filtered.filter(p => (p.category || []).includes(params.category) || p.place_type === params.category);
        }
        return filtered;
      }
    } catch (err) {
      console.warn('[fetchPlaces] Supabase query fallback to API:', err.message);
    }
  }

  // 2. Fallback to API route
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, v); });
  qs.set('_t', Date.now());
  const url = '/api/places?' + qs.toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch places: ' + res.status);
  const json = await res.json();
  return Array.isArray(json) ? json : json.data || [];
}
