const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAdmin } = require('../middleware/auth');

const alertsFilePath = path.join(__dirname, '..', 'data', 'alerts.json');

function readAlerts() {
  try {
    if (!fs.existsSync(alertsFilePath)) return [];
    return JSON.parse(fs.readFileSync(alertsFilePath, 'utf8'));
  } catch (err) {
    console.error('[Alerts Read Error]', err);
    return [];
  }
}

function writeAlerts(alerts) {
  try {
    fs.writeFileSync(alertsFilePath, JSON.stringify(alerts, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[Alerts Write Error]', err);
    return false;
  }
}

/**
 * GET /api/alerts
 * Query filters: ?district=...&category=...&activeOnly=true
 */
router.get('/', (req, res) => {
  const { district, category, activeOnly = 'true' } = req.query;
  let alerts = readAlerts();

  const now = new Date();
  if (activeOnly === 'true') {
    alerts = alerts.filter(a => a.active && (!a.expiresAt || new Date(a.expiresAt) > now));
  }

  if (district) {
    const q = district.toLowerCase().trim();
    alerts = alerts.filter(a => (a.location || '').toLowerCase().includes(q));
  }

  if (category) {
    alerts = alerts.filter(a => a.category === category);
  }

  res.json({
    ok: true,
    count: alerts.length,
    alerts
  });
});

/**
 * POST /api/alerts
 * Government Admin: Publish a new travel advisory or weather warning
 */
router.post('/', (req, res) => {
  try {
    const { title, category, severity, location, description, issuingAuthority, expiresAt, sourceUrl } = req.body;

    if (!title || !description || !issuingAuthority) {
      return res.status(400).json({ error: 'Title, description, and issuingAuthority are required' });
    }

    const alerts = readAlerts();
    const newAlert = {
      id: 'alert_' + Date.now(),
      title: title.trim(),
      category: category || 'general_advisory',
      severity: severity || 'info', // 'info' | 'advisory' | 'warning' | 'urgent'
      location: location ? location.trim() : 'Karnataka Statewide',
      description: description.trim(),
      issuingAuthority: issuingAuthority.trim(),
      publishedAt: new Date().toISOString(),
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      sourceUrl: sourceUrl ? sourceUrl.trim() : 'https://karnatakatourism.org',
      active: true
    };

    alerts.unshift(newAlert);
    writeAlerts(alerts);

    console.log(`[Travel Advisory] Published alert: "${newAlert.title}" by ${newAlert.issuingAuthority}`);

    res.status(201).json({
      ok: true,
      message: 'Travel advisory published successfully.',
      alert: newAlert
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish alert: ' + err.message });
  }
});

/**
 * PATCH /api/alerts/:id/toggle
 * Toggle active state of advisory
 */
router.patch('/:id/toggle', (req, res) => {
  const { id } = req.params;
  const alerts = readAlerts();
  const alert = alerts.find(a => a.id === id);

  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  alert.active = !alert.active;
  writeAlerts(alerts);

  res.json({
    ok: true,
    message: `Alert "${alert.title}" is now ${alert.active ? 'Active' : 'Archived'}.`,
    active: alert.active
  });
});

module.exports = router;

