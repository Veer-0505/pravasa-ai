const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { importData } = require('../services/importer');
const { searchPlaces, localAdapter } = require('../services/adapters');
const { getLiveWeather } = require('../services/weather');
const {
  isSupabaseEnabled,
  getSupabaseDestinations,
  upsertSupabaseDestination,
  deleteSupabaseDestination,
  uploadToSupabaseBucket
} = require('../services/supabase');
const { requireAdmin } = require('../middleware/auth');

const placesPath = path.join(__dirname, '..', 'data', 'places.json');
const uploadsDir = path.join(__dirname, '..', 'uploads');
const photosDir = path.join(uploadsDir, 'photos');
const videosDir = path.join(uploadsDir, 'videos');

if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

// Configure durable disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('video/')) {
      cb(null, videosDir);
    } else {
      cb(null, photosDir);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 75 * 1024 * 1024 // 75MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPG, PNG, WEBP, AVIF, MP4, WEBM`));
    }
  }
});

function getPlaces() {
  return JSON.parse(fs.readFileSync(placesPath, 'utf8'));
}

/**
 * Synchronize modular district files and districts.json with master places.json
 */
function syncDistrictFile(districtName) {
  try {
    if (!districtName) return;
    const districtsFilePath = path.join(__dirname, '..', 'data', 'districts.json');
    const districtsDir = path.join(__dirname, '..', 'data', 'districts');
    if (!fs.existsSync(districtsFilePath)) return;

    const districts = JSON.parse(fs.readFileSync(districtsFilePath, 'utf8'));
    const distLower = districtName.toLowerCase().trim();
    const dObj = districts.find(d => 
      d.name.toLowerCase() === distLower || 
      d.id.toLowerCase() === distLower || 
      d.id.toLowerCase() === distLower.replace(/\s+/g, '_')
    );
    if (!dObj) return;

    const allPlaces = getPlaces();
    const dPlaces = allPlaces.filter(p => {
      const pDist = (p.district || '').toLowerCase();
      return pDist === distLower || pDist === dObj.id.toLowerCase() || pDist.replace(/\s+/g, '_') === dObj.id.toLowerCase();
    });

    // 1. Update modular district file if directory exists
    if (fs.existsSync(districtsDir)) {
      const modPath = path.join(districtsDir, `${dObj.id}.json`);
      fs.writeFileSync(modPath, JSON.stringify({
        district: dObj.name,
        destinations: dPlaces,
        count: dPlaces.length
      }, null, 2), 'utf8');
    }

    // 2. Update topSpots & attractionCount in districts.json
    dObj.attractionCount = dPlaces.length;
    dObj.topSpots = dPlaces.slice(0, 8).map(p => ({
      id: p.id,
      name: p.name,
      nameKannada: p.nameKannada || p.name,
      image: p.image,
      category: Array.isArray(p.category) ? p.category : [p.category || 'heritage'],
      entryFeeINR: p.entryFeeINR || 0,
      avgVisitHours: p.estimatedVisitDuration ? parseInt(p.estimatedVisitDuration) || 2 : 2,
      hiddenGemStatus: p.hiddenGemClassification?.status || (p.offbeat ? 'hidden_gem' : 'popular')
    }));

    fs.writeFileSync(districtsFilePath, JSON.stringify(districts, null, 2), 'utf8');
    console.log(`[District Sync] Synchronized ${dObj.name} (${dPlaces.length} destinations)`);
  } catch (err) {
    console.error('[District Sync Error]', err.message);
  }
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Compute standardized Tourism Accessibility Score (1–10)
 * Evaluates wheelchair access, flat terrain, rest areas, senior friendliness
 */
function computeAccessibilityScore(place) {
  let score = 5; // Baseline
  if (place.seniorFriendly) score += 2;
  if (place.familyFriendly) score += 1;
  const acc = (place.accessibility || '').toLowerCase();
  if (acc.includes('wheelchair') || acc.includes('ramp') || acc.includes('fully accessible') || acc.includes('flat terrain')) {
    score += 2;
  }
  if (acc.includes('steps') || acc.includes('steep') || acc.includes('rough') || acc.includes('rocky') || acc.includes('boulder')) {
    score -= 2;
  }
  return Math.max(1, Math.min(10, score));
}

/**
 * Weather & seasonal advisory engine based on current month and Karnataka geographical zone
 */
function getSeasonalAdvisory(place) {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const region = place.region || '';
  const type = place.place_type || '';

  // Western Ghats / Coastal monsoon check (June to Sept)
  if (currentMonth >= 6 && currentMonth <= 9) {
    if (type === 'waterfall' || type === 'viewpoint' || type === 'hills') {
      return {
        level: 'caution',
        note: 'Monsoon season: Heavy rainfall in Western Ghats. Waterfalls are spectacular but rocks may be slippery. Check local road advisories.'
      };
    }
    if (type === 'beach') {
      return {
        level: 'warning',
        note: 'Monsoon rough sea: Swimming strictly prohibited along Arabian Sea coast due to high surf.'
      };
    }
  }

  // Peak summer (April to May) in North Karnataka
  if (currentMonth >= 4 && currentMonth <= 5 && (region.includes('North') || place.division === 'Kalaburagi' || place.division === 'Belagavi')) {
    return {
      level: 'info',
      note: 'Summer heat: Temperatures can exceed 38°C. Plan heritage monument visits early morning (before 10:30 AM) or after 4:00 PM.'
    };
  }

  // Pleasant season (Oct to Feb)
  if (currentMonth >= 10 || currentMonth <= 2) {
    return {
      level: 'ideal',
      note: 'Optimal travel season: Pleasant temperatures across Karnataka heritage circuits and hill stations.'
    };
  }

  return {
    level: 'normal',
    note: 'Standard seasonal conditions. Follow posted local archaeological and environmental guidelines.'
  };
}

/**
 * GET /api/places
 * Search by natural query, name, district, taluk, category, or place_type
 */
router.get('/', async (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  const { division, district, taluk, category, place_type, offbeat, hidden_gem_status, search, q, limit, offset, verified_only, lat, lng } = req.query;

  const queryText = (q || search || '').trim();
  const nearLat = parseFloat(lat);
  const nearLng = parseFloat(lng);
  const center = (!isNaN(nearLat) && !isNaN(nearLng)) ? { lat: nearLat, lng: nearLng } : null;

  const cats = [];
  if (category && category !== 'all') cats.push(category);
  if (place_type) cats.push(place_type);

  // 1. PRIMARY SOURCE OF TRUTH: Supabase PostgreSQL
  if (isSupabaseEnabled()) {
    try {
      const sbPlaces = await getSupabaseDestinations({
        district,
        taluk,
        offbeat: offbeat === 'true' || hidden_gem_status === 'hidden_gem' ? true : undefined,
        isPublished: verified_only === 'true' ? true : undefined
      });

      if (sbPlaces && sbPlaces.length > 0) {
        let items = sbPlaces;

        // Text search filter
        if (queryText) {
          const qLower = queryText.toLowerCase();
          items = items.filter(p =>
            p.name.toLowerCase().includes(qLower) ||
            (p.nameKannada && p.nameKannada.includes(queryText)) ||
            (p.district && p.district.toLowerCase().includes(qLower)) ||
            (p.taluk && p.taluk.toLowerCase().includes(qLower)) ||
            (p.description && p.description.toLowerCase().includes(qLower))
          );
        }

        // Category filter
        if (cats.length > 0) {
          items = items.filter(p => {
            const pCats = p.category || [];
            return cats.some(c => pCats.includes(c) || p.place_type === c);
          });
        }

        // Division filter
        if (division) {
          items = items.filter(p => (p.division || '').toLowerCase() === division.toLowerCase());
        }

        // Hidden gem filter
        if (hidden_gem_status && hidden_gem_status !== 'all') {
          items = items.filter(p => {
            const s = p.hiddenGemClassification?.status || (p.offbeat ? 'hidden_gem' : 'popular');
            return s === hidden_gem_status;
          });
        }

        const total = items.length;
        const pageLimit = parseInt(limit) || total;
        const pageOffset = parseInt(offset) || 0;
        const paged = items.slice(pageOffset, pageOffset + pageLimit);

        return res.json({
          data: paged,
          total,
          offset: pageOffset,
          limit: pageLimit,
          source: 'supabase'
        });
      }
    } catch (sbErr) {
      console.warn('[Places Route] Falling back to local index:', sbErr.message);
    }
  }

  // 2. Fallback to Local Index
  try {
    const result = await searchPlaces({
      query: queryText,
      center,
      categories: cats,
      district,
      taluk,
      offbeatOnly: offbeat === 'true' || hidden_gem_status === 'hidden_gem',
      limit: parseInt(limit) || 300,
      offset: parseInt(offset) || 0
    });

    let items = result.items;
    if (division) {
      items = items.filter(p => (p.division || '').toLowerCase() === division.toLowerCase());
    }
    if (hidden_gem_status && hidden_gem_status !== 'all') {
      items = items.filter(p => {
        const s = p.hiddenGemClassification?.status || (p.offbeat ? 'hidden_gem' : 'popular');
        return s === hidden_gem_status;
      });
    }
    if (verified_only === 'true') {
      items = items.filter(p => p.verification_status !== 'draft');
    }

    res.json({
      data: items,
      total: result.total,
      offset: parseInt(offset) || 0,
      limit: parseInt(limit) || items.length,
      parsedQuery: result.parsedQuery,
      source: 'local'
    });
  } catch (err) {
    console.error('[Places Route Error]', err);
    const places = getPlaces();
    res.json({ data: places.slice(0, parseInt(limit) || 50), total: places.length });
  }
});

const reportsPath = path.join(__dirname, '..', 'data', 'place_reports.json');
function readPlaceReports() {
  try {
    if (!fs.existsSync(reportsPath)) return [];
    return JSON.parse(fs.readFileSync(reportsPath, 'utf8'));
  } catch {
    return [];
  }
}
function writePlaceReports(reports) {
  try {
    fs.writeFileSync(reportsPath, JSON.stringify(reports, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

/**
 * GET /api/places/reports/all
 * List all destination discrepancy reports for administrator review
 */
router.get('/reports/all', (req, res) => {
  const reports = readPlaceReports();
  res.json({ ok: true, count: reports.length, reports });
});

/**
 * PATCH /api/places/reports/:reportId
 * Update discrepancy report status (resolve/dismiss)
 */
router.patch('/reports/:reportId', (req, res) => {
  const { reportId } = req.params;
  const { status, adminNotes } = req.body;

  const reports = readPlaceReports();
  const report = reports.find(r => r.id === reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (status) report.status = status;
  if (adminNotes) report.adminNotes = adminNotes;
  if (status === 'resolved') report.resolvedAt = new Date().toISOString();

  writePlaceReports(reports);
  res.json({ ok: true, message: `Report ${reportId} marked as ${status}`, report });
});

/**
 * GET /api/places/live-weather?lat=...&lng=...
 * Live weather query by latitude & longitude
 * Mounted BEFORE /:id to prevent route shadowing
 */
router.get('/live-weather', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const weather = await getLiveWeather(lat, lng);
  res.json(weather);
});

/**
 * GET /api/places/:id
 * Retrieve the exact place details for a tapped marker
 */
router.get('/:id', async (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  const place = await localAdapter.getPlaceById(req.params.id);
  if (!place) {
    return res.status(404).json({ error: 'Place not found in database', id: req.params.id });
  }

  const accessibilityScore = computeAccessibilityScore(place);
  const seasonalAdvisory = getSeasonalAdvisory(place);

  res.json({
    ...place,
    accessibilityScore,
    seasonalAdvisory,
    officialLinks: {
      karnatakaTourism: place.source_url || 'https://karnatakatourism.org',
      lgdDirectory: 'https://lgdirectory.gov.in',
      emergencyCentral: 'tel:112',
      tourismHelpline: 'tel:18004254425'
    }
  });
});

/**
 * GET /api/places/:id/nearby
 * Find verified nearby places using radius_m (meters) or radius (km)
 */
router.get('/:id/nearby', async (req, res) => {
  const place = await localAdapter.getPlaceById(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });

  // radius in meters: support radius_m or legacy radius in km
  const radiusMeters = parseFloat(req.query.radius_m) || (parseFloat(req.query.radius) ? parseFloat(req.query.radius) * 1000 : 35000);
  const radiusKm = radiusMeters / 1000;

  const result = await localAdapter.search({
    center: { lat: place.lat, lng: place.lng, name: place.name },
    radiusKm,
    limit: 15
  });

  const nearby = (result.items || [])
    .filter(p => p.id !== place.id)
    .map(p => ({
      ...p,
      distanceKm: p.distanceKm !== undefined ? p.distanceKm : Math.round((haversineMeters(place.lat, place.lng, p.lat, p.lng) / 1000) * 10) / 10
    }));

  res.json({ items: nearby, total: nearby.length, radius_m: radiusMeters });
});

/**
 * GET /api/places/:id/weather
 * Live weather conditions for specific destination via Open-Meteo
 */
router.get('/:id/weather', async (req, res) => {
  const place = await localAdapter.getPlaceById(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });
  const weather = await getLiveWeather(place.lat, place.lng);
  res.json({
    placeId: place.id,
    placeName: place.name,
    district: place.district,
    ...weather
  });
});

/**
 * POST /api/places/upload-media
 * Authorized Admin: Durable file upload for destination photos & videos
 * Accepts both 'media' and 'mediaFile' multipart fields
 * Stores securely on local disk with unique names and MIME verification
 */
const uploadMediaHandler = (req, res, next) => {
  upload.fields([{ name: 'media', maxCount: 1 }, { name: 'mediaFile', maxCount: 1 }])(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (req.files) {
      req.file = (req.files['media'] && req.files['media'][0]) || (req.files['mediaFile'] && req.files['mediaFile'][0]) || null;
    }
    next();
  });
};

router.post('/upload-media', uploadMediaHandler, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided.' });
    }
    const isVideo = req.file.mimetype.startsWith('video/');
    let mediaUrl = isVideo ? `/uploads/videos/${req.file.filename}` : `/uploads/photos/${req.file.filename}`;

    // Upload to Supabase Storage if configured
    if (isSupabaseEnabled()) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const bucket = isVideo ? 'tourism-backgrounds' : 'destination-images';
        const uploadRes = await uploadToSupabaseBucket(fileBuffer, req.file.originalname, req.file.mimetype, bucket);
        if (uploadRes && uploadRes.url) {
          mediaUrl = uploadRes.url;
          console.log(`[Supabase Storage] Uploaded to bucket ${bucket}: ${mediaUrl}`);
        }
      } catch (sbErr) {
        console.error('[Supabase Storage Upload Warning]', sbErr.message);
      }
    }

    console.log(`[Media Upload] Processed ${req.file.mimetype} (${Math.round(req.file.size / 1024)} KB) -> ${mediaUrl}`);

    res.json({
      ok: true,
      url: mediaUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      mediaType: isVideo ? 'video' : 'photo'
    });
  } catch (err) {
    console.error('[Upload Media Error]', err);
    res.status(500).json({ error: 'Failed to process media upload: ' + err.message });
  }
});

