/**
 * Frontend Media & Time-of-Day Utilities
 * Complies with Asia/Kolkata timezone and official Karnataka Tourism media specifications.
 */

// Safe, elegant neutral SVG placeholder (never displays misleading photographs of other places)
export const NEUTRAL_PLACEHOLDER_SVG = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23e7eee9'/%3E%3Crect x='300' y='145' width='200' height='140' rx='18' fill='%23c7d8ce'/%3E%3Ccircle cx='365' cy='190' r='20' fill='%23ffffff'/%3E%3Cpath d='M315 265l65-65 45 45 30-30 35 50z' fill='%2394b5a2'/%3E%3Ctext x='400' y='340' text-anchor='middle' font-family='Arial,sans-serif' font-size='24' fill='%233b5948'%3EPhoto unavailable%3C/text%3E%3Ctext x='400' y='372' text-anchor='middle' font-family='Arial,sans-serif' font-size='15' fill='%235b7565'%3EAdd a verified destination photo%3C/text%3E%3C/svg%3E";

// Category fallback images – curated Unsplash photos for each destination type
export const CATEGORY_FALLBACK_IMAGES = {
  heritage: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
  spiritual: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
  nature: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
  waterfall: 'https://images.unsplash.com/photo-1432405972618-c6b0cfba8d40?w=800&q=80',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  hills: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  trekking: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
  adventure: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=800&q=80',
  wildlife: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800&q=80',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  hidden: 'https://images.unsplash.com/photo-1518173946687-a1e4e3e3768a?w=800&q=80',
  temple: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
  fort: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
  lake: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80',
};

// Only block known misleading stock-photo placeholders.
// Allow Unsplash category fallbacks and admin-uploaded images through.
export function getSafeDestinationImage(rawUrl, place = null) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();
  if (url.startsWith('data:')) return url; // allow data URIs (SVG placeholders etc.)
  if (!/^https?:\/\//i.test(url)) return null;
  // Only block the two specific misleading stock photos, not ALL Unsplash
  if (/photo-1590050752117|photo-1600100397608|Karnataka_in_India/i.test(url)) return null;
  // Prevent the legacy Virupaksha/Hampi default image from appearing on unrelated places.
  const placeName = String(place?.name || '').toLowerCase();
  if (/virupaksha_temple|galigopuram_of_virupaksha/i.test(url) && !/(hampi|virupaksha)/i.test(placeName)) return null;
  return url;
}

/**
 * Get a category-based fallback image for a destination
 */
export function getCategoryFallback(place) {
  if (!place) return NEUTRAL_PLACEHOLDER_SVG;
  const cats = Array.isArray(place.category) ? place.category : [place.category || 'nature'];
  for (const cat of cats) {
    if (CATEGORY_FALLBACK_IMAGES[cat]) return CATEGORY_FALLBACK_IMAGES[cat];
  }
  return CATEGORY_FALLBACK_IMAGES.nature;
}

/**
 * Determine time of day strictly in Asia/Kolkata timezone
 * Morning: 5:00 AM - 10:59 AM
 * Afternoon: 11:00 AM - 3:59 PM
 * Evening: 4:00 PM - 7:59 PM
 * Night: 8:00 PM - 4:59 AM
 */
export function getCurrentTimeOfDay(date = new Date()) {
  try {
    const istString = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    const hour = istDate.getHours();

    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 16) return 'afternoon';
    if (hour >= 16 && hour < 20) return 'evening';
    return 'night';
  } catch {
    return 'afternoon';
  }
}

export const TIME_OF_DAY_CONFIG = {
  morning: { label: 'Morning', icon: '🌅', color: '#ea580c', bg: '#fff7ed', desc: 'Sunrise & morning light' },
  afternoon: { label: 'Afternoon', icon: '☀️', color: '#0284c7', bg: '#f0f9ff', desc: 'Full daylight & clear visibility' },
  evening: { label: 'Evening', icon: '🌇', color: '#d97706', bg: '#fef3c7', desc: 'Golden hour & sunset' },
  night: { label: 'Night', icon: '🌙', color: '#4338ca', bg: '#eef2ff', desc: 'Night illumination & evening activities' }
};

// Known Archaeological Survey of India (ASI) protected heritage monuments
export const ASI_HERITAGE_SITES = [
  'hampi', 'badami', 'pattadakal', 'aihole', 'gol gumbaz', 'bidar fort',
  'belur', 'halebidu', 'chitradurga', 'sannati', 'lakkundi', 'itagi'
];

export function isAsiMonument(place) {
  if (!place) return false;
  const name = (place.name || '').toLowerCase();
  const id = (place.id || '').toLowerCase();
  return ASI_HERITAGE_SITES.some(s => name.includes(s) || id.includes(s));
}

/**
 * Get active photo and attribution based on requested or automatic time-of-day
 */
export function getDestinationMedia(place, timeOfDay = null) {
  if (!place) {
    return {
      url: NEUTRAL_PLACEHOLDER_SVG,
      caption: '',
      attribution: '',
      timeOfDay: 'afternoon',
      isOpenAtNight: false
    };
  }

  const effectivePeriod = timeOfDay || getCurrentTimeOfDay();
  const periodMedia = place.timeOfDayMedia?.[effectivePeriod];

  let url = getSafeDestinationImage(periodMedia?.url, place) || getSafeDestinationImage(place.image, place) || getCategoryFallback(place);


  const isASI = isAsiMonument(place);
  const caption = periodMedia?.caption || `${place.name} (${place.district}, Karnataka)`;
  const attribution = periodMedia?.attribution || place.imageAttribution?.source || 'Pravasa AI Verified Directory';
  
  // ASI Monuments strictly enforce sunset closure truthfulness
  const isOpenAtNight = isASI ? false : Boolean(periodMedia?.isOpenAtNight);
  const nightNotes = isASI
    ? 'Monument closes strictly at sunset (6:00 PM) per Archaeological Survey of India (ASI) regulations. Night entry prohibited.'
    : (periodMedia?.nightNotes || (isOpenAtNight ? 'Open for evening visitors.' : 'Site closes at sunset for safety and conservation.'));

  return {
    url,
    caption,
    attribution,
    timeOfDay: effectivePeriod,
    isOpenAtNight,
    nightNotes
  };
}

/**
 * Extract YouTube Video ID and format safe, accessible embed URL
 */
export function extractYoutubeId(urlOrId) {
  if (!urlOrId) return null;
  const str = String(urlOrId).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;

  const match = str.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  return match ? match[1] : null;
}

