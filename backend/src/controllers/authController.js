/**
 * authController.js
 * Handles user registration and login.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../utils/db');

/**
 * POST /api/auth/register
 * Creates a new user. Role defaults to 'agent'; only existing admins
 * can register other admins (enforced in the route).
 */
async function register(req, res) {
  const { name, email, password, role = 'agent' } = req.body;

  try {
    // Check for duplicate email
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    // Hash password — cost factor 10 is a good balance of speed vs security
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name, email, hashed, role]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error during registration.' });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    const user = result.rows[0];

    // Use constant-time comparison to prevent timing attacks
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const { password: _pw, ...safeUser } = user; // strip password from response
    const token = signToken(safeUser);

    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
async function getMe(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = { register, login, getMe };