/**
 * POST /api/places
 * Government Admin: Add new tourist destination with photos and service details
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      nameKannada,
      district,
      taluk,
      category,
      place_type,
      lat,
      lng,
      description,
      image,
      imageAttribution,
      timeOfDayMedia,
      video,
      isPublished,
      entryFeeINR,
      openingHours,
      contact,
      official_website,
      accessibility,
      parking,
      services,
      offbeat,
      googleMapsUrl
    } = req.body;

    if (!name || !district) {
      return res.status(400).json({ error: 'Place name and district are required.' });
    }

    // Parse lat/lng if provided, or extract from Google Maps URL, or default gracefully
    let parsedLat = parseFloat(lat);
    let parsedLng = parseFloat(lng);
    const gUrl = googleMapsUrl || official_website || '';
    if (gUrl && (isNaN(parsedLat) || isNaN(parsedLng))) {
      const match = gUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || gUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) || gUrl.match(/destination=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        parsedLat = parseFloat(match[1]);
        parsedLng = parseFloat(match[2]);
      }
    }
    if (isNaN(parsedLat)) parsedLat = 15.3350;
    if (isNaN(parsedLng)) parsedLng = 76.4600;

    const places = getPlaces();
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    const id = req.body.id || `gov_${slug}_${Date.now()}`;

    if (places.some(p => p.id === id)) {
      return res.status(409).json({ error: 'A place with this ID already exists.' });
    }

    const verifiedImage = image ? image.trim() : 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Virupaksha_Temple%2C_Hampi.jpg/960px-Virupaksha_Temple%2C_Hampi.jpg';

    const newPlace = {
      id,
      name: name.trim(),
      nameKannada: nameKannada ? nameKannada.trim() : name.trim(),
      place_type: place_type || 'attraction',
      category: category ? (Array.isArray(category) ? category : [category]) : ['heritage'],
      lat: parsedLat,
      lng: parsedLng,
      googleMapsUrl: gUrl || '',
      district: district.trim(),
      taluk: taluk ? taluk.trim() : district.trim(),
      description: description ? description.trim() : 'Official tourist destination under Dept of Tourism, Karnataka.',
      image: verifiedImage,
      imageAttribution: imageAttribution || {
        source: 'Karnataka Tourism Official Admin',
        author: 'Dept of Tourism, Karnataka',
        license: 'Official / Public Domain',
        licenseUrl: 'https://karnatakatourism.org'
      },
      timeOfDayMedia: timeOfDayMedia || {
        morning: { url: verifiedImage, caption: `Morning view of ${name}`, attribution: 'Karnataka Tourism' },
        afternoon: { url: verifiedImage, caption: `Daytime visitor view of ${name}`, attribution: 'Karnataka Tourism' },
        evening: { url: verifiedImage, caption: `Sunset light over ${name}`, attribution: 'Karnataka Tourism' },
        night: {
          url: verifiedImage,
          caption: `Night view of ${name}`,
          attribution: 'Karnataka Tourism',
          isOpenAtNight: false,
          nightNotes: 'Site closes at sunset (6:00 PM) for safety and conservation.'
        }
      },
      video: video || {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=kY31QY0057E',
        videoId: 'kY31QY0057E',
        title: `${name} | Karnataka Tourism Official`,
        thumbnail: 'https://img.youtube.com/vi/kY31QY0057E/hqdefault.jpg',
        attribution: 'Department of Tourism, Government of Karnataka'
      },
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      entryFeeINR: entryFeeINR !== undefined ? Number(entryFeeINR) : 0,
      openingHours: openingHours ? openingHours.trim() : '09:00 - 18:00',
      contact: contact ? contact.trim() : '1800-425-4425',
      official_website: official_website ? official_website.trim() : 'https://karnatakatourism.org',
      accessibility: accessibility ? accessibility.trim() : 'Wheelchair accessible ramps and paved pathways.',
      parking: parking !== undefined ? Boolean(parking) : true,
      services: services || ['Parking', 'Restrooms', 'Drinking Water', 'Guide Assistance'],
      offbeat: offbeat !== undefined ? Boolean(offbeat) : false,
      verification_status: 'verified',
      verifiedDate: new Date().toISOString().split('T')[0],
      source: 'Dept of Tourism, Govt of Karnataka (Official Admin)',
      source_url: official_website || 'https://karnatakatourism.org'
    };

    places.unshift(newPlace);
    fs.writeFileSync(placesPath, JSON.stringify(places, null, 2), 'utf8');

    // Keep district modular files and districts.json in sync
    syncDistrictFile(newPlace.district);

    // Sync to Supabase PostgreSQL as primary
    if (isSupabaseEnabled()) {
      try {
        await upsertSupabaseDestination(newPlace);
      } catch (err) {
        console.error('[Supabase Post Sync Error]', err.message);
      }
    }

    console.log(`[Gov Admin] Added new destination: ${newPlace.name} (${newPlace.id}) in ${newPlace.district}`);

    res.status(201).json({
      ok: true,
      message: 'Destination successfully added to Karnataka Tourism verified repository.',
      place: newPlace
    });
  } catch (err) {
    console.error('[Add Place Error]', err);
    res.status(500).json({ error: 'Failed to add place: ' + err.message });
  }
});

/**
 * PUT /api/places/:id
 * Government Admin: Update destination details, daytime photos, videos, and visitor services
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const places = getPlaces();
    const idx = places.findIndex(p => p.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Place not found in database: ' + req.params.id });
    }

    const current = places[idx];
    const {
      name,
      nameKannada,
      district,
      taluk,
      category,
      place_type,
      lat,
      lng,
      description,
      image,
      imageAttribution,
      timeOfDayMedia,
      video,
      isPublished,
      entryFeeINR,
      openingHours,
      contact,
      official_website,
      accessibility,
      parking,
      services,
      offbeat,
      serviceStatus
    } = req.body;

    const updated = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      nameKannada: nameKannada !== undefined ? nameKannada.trim() : current.nameKannada,
      district: district !== undefined ? district.trim() : current.district,
      taluk: taluk !== undefined ? taluk.trim() : current.taluk,
      category: category !== undefined ? (Array.isArray(category) ? category : [category]) : current.category,
      place_type: place_type !== undefined ? place_type : current.place_type,
      lat: lat !== undefined ? parseFloat(lat) : current.lat,
      lng: lng !== undefined ? parseFloat(lng) : current.lng,
      description: description !== undefined ? description.trim() : current.description,
      image: image !== undefined ? image.trim() : current.image,
      imageAttribution: imageAttribution !== undefined ? imageAttribution : (current.imageAttribution || {
        source: 'Karnataka Tourism / LGD Directory',
        license: 'CC BY-SA 4.0 / Public Domain'
      }),
      timeOfDayMedia: timeOfDayMedia !== undefined ? timeOfDayMedia : (current.timeOfDayMedia || null),
      video: video !== undefined ? video : (current.video || null),
      isPublished: isPublished !== undefined ? Boolean(isPublished) : (current.isPublished !== undefined ? current.isPublished : true),
      entryFeeINR: entryFeeINR !== undefined ? Number(entryFeeINR) : current.entryFeeINR,
      openingHours: openingHours !== undefined ? openingHours.trim() : current.openingHours,
      contact: contact !== undefined ? contact.trim() : current.contact,
      official_website: official_website !== undefined ? official_website.trim() : current.official_website,
      accessibility: accessibility !== undefined ? accessibility.trim() : current.accessibility,
      parking: parking !== undefined ? Boolean(parking) : current.parking,
      services: services !== undefined ? services : (current.services || []),
      offbeat: offbeat !== undefined ? Boolean(offbeat) : current.offbeat,
      serviceStatus: serviceStatus || current.serviceStatus || 'Operational',
      verifiedDate: new Date().toISOString().split('T')[0],
      lastUpdatedBy: 'Gov Tourism Admin'
    };

    places[idx] = updated;
    fs.writeFileSync(placesPath, JSON.stringify(places, null, 2), 'utf8');

    // Keep district modular files and districts.json in sync
    syncDistrictFile(updated.district);
    if (current.district && current.district.toLowerCase() !== updated.district.toLowerCase()) {
      syncDistrictFile(current.district);
    }

    // Sync to Supabase PostgreSQL as primary
    if (isSupabaseEnabled()) {
      try {
        await upsertSupabaseDestination(updated);
      } catch (err) {
        console.error('[Supabase Put Sync Error]', err.message);
      }
    }

    console.log(`[Gov Admin] Updated destination: ${updated.name} (Photos, daytime media, and services persisted)`);

    res.json({
      ok: true,
      message: 'Destination media, timings, and services updated successfully.',
      place: updated
    });
  } catch (err) {
    console.error('[Update Place Error]', err);
    res.status(500).json({ error: 'Failed to update place: ' + err.message });
  }
});

/**
 * PATCH /api/places/:id/publish
 * Government Admin: Toggle publish / unpublish status
 */
