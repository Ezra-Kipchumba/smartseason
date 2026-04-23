/**
 * migrate.js  (v2)
 * Creates all database tables from scratch.
 * Safe to re-run: CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS.
 *
 * v2 additions over v1:
 *   fields        → latitude, longitude, expected_yield
 *   field_updates → issue, weather, yield_estimate
 *
 * Run with: node src/utils/migrate.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🌱 Running migrations (v2)...');
    await client.query('BEGIN');

    // ── Users ─────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        email       VARCHAR(150) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        role        VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'agent')),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── Fields ────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS fields (
        id             SERIAL PRIMARY KEY,
        name           VARCHAR(150) NOT NULL,
        crop_type      VARCHAR(100) NOT NULL,
        planting_date  DATE NOT NULL,
        stage          VARCHAR(30) NOT NULL DEFAULT 'planted'
                         CHECK (stage IN ('planted', 'growing', 'ready', 'harvested')),
        location       VARCHAR(255),
        area_hectares  NUMERIC(10,2),
        assigned_to    INT REFERENCES users(id) ON DELETE SET NULL,
        created_by     INT REFERENCES users(id) ON DELETE SET NULL,
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // v2 columns — safe on re-run
    await client.query(`ALTER TABLE fields ADD COLUMN IF NOT EXISTS latitude       NUMERIC(9,6);`);
    await client.query(`ALTER TABLE fields ADD COLUMN IF NOT EXISTS longitude      NUMERIC(9,6);`);
    await client.query(`ALTER TABLE fields ADD COLUMN IF NOT EXISTS expected_yield NUMERIC(10,2);`);

    // ── Field Updates ─────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS field_updates (
        id          SERIAL PRIMARY KEY,
        field_id    INT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
        agent_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        old_stage   VARCHAR(30),
        new_stage   VARCHAR(30),
        notes       TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // v2 columns — safe on re-run
    await client.query(`ALTER TABLE field_updates ADD COLUMN IF NOT EXISTS issue          VARCHAR(100);`);
    await client.query(`ALTER TABLE field_updates ADD COLUMN IF NOT EXISTS weather        VARCHAR(50);`);
    await client.query(`ALTER TABLE field_updates ADD COLUMN IF NOT EXISTS yield_estimate NUMERIC(10,2);`);

    await client.query('COMMIT');
    console.log('✅ Migrations complete (v2).');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

module.exports = { migrate };