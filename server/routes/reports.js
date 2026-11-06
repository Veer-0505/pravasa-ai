const express = require('express');
const router = express.Router();

const reports = [];
const MAX = 500;

// POST /api/reports - submit a place info report
router.post('/', (req, res) => {
  const { placeId, message, ts } = req.body;
  if (!placeId || !message) return res.status(400).json({ error: 'placeId and message are required' });

  const report = {
    id: 'rpt_' + Date.now(),
    placeId,
    message: message.slice(0, 500),
    ts: ts || new Date().toISOString(),
    status: 'pending',
  };

  reports.unshift(report);
  if (reports.length > MAX) reports.splice(MAX);

  res.json({ ok: true, id: report.id });
});

// GET /api/reports - list all (admin)
router.get('/', (req, res) => res.json(reports));

module.exports = router;