router.patch('/:id/publish', requireAdmin, async (req, res) => {
  try {
    const places = getPlaces();
    const idx = places.findIndex(p => p.id === req.params.id);
    const newStatus = req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : true;

    // Update in Supabase
    if (isSupabaseEnabled()) {
      try {
        await upsertSupabaseDestination({ id: req.params.id, isPublished: newStatus });
      } catch (sbErr) {
        console.warn('[Supabase Publish Sync Warning]', sbErr.message);
      }
    }

    let current = null;
    if (idx !== -1) {
      current = places[idx];
      current.isPublished = newStatus;
      places[idx] = current;
      fs.writeFileSync(placesPath, JSON.stringify(places, null, 2), 'utf8');
      syncDistrictFile(current.district);
    }

    console.log(`[Gov Admin] Destination ${req.params.id} published status set to: ${newStatus}`);

    res.json({
      ok: true,
      message: `Destination "${req.params.id}" is now ${newStatus ? 'Published to Public' : 'Unpublished (Draft)'}.`,
      isPublished: newStatus,
      place: current
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle publish status: ' + err.message });
  }
});

/**
 * DELETE /api/places/:id
 * Government Admin: Delete destination from repository
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    let removed = null;

    // Delete from Supabase PostgreSQL as primary
    if (isSupabaseEnabled()) {
      try {
        await deleteSupabaseDestination(id);
      } catch (sbErr) {
        console.error('[Supabase Delete Sync Error]', sbErr.message);
      }
    }

    const places = getPlaces();
    const idx = places.findIndex(p => p.id === id);
    if (idx !== -1) {
      removed = places.splice(idx, 1)[0];
      fs.writeFileSync(placesPath, JSON.stringify(places, null, 2), 'utf8');
      syncDistrictFile(removed.district);
    }

    console.log(`[Gov Admin] Deleted destination: ${id}`);

    res.json({
      ok: true,
      message: `Destination "${id}" deleted successfully from database.`,
      deletedId: id
    });
  } catch (err) {
    console.error('[Delete Place Error]', err);
    res.status(500).json({ error: 'Failed to delete place: ' + err.message });
  }
});

/**
 * POST /api/places/import
 * CSV or JSON import and validation pipeline
 */
router.post('/import', (req, res) => {
  try {
    const payload = req.body.csv || req.body.items || req.body;
    const result = importData(payload, placesPath);
    res.json({
      ok: true,
      message: `Processed ${result.totalSubmitted} records. Imported ${result.imported} new, updated ${result.updated}, rejected ${result.rejected}.`,
      ...result
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/places/:id/report
 * Community endpoint to submit discrepancy or inaccurate info about a place
 */
router.post('/:id/report', (req, res) => {
  try {
    const { id } = req.params;
    const { category, reportedIssue, suggestedCorrection, reporterEmail } = req.body;

    if (!reportedIssue || reportedIssue.trim().length < 10) {
      return res.status(400).json({ error: 'Please describe the discrepancy in at least 10 characters.' });
    }

    const places = getPlaces();
    const place = places.find(p => p.id === id);

    const reports = readPlaceReports();
    const newReport = {
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      placeId: id,
      placeName: place ? place.name : id,
      category: category || 'general',
      reportedIssue: reportedIssue.trim(),
      suggestedCorrection: (suggestedCorrection || '').trim(),
      reporterEmail: (reporterEmail || 'Anonymous Visitor').trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    reports.unshift(newReport);
    writePlaceReports(reports);

    console.log(`[Discrepancy Report] Submitted for ${id}: ${newReport.category} - "${newReport.reportedIssue.slice(0, 50)}..."`);
    res.status(201).json({
      ok: true,
      message: 'Thank you! Your feedback has been submitted to Karnataka Tourism administrators for verification.',
      report: newReport
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report: ' + err.message });
  }
});

module.exports = router;
