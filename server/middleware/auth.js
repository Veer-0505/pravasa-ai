const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const JWT_SECRET = process.env.JWT_SECRET || 'pravasa-karnataka-tourism-secret-key-2026';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
}) : null;

/**
 * Generate a secure JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Helper to verify either a local JWT token OR a Supabase Bearer access token
 */
async function authenticateTokenString(token) {
  if (!token) return null;

  // 1. First attempt: local JWT verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded) return decoded;
  } catch (err) {
    // Not a local JWT or expired, try Supabase next
  }

  // 2. Second attempt: Supabase Auth session token verification
  if (supabase) {
    try {
      const { data: { user: sbUser }, error } = await supabase.auth.getUser(token);
      if (!error && sbUser) {
        const metadataRole = sbUser.user_metadata?.role;
        // Check if admin by role metadata or known admin email
        const isAdmin = metadataRole === 'admin' || metadataRole === 'gov_admin' || 
          ['admin@pravasa.ai', 'veerrr0505@gmail.com', 'sveeresh.in@gmail.com', 'sveerrr0505@gmail.com'].includes(sbUser.email?.toLowerCase());

        return {
          id: sbUser.id,
          email: sbUser.email,
          role: isAdmin ? 'admin' : (metadataRole || 'customer'),
          name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0],
          isSupabase: true
        };
      }
    } catch (sbErr) {
      // Supabase verification failed
    }
  }

  return null;
}

/**
 * Middleware: Verify JWT or Supabase Token from Authorization: Bearer <token> header
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-access-token'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (authHeader) {
    token = authHeader.trim();
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const user = await authenticateTokenString(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }

  req.user = user;
  next();
}

/**
 * Middleware: Require admin privileges (Gov Admin)
 */
async function requireAdmin(req, res, next) {
  // If user is already set on req
  if (req.user) {
    if (req.user.role === 'admin' || req.user.role === 'gov_admin') {
      return next();
    }
    return res.status(403).json({ error: 'Access denied. Government Administrator privileges required.' });
  }

  // Otherwise extract and verify token
  const authHeader = req.headers['authorization'] || req.headers['x-access-token'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (authHeader) {
    token = authHeader.trim();
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const user = await authenticateTokenString(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }

  req.user = user;
  if (user.role === 'admin' || user.role === 'gov_admin') {
    return next();
  }

  return res.status(403).json({ error: 'Access denied. Government Administrator privileges required.' });
}

/**
 * Rate Limiter for Authentication Endpoints (prevent brute-force)
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

/**
 * General API Rate Limiter
 */
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API rate limit exceeded. Please throttle requests.' }
});

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  requireAdmin,
  authRateLimiter,
  generalRateLimiter
};
