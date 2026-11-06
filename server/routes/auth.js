const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { generateToken, authRateLimiter, verifyToken, requireAdmin } = require('../middleware/auth');
const { sendEmailOtpCode, verifyEmailOtpCode } = require('../services/emailOtp');

const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');

// In-memory active reset codes with 15-minute TTL: email -> { code, expiresAt }
const resetCodes = new Map();

function readUsers() {
  try {
    if (!fs.existsSync(usersFilePath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
  } catch (err) {
    console.error('[Auth Read Error]', err);
    return [];
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[Auth Write Error]', err);
    return false;
  }
}

function sanitizeUser(u) {
  const { password, ...safe } = u;
  return safe;
}

/**
 * POST /api/auth/send-otp
 * Reliable Email OTP generation and delivery
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email, name, role, city } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await sendEmailOtpCode(cleanEmail, {
      name: (name || cleanEmail.split('@')[0]).trim(),
      role: role || 'customer',
      city: city || 'Bengaluru'
    });

    res.json({
      ok: true,
      message: `6-digit OTP code sent to ${cleanEmail}. Check your email inbox!`,
      deliveryMethod: result.method,
      ...(result.otp ? { devOtp: result.otp } : {})
    });
  } catch (err) {
    console.error('[Send OTP Error]', err);
    res.status(500).json({ error: 'Failed to dispatch email OTP: ' + err.message });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify 6-digit Email OTP and return authenticated session
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, role } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Both email and 6-digit OTP code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const verification = verifyEmailOtpCode(cleanEmail, otp.toString());

    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    const users = readUsers();
    let user = users.find(u => u.email.toLowerCase() === cleanEmail);

    const isAdmin = (role === 'admin' || role === 'gov_admin' || verification.metadata?.role === 'admin' ||
      ['admin@pravasa.ai', 'veerrr0505@gmail.com', 'sveeresh.in@gmail.com', 'sveerrr0505@gmail.com'].includes(cleanEmail));

    if (!user) {
      // Create new user record on first successful OTP verification
      user = {
        id: (isAdmin ? 'gov_' : 'cust_') + Date.now(),
        name: name || verification.metadata?.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: '',
        role: isAdmin ? 'admin' : 'customer',
        city: verification.metadata?.city || 'Bengaluru',
        createdAt: new Date().toISOString(),
        status: 'active',
        isEmailVerified: true,
        savedTripsCount: 0
      };
      users.push(user);
      writeUsers(users);
    } else {
      user.isEmailVerified = true;
      user.lastLoginAt = new Date().toISOString();
      if (isAdmin && user.role !== 'admin') {
        user.role = 'admin';
      }
      writeUsers(users);
    }

    const token = generateToken(user);

    res.json({
      ok: true,
      message: 'Email OTP successfully verified!',
      user: sanitizeUser(user),
      token
    });
  } catch (err) {
    console.error('[Verify OTP Error]', err);
    res.status(500).json({ error: 'Failed to verify email OTP: ' + err.message });
  }
});

/**
 * POST /api/auth/register
 * Real-time customer and gov admin registration with bcrypt password hashing & JWT
 */
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { name, email, phone, password, role, govDesignation, city } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = readUsers();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 12);

    const newUser = {
      id: (role === 'admin' || role === 'gov_admin' ? 'gov_' : 'cust_') + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      password: hashedPassword,
      role: (role === 'admin' || role === 'gov_admin') ? 'admin' : 'customer',
      govDesignation: govDesignation ? govDesignation.trim() : null,
      city: city ? city.trim() : '',
      createdAt: new Date().toISOString(),
      status: 'active',
      savedTripsCount: 0
    };

    users.push(newUser);
    writeUsers(users);

    const token = generateToken(newUser);

    res.status(201).json({
      ok: true,
      message: 'Account created successfully in database',
      user: sanitizeUser(newUser),
      token
    });
  } catch (err) {
    console.error('[Auth Register Error]', err);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

/**
 * POST /api/auth/login
 * Real-time login verification with bcrypt password comparison & JWT
 */
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email address' });
    }

    // Check with bcrypt comparison
    let isValid = false;
    if (user.password.startsWith('$2')) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Fallback for unmigrated plain text
      isValid = (user.password === password);
      // Auto-migrate to bcrypt hash if valid
      if (isValid) {
        user.password = await bcrypt.hash(password, 12);
        writeUsers(users);
      }
    }

    // Demo admin convenience override
    if (!isValid && cleanEmail === 'admin@pravasa.ai' && (password === 'admin123' || password === 'admin')) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password entered' });
    }

    const token = generateToken(user);

    res.json({
      ok: true,
      message: 'Authenticated successfully',
      user: sanitizeUser(user),
      token
    });
  } catch (err) {
    console.error('[Auth Login Error]', err);
    res.status(500).json({ error: 'Authentication service encountered an error' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Real-time reset code generation for customers and gov officers (15-min TTL)
 */
router.post('/forgot-password', authRateLimiter, (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const users = readUsers();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(404).json({ error: 'No account registered with this email address' });
  }

  // Generate a random 6-digit real-time reset code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  resetCodes.set(cleanEmail, { code, expiresAt });

  console.log(`[Auth Password Reset] Real-time code for ${cleanEmail}: ${code}`);

  res.json({
    ok: true,
    message: 'Reset code generated successfully.',
    resetCode: code, // returned directly so user can reset immediately in UI
    expiresInMinutes: 15,
    userRole: user.role
  });
});

/**
 * POST /api/auth/reset-password
 * Real-time password update in database with bcrypt hashing
 */
router.post('/reset-password', authRateLimiter, async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const entry = resetCodes.get(cleanEmail);

    if (!entry || entry.code !== resetCode.trim()) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (Date.now() > entry.expiresAt) {
      resetCodes.delete(cleanEmail);
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    const users = readUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx === -1) {
      return res.status(404).json({ error: 'User record not found' });
    }

    users[idx].password = await bcrypt.hash(newPassword.trim(), 12);
    users[idx].updatedAt = new Date().toISOString();
    writeUsers(users);

    resetCodes.delete(cleanEmail);

    const token = generateToken(users[idx]);

    res.json({
      ok: true,
      message: 'Password reset successfully. You can now log in with your new password.',
      user: sanitizeUser(users[idx]),
      token
    });
  } catch (err) {
    console.error('[Auth Reset Password Error]', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * GET /api/auth/users
 * Real-time customer and gov admin listing for Admin Dashboard
 * Strictly protected: requires valid JWT with Administrator privileges
 */
router.get('/users', verifyToken, requireAdmin, (req, res) => {
  const users = readUsers();
  res.json({
    ok: true,
    total: users.length,
    customersCount: users.filter(u => u.role === 'customer').length,
    govAdminsCount: users.filter(u => u.role === 'admin' || u.role === 'gov_admin').length,
    users: users.map(sanitizeUser)
  });
});

/**
 * POST /api/auth/customer-detail
 * Save or update customer contact, preferences, and saved trips in database
 * Strictly protected: user can only modify their own profile, unless Master Admin
 */
router.post('/customer-detail', verifyToken, (req, res) => {
  const { email, phone, city, preferences, savedTrip } = req.body;
  const targetEmail = (email || req.user.email || '').trim().toLowerCase();
  
  if (!targetEmail) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Authorization check: non-admin cannot alter another user's profile
  if (req.user.role !== 'admin' && req.user.email.toLowerCase() !== targetEmail) {
    return res.status(403).json({ error: 'You are not authorized to update details for another account' });
  }

  const cleanEmail = targetEmail;
  const users = readUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);

  if (idx === -1) {
    return res.status(404).json({ error: 'User not found in database' });
  }

  if (phone) users[idx].phone = phone.trim();
  if (city) users[idx].city = city.trim();
  if (preferences) users[idx].preferences = preferences;
  if (savedTrip) {
    if (!users[idx].savedTrips) users[idx].savedTrips = [];
    users[idx].savedTrips.unshift(savedTrip);
    users[idx].savedTripsCount = users[idx].savedTrips.length;
  }
  users[idx].lastActiveAt = new Date().toISOString();

  writeUsers(users);

  res.json({
    ok: true,
    message: 'Customer details updated in database',
    user: sanitizeUser(users[idx])
  });
});

module.exports = router;
