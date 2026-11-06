require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const planRoute = require('./routes/plan');
const replanRoute = require('./routes/replan');
const chatRoute = require('./routes/chat');
const placesRoute = require('./routes/places');
const districtsRoute = require('./routes/districts');
const mapRoute = require('./routes/map');
const sosRoute = require('./routes/sos');
const crowdRoute = require('./routes/crowd');
const reportsRoute = require('./routes/reports');
const reviewsRoute = require('./routes/reviews');
const alertsRoute = require('./routes/alerts');
const analyticsRoute = require('./routes/analytics');
const authRoute = require('./routes/auth');
const pricingRoute = require('./routes/pricing');
const { generalRateLimiter } = require('./middleware/auth');

const app = express();

// Rate limiting & security
app.use('/api', generalRateLimiter);

// CORS - allow local dev origin
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Static uploads directory for durable media storage
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

// Routes
app.use('/api/auth', authRoute);
app.use('/api/plan', planRoute);
app.use('/api/replan', replanRoute);
app.use('/api/chat', chatRoute);
app.use('/api/places', placesRoute);
app.use('/api/districts', districtsRoute);
app.use('/api/map', mapRoute);
app.use('/api/sos', sosRoute);
app.use('/api/crowd', crowdRoute);
app.use('/api/reports', reportsRoute);
app.use('/api/reviews', reviewsRoute);
app.use('/api/alerts', alertsRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/pricing', pricingRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    env: {
      hasGeminiKey: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
      port: process.env.PORT || 5000,
    },
  });
});

// Gemini status and diagnostic test
const { hasKey, testGeminiConnection } = require('./services/gemini');
app.get('/api/gemini/status', async (req, res) => {
  const result = await testGeminiConnection();
  res.json({
    configured: hasKey(),
    ...result,
  });
});

app.post('/api/gemini/key', (req, res) => {
  const { apiKey, model } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return res.status(400).json({ error: 'Valid apiKey string is required' });
  }
  process.env.GEMINI_API_KEY = apiKey.trim();
  if (model) process.env.GEMINI_MODEL = model.trim();

  try {
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    if (/^GEMINI_API_KEY=/m.test(envContent)) {
      envContent = envContent.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${apiKey.trim()}`);
    } else {
      envContent += `\nGEMINI_API_KEY=${apiKey.trim()}`;
    }
    if (model) {
      if (/^GEMINI_MODEL=/m.test(envContent)) {
        envContent = envContent.replace(/^GEMINI_MODEL=.*$/m, `GEMINI_MODEL=${model.trim()}`);
      } else {
        envContent += `\nGEMINI_MODEL=${model.trim()}`;
      }
    }
    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  } catch (err) {
    console.error('[Config] Failed to persist .env:', err.message);
  }

  res.json({ ok: true, message: 'Gemini configuration updated successfully' });
});

// Static client serving for production deployment
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Pravasa AI Server running on port ${PORT}`);
  console.log(`   Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '⚠️  Not configured (smart planner active)'}`);
  console.log(`   API: http://localhost:${PORT}/api/health\n`);
});
