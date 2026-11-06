const places = require('../data/places.json');
const { roadDistanceKm, travelMinutes } = require('./distance');
const { calculateTripCost } = require('./pricingService');

// Authoritative coordinates for all 31 Karnataka Districts + major transit gateways
const START_COORDS = {
  // Major Gateways
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Kampli: { lat: 15.4060, lng: 76.6000 },
  'Bengaluru Urban': { lat: 12.9716, lng: 77.5946 },
  'Bengaluru Rural': { lat: 13.2355, lng: 77.5458 },
  Mysuru: { lat: 12.2958, lng: 76.6394 },
  Mangaluru: { lat: 12.9141, lng: 74.8560 },
  'Dakshina Kannada': { lat: 12.9141, lng: 74.8560 },
  Hubballi: { lat: 15.3647, lng: 75.1240 },
  Dharwad: { lat: 15.4589, lng: 75.0078 },
  Belagavi: { lat: 15.8497, lng: 74.4977 },
  Kalaburagi: { lat: 17.3297, lng: 76.8343 },
  Shivamogga: { lat: 13.9299, lng: 75.5681 },
  Udupi: { lat: 13.3409, lng: 74.7421 },
  Hospet: { lat: 15.2689, lng: 76.3909 },
  Hampi: { lat: 15.3350, lng: 76.4600 },
  Vijayanagara: { lat: 15.2689, lng: 76.3909 },

  // North Karnataka
  Bagalkot: { lat: 16.1817, lng: 75.6958 },
  Ballari: { lat: 15.1394, lng: 76.9214 },
  Bidar: { lat: 17.9104, lng: 77.5199 },
  Vijayapura: { lat: 16.8302, lng: 75.7100 },
  Bijapur: { lat: 16.8302, lng: 75.7100 },
  Gadag: { lat: 15.4167, lng: 75.6333 },
  Haveri: { lat: 14.7954, lng: 75.4011 },
  Koppal: { lat: 15.3456, lng: 76.1558 },
  Raichur: { lat: 16.2120, lng: 77.3439 },
  Yadgir: { lat: 16.7700, lng: 77.1400 },

  // Central & Malnad Karnataka
  Chitradurga: { lat: 14.2251, lng: 76.3980 },
  Davanagere: { lat: 14.4644, lng: 75.9218 },
  Chikkamagaluru: { lat: 13.3153, lng: 75.7754 },
  Hassan: { lat: 13.0072, lng: 76.1032 },
  'Uttara Kannada': { lat: 14.8185, lng: 74.1300 },
  Karwar: { lat: 14.8185, lng: 74.1300 },
  Gokarna: { lat: 14.5479, lng: 74.3188 },

  // Southern Karnataka
  Chamarajanagar: { lat: 11.9261, lng: 76.9437 },
  Chikkaballapura: { lat: 13.4325, lng: 77.7275 },
  Kodagu: { lat: 12.4244, lng: 75.7382 },
  Coorg: { lat: 12.4244, lng: 75.7382 },
  Madikeri: { lat: 12.4244, lng: 75.7382 },
  Kolar: { lat: 13.1367, lng: 78.1340 },
  Mandya: { lat: 12.5242, lng: 76.8958 },
  Ramanagara: { lat: 12.7209, lng: 77.2799 },
  Tumakuru: { lat: 13.3422, lng: 77.1017 }
};

// Dynamic coordinate lookup for any custom taluk, district, or town
function getStartCoordinates(cityName) {
  if (!cityName) return START_COORDS.Bengaluru;
  if (START_COORDS[cityName]) return START_COORDS[cityName];

  const q = cityName.toLowerCase().trim();
  // Find case-insensitive match in START_COORDS
  for (const [key, coords] of Object.entries(START_COORDS)) {
    if (key.toLowerCase() === q) return coords;
  }

  // Find match in places.json
  const match = places.find(p => 
    (p.name || '').toLowerCase() === q ||
    (p.district || '').toLowerCase() === q ||
    (p.taluk || '').toLowerCase() === q
  );
  if (match && match.lat && match.lng) {
    return { lat: match.lat, lng: match.lng };
  }

  return START_COORDS.Bengaluru;
}

