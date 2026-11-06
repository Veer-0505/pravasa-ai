const { places: localPlaces, getStartCoordinates } = require('./planner');
const { getSupabaseDestinations } = require('./supabase');
const { roadDistanceKm, travelMinutes } = require('./distance');
const { calculateTripCost, TRANSPORT_MODELS, FUEL_PRICE_PER_LITRE, DEFAULT_HOTEL_TIERS, DEFAULT_FOOD_TIERS } = require('./pricingService');

function validPoint(p) {
  return p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)) &&
    Number(p.lat) >= -90 && Number(p.lat) <= 90 &&
    Number(p.lng) >= -180 && Number(p.lng) <= 180 &&
    !(Number(p.lat) === 0 && Number(p.lng) === 0);
}

function nearestOrder(origin, items) {
  const remaining = [...items];
  const ordered = [];
  let current = origin;
  while (remaining.length) {
    let bestIndex = -1;
    let bestDistance = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = roadDistanceKm(current, remaining[i]);
      if (Number.isFinite(d) && d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }
    if (bestIndex < 0) break;
    const next = remaining.splice(bestIndex, 1)[0];
    ordered.push(next);
    current = next;
  }
  return ordered;
}

function loopDistance(origin, ordered) {
  if (!ordered.length) return 0;
  let km = 0;
  let current = origin;
  for (const p of ordered) {
    km += roadDistanceKm(current, p);
    current = p;
  }
  km += roadDistanceKm(current, origin);
  return km;
}

function transportEstimate(distanceKm, mode, days, travellers) {
  const model = TRANSPORT_MODELS[mode] || TRANSPORT_MODELS['Personal car'];
  if (model.type === 'personal') {
    return Math.round((distanceKm / model.mileageKmPerLitre) * FUEL_PRICE_PER_LITRE);
  }
  if (model.type === 'rental') {
    const fuel = Math.round((distanceKm / model.mileageKmPerLitre) * FUEL_PRICE_PER_LITRE);
    return (model.dailyRate * days) + fuel;
  }
  if (model.type === 'public') {
    const perPerson = Math.max(model.minFare, Math.round(distanceKm * model.ratePerKm));
    return perPerson * travellers;
  }
  return Math.round(distanceKm * model.ratePerKm);
}

function rankAttraction(place, interests, targetDistrict) {
  const cats = Array.isArray(place.category) ? place.category : (place.category ? [place.category] : []);
  const matching = cats.filter(c => interests.includes(c)).length;
  const rating = Number(place.rating || place.average_rating || 3);
  const freeBonus = Number(place.entryFeeINR || 0) === 0 ? 12 : 0;
  const offbeatBonus = place.offbeat ? 3 : 0;
  const districtBonus = targetDistrict && String(place.district || '').toLowerCase() === targetDistrict.toLowerCase() ? 8 : 0;
  const crowdPenalty = Math.max(0, Number(place.crowdLevel || 2) - 2);
  return (matching * 10) + (rating * 3) + freeBonus + offbeatBonus + districtBonus - crowdPenalty;
}

function normalizePlace(p) {
  return {
    ...p,
    lat: Number(p.lat ?? p.latitude),
    lng: Number(p.lng ?? p.longitude),
    entryFeeINR: Math.max(0, Number(p.entryFeeINR ?? p.entry_fee_inr ?? 0) || 0),
    avgVisitHours: Math.max(0.5, Number(p.avgVisitHours || p.avg_visit_hours || 2) || 2),
    category: Array.isArray(p.category) ? p.category : (p.category ? [p.category] : [])
  };
}

function calculatePricing(input, selected, totalDistanceKm) {
  const days = Math.max(1, Number(input.days) || 1);
  const travellers = Math.max(1, Number(input.travellers) || 1);
  const budgetStyle = input.budgetStyle || 'Medium';
  const style = String(budgetStyle).toLowerCase();
  const hotelTier = DEFAULT_HOTEL_TIERS[style] || DEFAULT_HOTEL_TIERS.medium;
  const foodTier = DEFAULT_FOOD_TIERS[style] || DEFAULT_FOOD_TIERS.medium;
  const rooms = Math.max(1, Number(input.rooms) || Math.ceil(travellers / 2));
  const nights = Math.max(0, days - 1);
  const parkingAndMisc = Math.round(days * 150);

  const pricing = calculateTripCost({
    days,
    nights,
    travellers,
    rooms,
    distanceKm: totalDistanceKm,
    totalDistanceKm,
    isRoundTrip: true,
    travelMode: input.travelMode || 'Personal car',
    budgetStyle,
    stops: selected.map(p => ({
      placeId: p.id,
      name: p.name,
      entryFeeINR: p.entryFeeINR || 0
    })),
    additionalServices: parkingAndMisc > 0 ? [{
      id: 'parking-contingency',
      name: 'Parking & small trip contingency (estimate)',
      price: parkingAndMisc,
      quantity: 1
    }] : []
  });
  return pricing;
}

