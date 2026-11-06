const express = require('express');
const router = express.Router();
const { buildPlan, places, getStartCoordinates, filterPlaces, score } = require('../services/planner');
const { hasKey, arrangeWithAI } = require('../services/gemini');
const { roadDistanceKm, travelMinutes } = require('../services/distance');
const { calculateTripCost } = require('../services/pricingService');
const { buildBudgetOptimizedPlan } = require('../services/budgetOptimizer');

function pad(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function structureFromAI(input, aiDays) {
  const start = getStartCoordinates(input.startCity);
  const placeMap = Object.fromEntries(places.map(p => [p.id, p]));
  const daysArr = [];
  let totalTransportKm = 0;
  const allStops = [];

  for (let i = 0; i < input.days; i++) {
    const ad = (aiDays[i]) || { day: i + 1, title: '', region: '', stops: [], stayArea: '' };
    const stops = ad.stops || [];
    const stopsOut = [];
    let prevPt = i === 0 ? start : (daysArr[i - 1]?.stops?.length ? { lat: daysArr[i - 1].stops[daysArr[i - 1].stops.length - 1].lat, lng: daysArr[i - 1].stops[daysArr[i - 1].stops.length - 1].lng } : start);
    let cursor = 8 * 60;
    let dayTransportKm = 0;

    stops.forEach((s, idx) => {
      const p = placeMap[s.placeId];
      if (!p) return;
      const fromPt = idx === 0 ? prevPt : { lat: stopsOut[stopsOut.length - 1].lat, lng: stopsOut[stopsOut.length - 1].lng };
      const km = roadDistanceKm(fromPt, p);
      const mins = travelMinutes(km);
      const arrive = cursor + mins;
      const visitMin = Math.round((p.avgVisitHours || 2.5) * 60);
      const leave = arrive + visitMin;
      dayTransportKm += km;

      const stopObj = {
        placeId: p.id,
        name: p.name,
        nameKannada: p.nameKannada || '',
        lat: p.lat,
        lng: p.lng,
        startTime: pad(arrive),
        endTime: pad(leave),
        travelFromPrevKm: Math.round(km),
        travelFromPrevMin: mins,
        entryFee: p.entryFeeINR || 0,
        description: s.description || p.description,
        tip: s.tip || '',
        food: s.food && s.food.length ? s.food : p.nearbyFood
      };

      stopsOut.push(stopObj);
      allStops.push(stopObj);
      cursor = leave + 30;
      prevPt = p;
    });

    totalTransportKm += dayTransportKm;
    const area = ad.stayArea || (stopsOut.length ? stopsOut[stopsOut.length - 1].name : input.startCity);
    const region = ad.region || (stopsOut.length ? placeMap[stopsOut[0].placeId]?.region : '—');

    daysArr.push({
      day: i + 1,
      title: ad.title || `${region} day`,
      region,
      travelKm: Math.round(dayTransportKm),
      stops: stopsOut,
      stay: { area },
      dayCost: {}
    });
  }

  // Authoritative Pricing Engine calculation
  const travellers = Math.max(1, parseInt(input.travellers, 10) || 2);
  const pricing = calculateTripCost({
    days: input.days,
    nights: Math.max(0, input.days - 1),
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
  const perDayTransport = Math.round(pricing.subtotals.transportation / Math.max(1, input.days));
  const perDayFood = Math.round(pricing.subtotals.food / Math.max(1, input.days));
  const perDayStay = Math.round(pricing.subtotals.accommodation / Math.max(1, input.days));

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

  const warnings = [];
  if (pricing.totalTripCost > input.budget) {
    warnings.push(`Estimated cost ₹${pricing.totalTripCost.toLocaleString('en-IN')} exceeds target budget ₹${input.budget.toLocaleString('en-IN')}.`);
  }

  const ecoScore = Math.max(0, Math.min(100, Math.round(100 - (totalTransportKm / (input.days * 100)))));

  return {
    meta: {
      source: 'ai',
      totalCost: pricing.totalTripCost,
      totalDistanceKm: Math.round(totalTransportKm),
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
      remaining: input.budget - pricing.totalTripCost,
      subtotals: pricing.subtotals,
      lineItems: pricing.lineItems
    },
    warnings,
    ecoScore
  };
}

// POST /api/plan/auto-budget
// Select attractions only after reserving outbound + return transport and fixed trip costs.
router.post('/auto-budget', async (req, res) => {
  try {
    const plan = await buildBudgetOptimizedPlan(req.body || {});
    return res.json(plan);
  } catch (err) {
    console.error('[Auto Budget Plan Error]', err);
    return res.status(err.status || 500).json({
      error: err.message || 'Automatic budget planning failed.'
    });
  }
});

router.post('/', async (req, res) => {
  const input = req.body;
  const { inSeason } = filterPlaces(input);
  const pool = inSeason.length ? inSeason : places;
  const scored = pool.map(p => ({ p, s: score(p, input) })).sort((a, b) => b.s - a.s);
  const pace = { Relaxed: 2, Balanced: 3, Packed: 4 }[input.pace] || 3;
  let shortlisted = scored.slice(0, Math.min(input.days * pace * 2, scored.length)).map(x => x.p.id);

  // If user selected a specific target destination, put it at index 0 and prioritize same district
  if (input.targetPlaceId) {
    const target = places.find(p => p.id === input.targetPlaceId);
    if (target) {
      const sameDistrict = places.filter(p => p.id !== target.id && p.district && p.district.toLowerCase() === target.district?.toLowerCase()).map(p => p.id);
      shortlisted = Array.from(new Set([target.id, ...sameDistrict, ...shortlisted]));
    }
  }

  if (hasKey()) {
    try {
      console.log(`[Plan] Requesting itinerary from Gemini AI for ${input.days} days from ${input.startCity}...`);
      const ai = await arrangeWithAI(input, shortlisted);
      const out = structureFromAI(input, ai.days);
      return res.json(out);
    } catch (e) {
      console.error('[Gemini Plan Fallback] AI generation failed, falling back to rule-based planner:', e.message);
    }
  }

  const out = buildPlan(input);
  res.json(out);
});

module.exports = router;
