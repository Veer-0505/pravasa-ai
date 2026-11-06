const express = require('express');
const router = express.Router();

// In-memory store (use a database in production)
const events = [];
const MAX_EVENTS = 500;

// Rate limiting: simple in-memory (per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 min
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > record.resetAt) { record.count = 0; record.resetAt = now + RATE_LIMIT_WINDOW_MS; }
  record.count++;
  rateLimitMap.set(ip, record);
  return record.count <= RATE_LIMIT_MAX;
}

// POST /api/sos - record SOS event
router.post('/', (req, res) => {
  const ip = req.ip || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many SOS requests. Please call 112 directly.' });
  }

  const { userId, emergencyType, location, locationAccuracy } = req.body;
  if (!emergencyType) return res.status(400).json({ error: 'emergencyType is required' });

  const event = {
    id: 'sos_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    userId: userId || 'anonymous',
    emergencyType,
    location: location || null,
    locationAccuracy: locationAccuracy || null,
    ts: new Date().toISOString(),
    status: 'received',
    notificationStatus: 'pending',
    note: '⚠️ This event is recorded for reference only. Emergency services are NOT automatically dispatched.',
  };

  events.unshift(event);
  if (events.length > MAX_EVENTS) events.splice(MAX_EVENTS);

  // In production: send notification to emergency contacts, log to database
  console.log(`[SOS] Event recorded: ${event.id} | Type: ${emergencyType} | User: ${userId}`);

  res.json({ ...event, reminder: 'Call 112 immediately if you require emergency assistance.' });
});

// GET /api/sos - list events (admin only in production)
router.get('/', (req, res) => {
  res.json(events);
});

// GET /api/sos/:id - single event
router.get('/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'SOS event not found' });
  res.json(event);
});

module.exports = router;
