/**
 * db.js
 * Exports a shared PostgreSQL connection pool.
 * Using a pool (not single connection) is best practice for web apps —
 * it reuses connections, handles concurrency, and auto-reconnects.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep pool small; fine for a moderate-traffic app
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log when a new client connects (helpful during development)
pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📦 New DB client connected');
    console.log('🚨 CONNECTING TO DB:', process.env.DATABASE_URL);
  }
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});

module.exports = pool;
