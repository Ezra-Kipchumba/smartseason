/**
 * index.js
 * Entry point for the SmartSeason backend API.
 * Sets up Express, middleware, routes, and starts the server.
 */

require('dotenv').config(); // Load .env variables first
const express = require('express');
const cors = require('cors');

const authRoutes  = require('./routes/authRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const userRoutes  = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const { migrate } = require('./utils/migrate');
const { seed } = require('./utils/seed');

(async () => {
  if (process.env.RUN_MIGRATIONS === 'true') {
    console.log('🚀 Running remote migrations...');
    await migrate();
    await seed();
    console.log('✅ Done. Disable RUN_MIGRATIONS now.');
  }
})();

// ── Global Middleware ─────────────────────────────────────────────────────────

// CORS — allow requests from the React frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/auth',   authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/users',  userRoutes);

// Health check — useful for deployment platforms (Railway, Render, etc.)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/', (_req, res) => {
  res.json({
    name: 'SmartSeason API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      fields: '/api/fields'
    }
  });
});
// 404 fallback for unknown API routes
app.use('*', (_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 SmartSeason API running on port ${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
});
