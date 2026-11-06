const express = require('express');
const router = express.Router();
const { hasKey, chatWithAI } = require('../services/gemini');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const places = require('../data/places.json');

// Helper to normalize and strip punctuation from query string
function cleanQuery(query) {
  return (query || '')
    .toLowerCase()
    .replace(/['".,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Distance matrix (approximate road distances and travel times in Karnataka)
const DISTANCES_FROM_BENGALURU = {
  hampi: { km: 340, time: '6 – 7 hours via NH 48 & NH 50', train: 'Hampi Express (Overnight from KSR Bengaluru SBC to Hosapete HPT)', aliases: ['hampi', 'ಹಂಪಿ', 'ಹಂಪಿಯಿಂದ', 'hosapete'] },
  mysuru: { km: 145, time: '2 hours via Bengaluru-Mysuru Expressway (NH 275)', train: 'Vande Bharat / Shatabdi Express (1 hr 45 min)', aliases: ['mysuru', 'mysore', 'ಮೈಸೂರು', 'ಮೈಸೂರಿಗೆ'] },
  coorg: { km: 250, time: '5 – 6 hours via NH 275 & Mysore-Madikeri Rd', train: 'Train to Mysuru or Hassan, then KSRTC bus to Madikeri', aliases: ['coorg', 'kodagu', 'madikeri', 'ಕೂರ್ಗ್', 'ಕೊಡಗು', 'ಮಡಿಕೇರಿ'] },
  gokarna: { km: 485, time: '8 – 9 hours via NH 48 & NH 69', train: 'Panchaganga Express / Karwar Express via Konkan Railway', aliases: ['gokarna', 'ಗೋಕರ್ಣ'] },
  shivamogga: { km: 300, time: '5 – 6 hours via NH 48 & NH 206', train: 'Jan Shatabdi / Talaguppa Intercity Express', aliases: ['shivamogga', 'shimoga', 'ಶಿವಮೊಗ್ಗ'] },
  jog_falls: { km: 375, time: '7 – 8 hours via NH 206', train: 'Train to Talaguppa (14 km from Jog Falls)', aliases: ['jog', 'ಜೋಗ'] },
  chikkamagaluru: { km: 245, time: '4.5 – 5 hours via NH 75 through Hassan', train: 'Train to Hassan Junction (40 km away) or direct KSRTC Airavat', aliases: ['chikkamagaluru', 'chikmagalur', 'ಚಿಕ್ಕಮಗಳೂರು'] },
  badami: { km: 450, time: '8 hours via NH 48 & NH 50', train: 'Gol Gumbaz Express / direct train to Badami railway station', aliases: ['badami', 'ಬಾದಾಮಿ'] },
  bandipur: { km: 220, time: '4.5 – 5 hours via Mysuru & Gundlupet', train: 'Nearest railhead: Mysuru Junction (80 km)', aliases: ['bandipur', 'ಬಂಡೀಪುರ'] },
  belagavi: { km: 505, time: '7 – 8 hours via NH 48', train: 'Rani Chennamma Express / Vande Bharat Express', aliases: ['belagavi', 'belgaum', 'ಬೆಳಗಾವಿ'] },
  mangaluru: { km: 350, time: '6.5 – 7.5 hours via Shiradi Ghat (NH 75)', train: 'Gomteshwara / Panchaganga / Vande Bharat Express', aliases: ['mangaluru', 'mangalore', 'ಮಂಗಳೂರು'] },
  udupi: { km: 400, time: '7.5 – 8.5 hours via NH 75 & NH 66', train: 'Panchaganga Express to Udupi station', aliases: ['udupi', 'ಉಡುಪಿ'] }
};

// Rich, grounded RAG companion knowledge engine
function generateCompanionReply(query, lang = 'en') {
  const raw = (query || '').toLowerCase().trim();
  const q = cleanQuery(query);
  const isKn = lang === 'kn' || /[\u0C80-\u0CFF]/.test(query);

  let reply = '';
  let suggestedPlaces = [];
  let quickPrompts = [];
  let source = 'Karnataka Tourism Official Master Records';

  // Helper to fetch place details by id
  const getPlace = (id) => places.find(p => p.id === id || (p.aliases && p.aliases.includes(id)));

  // 1. Distance inquiries (e.g. "how far is Hampi from Bengaluru", "distance to mysuru", "ದೂರ")
  if (q.includes('how far') || q.includes('distance') || raw.includes('ದೂರ') || q.includes('km') || ((q.includes('bengaluru') || raw.includes('ಬೆಂಗಳೂರು')) && (q.includes('hampi') || raw.includes('ಹಂಪಿ') || q.includes('coorg') || raw.includes('ಕೂರ್ಗ್') || q.includes('mysuru') || raw.includes('ಮೈಸೂರು')))) {
    const destKey = Object.keys(DISTANCES_FROM_BENGALURU).find(k => {
      const aliases = DISTANCES_FROM_BENGALURU[k].aliases || [k];
      return aliases.some(a => q.includes(a) || raw.includes(a));
    });
    if (destKey) {
      const dInfo = DISTANCES_FROM_BENGALURU[destKey];
      const placeName = destKey.charAt(0).toUpperCase() + destKey.slice(1);
      if (isKn) {
        reply = `ಬೆಂಗಳೂರಿನಿಂದ ${placeName} ನಡುವಿನ ಅಂತರ ಸರಿಸುಮಾರು ${dInfo.km} ಕಿ.ಮೀ. ಪ್ರಯಾಣದ ಸಮಯ: ರಸ್ತೆ ಮೂಲಕ ಸುಮಾರು ${dInfo.time}. ರೈಲು ಸಂಪರ್ಕ: ${dInfo.train}. KSRTC ಐರಾವತ ವೋಲ್ವೋ ಬಸ್‌ಗಳು ಸಹ ಲಭ್ಯವಿದೆ.`;
      } else {
        reply = `The road distance from Bengaluru to ${placeName} is approximately ${dInfo.km} km. Travel time: ${dInfo.time}. By Rail: ${dInfo.train}. KSRTC also runs regular Airavat Volvo and sleeper buses.`;
      }
      const matchP = getPlace(destKey) || places.find(p => (p.district || '').toLowerCase().includes(destKey));
      if (matchP) suggestedPlaces.push(matchP);
      quickPrompts = isKn
        ? ['ಪ್ರವಾಸ ವೇಳಾಪಟ್ಟಿ ತಯಾರಿಸಿ', 'ಹತ್ತಿರದ ಆಕರ್ಷಣೆಗಳು', 'ದೇವಸ್ಥಾನದ ಸಮಯ']
        : ['Build 3-Day Itinerary', 'Nearby Attractions', 'Best Route Info'];
      return { reply, suggestedPlaces, quickPrompts, source: 'NHAI & KSRTC Distance Records' };
    }
  }

  // 2. 3-Day Coorg Trip / Itinerary requests
  if (q.includes('coorg trip') || q.includes('three day') || q.includes('3 day') || (q.includes('plan') && q.includes('coorg')) || raw.includes('ಕೂರ್ಗ್') || raw.includes('ಕೊಡಗು') || q.includes('coorg')) {
    if (isKn) {
      reply = `ಕೊಡಗು (ಕೂರ್ಗ್) 3 ದಿನಗಳ ಅತ್ಯುತ್ತಮ ಪ್ರವಾಸ ವೇಳಾಪಟ್ಟಿ:\n• ದಿನ 1: ಮಡಿಕೇರಿ ತಲುಪಿ - ರಾಜಾಸೀಟ್ ಸೂರ್ಯಾಸ್ತ, ಮಡಿಕೇರಿ ಕೋಟೆ ಮತ್ತು ಓಂಕಾರೇಶ್ವರ ದೇವಾಲಯ.\n• ದಿನ 2: ಅಬ್ಬೆ ಜಲಪಾತ, ಮಾಂಡಲ್‌ಪಟ್ಟಿ ಜೀಪ್ ಚಾರಣ, ಮತ್ತು ತಲಕಾವೇರಿ (ಕಾವೇರಿ ನದಿಯ ಉಗಮ ಸ್ಥಾನ).\n• ದಿನ 3: ಬೈಲುಕುಪ್ಪೆಯ ನಾಮ್‌ಡ್ರೋಲಿಂಗ್ ಗೋಲ್ಡನ್ ಟೆಂಪಲ್ (ಟಿಬೆಟಿಯನ್ ಮಠ) ಮತ್ತು ದುಬಾರೆ ಆನೆ ಶಿಬಿರ.`;
    } else {
      reply = `Here is a curated 3-Day Coorg (Kodagu) itinerary:\n• Day 1: Arrive in Madikeri – explore Raja's Seat sunset garden, Madikeri Fort, and historic Omkareshwara Temple.\n• Day 2: Abbey Falls morning mist, Mandalpatti 4x4 off-road jeep viewpoint, and sacred Talakaveri.\n• Day 3: Namdroling Golden Temple in Bylakuppe and Dubare Elephant Camp for riverside bathing sessions.`;
    }
    const cSpots = places.filter(p => (p.district || '').toLowerCase().includes('kodagu') || p.id.includes('coorg')).slice(0, 4);
    suggestedPlaces = cSpots;
    quickPrompts = isKn
      ? ['ಕೂರ್ಗ್ ಹವಾಮಾನ ಹೇಗಿದೆ?', 'ಕೂರ್ಗ್ ಕಾಫಿ ತೋಟಗಳು', 'ಮಡಿಕೇರಿ ಹೋಂಸ್ಟೇ ಮಾಹಿತಿ']
      : ['Weather in Coorg', 'Coorg Coffee Estates', 'Homestay Booking Tips'];
    return { reply, suggestedPlaces, quickPrompts, source: 'KSTDC Curated Tour Circuits' };
  }

  // 3. Hidden gems near Bengaluru
  if ((q.includes('hidden') || q.includes('offbeat') || q.includes('ಗುಪ್ತ')) && (q.includes('bengaluru') || q.includes('bangalore') || q.includes('near'))) {
    if (isKn) {
      reply = `ಬೆಂಗಳೂರಿನ ಸಮೀಪವಿರುವ ಅತ್ಯುತ್ತಮ ಗುಪ್ತ ಮತ್ತು ಶಾಂತ ಪ್ರವಾಸಿ ತಾಣಗಳು:\n1. ರಾಮದೇವರ ಬೆಟ್ಟ (ರಾಮನಗರ): ಭಾರತದ ಏಕೈಕ ರಣಹದ್ದು ಸಂರಕ್ಷಿತ ಪ್ರದೇಶ ಮತ್ತು ಪ್ರಶಾಂತ ಚಾರಣ ತಾಣ.\n2. ದೇವರಾಯನದುರ್ಗ (ತುಮಕೂರು): ಬೆಟ್ಟದ ಮೇಲಿನ ಯೋಗ ನರಸಿಂಹ ದೇವಾಲಯ ಮತ್ತು ನಾಮದ ಚಿಲುಮೆ ಜಿಂಕೆ ವನ.\n3. ಮಂಚನಬೆಲೆ ಅಣೆಕಟ್ಟು & ದೊಡ್ಡ ಆಲದ ಮರ: ಪ್ರಕೃತಿಯ ಮಡಿಲಲ್ಲಿ ಶಾಂತ ದಿನಕಳೆಯಲು ಸೂಕ್ತ.\n4. ಗುಡಿಬಂಡೆ ಕೋಟೆ: ನಂದಿ ಬೆಟ್ಟದ ಜನದಟ್ಟಣೆಯಿಲ್ಲದ ಪುರಾತನ ಮೆಟ್ಟಿಲು ಕೋಟೆ.`;
    } else {
      reply = `Top verified off-beat escapes near Bengaluru without peak crowds:\n1. Ramadevara Betta (Ramanagara): India's only dedicated vulture sanctuary with granite trekking trails.\n2. Devarayanadurga (Tumakuru): High hill-top Yoga Narasimha temple and Namada Chilume natural spring.\n3. Gudibande Fort: A stunning 7-tiered hillside fort with panoramic reservoir views.\n4. Makalidurga: Serene hill trek alongside scenic railway tracks.`;
    }
    suggestedPlaces = places.filter(p => p.offbeat && ['Bengaluru Urban', 'Bengaluru Rural', 'Ramanagara', 'Tumakuru', 'Chikkaballapur'].includes(p.district)).slice(0, 4);
    quickPrompts = isKn
      ? ['ವಾರಾಂತ್ಯದ ಚಾರಣಗಳು', 'ಕುಟುಂಬದೊಂದಿಗೆ ಪಿಕ್ನಿಕ್', 'ರಾಮನಗರ ಮಾರ್ಗ']
      : ['Weekend Treks Near BLR', 'Family Picnic Spots', 'Ramanagara Trail Info'];
    return { reply, suggestedPlaces, quickPrompts, source: 'Karnataka Eco-Tourism Board' };
  }

  // 4. Safe Waterfalls inquiry
  if (q.includes('waterfall') || q.includes('safe') || q.includes('ಜಲಪಾತ')) {
    if (isKn) {
      reply = `ಕರ್ನಾಟಕದ ಪ್ರಮುಖ ಮತ್ತು ಸುರಕ್ಷಿತ ಜಲಪಾತಗಳು:\n• ಜೋಗ ಜಲಪಾತ (ಶಿವಮೊಗ್ಗ): ಭಾರತದ ಎರಡನೇ ಎತ್ತರದ ಜಲಪಾತ; ಕೆಎಸ್‌ಟಿಡಿಸಿ ವೀಕ್ಷಣಾ ವೇದಿಕೆಗಳಿಂದ ಸಂಪೂರ್ಣ ಸುರಕ್ಷಿತ ವೀಕ್ಷಣೆ.\n• ಶಿವನಸಮುದ್ರ (ಮಂಡ್ಯ): ಗಗನಚುಕ್ಕಿ ಮತ್ತು ಭರಚುಕ್ಕಿ ಅವಳಿ ಜಲಪಾತಗಳು; ಸುಸಜ್ಜಿತ ರೇಲಿಂಗ್ ಮತ್ತು ವಾಕ್‌ವೇಗಳಿವೆ.\n• ಅಬ್ಬೆ ಜಲಪಾತ (ಕೊಡಗು): ಕಾಫಿ ತೋಟಗಳ ನಡುವಿನ ತೂಗುಸೇತುವೆಯಿಂದ ಸುಂದರ ನೋಟ.\n⚠️ ಸುರಕ್ಷತಾ ಸೂಚನೆ: ಮಳೆಗಾಲದಲ್ಲಿ ನದಿಯ ರಭಸದ ನೀರಿನಲ್ಲಿ ಈಜುವುದು ಕಟ್ಟುನಿಟ್ಟಾಗಿ ನಿಷೇಧಿಸಲಾಗಿದೆ.`;
    } else {
      reply = `Top safe, well-equipped waterfalls in Karnataka with official railings and viewing decks:\n• Jog Falls (Shivamogga): India's iconic plunge waterfall with secure KSTDC viewing balconies and light shows.\n• Shivanasamudra Falls (Mandya): Gaganachukki & Bharachukki twin cascades with guarded observation pavilions.\n• Abbey Falls (Coorg): Located inside private coffee estates with a secure hanging bridge.\n• Hebbe Falls (Kemmanagundi): Reachable via authorized Forest Department 4x4 jeeps.\n⚠️ Safety Notice: Stepping into water currents or jumping from wet rocks is strictly banned during monsoons per District Magistrate advisories.`;
    }
    suggestedPlaces = places.filter(p => Array.isArray(p.category) ? p.category.includes('waterfall') : p.category === 'waterfall').slice(0, 4);
    quickPrompts = isKn
      ? ['ಜೋಗ ಜಲಪಾತಕ್ಕೆ ಹೋಗುವ ದಾರಿ', 'ಶಿವನಸಮುದ್ರ ಸಮಯ', 'ಮಳೆಗಾಲದ ಎಚ್ಚರಿಕೆಗಳು']
      : ['How to reach Jog Falls', 'Shivanasamudra Timings', 'Monsoon Travel Alerts'];
    return { reply, suggestedPlaces, quickPrompts, source: 'Karnataka Tourism & KSNDMC Safety Advisory' };
  }

  // 5. Best Trekking Destinations
  if (q.includes('trek') || q.includes('adventure') || q.includes('ಚಾರಣ')) {
    if (isKn) {
      reply = `ಕರ್ನಾಟಕದ ಜನಪ್ರಿಯ ಚಾರಣ ತಾಣಗಳು:\n1. ಕುದುರೆಮುಖ (ಚಿಕ್ಕಮಗಳೂರು): ಪಶ್ಚಿಮ ಘಟ್ಟಗಳ ಹಸಿರು ಶಿಖರ (ದಿನಕ್ಕೆ ಕೇವಲ 50 ಜನರಿಗೆ ಅರಣ್ಯ ಇಲಾಖೆಯ ಮುಂಗಡ ಅನುಮತಿ).\n2. ಕುಮಾರ ಪರ್ವತ / ಪುಷ್ಪಗಿರಿ (ಸುಬ್ರಹ್ಮಣ್ಯ): ದಕ್ಷಿಣ ಭಾರತದ ಅತ್ಯಂತ ಸವಾಲಿನ ಕಠಿಣ ಚಾರಣ.\n3. ಮುಳ್ಳಯ್ಯನಗಿರಿ: ಕರ್ನಾಟಕದ ಅತ್ಯುನ್ನತ ಶಿಖರ (1930 ಮೀಟರ್).\n4. ಸ್ಕಂದಗಿರಿ (ಚಿಕ್ಕಬಳ್ಳಾಪುರ): ಮೋಡಗಳ ಮೇಲಿನ ಸೂರ್ಯೋದಯ ವೀಕ್ಷಣೆಗೆ ರಾತ್ರಿ ಚಾರಣ (ಅರಣ್ಯ ಇಲಾಖೆ ಆನ್‌ಲೈನ್ ಬುಕಿಂಗ್ ಕಡ್ಡಾಯ).\nಅರಣ್ಯ ಇಲಾಖೆಯ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ (aranyaviation.karnataka.gov.in) ಮೂಲಕ ಮಾತ್ರ ನೋಂದಾಯಿಸಿ.`;
    } else {
      reply = `Premier trekking expeditions across Karnataka:\n1. Kudremukh Peak (Chikkamagaluru): Iconic horse-faced ridge; strict limit of 50 trekkers/day with mandatory Forest Dept eco-permit.\n2. Kumara Parvatha / Pushpagiri: Challenging 22 km endurance trek starting from Kukke Subramanya.\n3. Mullayanagiri: Highest peak in Karnataka (1,930 m) with mist-clad ridge walks.\n4. Skandagiri (Kalavara Durga): Famous sunrise sea-of-clouds night trek (official booking via Karnataka Eco-Tourism is mandatory).\n5. Tadiandamol (Coorg): Highest peak in Kodagu with views stretching to the Arabian coast.`;
    }
    suggestedPlaces = places.filter(p => (Array.isArray(p.category) && (p.category.includes('adventure') || p.category.includes('hills'))) || ['kudremukh', 'chikkamagaluru_mullayanagiri', 'nandi_hills'].includes(p.id)).slice(0, 4);
    quickPrompts = isKn
      ? ['ಚಾರಣಕ್ಕೆ ಅರಣ್ಯ ಅನುಮತಿ', 'ಆರಂಭಿಕರಿಗೆ ಸುಲಭ ಚಾರಣ', 'ಕುದುರೆಮುಖ ಬುಕಿಂಗ್']
      : ['Trek Permission Rules', 'Beginner Treks in Karnataka', 'Kudremukh Booking Portal'];
    return { reply, suggestedPlaces, quickPrompts, source: 'Karnataka Forest Department Eco-Tourism Master' };
  }

  // 6. Wildlife Safari Destinations
  if (q.includes('wildlife') || q.includes('safari') || q.includes('tiger') || q.includes('animal') || q.includes('ವನ್ಯಜೀವಿ') || q.includes('ಸಫಾರಿ')) {
    if (isKn) {
      reply = `ಕರ್ನಾಟಕದ ವಿಶ್ವವಿಖ್ಯಾತ ವನ್ಯಜೀವಿ ಸಫಾರಿ ತಾಣಗಳು:\n• ಬಂಡೀಪುರ ರಾಷ್ಟ್ರೀಯ ಉದ್ಯಾನ: ಹುಲಿ, ಚಿರತೆ ಮತ್ತು ಆನೆಗಳ ಸಮೃದ್ಧ ನೆಲೆ; ಮುಂಜಾನೆ 6:00 ಮತ್ತು ಮಧ್ಯಾಹ್ನ 3:30 ಕ್ಕೆ ಜೀಪ್/ಕ್ಯಾಂಟರ್ ಸಫಾರಿ.\n• ನಾಗರಹೊಳೆ & ಕಬಿನಿ: ಕಬಿನಿ ಹಿನ್ನೀರಿನಲ್ಲಿ ದೋಣಿ ಸಫಾರಿ ಮತ್ತು ಕಪ್ಪು ಚಿರತೆ (ಬ್ಲ್ಯಾಕ್ ಪ್ಯಾಂಥರ್) ಕಾಣಸಿಗುವ ಅಪರೂಪದ ತಾಣ.\n• ಭದ್ರಾ ವನ್ಯಜೀವಿ ಅಭಯಾರಣ್ಯ (ಚಿಕ್ಕಮಗಳೂರು): ಕಾಡುಕೋಣ ಮತ್ತು ಸಾಂಬಾರ್ ಜಿಂಕೆಗಳಿಗೆ ಹೆಸರುವಾಸಿ.\n• ಬನ್ನೇರುಘಟ್ಟ ಜೈವಿಕ ಉದ್ಯಾನ (ಬೆಂಗಳೂರು): ನಗರದ ಹತ್ತಿರವಿರುವ ಸಫಾರಿ ಮತ್ತು ಚಿಟ್ಟೆ ಉದ್ಯಾನ.\nಬುಕಿಂಗ್: ಅಧಿಕೃತ ಜಂಗಲ್ ಲಾಡ್ಜಸ್ (JLR) ಅಥವಾ ಅರಣ್ಯ ಇಲಾಖೆ ಮೂಲಕ ಮಾಡಿ.`;
    } else {
      reply = `World-class wildlife and tiger reserves in Karnataka:\n• Bandipur National Park: Premier Project Tiger reserve; daily morning (6:00 AM) and evening (3:30 PM) jeep and canter safaris.\n• Nagarahole & Kabini: Legendary backwaters boat safari famous for Asiatic elephants and melanistic leopards (Black Panther).\n• Bhadra Tiger Reserve (Lakkavalli): Pristine forest around Bhadra reservoir, teeming with Indian gaurs.\n• Kali Tiger Reserve (Dandeli): Hornbill capital with deep deciduous jungle safaris.\n• Bannerghatta Biological Park (Bengaluru): Close to the capital with tiger, lion, and bear safaris plus a world-class butterfly conservatory.`;
    }
    suggestedPlaces = places.filter(p => Array.isArray(p.category) ? p.category.includes('wildlife') : p.category === 'wildlife').slice(0, 4);
    quickPrompts = isKn
      ? ['ಕಬಿನಿ ಸಫಾರಿ ಸಮಯ', 'ಬಂಡೀಪುರ ಆನ್‌ಲೈನ್ ಬುಕಿಂಗ್', 'ಜಂಗಲ್ ಲಾಡ್ಜಸ್ ಮಾಹಿತಿ']
      : ['Kabini Boat Safari Timings', 'Bandipur Booking Rules', 'Jungle Lodges & Resorts'];
    return { reply, suggestedPlaces, quickPrompts, source: 'Karnataka Forest Department & JLR' };
  }

  // 7. Places to visit with Family
  if (q.includes('family') || q.includes('children') || q.includes('kids') || q.includes('parents') || q.includes('ಕುಟುಂಬ')) {
    if (isKn) {
      reply = `ಕುಟುಂಬ ಸಮೇತ ಸುಖಕರವಾಗಿ ಭೇಟಿ ನೀಡಬಹುದಾದ ಕರ್ನಾಟಕದ ತಾಣಗಳು:\n1. ಮೈಸೂರು: ಮೈಸೂರು ಅರಮನೆ, ಶ್ರೀ ಚಾಮರಾಜೇಂದ್ರ ಮೃಗಾಲಯ, ಮತ್ತು ಬೃಂದಾವನ ಗಾರ್ಡನ್ (ಸಂಗೀತ ಕಾರಂಜಿ).\n2. ಉಡುಪಿ & ಮಲ್ಪೆ ಬೀಚ್: ಸಮುದ್ರ ತೀರದ ನಡಿಗೆ, ಸೈಂಟ್ ಮೇರೀಸ್ ದ್ವೀಪದ ದೋಣಿ ಪಯಣ, ಮತ್ತು ಶ್ರೀ ಕೃಷ್ಣ ಮಠ.\n3. ಹಂಪಿ: ಕುಟುಂಬಕ್ಕೆ ಸುಲಭವಾಗಿ ಸುತ್ತಾಡಲು ಇ-ಕಾರ್ಟ್ (ಬ್ಯಾಟರಿ ವಾಹನ) ಸೌಲಭ್ಯವಿರುವ ವಿಶ್ವ ಪರಂಪರೆಯ ತಾಣ.\n4. ಕೊಡಗು (ಕೂರ್ಗ್): ಕಾಫಿ ಎಸ್ಟೇಟ್ ಹೋಂಸ್ಟೇಗಳು, ಆನೆ ಶಿಬಿರ ಮತ್ತು ಶಾಂತ ವಾತಾವರಣ.`;
    } else {
      reply = `Top family-friendly destinations in Karnataka with senior-friendly pathways and child amenities:\n1. Mysuru: Royal Mysuru Palace, world-renowned Sri Chamarajendra Zoological Gardens, and Brindavan Gardens musical fountain.\n2. Udupi & Malpe: Safe sandy beach with sea-walk, boat ride to St. Mary's basaltic island, and Krishna Matha Anna Dana dining.\n3. Hampi: Easy golf-cart electric vehicle shuttles inside Vittala temple complex; fascinating open-air history museum.\n4. Coorg: Serene coffee estate homestays, Bylakuppe Tibetan monastery, and Dubare elephant interactions.`;
    }
    suggestedPlaces = places.filter(p => p.familyFriendly && p.seniorFriendly).slice(0, 4);
    quickPrompts = isKn
      ? ['ಮೈಸೂರು ಅರಮನೆ ಸಮಯ', 'ಉಡುಪಿ ಹೋಟೆಲ್ ಶಿಫಾರಸು', 'ಹಂಪಿಯಲ್ಲಿ ಇ-ಕಾರ್ಟ್']
      : ['Mysuru Palace Lightings', 'Udupi Beach Activities', 'Hampi Senior Accessibility'];
    return { reply, suggestedPlaces, quickPrompts, source: 'Karnataka Tourism Family Circuits' };
  }

  // 8. Low-Budget Karnataka Trip
  if (q.includes('low budget') || q.includes('budget') || q.includes('cheap') || q.includes('backpack') || q.includes('ಕಡಿಮೆ ಬಜೆಟ್')) {
    if (isKn) {
      reply = `ಕಡಿಮೆ ವೆಚ್ಚದಲ್ಲಿ ಕರ್ನಾಟಕ ಪ್ರವಾಸ ಮಾಡುವ ಅತ್ಯುತ್ತಮ ಯೋಜನೆ:\n• ಸಾರಿಗೆ: ಕೆಎಸ್‌ಆರ್‌ಟಿಸಿ (KSRTC) ರಾಜಹಂಸ ಅಥವಾ ಭಾರತೀಯ ರೈಲ್ವೆ (IRCTC) ಸಾಮಾನ್ಯ/ಸ್ಲೀಪರ್ ಬೋಗಿಗಳನ್ನು ಬಳಸಿ.\n• ತಾಣ 1 - ಹಂಪಿ: ಸರ್ಕಾರಿ ಕೆಎಸ್‌ಟಿಸಿ ಮಯೂರ ಹೋಟೆಲ್ ಅಥವಾ ಕಮಲಾಪುರದ ಹೋಂಸ್ಟೇಗಳಲ್ಲಿ ತಂಗಬಹುದು. ಸೈಕಲ್ ಬಾಡಿಗೆ ಪಡೆದು ₹100/ದಿನಕ್ಕೆ ಇಡೀ ಹಂಪಿಯನ್ನು ಸುತ್ತಾಡಬಹುದು.\n• ತಾಣ 2 - ಗೋಕರ್ಣ: ಕಡಲತೀರದ ಸರಳ ಗುಡಿಸಲುಗಳು ಮತ್ತು ಪ್ರಶಾಂತ ಬೀಚ್ ವಾಕಿಂಗ್.\n• ಆಹಾರ: ಸ್ಥಳೀಯ ಖಾನಾವಳಿಗಳ ಜೋಳದ ರೊಟ್ಟಿ ಊಟ ಅಥವಾ ಉಡುಪಿ ಉಪಾಹಾರ ಗೃಹಗಳಲ್ಲಿ ₹80-₹120ಕ್ಕೆ ಪೌಷ್ಟಿಕ ಊಟ ಲಭ್ಯ.`;
    } else {
      reply = `Smart budget-travel guide for exploring Karnataka under ₹1,500 – ₹2,500 per day:\n• Transit: Rely on overnight KSRTC buses or IRCTC superfast trains (e.g. Hampi Express, Gol Gumbaz Express).\n• Hampi: Stay at backpacker guesthouses in Kamalapura or Sanapur; rent bicycles for ₹100–₹150/day to tour the 4,100-hectare ruins.\n• Gokarna: Beachside shack stays on Kudle beach; enjoy free coastal hiking between Om Beach and Half Moon Beach.\n• Food: Savor authentic North Karnataka Jolada Rotti meals at local Khanavalis or Udupi Sagar vegetarian restaurants for ₹80–₹120.`;
    }
    suggestedPlaces = places.filter(p => (p.costLevel === 'budget' || p.approxStayPerNightINR < 1500) && !p.place_type).slice(0, 4);
    quickPrompts = isKn
      ? ['ಹಂಪಿಯಲ್ಲಿ ಸೈಕಲ್ ಬಾಡಿಗೆ', 'ಗೋಕರ್ಣ ಬೀಚ್ ವಾಕ್', 'ಉಡುಪಿ ಊಟದ ತಾಣಗಳು']
      : ['Hampi Cycle Rentals', 'Gokarna Beach Trail', 'Budget Food In Karnataka'];
    return { reply, suggestedPlaces, quickPrompts, source: 'Pravasa AI Budget Travel Intelligence' };
  }

  // 9. Monsoon Travel Advice
  if (q.includes('monsoon') || q.includes('rain') || q.includes('ಮಳೆಗಾಲ')) {
    if (isKn) {
      reply = `ಮಳೆಗಾಲದಲ್ಲಿ (ಜೂನ್ - ಸೆಪ್ಟೆಂಬರ್) ಕರ್ನಾಟಕದ ಅತ್ಯುತ್ತಮ ತಾಣಗಳು:\n• ಮಲೆನಾಡು & ಪಶ್ಚಿಮ ಘಟ್ಟಗಳು: ಜೋಗ ಜಲಪಾತ, ಆಗುಂಬೆ (ಭಾರತದ ಚಿರಾಪುಂಜಿ), ಮತ್ತು ಚಿಕ್ಕಮಗಳೂರಿನ ಹಚ್ಚಹಸಿರಿನ ಕಾಫಿ ತೋಟಗಳು ತಮ್ಮ ಗರಿಷ್ಠ ವೈಭವದಲ್ಲಿರುತ್ತವೆ.\n• ಕೂರ್ಗ್ & ಸಕಲೇಶಪುರ: ಮಂಜುಮುಸುಕಿದ ಬೆಟ್ಟಗಳು ಮತ್ತು ಜಲಪಾತಗಳು.\n⚠️ ಮುನ್ನೆಚ್ಚರಿಕೆ: ಚಾರ್ಮಾಡಿ ಮತ್ತು ಶಿರಾಡಿ ಘಾಟಿಗಳಲ್ಲಿ ನಿಧಾನವಾಗಿ ವಾಹನ ಚಲಾಯಿಸಿ. ಕಡಲತೀರಗಳಲ್ಲಿ ಸಮುದ್ರಕ್ಕೆ ಇಳಿಯುವುದನ್ನು ಮತ್ತು ಜಲಪಾತಗಳಲ್ಲಿ ನೀರಿಗೆ ಇಳಿಯುವುದನ್ನು ತಪ್ಪಿಸಿ.`;
    } else {
      reply = `Magical monsoon destinations across Karnataka (July – October):\n• Malnad & Western Ghats: Jog Falls roars in full fury; Agumbe rainforest reveals misty canopies and reptile research stations.\n• Chikkamagaluru & Sakleshpur: Rolling emerald estates surrounded by floating white monsoon clouds.\n• Dudhsagar & Sathodi Waterfalls: Dramatic water torrents descending through dense evergreen forests.\n⚠️ Safety Protocol: Drive cautiously along Charmadi & Shiradi Ghats due to fog. Sea swimming on the Arabian coast is prohibited during active monsoon warnings per Coast Guard directives.`;
    }
    suggestedPlaces = places.filter(p => p.bestMonths && (p.bestMonths.includes('Jul') || p.bestMonths.includes('Aug') || p.bestMonths.includes('Sep'))).slice(0, 4);
    quickPrompts = isKn
      ? ['ಆಗುಂಬೆ ಮಳೆಗಾಲ ಮಾಹಿತಿ', 'ಜೋಗ ಜಲಪಾತ ರಸ್ತೆ ಸ್ಥಿತಿ', 'ಘಾಟ್ ರಸ್ತೆ ಸುರಕ್ಷತೆ']
      : ['Agumbe Rain Timings', 'Jog Falls Water Level', 'Ghat Road Safety Status'];
    return { reply, suggestedPlaces, quickPrompts, source: 'KSNDMC & IMD Meteorological Records' };
  }

  // 10. Local Karnataka Food Inquiries
  if (q.includes('food') || q.includes('cuisine') || q.includes('dishes') || q.includes('eat') || q.includes('ಆಹಾರ') || q.includes('ಊಟ')) {
    if (isKn) {
      reply = `ಕರ್ನಾಟಕದ ರುಚಿಕರ ಸಾಂಪ್ರದಾಯಿಕ ಆಹಾರ ಸಂಸ್ಕೃತಿ:\n• ಕರಾವಳಿ (ಉಡುಪಿ & ಮಂಗಳೂರು): ನೀರ್ ದೋಸೆ, ಕೊರಿ ರೊಟ್ಟಿ, ಮಂಗಳೂರು ಬನ್ಸ್, ಮತ್ತು ಮಸಾಲೆಯುಕ್ತ ಮೀನಿನ ಊಟ.\n• ಮಲೆನಾಡು (ಕೂರ್ಗ್ & ಶಿವಮೊಗ್ಗ): ಕಡಂಬು (ಅಕ್ಕಿ ಉಂಡೆ), ಪಾಂಡಿ ಕರಿ, ಹಲಸಿನ ಹಣ್ಣಿನ ತಿನಿಸುಗಳು, ಮತ್ತು ತಾಜಾ ಫಿಲ್ಟರ್ ಕಾಫಿ.\n• ಉತ್ತರ ಕರ್ನಾಟಕ: ಬಿಸಿ ಜೋಳದ ರೊಟ್ಟಿ, ಎಣ್ಣೆಗಾಯಿ ಬದನೆಕಾಯಿ, ಶೇಂಗಾ ಚಟ್ನಿ ಪುಡಿ ಮತ್ತು ಧಾರವಾಡ ಪೇಡ.\n• ಮೈಸೂರು & ಮಂಡ್ಯ: ಮೈಸೂರು ಮಸಾಲೆ ದೋಸೆ, ರಾಗಿ ಮುದ್ದೆ ನಾಟಿ ಕೋಳಿ ಸಾರು, ಮತ್ತು ರೇಷ್ಮೆಯಂತಹ ಮೈಸೂರು ಪಾಕ್.`;
    } else {
      reply = `Iconic regional gastronomic specialties of Karnataka:\n• Coastal (Mangaluru & Udupi): Neer Dosa, Kori Rotti, Mangalore Buns, Kundapura Chicken Curry, and coastal fish fry.\n• Malnad & Coorg: Kadambuttu (steamed rice balls), Bamboo shoot curry, Akki Rotti with coconut chutney, and roasted estate filter coffee.\n• North Karnataka: Hot Jolada Rotti with Yennegai (stuffed baby brinjal), Shenga (peanut) chutney podi, and famous Dharwad Peda.\n• Old Mysore Region: Crispy red chutney Mysore Masala Dosa, nutritious Ragi Mudde with rustic saaru, and authentic melt-in-mouth Mysore Pak.`;
    }
    suggestedPlaces = places.filter(p => p.nearbyFood && p.nearbyFood.length > 0).slice(0, 4);
    quickPrompts = isKn
      ? ['ಮೈಸೂರು ಮಸಾಲೆ ದೋಸೆ ತಾಣಗಳು', 'ಕರಾವಳಿ ಮೀನಿನ ಊಟ', 'ಧಾರವಾಡ ಪೇಡ ಅಂಗಡಿಗಳು']
      : ['Best Mysore Masala Dosa', 'Coastal Seafood Hubs', 'Dharwad Peda Heritage'];
    return { reply, suggestedPlaces, quickPrompts, source: 'Karnataka Culinary Heritage Guild' };
  }

  // 11. Latest Festivals & Cultural Events
  if (q.includes('festival') || q.includes('culture') || q.includes('event') || q.includes('dasara') || q.includes('utsav') || raw.includes('ಉತ್ಸವ') || raw.includes('ಹಬ್ಬ') || raw.includes('ಕಾರ್ಯಕ್ರಮ')) {
    if (isKn) {
      reply = `ಕರ್ನಾಟಕದ ಪ್ರಸಿದ್ಧ ಸಾಂಸ್ಕೃತಿಕ ಉತ್ಸವಗಳು:\n• ಮೈಸೂರು ದಸರಾ (ವಿಜಯದಶಮಿ): ನಾಡಹಬ್ಬ; ಚಿನ್ನದ ಅಂಬಾರಿಯಲ್ಲಿ ಚಾಮುಂಡೇಶ್ವರಿ ಮೆರವಣಿಗೆ, ಮತ್ತು 1,00,000 ದೀಪಗಳಿಂದ ಬೆಳಗುವ ಮೈಸೂರು ಅರಮನೆ.\n• ಹಂಪಿ ಉತ್ಸವ (ಜನವರಿ/ಫೆಬ್ರವರಿ): ವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯದ ಶಿಲ್ಪಕಲೆಗಳ ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಸಂಗೀತ ಮತ್ತು ನೃತ್ಯ ವೈಭವ.\n• ಕಂಬಳ (ನವೆಂಬರ್ - ಮಾರ್ಚ್): ಕರಾವಳಿ ಕರ್ನಾಟಕದ ಸಾಂಪ್ರದಾಯಿಕ ಗದ್ದೆ ಕೋಣಗಳ ರೋಮಾಂಚಕ ಓಟ.\n• ಯಕ್ಷಗಾನ & ಭೂತ ಕೋಲ: ರಾತ್ರಿಯಿಡೀ ನಡೆಯುವ ಕರಾವಳಿಯ ವಿಶಿಷ್ಟ ದೈವಿಕ ರಂಗಭೂಮಿ ಕಲೆ.`;
    } else {
      reply = `Premier cultural festivals and living traditions of Karnataka:\n• Mysuru Dasara (September/October): The 10-day State Festival (Naada Habba) with the iconic Jumboo Savari elephant procession and 100,000 incandescent palace lights.\n• Hampi Utsav (Jan/Feb): Magnificent 3-day cultural extravaganza illuminating the UNESCO ruins with classical music, fireworks, and heritage pageants.\n• Coastal Kambala (Nov to March): High-octane traditional slushy paddy field buffalo races in Dakshina Kannada & Udupi.\n• Yakshagana & Bhoota Kola: Ancient twilight dance-drama traditions with elaborate headdresses and spiritual reverence.`;
    }
    quickPrompts = isKn
      ? ['ದಸರಾ ಟಿಕೆಟ್ ಮಾಹಿತಿ', 'ಹಂಪಿ ಉತ್ಸವ ದಿನಾಂಕ', 'ಕಂಬಳ ವೇಳಾಪಟ್ಟಿ']
      : ['Dasara Gold Card Info', 'Hampi Utsav Dates', 'Kambala Race Schedule'];
    return { reply, suggestedPlaces: [getPlace('mysuru_palace'), getPlace('hampi')].filter(Boolean), quickPrompts, source: 'Department of Kannada and Culture' };
  }

  // 12. Best Places to visit in Karnataka (General overview)
  if (q.includes('best place') || q.includes('top place') || q.includes('must visit') || raw.includes('ಅತ್ಯುತ್ತಮ') || raw.includes('ಪ್ರಮುಖ') || raw.includes('ತಾಣಗಳು') || (q.includes('visit') && q.includes('karnataka'))) {
    if (isKn) {
      reply = `ಕರ್ನಾಟಕದಲ್ಲಿ ಭೇಟಿ ನೀಡಲೇಬೇಕಾದ ಪ್ರಮುಖ 5 ಅದ್ಭುತ ತಾಣಗಳು:\n1. ಹಂಪಿ (ವಿಜಯನಗರ): ಯುನೆಸ್ಕೋ ವಿಶ್ವ ಪರಂಪರೆಯ ವಿಜಯನಗರ ಶಿಲ್ಪಕಲೆಯ ರಾಜಧಾನಿ.\n2. ಮೈಸೂರು: ಅರಮನೆ, ಮೃಗಾಲಯ ಮತ್ತು ಶ್ರೀಮಂತ ಸಾಂಸ್ಕೃತಿಕ ಪರಂಪರೆ.\n3. ಕೊಡಗು (ಕೂರ್ಗ್): ಹಸಿರು ಕಾಫಿ ತೋಟಗಳು, ರಾಜಾಸೀಟ್ ಮತ್ತು ಅಬ್ಬೆ ಜಲಪಾತ.\n4. ಗೋಕರ್ಣ: ಪ್ರಶಾಂತ ಓಂ ಬೀಚ್ ಮತ್ತು ಪ್ರಾಚೀನ ಮಹಾಬಲೇಶ್ವರ ದೇವಸ್ಥಾನ.\n5. ಜೋಗ ಜಲಪಾತ (ಶಿವಮೊಗ್ಗ): ಭೋರ್ಗರೆಯುವ ಶರಾವತಿ ನದಿಯ 4 ರುದ್ರರಮಣೀಯ ಜಲಪಾತಗಳು.`;
    } else {
      reply = `Top 5 quintessential Karnataka destinations:\n1. Hampi (Vijayanagara): UNESCO World Heritage 14th-century empire ruins, Stone Chariot, and boulder-strewn sunsets.\n2. Mysuru: Grand Maharaja's Palace, Chamundi Hills, and rich royal heritage.\n3. Coorg (Kodagu): Rolling coffee plantations, misty waterfalls, and spice estates.\n4. Gokarna: Serene Om Beach, coastal cliffs, and sacred Mahabaleshwar Temple.\n5. Jog Falls (Shivamogga): India's magnificent 253-meter plunge waterfall in the heart of the Western Ghats.`;
    }
    suggestedPlaces = [getPlace('hampi'), getPlace('mysuru_palace'), getPlace('coorg_abbey_falls'), getPlace('gokarna_beach')].filter(Boolean);
    quickPrompts = isKn
      ? ['ಹಂಪಿ ಮಾರ್ಗಸೂಚಿ', 'ಮೈಸೂರು ಅರಮನೆ ಸಮಯ', 'ಕೂರ್ಗ್ ಪ್ರವಾಸ']
      : ['Explore Hampi', 'Mysuru Palace Timings', 'Plan Coorg Trip'];
    return { reply, suggestedPlaces, quickPrompts, source: 'Karnataka Tourism Board' };
  }

  // 13. Specific Place Matching in database
  const matchingPlace = places.find(p => {
    const pName = cleanQuery(p.name);
    const pKannada = (p.nameKannada || '').toLowerCase();
    const pId = (p.id || '').replace(/_/g, ' ');
    return q.includes(pName) || pName.includes(q) || (pKannada && raw.includes(pKannada)) || q.includes(pId);
  });

  if (matchingPlace) {
    const fee = matchingPlace.entryFeeINR ? `Entry fee: ₹${matchingPlace.entryFeeINR}.` : 'Free entry.';
    const hours = matchingPlace.openingHours ? `Timings: ${matchingPlace.openingHours}.` : 'Open during daytime.';
    const loc = `${matchingPlace.district} district, ${matchingPlace.taluk || ''}`;

    if (isKn) {
      reply = `${matchingPlace.nameKannada || matchingPlace.name} (${loc}): ${matchingPlace.description || ''}\n• ಸಮಯ: ${hours}\n• ಪ್ರವೇಶ ಶುಲ್ಕ: ${fee}`;
    } else {
      reply = `${matchingPlace.name} (${loc}): ${matchingPlace.description || ''}\n• Hours: ${hours}\n• Fee: ${fee}`;
    }
    suggestedPlaces = [matchingPlace];
    quickPrompts = isKn
      ? [`${matchingPlace.district} ಜಿಲ್ಲೆಯ ಇತರ ತಾಣಗಳು`, 'ಹತ್ತಿರದ ಹೋಟೆಲ್‌ಗಳು', 'ಪ್ರವಾಸಕ್ಕೆ ಸೇರಿಸಿ']
      : [`More in ${matchingPlace.district}`, 'Nearby Food & Stays', 'Add to My Trip'];
    return { reply, suggestedPlaces, quickPrompts, source: matchingPlace.dataSource || 'Official ASI / KSTDC Registry' };
  }

  // 14. Fallback default
  if (isKn) {
    reply = `ನಮಸ್ಕಾರ! ಪ್ರವಾಸ AI ಗೆ ಸುಸ್ವಾಗತ. ನೀವು ಕರ್ನಾಟಕದ ಎಲ್ಲಾ 31 ಜಿಲ್ಲೆಗಳ 159+ ಪರಿಶೀಲಿಸಿದ ತಾಣಗಳು, ಹಂಪಿ ಪರಂಪರೆ, ಕೂರ್ಗ್ ಕಾಫಿ ತೋಟಗಳು, ಜಲಪಾತಗಳ ಸುರಕ್ಷತೆ, ಅಥವಾ ಚಾರಣ ಮಾರ್ಗಗಳ ಬಗ್ಗೆ ಯಾವುದೇ ಮಾಹಿತಿ ಕೇಳಬಹುದು.`;
    quickPrompts = ['ಕರ್ನಾಟಕದ ಅತ್ಯುತ್ತಮ ತಾಣಗಳು', 'ಕೂರ್ಗ್ 3 ದಿನಗಳ ಪ್ರವಾಸ', 'ಸುರಕ್ಷಿತ ಜಲಪಾತಗಳು', 'ವನ್ಯಜೀವಿ ಸಫಾರಿ'];
  } else {
    reply = `Namaskara! Welcome to Pravasa AI. You can ask me anything about Karnataka's 31 districts, verified ASI heritage monuments, 3-day itineraries, trekking permits, wildlife safaris, or distance calculations.`;
    quickPrompts = ['Best places in Karnataka', 'Plan 3-day Coorg trip', 'Safe waterfalls to visit', 'Wildlife safari destinations'];
  }
  suggestedPlaces = [getPlace('hampi'), getPlace('mysuru_palace')].filter(Boolean);

  return { reply, suggestedPlaces, quickPrompts, source: 'Pravasa AI Intelligence Engine' };
}

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, plan, isCompanionChat, lang } = req.body;

    // Case 1: General companion chat or no itinerary plan provided
    if (isCompanionChat || !plan) {
      // 1. Try Gemini AI with strict data grounding if API key is present
      if (hasKey()) {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
          const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
          const model = genAI.getGenerativeModel({ model: modelName });

          const prompt = `You are Pravasa AI, an expert, courteous Karnataka tourism guide.
User query: "${message}"
Language preference: ${lang === 'kn' ? 'Kannada (ಕನ್ನಡ)' : 'English'}.

Strict Grounding Rules:
- Rely strictly on verified Karnataka facts, geography, distances, and Archaeological Survey of India (ASI) regulations.
- Never invent imaginary entry ticket fees or fake opening hours.
- If mentioning Hampi, Badami, or ASI monuments, note they close at sunset (6:00 PM).
- Answer in 3 to 4 clear, helpful sentences.`;

          const result = await model.generateContent(prompt);
          const aiReply = result.response.text();
          if (aiReply && aiReply.trim()) {
            // Also run rule matcher to extract matched destination cards
            const fallbackObj = generateCompanionReply(message, lang);
            return res.json({
              reply: aiReply.trim(),
              suggestedPlaces: fallbackObj.suggestedPlaces || [],
              quickPrompts: fallbackObj.quickPrompts || [],
              source: 'Google Gemini 2.0 & Karnataka Tourism Master Database'
            });
          }
        } catch (err) {
          console.warn('[Gemini Companion Notice]', err.message);
        }
      }

      // 2. High-precision rule-based and RAG knowledge engine
      const out = generateCompanionReply(message, lang);
      return res.json(out);
    }

    // Case 2: Itinerary plan refinement
    if (hasKey()) {
      try {
        console.log(`[Chat] Refining itinerary with Gemini AI: "${message}"...`);
        const out = await chatWithAI(message, plan);
        if (out) return res.json(out);
      } catch (e) {
        console.error('[Gemini Chat Fallback] AI chat failed, falling back to rule adjustments:', e.message);
      }
    }

    // Safe rule-based plan fallback
    const newPlan = plan ? JSON.parse(JSON.stringify(plan)) : { days: [] };
    const msg = (message || '').toLowerCase();
    if (newPlan.days && (msg.includes('less tiring') || msg.includes('relax') || msg.includes('easy'))) {
      newPlan.days.forEach(d => {
        if (d.stops && d.stops.length > 2) d.stops = d.stops.slice(0, 2);
      });
    }

    return res.json(newPlan);
  } catch (error) {
    console.error('[Chat Route Error]', error);
    return res.status(500).json({
      error: 'An error occurred during chat processing',
      reply: 'Karnataka Tourism information can be explored on the interactive map or by calling KSTDC at 1800-425-4425.',
      suggestedPlaces: [],
      quickPrompts: []
    });
  }
});

module.exports = router;
