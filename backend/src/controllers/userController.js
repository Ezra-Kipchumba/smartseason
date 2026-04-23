/**
 * userController.js
 * Admin-only endpoints for managing agent accounts.
 */

const bcrypt = require('bcryptjs');
const pool = require('../utils/db');

/**
 * GET /api/users
 * Returns all users (admins use this to populate agent dropdown).
 */
async function getUsers(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not retrieve users.' });
  }
}

/**
 * GET /api/users/agents
 * Returns only agents — used when assigning fields.
 */
async function getAgents(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, email,
         (SELECT COUNT(*) FROM fields WHERE assigned_to = users.id) AS field_count
       FROM users WHERE role='agent' ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not retrieve agents.' });
  }
}

/**
 * POST /api/users
 * Admin creates a new user (agent or admin).
 */
async function createUser(req, res) {
  const { name, email, password, role = 'agent' } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1,$2,$3,$4) RETURNING id, name, email, role, created_at`,
      [name, email, hashed, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not create user.' });
  }
}

/**
 * DELETE /api/users/:id
 * Admin deletes a user. Prevents self-deletion.
 */
async function deleteUser(req, res) {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Cannot delete your own account.' });
  }
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id=$1 RETURNING id', [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete user.' });
  }
}

module.exports = { getUsers, getAgents, createUser, deleteUser };