const COST_PER_KM = {
  'Own car': 8,
  'Taxi': 14,
  'Bus/Train': 3,
  'Electric Vehicle': 6
};

// Carbon emission factor in kg CO2 per km
const CARBON_EMISSION_PER_KM = {
  'Bus/Train': 0.05,
  'Electric Vehicle': 0.03,
  'Own car': 0.17,
  'Taxi': 0.16
};

const PACE_PLACES = { Relaxed: 2, Balanced: 3, Packed: 4 };
const STAY_MULT = { Low: 'low', Medium: 'medium', Premium: 'premium' };

function filterPlaces(input) {
  const month = input.month;
  const interests = input.interests || [];
  const group = input.groupType;
  const offbeat = input.offbeat;
  const accessibility = input.accessibilityNeeds;

  let list = places.filter(p => {
    // Only attractions with valid coordinates
    if (!p.lat || !p.lng) return false;
    if (['district', 'taluk'].includes(p.place_type)) return false;

    if (!offbeat && p.offbeat) return false;
    if (interests.length && !p.category.some(c => interests.includes(c))) return false;
    if (group === 'Seniors' && !p.seniorFriendly) return false;
    if (group === 'Family with kids' && !p.familyFriendly) return false;
    if (accessibility && p.seniorFriendly === false && (p.accessibility || '').toLowerCase().includes('steep')) return false;
    return true;
  });

  const inSeason = list.filter(p => (p.bestMonths || []).includes(month));
  const outSeason = list.filter(p => !(p.bestMonths || []).includes(month));
  return { inSeason, outSeason, all: list };
}

function score(p, input) {
  let s = 0;
  s += (p.category.filter(c => (input.interests || []).includes(c)).length) * 10;
  if (p.offbeat && input.offbeat) s += 4;
  if (input.groupType === 'Seniors' && p.seniorFriendly) s += 6;
  if (input.groupType === 'Family with kids' && p.familyFriendly) s += 5;
  if (input.accessibilityNeeds && p.seniorFriendly) s += 6;

  s += (4 - (p.crowdLevel || 2));
  s += (4 - (p.costLevel || 2));
  return s;
}

function clusterByRegion(list) {
  const groups = {};
  list.forEach(p => { (groups[p.region || 'Karnataka'] = groups[p.region || 'Karnataka'] || []).push(p); });
  return groups;
}

function nearestNeighborOrder(start, items) {
  const remaining = [...items];
  const ordered = [];
  let cur = start;
  while (remaining.length) {
    let bestIdx = 0, bestD = Infinity;
    remaining.forEach((p, i) => {
      const d = roadDistanceKm(cur, p);
      if (d < bestD) { bestD = d; bestIdx = i; }
    });
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    cur = next;
  }
  return ordered;
}

