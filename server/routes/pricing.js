const express = require('express');
const router = express.Router();
const { calculateTripCost, TRANSPORT_MODELS, DEFAULT_HOTEL_TIERS, DEFAULT_FOOD_TIERS } = require('../services/pricingService');

/**
 * POST /api/pricing/calculate
 * Central authoritative calculation endpoint for Trip Planner, Itinerary, Saved Trips, and Checkout
 */
router.post('/calculate', (req, res) => {
  try {
    const payload = req.body || {};
    const result = calculateTripCost(payload);
    res.json(result);
  } catch (err) {
    console.error('[Pricing Error]', err);
    res.status(500).json({ error: 'Pricing calculation failed', message: err.message });
  }
});

/**
 * GET /api/pricing/rates
 * Returns verified base rates for frontend preview and transparent tariffs
 */
router.get('/rates', (req, res) => {
  res.json({
    transportModels: TRANSPORT_MODELS,
    hotelTiers: DEFAULT_HOTEL_TIERS,
    foodTiers: DEFAULT_FOOD_TIERS,
    gstRate: 0.05
  });
});

module.exports = router;

