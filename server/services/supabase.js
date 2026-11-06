const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('YOUR_SUPABASE')
);

const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

function isSupabaseEnabled() {
  return isConfigured && supabase !== null;
}

/**
 * Fetch destinations from Supabase PostgreSQL
 */
async function getSupabaseDestinations(filter = {}) {
  if (!isSupabaseEnabled()) return null;

  try {
    let query = supabase.from('destinations').select('*, destination_categories(category)');

    if (filter.isPublished !== undefined) {
      query = query.eq('is_published', filter.isPublished);
    }

    if (filter.district) {
      query = query.ilike('district', `%${filter.district}%`);
    }

    if (filter.taluk) {
      query = query.ilike('taluk', `%${filter.taluk}%`);
    }

    if (filter.offbeat !== undefined) {
      query = query.eq('offbeat', filter.offbeat);
    }

    query = query.order('name', { ascending: true });

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Map database snake_case columns back to standard frontend camelCase properties
    return data.map(d => {
      const categories = d.destination_categories && Array.isArray(d.destination_categories)
        ? d.destination_categories.map(c => typeof c === 'string' ? c : c.category)
        : [d.place_type || 'heritage'];

      return {
        id: d.id,
        name: d.name,
        nameKannada: d.name_kannada || d.name,
        district: d.district,
        taluk: d.taluk || d.district,
        division: d.division || '',
        place_type: d.place_type || 'attraction',
        category: categories,
        categories,
        lat: typeof d.lat === 'number' ? d.lat : parseFloat(d.lat),
        lng: typeof d.lng === 'number' ? d.lng : parseFloat(d.lng),
        location: {
          latitude: typeof d.lat === 'number' ? d.lat : parseFloat(d.lat),
          longitude: typeof d.lng === 'number' ? d.lng : parseFloat(d.lng)
        },
        description: d.description || '',
        shortDescription: d.short_description || d.description || '',
        image: d.image || '',
        imageAttribution: d.image_attribution || {
          source: 'Karnataka Tourism / LGD Directory',
          license: 'CC BY-SA 4.0 / Public Domain'
        },
        timeOfDayMedia: d.time_of_day_media || null,
        video: d.video || null,
        entryFeeINR: typeof d.entry_fee_inr === 'number' ? d.entry_fee_inr : parseInt(d.entry_fee_inr || 0, 10),
        openingHours: d.opening_hours || '06:00 - 18:00',
        contact: d.contact || '1800-425-4425',
        official_website: d.official_website || 'https://karnatakatourism.org',
        accessibility: d.accessibility || 'Partially accessible',
        accessibilityScore: d.accessibility_score || 6,
        parking: d.parking !== undefined ? Boolean(d.parking) : true,
        offbeat: d.offbeat !== undefined ? Boolean(d.offbeat) : false,
        isPublished: d.is_published !== undefined ? Boolean(d.is_published) : true,
        verification_status: d.verification_status || 'verified',
        verifiedDate: d.verified_date || '',
        source: d.source || 'Department of Tourism, Government of Karnataka',
        source_url: d.source_url || 'https://karnatakatourism.org',
        googleMapsUrl: d.time_of_day_media?.googleMapsUrl || d.source_url || '',
        crowdLevel: d.crowd_level || 2,
        seniorFriendly: d.senior_friendly !== undefined ? Boolean(d.senior_friendly) : true,
        familyFriendly: d.family_friendly !== undefined ? Boolean(d.family_friendly) : true,
        lastUpdatedBy: d.last_updated_by || 'Gov Tourism Admin'
      };
    });
  } catch (err) {
    console.error('[Supabase Fetch Error]', err.message);
    return null;
  }
}

/**
 * Upsert destination into Supabase PostgreSQL
 */
