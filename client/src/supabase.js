import { createClient } from '@supabase/supabase-js';

// Load Supabase environment variables for frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('YOUR_SUPABASE')
);

// Initialize Supabase Client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

/**
 * -------------------------------------------------------------
 * AUTHENTICATION HELPERS
 * -------------------------------------------------------------
 */

/**
 * Send 6-digit Email OTP using Supabase Auth (Passwordless)
 */
export async function sendEmailOtp(email, metadata = {}) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not yet configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      data: metadata,
      shouldCreateUser: true
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Verify 6-digit Email OTP
 */
export async function verifyEmailOtp(email, token) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'email'
  });

  if (error) throw error;
  return data;
}

/**
 * Send 6-digit SMS OTP for Indian Mobile (+91)
 */
export async function sendMobileOtp(phoneNumber) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  // Format as +91XXXXXXXXXX
  let formatted = phoneNumber.trim().replace(/[\s-]/g, '');
  if (!formatted.startsWith('+')) {
    if (formatted.startsWith('91') && formatted.length === 12) {
      formatted = `+${formatted}`;
    } else {
      formatted = `+91${formatted.replace(/^0+/, '')}`;
    }
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    phone: formatted,
    options: {
      shouldCreateUser: true
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Verify 6-digit SMS OTP
 */
export async function verifyMobileOtp(phoneNumber, token) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  let formatted = phoneNumber.trim().replace(/[\s-]/g, '');
  if (!formatted.startsWith('+')) {
    if (formatted.startsWith('91') && formatted.length === 12) {
      formatted = `+${formatted}`;
    } else {
      formatted = `+91${formatted.replace(/^0+/, '')}`;
    }
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone: formatted,
    token: token.trim(),
    type: 'sms'
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out from Supabase
 */
export async function supabaseSignOut() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

/**
 * -------------------------------------------------------------
 * STORAGE HELPERS
 * -------------------------------------------------------------
 */

/**
 * Upload an image file to Supabase Storage bucket
 * Buckets: 'destination-images' | 'destination-gallery' | 'tourism-backgrounds' | 'user-uploads'
 */
export async function uploadToSupabaseStorage(file, bucket = 'destination-images', folder = '') {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase storage not configured.');
  }

  const ext = file.name.split('.').pop();
  const fileName = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  // Retrieve public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl
  };
}

/**
 * -------------------------------------------------------------
 * DESTINATION HELPERS (SINGLE SOURCE OF TRUTH: SUPABASE)
 * -------------------------------------------------------------
 */

/**
 * Format raw Supabase PostgreSQL row into standard frontend destination object
 */
export function mapSupabaseDestination(d) {
  if (!d) return null;
  const categories = d.destination_categories && Array.isArray(d.destination_categories)
    ? d.destination_categories.map(c => (typeof c === 'string' ? c : c.category)).filter(Boolean)
    : (d.category ? (Array.isArray(d.category) ? d.category : [d.category]) : [d.place_type || 'heritage']);

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
      license: 'Public Domain / CC BY-SA 4.0'
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
    googleMapsUrl: d.time_of_day_media?.googleMapsUrl || (d.source_url && d.source_url.includes('maps') ? d.source_url : ''),
    crowdLevel: d.crowd_level || 2,
    seniorFriendly: d.senior_friendly !== undefined ? Boolean(d.senior_friendly) : true,
    familyFriendly: d.family_friendly !== undefined ? Boolean(d.family_friendly) : true,
    lastUpdatedBy: d.last_updated_by || 'Gov Tourism Admin',
    createdAt: d.created_at,
    updatedAt: d.updated_at
  };
}

/**
 * Fetch all destinations directly from Supabase PostgreSQL
 */
export async function fetchDestinationsFromSupabase(options = {}) {
  if (!isSupabaseConfigured) return null;

  try {
    let query = supabase
      .from('destinations')
      .select('*, destination_categories(category)');

    if (options.isPublished !== undefined) {
      query = query.eq('is_published', options.isPublished);
    } else if (!options.includeUnpublished) {
      query = query.eq('is_published', true);
    }

    if (options.district && options.district !== 'all') {
      query = query.ilike('district', `%${options.district}%`);
    }

    if (options.taluk && options.taluk !== 'all') {
      query = query.ilike('taluk', `%${options.taluk}%`);
    }

    if (options.offbeat !== undefined) {
      query = query.eq('offbeat', options.offbeat);
    }

    query = query.order('name', { ascending: true });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(mapSupabaseDestination);
  } catch (err) {
    console.warn('[Supabase Client] Failed to fetch destinations:', err.message);
    return null;
  }
}

/**
 * Fetch single destination by ID directly from Supabase
 */
export async function fetchDestinationByIdFromSupabase(id) {
  if (!isSupabaseConfigured || !id) return null;

  try {
    const { data, error } = await supabase
      .from('destinations')
      .select('*, destination_categories(category)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapSupabaseDestination(data);
  } catch (err) {
    console.warn(`[Supabase Client] Failed to fetch destination "${id}":`, err.message);
    return null;
  }
}

/**
 * -------------------------------------------------------------
 * REALTIME SUBSCRIPTIONS
 * -------------------------------------------------------------
 */

/**
 * Subscribe to live destination updates (changes made in Gov Admin reflect in real-time)
 * Uses a unique channel name per subscription to prevent channel collisions and memory leaks.
 */
export function subscribeToDestinations(onUpdate) {
  if (!isSupabaseConfigured) return () => {};

  const channelId = `destinations_live_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'destinations' },
      (payload) => {
        if (typeof onUpdate === 'function') {
          onUpdate(payload);
        }
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {
      console.warn('[Realtime] Cleanup warning:', e.message);
    }
  };
}

/**
 * Subscribe to live crowd reports
 */
export function subscribeToCrowdReports(destinationId, onReport) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`public:crowd_reports:${destinationId || 'all'}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'crowd_reports' },
      (payload) => {
        if (!destinationId || payload.new.destination_id === destinationId) {
          if (typeof onReport === 'function') {
            onReport(payload.new);
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

