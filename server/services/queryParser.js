/**
 * Natural language tourism query parser for Karnataka places.
 * Supports patterns like:
 * - "temples near Mysuru"
 * - "waterfalls near Shivamogga"
 * - "hidden places near Hampi"
 * - "lakes near Bengaluru"
 * - "beaches in coastal Karnataka"
 * - "forts near Chitradurga"
 * - "trekking places in Karnataka"
 * - "tourist places near my location"
 * - Direct district/taluk/city queries: "Bidar", "Shivamogga district", "Tirthahalli taluk", "Badami city", "Udupi", "Belur"
 * - Kannada equivalents: "ಮೈಸೂರು ಹತ್ತಿರ ದೇವಾಲಯಗಳು", "ಶಿವಮೊಗ್ಗ ಜಲಪಾತಗಳು", "ಹಂಪಿ ಕೋಟೆಗಳು"
 */

// Comprehensive Karnataka 31 districts and landmark anchor centers
const ANCHOR_COORDINATES = {
  // All 31 Districts
  mysuru: { name: 'Mysuru', lat: 12.2958, lng: 76.6394, aliases: ['mysore', 'ಮೈಸೂರು'] },
  bengaluru: { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, aliases: ['bangalore', 'ಬೆಂಗಳೂರು', 'blore', 'bangalore urban', 'bengaluru urban'] },
  bengaluru_rural: { name: 'Bengaluru Rural', lat: 13.2847, lng: 77.5671, aliases: ['bangalore rural', 'ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ', 'devenahalli'] },
  shivamogga: { name: 'Shivamogga', lat: 13.9299, lng: 75.5681, aliases: ['shimoga', 'ಶಿವಮೊಗ್ಗ'] },
  chitradurga: { name: 'Chitradurga', lat: 14.2251, lng: 76.3980, aliases: ['ಚಿತ್ರದುರ್ಗ'] },
  mangaluru: { name: 'Mangaluru', lat: 12.9141, lng: 74.8560, aliases: ['mangalore', 'ಕುಡ್ಲ', 'ಮಂಗಳೂರು'] },
  dakshina_kannada: { name: 'Dakshina Kannada', lat: 12.9141, lng: 74.8560, aliases: ['ದಕ್ಷಿಣ ಕನ್ನಡ', 'dk'] },
  udupi: { name: 'Udupi', lat: 13.3409, lng: 74.7421, aliases: ['ಉಡುಪಿ'] },
  uttara_kannada: { name: 'Uttara Kannada', lat: 14.8185, lng: 74.1303, aliases: ['karwar', 'coastal karnataka', 'ಉತ್ತರ ಕನ್ನಡ', 'ಕಾರವಾರ', 'uk'] },
  chikkamagaluru: { name: 'Chikkamagaluru', lat: 13.3161, lng: 75.7720, aliases: ['chikmagalur', 'ಚಿಕ್ಕಮಗಳೂರು'] },
  kodagu: { name: 'Kodagu', lat: 12.4244, lng: 75.7382, aliases: ['coorg', 'madikeri', 'ಮಡಿಕೇರಿ', 'ಕೊಡಗು'] },
  dharwad: { name: 'Dharwad', lat: 15.4589, lng: 75.0078, aliases: ['hubballi', 'hubli', 'ಹುಬ್ಬಳ್ಳಿ', 'ಧಾರವಾಡ'] },
  belagavi: { name: 'Belagavi', lat: 15.8497, lng: 74.4977, aliases: ['belgaum', 'ಬೆಳಗಾವಿ'] },
  kalaburagi: { name: 'Kalaburagi', lat: 17.3297, lng: 76.8343, aliases: ['gulbarga', 'ಕಲಬುರಗಿ'] },
  vijayapura: { name: 'Vijayapura', lat: 16.8302, lng: 75.7100, aliases: ['bijapur', 'ವಿಜಯಪುರ'] },
  bidar: { name: 'Bidar', lat: 17.9104, lng: 77.5199, aliases: ['ಬೀದರ್'] },
  bagalkot: { name: 'Bagalkot', lat: 16.1691, lng: 75.6615, aliases: ['ಬಾಗಲಕೋಟೆ'] },
  ballari: { name: 'Ballari', lat: 15.1394, lng: 76.9214, aliases: ['bellary', 'ಬಳ್ಳಾರಿ'] },
  vijayanagara: { name: 'Vijayanagara', lat: 15.2689, lng: 76.3909, aliases: ['hospet', 'hosapete', 'ವಿಜಯನಗರ', 'ಹೊಸಪೇಟೆ'] },
  hassan: { name: 'Hassan', lat: 13.0033, lng: 76.1004, aliases: ['ಹಾಸನ'] },
  mandya: { name: 'Mandya', lat: 12.5218, lng: 76.8951, aliases: ['ಮಂಡ್ಯ'] },
  kolar: { name: 'Kolar', lat: 13.1367, lng: 78.1292, aliases: ['kgf', 'ಕೋಲಾರ'] },
  chikkaballapur: { name: 'Chikkaballapur', lat: 13.4355, lng: 77.7315, aliases: ['chickballapur', 'ಚಿಕ್ಕಬಳ್ಳಾಪುರ', 'nandi hills', 'nandihills'] },
  ramanagara: { name: 'Ramanagara', lat: 12.7209, lng: 77.2799, aliases: ['ramanagar', 'ರಾಮನಗರ', 'ramnagaram'] },
  tumakuru: { name: 'Tumakuru', lat: 13.3392, lng: 77.1017, aliases: ['tumkur', 'ತುಮಕೂರು'] },
  gadag: { name: 'Gadag', lat: 15.4167, lng: 75.6167, aliases: ['lakkundi', 'ಗದಗ'] },
  koppal: { name: 'Koppal', lat: 15.3524, lng: 76.1557, aliases: ['itagi', 'ಕೊಪ್ಪಳ'] },
  raichur: { name: 'Raichur', lat: 16.2076, lng: 77.3463, aliases: ['ರಾಯಚೂರು'] },
  yadgir: { name: 'Yadgir', lat: 16.7627, lng: 77.1378, aliases: ['ಯಾದಗಿರಿ'] },
  chamarajanagar: { name: 'Chamarajanagar', lat: 11.9261, lng: 76.9437, aliases: ['bandipur', 'ಚಾಮರಾಜನಗರ'] },
  davanagere: { name: 'Davanagere', lat: 14.4644, lng: 75.9218, aliases: ['davangere', 'ದಾವಣಗೆರೆ'] },
  haveri: { name: 'Haveri', lat: 14.7958, lng: 75.4022, aliases: ['ಹಾವೇರಿ'] },

  // Prominent Taluks, Heritage & Tourist Towns
  hampi: { name: 'Hampi', district: 'Vijayanagara', taluk: 'Hosapete', lat: 15.3350, lng: 76.4600, aliases: ['ವಿಜಯನಗರ', 'ಹಂಪಿ'] },
  badami: { name: 'Badami', district: 'Bagalkot', taluk: 'Badami', lat: 15.9189, lng: 75.6766, aliases: ['ಬಾದಾಮಿ'] },
  aihole: { name: 'Aihole', district: 'Bagalkot', taluk: 'Hungund', lat: 16.0194, lng: 75.8814, aliases: ['ಐಹೊಳೆ'] },
  pattadakal: { name: 'Pattadakal', district: 'Bagalkot', taluk: 'Badami', lat: 15.9489, lng: 75.8160, aliases: ['ಪಟ್ಟದಕಲ್ಲು'] },
  tirthahalli: { name: 'Tirthahalli', district: 'Shivamogga', taluk: 'Tirthahalli', lat: 13.6874, lng: 75.2447, aliases: ['thirthahalli', 'ತೀರ್ಥಹಳ್ಳಿ'] },
  sagar: { name: 'Sagar', district: 'Shivamogga', taluk: 'Sagar', lat: 14.1670, lng: 75.0300, aliases: ['ಸಾಗರ', 'jog falls', 'jog'] },
  belur: { name: 'Belur', district: 'Hassan', taluk: 'Belur', lat: 13.1623, lng: 75.8617, aliases: ['ಬೇಲೂರು'] },
  halebidu: { name: 'Halebidu', district: 'Hassan', taluk: 'Belur', lat: 13.2167, lng: 75.9833, aliases: ['halebid', 'ಹಳೇಬೀಡು'] },
  shravanabelagola: { name: 'Shravanabelagola', district: 'Hassan', taluk: 'Channarayapatna', lat: 12.8576, lng: 76.4867, aliases: ['ಶ್ರವಣಬೆಳಗೊಳ'] },
  sringeri: { name: 'Sringeri', district: 'Chikkamagaluru', taluk: 'Sringeri', lat: 13.4189, lng: 75.2562, aliases: ['ಶೃಂಗೇರಿ'] },
  mudigere: { name: 'Mudigere', district: 'Chikkamagaluru', taluk: 'Mudigere', lat: 13.1368, lng: 75.6402, aliases: ['ಮೂಡಿಗೆರೆ'] },
  gokarna: { name: 'Gokarna', district: 'Uttara Kannada', taluk: 'Kumta', lat: 14.5479, lng: 74.3188, aliases: ['ಗೋಕರ್ಣ'] },
  sirsi: { name: 'Sirsi', district: 'Uttara Kannada', taluk: 'Sirsi', lat: 14.6195, lng: 74.8354, aliases: ['ಶಿರಸಿ'] },
  bhatkal: { name: 'Bhatkal', district: 'Uttara Kannada', taluk: 'Bhatkal', lat: 13.9880, lng: 74.5510, aliases: ['murudeshwar', 'ಮುರುಡೇಶ್ವರ', 'ಭಟ್ಕಳ'] },
  dandeli: { name: 'Dandeli', district: 'Uttara Kannada', taluk: 'Dandeli', lat: 15.2361, lng: 74.6173, aliases: ['ದಾಂಡೇಲಿ'] },
  kundapura: { name: 'Kundapura', district: 'Udupi', taluk: 'Kundapura', lat: 13.6268, lng: 74.6917, aliases: ['kundapur', 'ಕುಂದಾಪುರ'] },
  karkala: { name: 'Karkala', district: 'Udupi', taluk: 'Karkala', lat: 13.2132, lng: 74.9984, aliases: ['ಕಾರ್ಕಳ'] },
  srirangapatna: { name: 'Srirangapatna', district: 'Mandya', taluk: 'Srirangapatna', lat: 12.4238, lng: 76.6947, aliases: ['ಶ್ರೀರಂಗಪಟ್ಟಣ'] },
  nanjangud: { name: 'Nanjangud', district: 'Mysuru', taluk: 'Nanjangud', lat: 12.1189, lng: 76.6806, aliases: ['ನಂಜನಗೂಡು'] },
  talakadu: { name: 'Talakadu', district: 'Mysuru', taluk: 'T. Narasipura', lat: 12.1967, lng: 77.0317, aliases: ['ತಲಕಾಡು'] },
  somwarpet: { name: 'Somwarpet', district: 'Kodagu', taluk: 'Somwarpet', lat: 12.5978, lng: 75.8631, aliases: ['ಸೋಮವಾರಪೇಟೆ'] },
  sandur: { name: 'Sandur', district: 'Ballari', taluk: 'Sandur', lat: 15.0877, lng: 76.5497, aliases: ['ಸಂಡೂರು'] },
  kampli: { name: 'Kampli', district: 'Ballari', taluk: 'Kampli', lat: 15.4026, lng: 76.5947, aliases: ['ಕಂಪ್ಲಿ', 'kampli fort', 'kampli taluk'] },
  sakleshpur: { name: 'Sakleshpur', district: 'Hassan', taluk: 'Sakleshpur', lat: 12.9439, lng: 75.7876, aliases: ['ಸಕಲೇಶಪುರ', 'saklespur'] },
  madikeri: { name: 'Madikeri', district: 'Kodagu', taluk: 'Madikeri', lat: 12.4244, lng: 75.7382, aliases: ['ಮಡಿಕೇರಿ', 'mercara'] },
  kumta: { name: 'Kumta', district: 'Uttara Kannada', taluk: 'Kumta', lat: 14.4258, lng: 74.4097, aliases: ['ಕುಮಟಾ'] },
  honnavar: { name: 'Honnavar', district: 'Uttara Kannada', taluk: 'Honnavar', lat: 14.2800, lng: 74.4500, aliases: ['ಹೊನ್ನಾವರ'] },
  yellapur: { name: 'Yellapur', district: 'Uttara Kannada', taluk: 'Yellapur', lat: 14.9644, lng: 74.7122, aliases: ['ಯಲ್ಲಾಪುರ'] },
  gangavathi: { name: 'Gangavathi', district: 'Koppal', taluk: 'Gangavathi', lat: 15.4300, lng: 76.5300, aliases: ['ಗಂಗಾವತಿ', 'gangavati', 'anegundi'] },
  basavakalyan: { name: 'Basavakalyan', district: 'Bidar', taluk: 'Basavakalyan', lat: 17.8700, lng: 76.9500, aliases: ['ಬಸವಕಲ್ಯಾಣ'] },
  bhalki: { name: 'Bhalki', district: 'Bidar', taluk: 'Bhalki', lat: 18.0400, lng: 77.2200, aliases: ['ಭಾಲ್ಕಿ'] },
  humnabad: { name: 'Humnabad', district: 'Bidar', taluk: 'Humnabad', lat: 17.7700, lng: 77.1300, aliases: ['ಹುಮನಾಬಾದ್'] },
  gokak: { name: 'Gokak', district: 'Belagavi', taluk: 'Gokak', lat: 16.1667, lng: 74.8333, aliases: ['ಗೋಕಾಕ', 'gokak falls'] },
  saundatti: { name: 'Saundatti', district: 'Belagavi', taluk: 'Saundatti', lat: 15.7667, lng: 75.1167, aliases: ['ಸವದತ್ತಿ', 'yellamma temple'] },
  jamkhandi: { name: 'Jamkhandi', district: 'Bagalkot', taluk: 'Jamkhandi', lat: 16.5056, lng: 75.2956, aliases: ['ಜಮಖಂಡಿ'] },
  mudhol: { name: 'Mudhol', district: 'Bagalkot', taluk: 'Mudhol', lat: 16.3300, lng: 75.2800, aliases: ['ಮುಧೋಳ'] },
  hungund: { name: 'Hungund', district: 'Bagalkot', taluk: 'Hungund', lat: 16.0600, lng: 76.0500, aliases: ['ಹುನಗುಂದ'] },
  sindhanur: { name: 'Sindhanur', district: 'Raichur', taluk: 'Sindhanur', lat: 15.7800, lng: 76.7700, aliases: ['ಸಿಂಧನೂರು'] },
  lingsugur: { name: 'Lingsugur', district: 'Raichur', taluk: 'Lingsugur', lat: 16.1600, lng: 76.5200, aliases: ['ಲಿಂಗಸುಗೂರು'] },
  shahapur: { name: 'Shahapur', district: 'Yadgir', taluk: 'Shahapur', lat: 16.7000, lng: 76.8400, aliases: ['ಶಹಾಪುರ'] },
  shorapur: { name: 'Shorapur', district: 'Yadgir', taluk: 'Shorapur', lat: 16.5200, lng: 76.7600, aliases: ['ಶೋರಾಪುರ'] },
  kudligi: { name: 'Kudligi', district: 'Vijayanagara', taluk: 'Kudligi', lat: 14.9000, lng: 76.3800, aliases: ['ಕೂಡ್ಲಿಗಿ'] },
  harapanahalli: { name: 'Harapanahalli', district: 'Vijayanagara', taluk: 'Harapanahalli', lat: 14.8000, lng: 75.9900, aliases: ['ಹರಪನಹಳ್ಳಿ'] },
  siruguppa: { name: 'Siruguppa', district: 'Ballari', taluk: 'Siruguppa', lat: 15.6300, lng: 76.8900, aliases: ['ಸಿರುಗುಪ್ಪ'] }
};

