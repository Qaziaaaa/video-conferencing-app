const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'email, password, and displayName are required', code: 'MISSING_FIELDS' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters', code: 'WEAK_PASSWORD' });
    }

    if (displayName.trim().length < 1 || displayName.trim().length > 50) {
      return res.status(400).json({ error: 'displayName must be 1–50 characters', code: 'INVALID_DISPLAY_NAME' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered', code: 'EMAIL_EXISTS' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      displayName: displayName.trim(),
    });

    return res.status(201).json({
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
    });
  } catch (err) {
    console.error('[AUTH] Register error:', err);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required', code: 'MISSING_FIELDS' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, displayName: user.displayName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

module.exports = router;
