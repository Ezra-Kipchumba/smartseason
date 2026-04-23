/**
 * db.js
 * PostgreSQL connection pool (Render-ready with SSL support)
 */

const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // ✅ Required for Render / hosted Postgres
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // slightly higher for cloud DB
});

// Log when a new client connects (dev only)
pool.on('connect', () => {
  if (!isProduction) {
    console.log('📦 New DB client connected');
    console.log('🚨 CONNECTING TO DB:', process.env.DATABASE_URL);
  }
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});

module.exports = pool;