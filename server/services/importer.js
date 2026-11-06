const fs = require('fs');
const path = require('path');

const KARNATAKA_BOUNDS = {
  south: 11.5,
  north: 18.6,
  west: 74.0,
  east: 78.6
};

const VALID_PLACE_TYPES = new Set([
  'district', 'taluk', 'town', 'village',
  'temple', 'waterfall', 'viewpoint', 'fort',
  'beach', 'nature', 'wildlife', 'heritage',
  'hill_station', 'spiritual', 'monument', 'park'
]);

function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const row = [];
    let inQuote = false;
    let cell = '';
    const line = lines[i];

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        row.push(cell.trim());
        cell = '';
      } else {
        cell += char;
      }
    }
    row.push(cell.trim());

    const item = {};
    headers.forEach((h, idx) => {
      let val = row[idx] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      item[h] = val;
    });
    records.push(item);
  }
  return records;
}

function validateAndNormalizeRecord(raw) {
  const errors = [];
  const id = String(raw.id || '').trim();
  if (!id) errors.push('Missing unique id');

  const name = String(raw.name || '').trim();
  if (!name) errors.push('Missing place name');

  let placeType = String(raw.place_type || raw.type || 'heritage').trim().toLowerCase();
  if (!VALID_PLACE_TYPES.has(placeType)) {
    placeType = 'heritage';
  }

  const rawLat = parseFloat(raw.latitude || raw.lat);
  const rawLng = parseFloat(raw.longitude || raw.lng);

  let lat = null, lng = null, locationVerified = false;
  if (!isNaN(rawLat) && !isNaN(rawLng)) {
    if (
      rawLat >= KARNATAKA_BOUNDS.south &&
      rawLat <= KARNATAKA_BOUNDS.north &&
      rawLng >= KARNATAKA_BOUNDS.west &&
      rawLng <= KARNATAKA_BOUNDS.east
    ) {
      lat = rawLat;
      lng = rawLng;
      locationVerified = true;
    } else {
      errors.push(`Coordinates (${rawLat}, ${rawLng}) are outside Karnataka geographical boundary (11.5°N - 18.6°N, 74.0°E - 78.6°E)`);
    }
  } else {
    errors.push('Missing or invalid numerical latitude/longitude coordinates');
  }

  const verificationStatus = ['verified', 'draft', 'needs_review'].includes(raw.verification_status)
    ? raw.verification_status
    : locationVerified ? 'verified' : 'needs_review';

  const entryFee = parseInt(raw.entryFeeINR || raw.entry_fee) || 0;
  const openingHours = raw.openingHours || raw.hours || (placeType === 'district' || placeType === 'taluk' ? '10:00 – 17:30' : 'Sunrise to Sunset');

  const record = {
    id,
    name,
    nameKannada: raw.nameKannada || raw.name_kannada || '',
    place_type: placeType,
    parent_id: raw.parent_id || null,
    division: raw.division || '',
    district: raw.district || '',
    taluk: raw.taluk || '',
    region: raw.region || (['Kalaburagi', 'Belagavi'].includes(raw.division) ? 'North Karnataka' : 'South Karnataka'),
    category: Array.isArray(raw.category) ? raw.category : [placeType],
    lat,
    lng,
    location: locationVerified ? { latitude: lat, longitude: lng } : null,
    location_verified: locationVerified,
    verification_status: verificationStatus,
    description: raw.description || `${name} located in ${raw.district || 'Karnataka'}.`,
    shortDescription: raw.shortDescription || raw.description || name,
    photos: raw.image ? [{ url: raw.image, caption: name, source: raw.dataSource || 'Verified Directory' }] : (raw.photos || []),
    image: raw.image || (raw.photos && raw.photos[0] ? raw.photos[0].url : 'https://images.unsplash.com/photo-1600100397608-f010f443b350?w=800&auto=format&fit=crop&q=80'),
    visit_info: {
      openingHours,
      entryFeeINR: entryFee,
      bestMonths: raw.bestMonths || [10, 11, 12, 1, 2],
      seasonNotes: raw.seasonNotes || 'Best visited between October and March.',
      safetyNotes: raw.safetyNotes || 'Follow local municipal or archaeological guidelines.'
    },
    entryFeeINR: entryFee,
    openingHours,
    source_url: raw.source_url || raw.sourceUrl || 'https://lgdirectory.gov.in',
    dataSource: raw.dataSource || 'Karnataka Tourism / LGD Directory',
    verified: verificationStatus === 'verified' && locationVerified,
    verifiedDate: raw.verifiedDate || new Date().toISOString().split('T')[0],
    offbeat: Boolean(raw.offbeat),
    crowdLevel: parseInt(raw.crowdLevel) || 2
  };

  return { record, errors, isValid: errors.length === 0 };
}

function importData(itemsOrCsv, placesFilePath) {
  let rawList = [];
  if (typeof itemsOrCsv === 'string') {
    rawList = parseCSV(itemsOrCsv);
  } else if (Array.isArray(itemsOrCsv)) {
    rawList = itemsOrCsv;
  } else {
    throw new Error('Input must be a CSV string or an array of place objects.');
  }

  const existingPlaces = JSON.parse(fs.readFileSync(placesFilePath, 'utf8'));
  const placeMap = new Map(existingPlaces.map(p => [p.id, p]));

  const results = {
    totalSubmitted: rawList.length,
    imported: 0,
    updated: 0,
    rejected: 0,
    errors: []
  };

  rawList.forEach((raw, idx) => {
    const { record, errors, isValid } = validateAndNormalizeRecord(raw);
    if (!isValid) {
      results.rejected++;
      results.errors.push({ row: idx + 1, id: raw.id || 'unknown', name: raw.name || 'unnamed', errors });
      return;
    }

    if (placeMap.has(record.id)) {
      results.updated++;
    } else {
      results.imported++;
    }
    placeMap.set(record.id, { ...placeMap.get(record.id), ...record });
  });

  const updatedPlaces = Array.from(placeMap.values());
  fs.writeFileSync(placesFilePath, JSON.stringify(updatedPlaces, null, 2), 'utf8');

  return { ...results, totalDatabaseCount: updatedPlaces.length };
}

module.exports = {
  KARNATAKA_BOUNDS,
  VALID_PLACE_TYPES,
  parseCSV,
  validateAndNormalizeRecord,
  importData
};