function buildPlan(input) {
  const days = Math.max(1, Math.min(10, input.days));
  const pace = PACE_PLACES[input.pace] || 3;
  const month = input.month || 10;
  const budget = input.budget || 25000;
  const startCity = input.startCity || 'Bengaluru';
  const start = getStartCoordinates(startCity);
  const costPerKm = COST_PER_KM[input.travelMode] || 14;
  const carbonRate = CARBON_EMISSION_PER_KM[input.travelMode] || 0.16;
  const stayTier = STAY_MULT[input.budgetStyle] || 'medium';

  const { inSeason, outSeason } = filterPlaces(input);
  const warnings = [];
  let candidatePool = inSeason.length ? inSeason : places.filter(p => !['district', 'taluk'].includes(p.place_type));
  if (!inSeason.length) warnings.push('No places match the travel month exactly; using verified places with general season advisory.');
  else if (outSeason.length) warnings.push(`${outSeason.length} place(s) deferred (not optimal for travel month ${month}).`);

  // Target destination priority if specified in input (e.g. user selected Hampi or Mysuru)
  let targetPlace = null;
  if (input.targetPlaceId) {
    targetPlace = places.find(p => p.id === input.targetPlaceId);
    if (targetPlace) {
      // Prioritize same-district attractions
      const sameDistrict = places.filter(p => p.id !== targetPlace.id && p.district && p.district.toLowerCase() === targetPlace.district?.toLowerCase());
      candidatePool = [targetPlace, ...sameDistrict, ...candidatePool.filter(p => p.id !== targetPlace.id && (!p.district || p.district.toLowerCase() !== targetPlace.district?.toLowerCase()))];
    }
  }

  // Score & sort candidates
  const scored = candidatePool.map(p => ({
    p,
    s: (targetPlace && p.id === targetPlace.id) ? 99999 : ((targetPlace && p.district && p.district.toLowerCase() === targetPlace.district?.toLowerCase()) ? score(p, input) + 500 : score(p, input))
  })).sort((a, b) => b.s - a.s);
  const need = days * pace + 2;
  const shortlisted = scored.slice(0, Math.min(need * 2, scored.length)).map(x => x.p);

  // Cluster by geographic region
  const clusters = clusterByRegion(shortlisted);
  const regionOrder = Object.keys(clusters).sort((a, b) => {
    const ca = clusters[a][0]; const cb = clusters[b][0];
    return roadDistanceKm(start, ca) - roadDistanceKm(start, cb);
  });

  const allOrdered = [];
  for (const r of regionOrder) {
    const ordered = nearestNeighborOrder(allOrdered.length ? allOrdered[allOrdered.length - 1] : start, clusters[r]);
    allOrdered.push(...ordered);
  }

  const picks = allOrdered.slice(0, days * pace);

  // Assign to days respecting driving limit (~280km/day)
  const MAX_DAY_KM = 280;
  const dayStops = [];
  let current = [];
  let curKm = 0;
  let prev = start;

  for (const p of picks) {
    const d = roadDistanceKm(prev, p);
    if (current.length >= pace || (current.length > 0 && curKm + d > MAX_DAY_KM)) {
      dayStops.push(current);
      current = [];
      curKm = 0;
      const lastDay = dayStops[dayStops.length - 1];
      prev = lastDay[lastDay.length - 1];
    }
    current.push(p);
    curKm += roadDistanceKm(prev, p);
    prev = p;
  }
  if (current.length) dayStops.push(current);
  while (dayStops.length < days) dayStops.push([]);

  // Build structured day objects
  const daysArr = [];
  let totalTransportKm = 0;
  let totalCost = 0;
  const budgetBreakdown = { transport: 0, food: 0, stay: 0, entry: 0 };

  for (let i = 0; i < days; i++) {
    const stops = dayStops[i] || [];
    const stopsOut = [];
    let prevPt = i === 0 ? start : (daysArr[i - 1]?.stops?.length ? { lat: daysArr[i - 1].stops[daysArr[i - 1].stops.length - 1].lat, lng: daysArr[i - 1].stops[daysArr[i - 1].stops.length - 1].lng } : start);

    let dayTransportKm = 0;
    let dayEntry = 0;
    const startTime0 = (i === 0 && roadDistanceKm(start, stops[0] || start) > 200) ? 7 * 60 : 9 * 60; // 07:00 AM for long drives, 09:00 AM for normal days
    let cursor = startTime0;

    stops.forEach((p, idx) => {
      const isDay1FirstStop = (i === 0 && idx === 0);
      const distFromStart = isDay1FirstStop ? roadDistanceKm(start, p) : 0;
      const fromPt = (idx === 0 && i > 0) ? prevPt : (idx === 0 ? (distFromStart > 200 ? p : start) : { lat: stopsOut[stopsOut.length - 1].lat, lng: stopsOut[stopsOut.length - 1].lng });
      const localKm = (isDay1FirstStop && distFromStart > 200) ? 5 : roadDistanceKm(fromPt, p);
      const mins = travelMinutes(localKm);
      
      // If Day 1 has a long drive (> 200 km), arrive in late afternoon and visit sunset attraction
      let arrive = cursor + mins;
      if (isDay1FirstStop && distFromStart > 200) {
        arrive = Math.max(16 * 60 + 30, 7 * 60 + travelMinutes(distFromStart) + 45);
        dayTransportKm += distFromStart;
      } else {
        dayTransportKm += localKm;
      }

      // Add lunch break around 12:30 - 13:30
      if (idx > 0 && arrive >= 12 * 60 + 30 && arrive < 14 * 60) {
        arrive += 60;
      }

      const visitMin = Math.min(150, Math.round((p.avgVisitHours || 2.0) * 60));
      let leave = arrive + visitMin;
      // Cap at sunset (18:30)
      if (leave > 18 * 60 + 30) {
        leave = 18 * 60 + 30;
      }
      dayEntry += (p.entryFeeINR || 0);

      stopsOut.push({
        placeId: p.id,
        name: p.name,
        nameKannada: p.nameKannada || '',
        image: p.image || null,
        category: p.category || [],
        lat: p.lat,
        lng: p.lng,
        startTime: fmtTime(arrive),
        endTime: fmtTime(leave),
        travelFromPrevKm: Math.round(isDay1FirstStop && distFromStart > 200 ? distFromStart : localKm),
        travelFromPrevMin: (isDay1FirstStop && distFromStart > 200) ? travelMinutes(distFromStart) : mins,
        entryFee: p.entryFeeINR || 0,
        description: p.description,
        accessibilityScore: p.accessibilityScore || (p.seniorFriendly ? 8 : 6),
        tip: `Optimal season: ${p.bestMonths ? p.bestMonths.map(m => monthName(m)).join(', ') : 'Oct–Mar'}.`,
        food: p.nearbyFood || ['Local Karnataka Meals', 'Filter Coffee']
      });
      cursor = leave + 25; // 25 min buffer
      prevPt = p;
    });

    totalTransportKm += dayTransportKm;
    const transportCost = Math.round(dayTransportKm * costPerKm);
    const foodCost = stops.length * 350 * (input.budgetStyle === 'Premium' ? 2 : input.budgetStyle === 'Low' ? 0.7 : 1);
    const entryCost = dayEntry;
    const stayCost = (i < days - 1) ? (stops.length ? (stops[stops.length - 1].approxStayPerNightINR?.[stayTier] || 1500) : 0) : 0;
    const area = stops.length ? stops[stops.length - 1].name : startCity;
    const region = stops.length ? (stops[0].region || 'Karnataka Circuit') : 'Rest day';
    const title = stops.length ? `${region} Exploration` : 'Scenic Transit & Rest';

    budgetBreakdown.transport += transportCost;
    budgetBreakdown.food += Math.round(foodCost);
    budgetBreakdown.stay += stayCost;
    budgetBreakdown.entry += entryCost;
    totalCost += transportCost + Math.round(foodCost) + stayCost + entryCost;

    daysArr.push({
      day: i + 1,
      title,
      region,
      travelKm: Math.round(dayTransportKm),
      estDrivingHours: Math.round((dayTransportKm / 45) * 10) / 10,
      stops: stopsOut,
      stay: { area, costINR: stayCost },
      dayCost: { transport: transportCost, food: Math.round(foodCost), stay: stayCost, entry: entryCost }
    });
  }

  // Budget warnings
  if (totalCost > budget) {
    warnings.push(`Projected expense ₹${totalCost.toLocaleString('en-IN')} exceeds allocation target ₹${budget.toLocaleString('en-IN')}. Consider switching travel mode.`);
  }

  // Driving fatigue check (>6h driving per day)
  daysArr.forEach(d => {
    const km = d.stops.reduce((a, s) => a + (s.travelFromPrevKm || 0), 0);
    const hrs = km / 45;
    if (hrs > 6) {
      warnings.push(`Day ${d.day} entails ~${hrs.toFixed(1)}h road driving. Consider pacing stops with an overnight break.`);
    }
  });

  // Carbon footprint estimate
  const carbonEstimateKg = Math.round(totalTransportKm * carbonRate * 10) / 10;
  const ecoScore = Math.max(0, Math.min(100, Math.round(100 - (totalTransportKm / (days * 100)))));

  // Weather recommendations
  const weatherAdvisories = [];
  if (month >= 6 && month <= 9) {
    weatherAdvisories.push('Southwest Monsoon active: Lush greenery across Malnad and coastal belt. Carry rainwear and exercise caution near waterfalls.');
  } else if (month >= 3 && month <= 5) {
    weatherAdvisories.push('Summer season: Stay hydrated and schedule temple / outdoor heritage exploration in morning and evening windows.');
  } else {
    weatherAdvisories.push('Pleasant winter season: Cool mornings and temperate afternoons. Prime time for heritage walking and photography.');
  }

  const allStops = [];
  daysArr.forEach(d => {
    (d.stops || []).forEach(s => allStops.push(s));
  });

  const travellers = Math.max(1, parseInt(input.travellers, 10) || 2);
  const pricing = calculateTripCost({
    days,
    nights: Math.max(0, days - 1),
    travellers,
    rooms: input.rooms || Math.ceil(travellers / 2),
    distanceKm: Math.round(totalTransportKm),
    travelMode: input.travelMode || 'Personal car',
    budgetStyle: input.budgetStyle || 'Medium',
    hotels: input.hotels || [],
    food: input.food || [],
    stops: allStops,
    activities: input.activities || [],
    guide: input.guide || null,
    additionalServices: input.additionalServices || []
  });

  // Distribute costs to dayCost
  const perDayTransport = Math.round(pricing.subtotals.transportation / days);
  const perDayFood = Math.round(pricing.subtotals.food / days);
  const perDayStay = Math.round(pricing.subtotals.accommodation / days);

  daysArr.forEach(d => {
    const dayEntry = d.stops.reduce((sum, s) => sum + ((s.entryFee || 0) * travellers), 0);
    d.dayCost = {
      transport: perDayTransport,
      food: perDayFood,
      stay: perDayStay,
      entry: dayEntry,
      total: perDayTransport + perDayFood + perDayStay + dayEntry
    };
    d.stay.costINR = perDayStay;
  });

  return {
    meta: {
      source: 'rules',
      totalCost: pricing.totalTripCost,
      totalDistanceKm: Math.round(totalTransportKm),
      carbonEstimateKg,
      travellers,
      travelMode: input.travelMode || 'Personal car',
      budgetStyle: input.budgetStyle || 'Medium',
      pricing
    },
    days: daysArr,
    budget: {
      transport: pricing.subtotals.transportation,
      food: pricing.subtotals.food,
      stay: pricing.subtotals.accommodation,
      entry: pricing.subtotals.entryFees,
      activities: pricing.subtotals.activities,
      guide: pricing.subtotals.guideCharges,
      additionalServices: pricing.subtotals.additionalServices,
      taxes: pricing.subtotals.taxes,
      total: pricing.totalTripCost,
      remaining: Math.round(budget - pricing.totalTripCost),
      subtotals: pricing.subtotals,
      lineItems: pricing.lineItems
    },
    warnings,
    weatherAdvisories,
    ecoScore
  };
}

/**
 * Smart Trip Rescue:
 * Finds an alternative destination in the same sector when an attraction is closed or weather disrupted
 */
function rescueStop(placeId) {
  const current = places.find(p => p.id === placeId);
  if (!current) return null;

  // Find nearest alternative in same district or division with lower crowd
  const alternatives = places
    .filter(p => p.id !== placeId && p.lat && p.lng && !['district', 'taluk'].includes(p.place_type))
    .map(p => ({
      ...p,
      distanceKm: Math.round(roadDistanceKm(current, p) * 10) / 10
    }))
    .filter(p => p.distanceKm <= 50)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return alternatives[0] || null;
}

function fmtTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function monthName(m) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
}

module.exports = {
  buildPlan,
  places,
  START_COORDS,
  getStartCoordinates,
  filterPlaces,
  score,
  rescueStop,
  CARBON_EMISSION_PER_KM
};
