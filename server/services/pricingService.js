/**
 * PRAVASA AI - Centralized Authoritative Pricing Engine
 * Computes exact itemized trip pricing and category-wise subtotals.
 * 
 * TOTAL TRIP COST = 
 *   Transportation + Accommodation + Food + Activities + 
 *   Entry Fees + Guide Charges + Additional Services + Taxes
 */

const FUEL_PRICE_PER_LITRE = 102; // Average fuel price in INR in Karnataka
const GST_TAX_RATE = 0.05; // 5% Standard blended tourism & transit GST

const TRANSPORT_MODELS = {
  'Personal car': {
    type: 'personal',
    mileageKmPerLitre: 14,
    description: 'Personal car fuel estimate based on 14 km/l mileage @ ₹102/L'
  },
  'Personal bike': {
    type: 'personal',
    mileageKmPerLitre: 38,
    description: 'Personal two-wheeler fuel estimate based on 38 km/l mileage @ ₹102/L'
  },
  'Rental car': {
    type: 'rental',
    dailyRate: 2200,
    mileageKmPerLitre: 14,
    description: 'Self-drive rental sedan @ ₹2,200/day + fuel @ 14 km/l'
  },
  'Rental bike': {
    type: 'rental',
    dailyRate: 650,
    mileageKmPerLitre: 38,
    description: 'Two-wheeler rental @ ₹650/day + fuel @ 38 km/l'
  },
  'Bus': {
    type: 'public',
    ratePerKm: 2.5,
    minFare: 80,
    description: 'KSRTC Rajahamsa / Express bus estimated tariff @ ₹2.50/km per passenger'
  },
  'Train': {
    type: 'public',
    ratePerKm: 1.8,
    minFare: 60,
    description: 'South Western Railway second-sitting / express fare @ ₹1.80/km per passenger'
  },
  'Taxi': {
    type: 'commercial',
    ratePerKm: 14,
    description: 'Commercial AC tourist cab @ ₹14/km'
  },
  'Electric Vehicle': {
    type: 'ev',
    ratePerKm: 4.5,
    description: 'EV charging tariff model @ ₹4.50/km'
  }
};

const DEFAULT_HOTEL_TIERS = {
  low: { name: 'Budget Hotel / Homestay', pricePerNight: 1200 },
  medium: { name: 'Standard 3-Star Hotel', pricePerNight: 2500 },
  premium: { name: 'Luxury Resort / Heritage Palace', pricePerNight: 5500 }
};

const DEFAULT_FOOD_TIERS = {
  low: { perPersonPerDay: 250, description: 'Budget local tiffin & vegetarian thali' },
  medium: { perPersonPerDay: 600, description: 'Authentic restaurants & multicuisine meals' },
  premium: { perPersonPerDay: 1400, description: 'Fine dining & heritage specialty cuisine' }
};

/**
 * Authoritative Pricing Calculator
 * Accepts raw selections and returns validated, unassailable financial breakdown.
 */