// Category keywords and their mappings
const CATEGORY_KEYWORDS = {
  temple: ['temple', 'temples', 'mandir', 'kovil', 'devasthana', 'gudi', 'spiritual', 'ದೇವಸ್ಥಾನ', 'ಗುಡಿ', 'ದೇವಾಲಯ'],
  waterfall: ['waterfall', 'waterfalls', 'falls', 'cascade', 'jalapatha', 'ಜಲಪಾತ'],
  beach: ['beach', 'beaches', 'coastal', 'coast', 'sea', 'samudra', 'ಕಡಲತೀರ', 'ಕಡಲ ತೀರ'],
  fort: ['fort', 'forts', 'kote', 'fortress', 'citadel', 'ಕೋಟೆ'],
  hidden: ['hidden', 'hidden gems', 'hidden places', 'offbeat', 'lesser known', 'secret', 'unknown', 'ಅಜ್ಞಾತ', 'ಗುಪ್ತ'],
  lake: ['lake', 'lakes', 'kere', 'reservoir', 'ತೊರೆ', 'ಕೆರೆ'],
  trek: ['trek', 'trekking', 'hike', 'hiking', 'peak', 'hill', 'hills', 'betta', 'mountain', 'ಬೆಟ್ಟ'],
  wildlife: ['wildlife', 'safari', 'animals', 'tiger', 'elephant', 'sanctuary', 'zoo', 'ವನ್ಯಜೀವಿ', 'ಅರಣ್ಯ'],
  heritage: ['heritage', 'history', 'historic', 'historical', 'monument', 'ruins', 'palace', 'ಅರಮನೆ', 'ಸ್ಮಾರಕ', 'ಇತಿಹಾಸ'],
  nature: ['nature', 'scenic', 'viewpoint', 'view', 'forest', 'park', 'ಪ್ರಕೃತಿ']
};