async function upsertSupabaseDestination(place) {
  if (!isSupabaseEnabled()) return null;

  try {
    const parsedLat = parseFloat(place.lat);
    const parsedLng = parseFloat(place.lng);

    // Extract coordinates from Google Maps URL if lat/lng not provided
    let finalLat = !isNaN(parsedLat) ? parsedLat : 15.3350;
    let finalLng = !isNaN(parsedLng) ? parsedLng : 76.4600;
    const gUrl = place.googleMapsUrl || place.timeOfDayMedia?.googleMapsUrl || (place.source_url && place.source_url.includes('maps') ? place.source_url : '');
    
    if (gUrl && (isNaN(parsedLat) || isNaN(parsedLng))) {
      const match = gUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || gUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) || gUrl.match(/destination=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        finalLat = parseFloat(match[1]);
        finalLng = parseFloat(match[2]);
      }
    }

    const payload = {
      id: place.id,
      name: place.name,
      name_kannada: place.nameKannada || place.name,
      district: place.district,
      taluk: place.taluk || place.district,
      division: place.division || '',
      place_type: place.place_type || 'attraction',
      lat: finalLat,
      lng: finalLng,
      description: place.description || '',
      short_description: place.shortDescription || place.description || '',
      image: place.image,
      image_attribution: place.imageAttribution || {},
      time_of_day_media: {
        ...(place.timeOfDayMedia || {}),
        googleMapsUrl: gUrl || place.timeOfDayMedia?.googleMapsUrl || ''
      },
      video: place.video || {},
      entry_fee_inr: parseInt(place.entryFeeINR || 0, 10) || 0,
      opening_hours: place.openingHours || '06:00 - 18:00',
      contact: place.contact || '1800-425-4425',
      official_website: place.official_website || 'https://karnatakatourism.org',
      accessibility: place.accessibility || 'Partially accessible',
      accessibility_score: parseInt(place.accessibilityScore || 6, 10) || 6,
      parking: place.parking !== undefined ? Boolean(place.parking) : true,
      offbeat: place.offbeat !== undefined ? Boolean(place.offbeat) : false,
      is_published: place.isPublished !== undefined ? Boolean(place.isPublished) : true,
      verification_status: place.verification_status || 'verified',
      verified_date: place.verifiedDate || new Date().toISOString().split('T')[0],
      source: place.source || 'Department of Tourism, Government of Karnataka',
      source_url: gUrl || place.source_url || 'https://karnatakatourism.org',
      crowd_level: place.crowdLevel || 2,
      senior_friendly: place.seniorFriendly !== undefined ? Boolean(place.seniorFriendly) : true,
      family_friendly: place.familyFriendly !== undefined ? Boolean(place.familyFriendly) : true,
      last_updated_by: 'Gov Tourism Admin'
    };

    const { data, error } = await supabase
      .from('destinations')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) throw error;

    // Sync categories to destination_categories table
    if (place.category || place.categories) {
      const rawCats = place.category || place.categories;
      const cats = Array.isArray(rawCats) ? rawCats : [rawCats];
      try {
        await supabase.from('destination_categories').delete().eq('destination_id', place.id);
        const catRows = cats.map(c => ({
          destination_id: place.id,
          category: typeof c === 'string' ? c : c.category
        })).filter(r => Boolean(r.category));
        if (catRows.length > 0) {
          await supabase.from('destination_categories').insert(catRows);
        }
      } catch (catErr) {
        console.warn('[Supabase Category Sync Warning]', catErr.message);
      }
    }

    return data?.[0] || payload;
  } catch (err) {
    console.error('[Supabase Upsert Destination Error]', err.message);
    return null;
  }
}

/**
 * Delete destination from Supabase PostgreSQL
 */
async function deleteSupabaseDestination(id) {
  if (!isSupabaseEnabled()) return false;

  try {
    const { error } = await supabase
      .from('destinations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase Delete Destination Error]', err.message);
    return false;
  }
}

/**
 * Upload image buffer to Supabase Storage Bucket
 */
async function uploadToSupabaseBucket(fileBuffer, originalName, mimeType, bucket = 'destination-images') {
  if (!isSupabaseEnabled()) return null;

  try {
    const ext = path.extname(originalName) || '.jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicUrlData.publicUrl
    };
  } catch (err) {
    console.error('[Supabase Storage Upload Error]', err.message);
    return null;
  }
}

module.exports = {
  supabase,
  isSupabaseEnabled,
  getSupabaseDestinations,
  upsertSupabaseDestination,
  deleteSupabaseDestination,
  uploadToSupabaseBucket
};