function formatClockTime(totalMinutes) {
  const norm = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function distributePlacesToDays(ordered, days, outboundKm, returnKm) {
  const outboundMins = travelMinutes(outboundKm);
  const returnMins = travelMinutes(returnKm);
  // If drive is > 4.5 hours (270 min), arrival is late afternoon/evening so Day 1 has no rush sightseeing
  const isVeryLongOutbound = outboundMins > 270;
  const isVeryLongReturn = returnMins > 300;
  const total = ordered.length;
  const dayBuckets = Array.from({ length: days }, () => []);

  if (total === 0) return dayBuckets;
  if (days === 1) {
    dayBuckets[0] = [...ordered];
    return dayBuckets;
  }

  // Determine ideal capacity for each day
  const capacities = [];
  for (let d = 0; d < days; d++) {
    if (d === 0) {
      // Long drive on day 1: 0 stops if drive > 4.5h, 1 stop if moderate drive
      capacities.push(isVeryLongOutbound ? 0 : (outboundMins > 120 ? 1 : 2));
    } else if (d === days - 1) {
      // Long return drive on last day: max 1 morning stop
      capacities.push(isVeryLongReturn ? (total > (days - 1) * 2 ? 1 : 0) : 1);
    } else {
      capacities.push(3); // Normal full sightseeing day
    }
  }

  // Ensure total capacity is at least total
  let totalCap = capacities.reduce((a, b) => a + b, 0);
  while (totalCap < total) {
    for (let d = 0; d < days && totalCap < total; d++) {
      capacities[d]++;
      totalCap++;
    }
  }

  // Priority for allocating places: middle sightseeing days first, then last day, then day 1
  const priorityDays = [];
  for (let d = 1; d < days - 1; d++) priorityDays.push(d);
  if (days > 1) priorityDays.push(days - 1);
  priorityDays.push(0);

  let itemIdx = 0;

  // Round 1: ensure each middle day has at least 1 attraction if available
  for (let d = 1; d < days - 1; d++) {
    if (itemIdx < total && dayBuckets[d].length < capacities[d]) {
      dayBuckets[d].push(ordered[itemIdx++]);
    }
  }

  // Round 2: fill remaining places based on day capacity
  while (itemIdx < total) {
    let placed = false;
    for (const d of priorityDays) {
      if (dayBuckets[d].length < capacities[d] && itemIdx < total) {
        dayBuckets[d].push(ordered[itemIdx++]);
        placed = true;
      }
    }
    if (!placed) {
      // Add to day with smallest count among middle days, or last day
      let minDay = (days > 2) ? 1 : 0;
      for (let d = 0; d < days; d++) {
        if (dayBuckets[d].length < dayBuckets[minDay].length) minDay = d;
      }
      dayBuckets[minDay].push(ordered[itemIdx++]);
    }
  }

  return dayBuckets;
}

function buildDays(input, ordered, start, destination, outboundKm, returnKm) {
  const days = Math.max(1, Math.min(10, Number(input.days) || 1));
  const travellers = Math.max(1, Number(input.travellers) || 1);
  const isLongOutbound = outboundKm >= 200;
  const isLongReturn = returnKm >= 200;

  const dayBuckets = distributePlacesToDays(ordered, days, outboundKm, returnKm);
  const daysArr = [];

  for (let dayIdx = 0; dayIdx < days; dayIdx++) {
    const day = dayIdx + 1;
    const dayPlaces = dayBuckets[dayIdx] || [];
    const isFirstDay = day === 1;
    const isLastDay = day === days;
    const stops = [];

    let dayKm = 0;
    let departureTimeStr = '09:00';
    let hubPoint = dayPlaces.length ? dayPlaces[0] : destination;

    if (isFirstDay && isLongOutbound) {
      // Day 1 with long drive from origin (e.g. Bengaluru to Badami)
      dayKm += outboundKm;
      const driveMins = travelMinutes(outboundKm);
      // Depart origin at 07:00 AM (420 mins)
      const departOriginMin = 7 * 60;
      departureTimeStr = '07:00';
      // Midway lunch break (60 min)
      const arriveHubMin = departOriginMin + driveMins + 60; // typically around 15:30 - 16:30
      // Check in & refresh
      let cursor = arriveHubMin + 45;

      if (dayPlaces.length > 0) {
        let prevPoint = destination;
        for (let i = 0; i < dayPlaces.length; i++) {
          const p = dayPlaces[i];
          const localKm = roadDistanceKm(prevPoint, p);
          const localMins = travelMinutes(localKm);
          dayKm += localKm;

          // Sunset visit comfortably within golden hour (e.g. 16:45 - 18:30)
          const arrivalMin = Math.max(cursor + localMins, 16 * 60 + 45);
          const visitMins = Math.min(90, Math.round((p.avgVisitHours || 1.5) * 60));
          const departureMin = Math.min(arrivalMin + visitMins, 18 * 60 + 30); // finish before 18:30

          stops.push({
            placeId: p.id,
            name: p.name,
            nameKannada: p.nameKannada || '',
            image: p.image || null,
            category: p.category || [],
            lat: p.lat,
            lng: p.lng,
            startTime: formatClockTime(arrivalMin),
            endTime: formatClockTime(departureMin),
            travelFromPrevKm: Math.round(localKm || 5),
            travelFromPrevMin: localMins || 15,
            entryFee: p.entryFeeINR || 0,
            description: p.description || '',
            tip: p.tip || 'Ideal for sunset photography and evening relaxation.',
            food: p.nearbyFood || ['Local Karnataka Meals', 'Filter Coffee']
          });
          cursor = departureMin + 20;
          prevPoint = p;
        }
      }
    } else {
      // Regular Sightseeing Day (Day 2+, or Day 1 if short distance < 200km)
      let cursor = 9 * 60; // 09:00 AM
      departureTimeStr = '09:00';

      if (isFirstDay && !isLongOutbound) {
        dayKm += outboundKm;
        const driveMins = travelMinutes(outboundKm);
        departureTimeStr = '08:00';
        cursor = 8 * 60 + driveMins + 30; // arrive and start
      }

      let currentPoint = destination;
      for (let i = 0; i < dayPlaces.length; i++) {
        const p = dayPlaces[i];
        const localKm = roadDistanceKm(currentPoint, p);
        const localMins = travelMinutes(localKm);
        dayKm += localKm;

        let arrivalMin = cursor + localMins;
        // Lunch break around 12:30 - 13:30
        if (i > 0 && arrivalMin >= 12 * 60 + 30 && arrivalMin < 14 * 60) {
          arrivalMin += 60;
        }
        const visitMins = Math.round((p.avgVisitHours || 2) * 60);
        let departureMin = arrivalMin + visitMins;

        // Ensure daytime operating hours (strictly before 18:30)
        if (departureMin > 18 * 60 + 30) {
          departureMin = 18 * 60 + 30;
        }

        stops.push({
          placeId: p.id,
          name: p.name,
          nameKannada: p.nameKannada || '',
          image: p.image || null,
          category: p.category || [],
          lat: p.lat,
          lng: p.lng,
          startTime: formatClockTime(arrivalMin),
          endTime: formatClockTime(departureMin),
          travelFromPrevKm: Math.round(localKm),
          travelFromPrevMin: localMins,
          entryFee: p.entryFeeINR || 0,
          description: p.description || '',
          tip: p.tip || 'Check current opening hours and ticket rates before visiting.',
          food: p.nearbyFood || ['Local Karnataka Meals', 'Filter Coffee']
        });
        cursor = departureMin + 25;
        currentPoint = p;
      }
    }

    // Include return journey on the last day
    if (isLastDay) {
      dayKm += returnKm;
    }

    // Meaningful, descriptive day titles
    let dayTitle = '';
    if (isFirstDay && isLongOutbound) {
      dayTitle = stops.length
        ? `Day 1 – Outbound Journey & Sunset at ${stops[0].name.split(' ')[0]}`
        : `Day 1 – Scenic Journey to ${destination.district || destination.name} & Hotel Arrival`;
    } else if (isLastDay && isLongReturn) {
      dayTitle = stops.length
        ? `Day ${day} – Morning Visit to ${stops[0].name.split(' ')[0]} & Safe Return Journey`
        : `Day ${day} – Cultural Leisure & Return Journey`;
    } else if (stops.length > 0) {
      dayTitle = `Day ${day} – ${stops.map(s => s.name.split(' ')[0]).slice(0, 2).join(' & ')} Exploration`;
    } else {
      dayTitle = `Day ${day} – Cultural Leisure & Local Heritage Walk`;
    }

    const overnightHub = dayPlaces.length
      ? dayPlaces[dayPlaces.length - 1].name
      : (destination.name || input.startCity);

    daysArr.push({
      day,
      title: dayTitle,
      departureTime: departureTimeStr,
      region: destination.district || destination.name || 'Selected destination',
      travelKm: Math.round(dayKm),
      estDrivingHours: Math.round((dayKm / 45) * 10) / 10,
      stops,
      stay: { area: overnightHub, costINR: 0 },
      dayCost: {}
    });
  }

  return daysArr;
}

async function buildBudgetOptimizedPlan(input = {}) {
  const budget = Number(input.budget);
  const travellers = Math.max(1, Math.min(20, Number(input.travellers) || 1));
  const days = Math.max(1, Math.min(10, Number(input.days) || 1));
  if (!Number.isFinite(budget) || budget < 1000) {
    const error = new Error('Enter a valid trip budget of at least ₹1,000.');
    error.status = 400;
    throw error;
  }
  if (!input.targetPlaceId) {
    const error = new Error('Please search for and select your destination first.');
    error.status = 400;
    throw error;
  }

  let dbPlaces = null;
  try {
    dbPlaces = await getSupabaseDestinations({ isPublished: true, limit: 2000 });
  } catch (_) {}
  const sourcePlaces = (dbPlaces && dbPlaces.length ? dbPlaces : localPlaces).map(normalizePlace);
  const destination = sourcePlaces.find(p => String(p.id) === String(input.targetPlaceId)) ||
    localPlaces.map(normalizePlace).find(p => String(p.id) === String(input.targetPlaceId));

  if (!destination || !validPoint(destination)) {
    const error = new Error('Selected destination has no valid GPS coordinates. Update its coordinates in the Government Admin portal.');
    error.status = 400;
    throw error;
  }

  const startCity = String(input.startCity || 'Bengaluru').trim();
  const namedOrigin = sourcePlaces.find(p =>
    [p.name, p.taluk, p.district].some(value =>
      String(value || '').trim().toLowerCase() === startCity.toLowerCase()
    ) && validPoint(p)
  );
  const start = namedOrigin
    ? { lat: namedOrigin.lat, lng: namedOrigin.lng }
    : getStartCoordinates(startCity);
  const origin = { lat: Number(start.lat), lng: Number(start.lng) };
  const isBengaluruName = ['bengaluru', 'bengaluru urban'].includes(startCity.toLowerCase());
  if (!namedOrigin && !isBengaluruName &&
      Math.abs(origin.lat - 12.9716) < 0.0001 &&
      Math.abs(origin.lng - 77.5946) < 0.0001) {
    const error = new Error(`GPS coordinates for starting point "${startCity}" are unavailable. Choose a known gateway or add this town's coordinates to the location directory.`);
    error.status = 400;
    throw error;
  }
  const targetDistrict = destination.district || destination.name || '';
  const interests = Array.isArray(input.interests) ? input.interests : [];

  const candidatePool = sourcePlaces.filter(p => {
    if (!validPoint(p)) return false;
    if (['district', 'taluk'].includes(String(p.place_type || '').toLowerCase())) return false;
    const sameDistrict = targetDistrict && String(p.district || '').toLowerCase() === String(targetDistrict).toLowerCase();
    const nearDestination = roadDistanceKm(destination, p) <= 35;
    if (!sameDistrict && !nearDestination) return false;
    if (!input.offbeat && p.offbeat) return false;
    if (interests.length && p.category.length && !p.category.some(c => interests.includes(c))) return false;
    if (input.groupType === 'Seniors' && p.seniorFriendly === false) return false;
    if (input.groupType === 'Family with kids' && p.familyFriendly === false) return false;
    return true;
  });

  if (!candidatePool.length) {
    const error = new Error('No published attractions with GPS coordinates were found near this destination. Add or publish nearby attractions in the Government Admin portal.');
    error.status = 404;
    throw error;
  }

  const outboundKm = roadDistanceKm(origin, destination);
  const returnKm = outboundKm;
  const intercityRoundTripKm = outboundKm + returnKm;
  const paceMap = { Relaxed: 2, Balanced: 3, Packed: 4 };
  const maxStops = Math.min(candidatePool.length, days * (paceMap[input.pace] || 3));
  const availableVisitMinutes = days * 8 * 60;

  const selected = [];
  let visitMinutes = 0;
  let ordered = [];
  let pricing = calculatePricing(input, selected, intercityRoundTripKm);

  // Choose the best value attraction one at a time. Recalculate the complete
  // round-trip route and total trip cost before accepting each attraction.
  const remaining = [...candidatePool];
  while (remaining.length && selected.length < maxStops) {
    const options = remaining.map(p => {
      const trial = nearestOrder(destination, [...selected, p]);
      const localLoopKm = loopDistance(destination, trial);
      const trialDistance = intercityRoundTripKm + localLoopKm;
      const trialPricing = calculatePricing(input, [...selected, p], trialDistance);
      const incrementalCost = Math.max(1, trialPricing.totalTripCost - pricing.totalTripCost);
      const travelPenalty = roadDistanceKm(selected.length ? selected[selected.length - 1] : destination, p);
      const quality = rankAttraction(p, interests, targetDistrict);
      const valueScore = quality / (incrementalCost + travelPenalty * 2 + 1);
      return { p, trial, localLoopKm, trialDistance, trialPricing, valueScore, incrementalCost };
    }).sort((a, b) => b.valueScore - a.valueScore);

    const best = options[0];
    if (!best) break;
    remaining.splice(remaining.findIndex(p => String(p.id) === String(best.p.id)), 1);

    const duration = Math.round((best.p.avgVisitHours || 2) * 60);
    if (visitMinutes + duration > availableVisitMinutes) continue;

    if (best.trialPricing.totalTripCost <= budget) {
      selected.push(best.p);
      ordered = best.trial;
      pricing = best.trialPricing;
      visitMinutes += duration;
    }
  }

  // If no attraction fits, keep a complete cost estimate with no sightseeing tickets.
  const localLoopKm = selected.length ? loopDistance(destination, ordered) : 0;
  const totalDistanceKm = intercityRoundTripKm + localLoopKm;
  pricing = calculatePricing(input, selected, totalDistanceKm);

  const daysArr = buildDays(input, ordered, origin, destination, outboundKm, returnKm);
  const perDayTransport = Math.round(pricing.subtotals.transportation / days);
  const perDayFood = Math.round(pricing.subtotals.food / days);
  const perDayStay = Math.round(pricing.subtotals.accommodation / days);
  daysArr.forEach(d => {
    const entry = d.stops.reduce((sum, s) => sum + (Number(s.entryFee || 0) * travellers), 0);
    d.dayCost = {
      transport: perDayTransport,
      food: perDayFood,
      stay: perDayStay,
      entry,
      total: perDayTransport + perDayFood + perDayStay + entry
    };
    d.stay.costINR = perDayStay;
  });

  const warnings = [];
  if (pricing.totalTripCost > budget) {
    warnings.push(`Your fixed trip costs are estimated at ₹${pricing.totalTripCost.toLocaleString('en-IN')}, which already exceeds the ₹${budget.toLocaleString('en-IN')} budget. Reduce travel, stay, or food costs.`);
  } else if (!selected.length) {
    warnings.push('No attraction could be added after reserving the round-trip transport, accommodation, food and contingency costs.');
  }

  const optimization = {
    enabled: true,
    destination: destination.name,
    origin: input.startCity || 'Bengaluru',
    selectedCount: selected.length,
    availableCandidates: candidatePool.length,
    selectedAttractionIds: selected.map(p => p.id),
    fixedRoundTripDistanceKm: Math.round(intercityRoundTripKm),
    sightseeingLoopDistanceKm: Math.round(localLoopKm),
    totalRoundTripDistanceKm: Math.round(totalDistanceKm),
    returnJourneyIncluded: true,
    method: 'Budget-first greedy selection with nearest-neighbour local loop; distances are estimated road distances.'
  };

  return {
    meta: {
      source: 'budget-optimizer',
      totalCost: pricing.totalTripCost,
      totalDistanceKm: Math.round(totalDistanceKm),
      travellers,
      travelMode: input.travelMode || 'Personal car',
      budgetStyle: input.budgetStyle || 'Medium',
      pricing,
      autoBudgetOptimization: optimization,
      roundTrip: {
        origin: input.startCity || 'Bengaluru',
        destination: destination.name,
        outboundDistanceKm: Math.round(outboundKm),
        returnDistanceKm: Math.round(returnKm),
        sightseeingLoopDistanceKm: Math.round(localLoopKm),
        totalDistanceKm: Math.round(totalDistanceKm),
        returnIncluded: true
      }
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
    ecoScore: Math.max(0, Math.min(100, Math.round(100 - totalDistanceKm / Math.max(1, days * 100))))
  };
}

module.exports = { buildBudgetOptimizedPlan };
