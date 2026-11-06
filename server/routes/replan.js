const express = require('express');
const router = express.Router();
const { rescueStop, places, getStartCoordinates } = require('../services/planner');
const { roadDistanceKm, travelMinutes } = require('../services/distance');
const { calculateTripCost } = require('../services/pricingService');

function fmtTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Recomputes all timing, distances, day costs, and full itemized pricing
 */
function recalculatePlan(plan, preferences = {}) {
  const startCity = preferences.startCity || plan.meta?.startCity || 'Bengaluru';
  const start = getStartCoordinates(startCity);
  let totalKm = 0;
  const allStops = [];

  for (let i = 0; i < plan.days.length; i++) {
    const d = plan.days[i];
    let prevPt = i === 0 ? start : (plan.days[i - 1]?.stops?.length ? plan.days[i - 1].stops[plan.days[i - 1].stops.length - 1] : start);
    let cursor = 8 * 60; // 08:00 AM
    let dayKm = 0;

    d.stops = d.stops || [];
    d.stops.forEach((s, idx) => {
      const fromPt = idx === 0 ? prevPt : { lat: d.stops[idx - 1].lat, lng: d.stops[idx - 1].lng };
      const km = roadDistanceKm(fromPt, s);
      const mins = travelMinutes(km);
      const arrive = cursor + mins;
      const visitMin = Math.round((s.avgVisitHours || 2) * 60);
      const leave = arrive + visitMin;
      dayKm += km;

      s.startTime = fmtTime(arrive);
      s.endTime = fmtTime(leave);
      s.travelFromPrevKm = Math.round(km);
      s.travelFromPrevMin = mins;
      cursor = leave + 30;
      prevPt = s;
      allStops.push(s);
    });

    d.travelKm = Math.round(dayKm);
    totalKm += dayKm;
  }

  // Authoritative financial pricing calculation
  const travellers = Math.max(1, parseInt(preferences.travellers || plan.meta?.travellers || 2, 10));
  const days = Math.max(1, plan.days.length);
  const nights = Math.max(0, days - 1);

  const pricingInput = {
    days,
    nights,
    travellers,
    rooms: preferences.rooms || plan.meta?.rooms || Math.ceil(travellers / 2),
    distanceKm: Math.round(totalKm),
    travelMode: preferences.travelMode || plan.meta?.travelMode || 'Personal car',
    budgetStyle: preferences.budgetStyle || plan.meta?.budgetStyle || 'Medium',
    hotels: preferences.hotels || plan.hotels || [],
    food: preferences.food || plan.food || [],
    stops: allStops,
    activities: preferences.activities || plan.activities || [],
    guide: preferences.guide || plan.guide || null,
    additionalServices: preferences.additionalServices || plan.additionalServices || [],
    isConfirmedBooking: Boolean(preferences.isConfirmedBooking || plan.isConfirmedBooking)
  };

  const pricing = calculateTripCost(pricingInput);

  // Distribute costs across days
  const perDayTransport = Math.round(pricing.subtotals.transportation / days);
  const perDayFood = Math.round(pricing.subtotals.food / days);
  const perDayStay = Math.round(pricing.subtotals.accommodation / days);

  plan.days.forEach(d => {
    const dayEntry = d.stops.reduce((sum, s) => sum + ((s.entryFee || s.entryFeeINR || 0) * travellers), 0);
    d.dayCost = {
      transport: perDayTransport,
      food: perDayFood,
      stay: perDayStay,
      entry: dayEntry,
      total: perDayTransport + perDayFood + perDayStay + dayEntry
    };
  });

  const targetBudget = preferences.budget || plan.meta?.budget || 25000;

  plan.hotels = pricingInput.hotels;
  plan.food = pricingInput.food;
  plan.activities = pricingInput.activities;
  plan.guide = pricingInput.guide;
  plan.additionalServices = pricingInput.additionalServices;

  plan.meta = {
    ...plan.meta,
    totalCost: pricing.totalTripCost,
    totalDistanceKm: Math.round(totalKm),
    travellers,
    travelMode: pricingInput.travelMode,
    budgetStyle: pricingInput.budgetStyle,
    pricing
  };

  plan.budget = {
    transport: pricing.subtotals.transportation,
    food: pricing.subtotals.food,
    stay: pricing.subtotals.accommodation,
    entry: pricing.subtotals.entryFees,
    activities: pricing.subtotals.activities,
    guide: pricing.subtotals.guideCharges,
    additionalServices: pricing.subtotals.additionalServices,
    taxes: pricing.subtotals.taxes,
    total: pricing.totalTripCost,
    remaining: targetBudget - pricing.totalTripCost,
    subtotals: pricing.subtotals,
    lineItems: pricing.lineItems
  };

  return plan;
}

