require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const crops = ['Maize', 'Beans', 'Wheat', 'Sorghum', 'Sunflower'];
const locations = ['Kiambu', 'Thika', 'Ruiru', 'Limuru', 'Naivasha'];

const weatherOptions = ['Sunny', 'Rainy', 'Dry', 'Cloudy'];
const issues = ['Pests', 'Drought', 'Flooding', 'Disease', null];

const stageFlow = ['planted', 'growing', 'ready', 'harvested'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const randomCoord = (base, variance = 0.2) =>
  base + (Math.random() - 0.5) * variance;

// Kenya-ish center
const BASE_LAT = -1.286389;
const BASE_LNG = 36.817223;

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding PRO dataset...');
    await client.query('BEGIN');

    await client.query('DELETE FROM field_updates');
    await client.query('DELETE FROM fields');
    await client.query('DELETE FROM users');

    const password = await bcrypt.hash('password123', 10);

    const admin = await client.query(
      `INSERT INTO users (name,email,password,role)
       VALUES ($1,$2,$3,'admin') RETURNING id`,
      ['Alice Coordinator', 'admin@smartseason.com', password]
    );

    const agent1 = await client.query(
      `INSERT INTO users (name,email,password,role)
       VALUES ($1,$2,$3,'agent') RETURNING id`,
      ['Bob Agent', 'agent1@smartseason.com', password]
    );

    const agent2 = await client.query(
      `INSERT INTO users (name,email,password,role)
       VALUES ($1,$2,$3,'agent') RETURNING id`,
      ['Carol Agent', 'agent2@smartseason.com', password]
    );

    const adminId = admin.rows[0].id;
    const agent1Id = agent1.rows[0].id;
    const agent2Id = agent2.rows[0].id;

    const fields = [];

    // 🔥 Create MANY fields (stress test)
    const FIELD_COUNT = 120;

    for (let i = 0; i < FIELD_COUNT; i++) {
      const plantingDate = randomDate(daysAgo(200), daysAgo(5));
      const expectedYield = (Math.random() * 5 + 1).toFixed(2);

      const res = await client.query(
        `INSERT INTO fields
        (name, crop_type, planting_date, stage, location, area_hectares,
         assigned_to, created_by, latitude, longitude, expected_yield)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id`,
        [
          `Field ${i + 1}`,
          randomItem(crops),
          plantingDate,
          'planted',
          randomItem(locations),
          (Math.random() * 10 + 1).toFixed(1),
          i % 2 === 0 ? agent1Id : agent2Id,
          adminId,
          randomCoord(BASE_LAT),
          randomCoord(BASE_LNG),
          expectedYield
        ]
      );

      fields.push({ id: res.rows[0].id, plantingDate, expectedYield });
    }

    // 📈 Updates with realism
    for (const field of fields) {
      let stageIndex = 0;
      let updateDate = new Date(field.plantingDate);

      const updates = Math.floor(Math.random() * 4) + 3; // 3–6 updates

      for (let i = 0; i < updates; i++) {
        const nextStage = Math.min(stageIndex + 1, stageFlow.length - 1);

        updateDate.setDate(updateDate.getDate() + Math.random() * 15 + 5);

        const yieldEstimate =
          stageIndex >= 2
            ? (Math.random() * 4 + 1).toFixed(2)
            : null;

        await client.query(
          `INSERT INTO field_updates
          (field_id, agent_id, old_stage, new_stage, notes, created_at, issue, weather, yield_estimate)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            field.id,
            Math.random() > 0.5 ? agent1Id : agent2Id,
            stageFlow[stageIndex],
            stageFlow[nextStage],
            generateNote(stageFlow[stageIndex], stageFlow[nextStage]),
            new Date(updateDate),
            randomItem(issues),
            randomItem(weatherOptions),
            yieldEstimate
          ]
        );

        stageIndex = nextStage;

        if (stageIndex === stageFlow.length - 1) break;
      }
    }

    await client.query('COMMIT');
    console.log('✅ PRO Seed complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

function generateNote(oldStage, newStage) {
  return `Transition: ${oldStage} → ${newStage}. Conditions monitored.`;
}

module.exports = { seed };