/**
 * Parses user search query string into structured parameters
 * @param {string} rawQuery - e.g. "temples near Mysuru", "waterfalls in Shivamogga", "Bidar district", "Tirthahalli taluk"
 * @param {object} userLocation - optional { lat, lng }
 * @returns {object} structured search intent
 */
function parseTourismQuery(rawQuery = '', userLocation = null) {
  const query = (rawQuery || '').trim().toLowerCase();
  if (!query) {
    return {
      rawQuery: '',
      normalizedQuery: '',
      category: null,
      categories: [],
      anchor: null,
      nearUser: false,
      radiusKm: 60,
      offbeatOnly: false,
      detectedDistrict: null,
      detectedTaluk: null,
      isSpatialSearch: false
    };
  }

  let matchedCategory = null;
  const matchedCategories = [];
  let isOffbeat = false;

  // 1. Detect Category
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(query)) {
        if (cat === 'hidden') {
          isOffbeat = true;
        } else {
          if (!matchedCategory) matchedCategory = cat;
          if (!matchedCategories.includes(cat)) matchedCategories.push(cat);
        }
        break;
      }
    }
  }

  // 2. Clean query to check for anchors (strip filler stop words like district, taluk, city, in, near, at)
  const cleanedForAnchor = query
    .replace(/\b(district|dist|taluk|taluka|tk|city|town|village|place|places|tourist\s+places|in|near|at|around|close\s+to|from|to|ಹತ್ತಿರ|ಜಿಲ್ಲೆ|ತಾಲೂಕು|ನಗರ|ತಾಣಗಳು)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 3. Detect "near me" or "near my location" or "near <anchor>"
  const isNear = /\b(near|around|nearby|close\s+to|ಹತ್ತಿರ)\b/i.test(query);
  const nearMePatterns = [
    /near\s+(my\s+)?(location|me|here)/i,
    /around\s+(my\s+)?(location|me|here)/i,
    /close\s+to\s+(me|here)/i,
    /ನನ್ನ\s+ಹತ್ತಿರ/i
  ];
  const isNearMe = nearMePatterns.some(rx => rx.test(query));

  // 4. Detect Anchor Destination / District / Taluk / City
  let matchedAnchor = null;
  for (const [key, anchor] of Object.entries(ANCHOR_COORDINATES)) {
    const namesToCheck = [anchor.name.toLowerCase(), key, ...(anchor.aliases || [])];
    for (const name of namesToCheck) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\b)${escaped}(\\b|$)`, 'i');
      if (regex.test(query) || regex.test(cleanedForAnchor)) {
        matchedAnchor = anchor;
        break;
      }
    }
    if (matchedAnchor) break;
  }

  // 5. Default to user location if "near me" matched and coordinates supplied
  if (isNearMe && userLocation && userLocation.lat && userLocation.lng) {
    matchedAnchor = {
      name: 'My Location',
      lat: userLocation.lat,
      lng: userLocation.lng,
      isUser: true
    };
  }

  const detectedDistrict = matchedAnchor ? (matchedAnchor.district || matchedAnchor.name) : null;
  const detectedTaluk = matchedAnchor?.taluk || null;

  return {
    rawQuery,
    normalizedQuery: query,
    cleanedQuery: cleanedForAnchor,
    category: matchedCategory,
    categories: matchedCategories,
    anchor: matchedAnchor,
    detectedAnchor: matchedAnchor?.name || null,
    detectedDistrict,
    detectedTaluk,
    isNear,
    nearUser: isNearMe,
    radiusKm: matchedAnchor ? 95 : null,
    offbeatOnly: isOffbeat,
    isSpatialSearch: !!matchedAnchor
  };
}

module.exports = {
  ANCHOR_COORDINATES,
  CATEGORY_KEYWORDS,
  parseTourismQuery
};
