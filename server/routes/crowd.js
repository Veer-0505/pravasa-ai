const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const crowdFilePath = path.join(__dirname, '..', 'data', 'crowd_reports.json');
const MAX_REPORTS = 1000;

function readReports() {
  try {
    if (!fs.existsSync(crowdFilePath)) return [];
    return JSON.parse(fs.readFileSync(crowdFilePath, 'utf8'));
  } catch (err) {
    console.error('[Crowd Read Error]', err);
    return [];
  }
}

function writeReports(list) {
  try {
    fs.writeFileSync(crowdFilePath, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[Crowd Write Error]', err);
    return false;
  }
}

// POST /api/crowd - submit crowd report
router.post('/', (req, res) => {
  const { placeId, placeName, crowdLevel, queueEstimate, parkingStatus, note, source, confidence } = req.body;
  if (!placeId) return res.status(400).json({ error: 'placeId is required' });

  const validLevels = ['low', 'moderate', 'high', 'very-high'];
  const normalizedLevel = validLevels.includes(crowdLevel) ? crowdLevel : 'unknown';

  const report = {
    id: 'crowd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    placeId,
    placeName: placeName || placeId,
    crowdLevel: normalizedLevel,
    queueEstimate: queueEstimate || null,
    parkingStatus: parkingStatus || null,
    note: note || null,
    source: source || 'traveller-report',
    confidence: confidence || 'low',
    ts: new Date().toISOString(),
    disclaimer: 'This is a user-submitted report and does not represent official or real-time data.',
  };

  const reports = readReports();
  reports.unshift(report);
  if (reports.length > MAX_REPORTS) reports.splice(MAX_REPORTS);
  writeReports(reports);

  res.json(report);
});

// GET /api/crowd - get recent reports
router.get('/', (req, res) => {
  const { placeId, hours } = req.query;
  let list = readReports();

  if (placeId) list = list.filter(r => r.placeId === placeId);
  if (hours) {
    const cutoff = Date.now() - (parseFloat(hours) * 3600 * 1000);
    list = list.filter(r => new Date(r.ts).getTime() > cutoff);
  }

  res.json(list);
});

// GET /api/crowd/:placeId/summary - aggregated summary
router.get('/:placeId/summary', (req, res) => {
  const { placeId } = req.params;
  const reports = readReports();
  const recent = reports.filter(r => r.placeId === placeId && Date.now() - new Date(r.ts).getTime() < 6 * 3600 * 1000);
  if (recent.length === 0) return res.json({ placeId, dataAvailable: false, note: 'No recent traveller reports' });

  const counts = {};
  recent.forEach(r => { counts[r.crowdLevel] = (counts[r.crowdLevel] || 0) + 1; });
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  res.json({
    placeId,
    dataAvailable: true,
    dominantCrowdLevel: dominant,
    reportCount: recent.length,
    latest: recent[0].ts,
    confidence: 'low',
    disclaimer: 'Based on ' + recent.length + ' traveller report(s) in the last 6 hours. Not official data.',
  });
});

module.exports = router;