router.post('/', (req, res) => {
  const { plan, action, placeId, day, alternativePlaceId, item, preferences } = req.body;
  if (!plan || !plan.days) {
    return res.status(400).json({ error: 'Valid plan object is required' });
  }

  const newPlan = JSON.parse(JSON.stringify(plan));
  const mergedPrefs = { ...(preferences || {}), ...(newPlan.meta || {}) };

  // 1. Remove Stop
  if (action === 'remove') {
    const targetDay = newPlan.days.find(x => x.day === day);
    if (targetDay) {
      targetDay.stops = targetDay.stops.filter(s => s.placeId !== placeId);
    }
    const updated = recalculatePlan(newPlan, mergedPrefs);
    return res.json(updated);
  }

  // 2. Add Stop
  if (action === 'add') {
    const targetDay = newPlan.days.find(x => x.day === (day || 1));
    if (targetDay) {
      const placeRecord = places.find(p => p.id === placeId) || item;
      if (placeRecord) {
        targetDay.stops.push({
          placeId: placeRecord.id,
          name: placeRecord.name,
          nameKannada: placeRecord.nameKannada || '',
          lat: placeRecord.lat,
          lng: placeRecord.lng,
          entryFee: placeRecord.entryFeeINR || 0,
          description: placeRecord.description || '',
          tip: 'Newly added stop',
          food: placeRecord.nearbyFood || []
        });
      }
    }
    const updated = recalculatePlan(newPlan, mergedPrefs);
    return res.json(updated);
  }

  // 3. Rescue / Swap Stop
  if (action === 'rescue') {
    const alternative = alternativePlaceId
      ? places.find(p => p.id === alternativePlaceId)
      : rescueStop(placeId);

    if (!alternative) {
      return res.status(404).json({ error: 'No suitable alternative found in this sector for rescue' });
    }

    const targetDay = newPlan.days.find(x => x.day === day);
    if (!targetDay) return res.status(404).json({ error: `Day ${day} not found` });

    const stopIdx = targetDay.stops.findIndex(s => s.placeId === placeId);
    if (stopIdx === -1) return res.status(404).json({ error: 'Stop not found on specified day' });

    const oldStop = targetDay.stops[stopIdx];
    targetDay.stops[stopIdx] = {
      ...oldStop,
      placeId: alternative.id,
      name: alternative.name,
      nameKannada: alternative.nameKannada || '',
      lat: alternative.lat,
      lng: alternative.lng,
      entryFee: alternative.entryFeeINR || 0,
      description: `[Smart Trip Rescue Alternative] ${alternative.description}`,
      tip: `Rescued alternative for ${oldStop.name}.`,
      food: alternative.nearbyFood || oldStop.food,
      rescuedFrom: oldStop.name
    };

    if (!newPlan.rescues) newPlan.rescues = [];
    newPlan.rescues.push({
      original: oldStop.name,
      replacement: alternative.name,
      day,
      reason: 'Smart Trip Rescue triggered: alternative destination assigned.'
    });

    const updated = recalculatePlan(newPlan, mergedPrefs);
    return res.json(updated);
  }

  // 4. Add/Remove Hotels
  if (action === 'addHotel') {
    newPlan.hotels = newPlan.hotels || [];
    if (item && !newPlan.hotels.some(h => h.id === item.id)) {
      newPlan.hotels.push(item);
    }
    const updated = recalculatePlan(newPlan, mergedPrefs);
    return res.json(updated);
  }
  if (action === 'removeHotel') {
    newPlan.hotels = (newPlan.hotels || []).filter(h => h.id !== item?.id && h.id !== placeId);
    const updated = recalculatePlan(newPlan, mergedPrefs);
    return res.json(updated);
  }

  // 5. Add/Remove Food
  if (action === 'addFood') {
    newPlan.food = newPlan.food || [];
    if (item) newPlan.food.push(item);
    const updated = recalculatePlan(newPlan, mergedPrefs);
    return res.json(updated);
  }
  if (action === 'removeFood') {
    newPlan.food = (newPlan.food || []).filter(f => f.id !== item?.id && f.name !== item?.name);
    const updated = recalculatePlan(newPlan, mergedPrefs);
    return res.json(updated);
  }

  // 6. Add/Remove Activity
  if (action === 'addActivity') {
    newPlan.activities = newPlan.activities || [];
    if (item) newPlan.activities.push(item);
    const updated = recalculatePlan(newPlan, mergedPrefs);
    return res.json(updated);
  }
  if (action === 'removeActivity') {
    newPlan.activities = (newPlan.activities || []).filter(a => a.id !== item?.id && a.id !== placeId);
    const updated = recalculatePlan(newPlan, mergedPrefs);
    return res.json(updated);
  }

  // 7. General Preference / Quantity Change (e.g. transport, travellers, days, guide)
  if (action === 'updatePreferences') {
    const updated = recalculatePlan(newPlan, { ...mergedPrefs, ...(preferences || {}) });
    return res.json(updated);
  }

  const fallbackUpdated = recalculatePlan(newPlan, mergedPrefs);
  res.json(fallbackUpdated);
});

module.exports = router;
module.exports.recalculatePlan = recalculatePlan;
