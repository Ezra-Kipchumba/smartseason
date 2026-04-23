/**
 * fieldRoutes.js
 */

const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  getFields, getField, createField, updateField, deleteField,
  addFieldUpdate, getStats, getFieldWeather,
} = require('../controllers/fieldController');

// All field routes require authentication
router.use(authenticate);

// Stats dashboard endpoint
router.get('/stats', getStats);

// Field listing & single field — both roles
router.get('/', getFields);
// ✅ ADD THIS BEFORE router.get('/:id', getField);
router.get('/map', async (req, res) => {
  try {
    const db = require('../utils/db'); // adjust if your path differs

    const result = await db.query(`
      SELECT 
        id,
        name,
        crop_type,
        stage,
        area_hectares,
        latitude,
        longitude
      FROM fields
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('🔥 MAP ERROR FULL:', err);       // full error
    console.error('🔥 MESSAGE:', err.message);      // message only
    res.status(500).json({ message: 'Could not retrieve fields.' });
  }
});
router.get('/:id', getField);

// Field weather endpoint
router.get('/:id/weather', getFieldWeather);

// Field creation & full update — admin only
router.post('/', requireAdmin, createField);
router.put('/:id', requireAdmin, updateField);
router.delete('/:id', requireAdmin, deleteField);

// Field update (stage + notes) — any authenticated user (agent restricted by controller)
router.post('/:id/updates', addFieldUpdate);

module.exports = router;