function calculateTripCost(payload = {}) {
  const days = Math.max(1, parseInt(payload.days, 10) || 1);
  const travellers = Math.max(1, parseInt(payload.travellers, 10) || 1);
  const nights = Math.max(0, parseInt(payload.nights, 10) || (days > 1 ? days - 1 : 0));
  const distanceKm = Math.max(0, parseFloat(payload.distanceKm) || 0);
  const travelMode = payload.travelMode || payload.transportation?.mode || 'Personal car';
  const budgetStyle = (payload.budgetStyle || 'Medium').toLowerCase();

  const lineItems = [];

  // ==========================================
  // 1. TRANSPORTATION CALCULATION
  // ==========================================
  const tm = TRANSPORT_MODELS[travelMode] || TRANSPORT_MODELS['Personal car'];
  let transportCost = 0;

  if (tm.type === 'personal') {
    // Roundtrip distance if personal vehicle
    const effectiveKm = Number.isFinite(Number(payload.totalDistanceKm))
      ? Math.max(0, Number(payload.totalDistanceKm))
      : (payload.isRoundTrip ? distanceKm : distanceKm * 2);
    const litres = effectiveKm / tm.mileageKmPerLitre;
    transportCost = Math.round(litres * FUEL_PRICE_PER_LITRE);
    lineItems.push({
      category: 'transportation',
      name: `${travelMode} (Fuel Estimation)`,
      quantity: Math.round(effectiveKm),
      unit: 'km',
      unitPrice: Math.round((FUEL_PRICE_PER_LITRE / tm.mileageKmPerLitre) * 100) / 100,
      total: transportCost,
      details: `${Math.round(litres * 10) / 10} Litres fuel @ ₹${FUEL_PRICE_PER_LITRE}/L`
    });
  } else if (tm.type === 'rental') {
    const rentalCharge = tm.dailyRate * days;
    const rentalDistanceKm = Number.isFinite(Number(payload.totalDistanceKm))
      ? Math.max(0, Number(payload.totalDistanceKm))
      : distanceKm;
    const litres = rentalDistanceKm / tm.mileageKmPerLitre;
    const fuelCost = Math.round(litres * FUEL_PRICE_PER_LITRE);
    transportCost = rentalCharge + fuelCost;
    lineItems.push({
      category: 'transportation',
      name: `${travelMode} Daily Hire`,
      quantity: days,
      unit: 'days',
      unitPrice: tm.dailyRate,
      total: rentalCharge,
      details: `Rental rate ₹${tm.dailyRate}/day × ${days} days`
    });
    if (fuelCost > 0) {
      lineItems.push({
        category: 'transportation',
        name: `${travelMode} Fuel`,
        quantity: Math.round(distanceKm),
        unit: 'km',
        unitPrice: Math.round((FUEL_PRICE_PER_LITRE / tm.mileageKmPerLitre) * 100) / 100,
        total: fuelCost,
        details: `Estimated fuel @ ₹${FUEL_PRICE_PER_LITRE}/L`
      });
    }
  } else if (tm.type === 'public') {
    const fareDistanceKm = Number.isFinite(Number(payload.totalDistanceKm))
      ? Math.max(0, Number(payload.totalDistanceKm))
      : distanceKm;
    const perPersonFare = Math.max(tm.minFare, Math.round(fareDistanceKm * tm.ratePerKm));
    transportCost = perPersonFare * travellers;
    lineItems.push({
      category: 'transportation',
      name: `${travelMode} Tickets`,
      quantity: travellers,
      unit: 'passengers',
      unitPrice: perPersonFare,
      total: transportCost,
      details: `₹${perPersonFare}/passenger based on ${Math.round(fareDistanceKm)} km total estimated journey distance`
    });
  } else {
    // Commercial Taxi / EV
    const commercialDistanceKm = Number.isFinite(Number(payload.totalDistanceKm))
      ? Math.max(0, Number(payload.totalDistanceKm))
      : distanceKm;
    transportCost = Math.round(commercialDistanceKm * tm.ratePerKm);
    lineItems.push({
      category: 'transportation',
      name: travelMode,
      quantity: Math.round(commercialDistanceKm),
      unit: 'km',
      unitPrice: tm.ratePerKm,
      total: transportCost,
      details: `₹${tm.ratePerKm}/km travel tariff over ${Math.round(commercialDistanceKm)} km`
    });
  }

  // ==========================================
  // 2. ACCOMMODATION / HOTEL PRICING
  // Formula: Price Per Night × Number of Nights × Number of Rooms
  // ==========================================
  let accommodationCost = 0;
  const rawHotels = Array.isArray(payload.hotels) ? payload.hotels : [];

  if (rawHotels.length > 0) {
    rawHotels.forEach((h, idx) => {
      const roomCat = h.roomCategory || h.roomType || 'Standard Room';
      const pricePerNight = Math.max(0, parseInt(h.pricePerNight, 10) || 2000);
      const hNights = Math.max(1, parseInt(h.nights, 10) || 1);
      const hRooms = Math.max(1, parseInt(h.rooms, 10) || Math.ceil(travellers / 2));
      const sub = pricePerNight * hNights * hRooms;
      accommodationCost += sub;

      lineItems.push({
        category: 'accommodation',
        id: h.id || `hotel_${idx}`,
        name: h.name || 'Selected Hotel',
        roomCategory: roomCat,
        quantity: hRooms,
        unit: 'rooms',
        nights: hNights,
        unitPrice: pricePerNight,
        total: sub,
        details: `₹${pricePerNight}/night × ${hNights} nights × ${hRooms} rooms`
      });
    });
  } else if (nights > 0) {
    // Fallback to tier estimation
    const tier = DEFAULT_HOTEL_TIERS[budgetStyle] || DEFAULT_HOTEL_TIERS.medium;
    const defaultRooms = Math.max(1, parseInt(payload.rooms, 10) || Math.ceil(travellers / 2));
    const sub = tier.pricePerNight * nights * defaultRooms;
    accommodationCost += sub;

    lineItems.push({
      category: 'accommodation',
      name: `${tier.name} (${budgetStyle.toUpperCase()})`,
      quantity: defaultRooms,
      unit: 'rooms',
      nights,
      unitPrice: tier.pricePerNight,
      total: sub,
      details: `Estimated ₹${tier.pricePerNight}/night × ${nights} nights × ${defaultRooms} rooms`
    });
  }

  // ==========================================
  // 3. FOOD AND RESTAURANTS PRICING
  // ==========================================
  let foodCost = 0;
  const rawFood = Array.isArray(payload.food) ? payload.food : [];

  if (rawFood.length > 0) {
    rawFood.forEach((f, idx) => {
      const price = Math.max(0, parseInt(f.price, 10) || 250);
      const qty = Math.max(1, parseInt(f.quantity, 10) || travellers);
      const sub = price * qty;
      foodCost += sub;

      lineItems.push({
        category: 'food',
        id: f.id || `food_${idx}`,
        name: f.name || 'Selected Meal / Restaurant',
        quantity: qty,
        unit: 'meals',
        unitPrice: price,
        total: sub,
        details: `₹${price} × ${qty} meals`
      });
    });
  } else {
    // Default tier-based meals
    const fTier = DEFAULT_FOOD_TIERS[budgetStyle] || DEFAULT_FOOD_TIERS.medium;
    const sub = fTier.perPersonPerDay * travellers * days;
    foodCost += sub;

    lineItems.push({
      category: 'food',
      name: `Culinary & Meals (${budgetStyle.toUpperCase()})`,
      quantity: travellers * days,
      unit: 'traveller-days',
      unitPrice: fTier.perPersonPerDay,
      total: sub,
      details: `₹${fTier.perPersonPerDay}/day × ${travellers} travellers × ${days} days`
    });
  }

  // ==========================================
  // 4. ATTRACTION ENTRY FEES
  // ==========================================
  let entryFeesCost = 0;
  const rawStops = Array.isArray(payload.stops) ? payload.stops : [];

  rawStops.forEach((s, idx) => {
    const fee = Math.max(0, parseInt(s.entryFeeINR || s.entryFee || 0, 10));
    if (fee > 0) {
      const sub = fee * travellers;
      entryFeesCost += sub;
      lineItems.push({
        category: 'entryFees',
        id: s.placeId || s.id || `stop_${idx}`,
        name: `${s.name || 'Attraction'} Entry Ticket`,
        quantity: travellers,
        unit: 'tickets',
        unitPrice: fee,
        total: sub,
        details: `₹${fee} × ${travellers} travellers`
      });
    }
  });

  // ==========================================
  // 5. ADVENTURE & ACTIVITIES PRICING
  // ==========================================
  let activitiesCost = 0;
  const rawActivities = Array.isArray(payload.activities) ? payload.activities : [];

  rawActivities.forEach((act, idx) => {
    const price = Math.max(0, parseInt(act.priceINR || act.price || 0, 10));
    const qty = Math.max(1, parseInt(act.quantity, 10) || travellers);
    const sub = price * qty;
    activitiesCost += sub;

    lineItems.push({
      category: 'activities',
      id: act.id || `activity_${idx}`,
      name: act.name || 'Adventure Activity',
      quantity: qty,
      unit: 'slots',
      unitPrice: price,
      total: sub,
      details: `₹${price} × ${qty} participants`
    });
  });

  // ==========================================
  // 6. TOUR GUIDE CHARGES
  // ==========================================
  let guideCost = 0;
  if (payload.guide && (payload.guide.enabled !== false)) {
    const dailyRate = Math.max(0, parseInt(payload.guide.dailyRate, 10) || 1200);
    const guideDays = Math.max(1, parseInt(payload.guide.days, 10) || days);
    guideCost = dailyRate * guideDays;

    lineItems.push({
      category: 'guideCharges',
      name: payload.guide.name || 'Certified KSTDC / Regional Tourist Guide',
      quantity: guideDays,
      unit: 'days',
      unitPrice: dailyRate,
      total: guideCost,
      details: `₹${dailyRate}/day × ${guideDays} days`
    });
  }

  // ==========================================
  // 7. ADDITIONAL SERVICES (Eco-Permit, Insurance)
  // ==========================================
  let additionalServicesCost = 0;
  const rawServices = Array.isArray(payload.additionalServices) ? payload.additionalServices : [];

  rawServices.forEach((srv, idx) => {
    const price = Math.max(0, parseInt(srv.price, 10) || 0);
    const qty = Math.max(1, parseInt(srv.quantity, 10) || travellers);
    const sub = price * qty;
    additionalServicesCost += sub;

    lineItems.push({
      category: 'additionalServices',
      id: srv.id || `srv_${idx}`,
      name: srv.name || 'Additional Tourism Service',
      quantity: qty,
      unit: 'units',
      unitPrice: price,
      total: sub,
      details: `₹${price} × ${qty}`
    });
  });

  // ==========================================
  // 8. TAXES (GST 5%)
  // ==========================================
  const subtotalBeforeTaxes = 
    transportCost + 
    accommodationCost + 
    foodCost + 
    activitiesCost + 
    entryFeesCost + 
    guideCost + 
    additionalServicesCost;

  const taxesCost = Math.round(subtotalBeforeTaxes * GST_TAX_RATE);

  lineItems.push({
    category: 'taxes',
    name: 'Statutory GST & Tourism Cess (5%)',
    quantity: 1,
    unit: 'tax',
    unitPrice: taxesCost,
    total: taxesCost,
    details: '5% applied on applicable hospitality & transport services'
  });

  // ==========================================
  // 9. FINAL AGGREGATION
  // ==========================================
  const totalTripCost = subtotalBeforeTaxes + taxesCost;

  return {
    ok: true,
    currency: 'INR',
    currencySymbol: '₹',
    totalTripCost,
    subtotals: {
      transportation: transportCost,
      accommodation: accommodationCost,
      food: foodCost,
      entryFees: entryFeesCost,
      activities: activitiesCost,
      guideCharges: guideCost,
      additionalServices: additionalServicesCost,
      taxes: taxesCost,
      subtotalBeforeTaxes
    },
    meta: {
      days,
      nights,
      travellers,
      rooms: Math.max(1, parseInt(payload.rooms, 10) || Math.ceil(travellers / 2)),
      distanceKm: Math.round(distanceKm),
      travelMode,
      budgetStyle,
      isConfirmedBooking: Boolean(payload.isConfirmedBooking),
      status: payload.isConfirmedBooking ? 'confirmed' : 'estimated'
    },
    lineItems
  };
}

module.exports = {
  calculateTripCost,
  TRANSPORT_MODELS,
  DEFAULT_HOTEL_TIERS,
  DEFAULT_FOOD_TIERS,
  FUEL_PRICE_PER_LITRE,
  GST_TAX_RATE
};

