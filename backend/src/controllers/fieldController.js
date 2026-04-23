/**
 * fieldController.js
 * CRUD operations for fields and field updates.
 * Admins see all fields; agents see only their assigned fields.
 */

const { generateInsights } = require('../utils/insightEngine');
const pool = require('../utils/db');
const { computeStatus } = require('../utils/statusLogic');
const { getWeather } = require('../services/weatherService');


// ── Helpers ───────────────────────────────────────────────────────────────────

/** Attach computed status to each field row */
function withStatus(fields) {
  return fields.map(f => ({ ...f, status: computeStatus(f) }));
}

// ── Field CRUD ────────────────────────────────────────────────────────────────

/**
 * GET /api/fields
 * Admin → all fields with agent info
 * Agent → only their assigned fields
 */
async function getFields(req, res) {
  try {
    const { role, id } = req.user;

    const baseQuery = `
      SELECT
        f.*,
        u.name  AS agent_name,
        u.email AS agent_email
      FROM fields f
      LEFT JOIN users u ON u.id = f.assigned_to
    `;

    let result;
    if (role === 'admin') {
      result = await pool.query(baseQuery + ' ORDER BY f.created_at DESC');
    } else {
      result = await pool.query(
        baseQuery + ' WHERE f.assigned_to = $1 ORDER BY f.created_at DESC',
        [id]
      );
    }

    res.json(withStatus(result.rows));
  } catch (err) {
    console.error('getFields error:', err.message);
    res.status(500).json({ message: 'Could not retrieve fields.' });
  }
}

/**
 * GET /api/fields/:id
 * Returns a single field (with status + full update history).
 * Agents are restricted to their own fields.
 */
async function getField(req, res) {
  try {
    const { role, id: userId } = req.user;
    const { id } = req.params;

    const fieldRes = await pool.query(
      `SELECT f.*, u.name AS agent_name, u.email AS agent_email
       FROM fields f LEFT JOIN users u ON u.id = f.assigned_to
       WHERE f.id = $1`,
      [id]
    );
    if (!fieldRes.rows.length) {
      return res.status(404).json({ message: 'Field not found.' });
    }
    const field = fieldRes.rows[0];

    // Agents can only view their own fields
    if (role === 'agent' && field.assigned_to !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Fetch full update history for this field
    const updatesRes = await pool.query(
      `SELECT fu.*, u.name AS agent_name
       FROM field_updates fu
       JOIN users u ON u.id = fu.agent_id
       WHERE fu.field_id = $1
       ORDER BY fu.created_at DESC`,
      [id]
    );

    res.json({ ...field, status: computeStatus(field), updates: updatesRes.rows });
  } catch (err) {
    console.error('getField error:', err.message);
    res.status(500).json({ message: 'Could not retrieve field.' });
  }
}


/**
 * Get weather for a field's location (if lat/lng provided).
 * GET /api/fields/:id/weather
 * Agents can only access their own fields.
 */

async function getFieldWeather(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT name, latitude, longitude FROM fields WHERE id=$1',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Field not found.' });
    }

    const field = result.rows[0];

    if (!field.latitude || !field.longitude) {
      return res.status(400).json({
        message: 'Field has no coordinates.'
      });
    }

    const weather = await getWeather(field.latitude, field.longitude);
    const insights = generateInsights(field, weather);

    res.json({
      field: field.name,
      weather,
      insights
    });

  } catch (err) {
    console.error('getFieldWeather error:', err.message);
    res.status(500).json({ message: 'Could not retrieve weather.' });
  }
}


/**
 * POST /api/fields  (Admin only)
 */
async function createField(req, res) {
  const {
    name,
    crop_type,
    planting_date,
    stage = 'planted',
    location,
    area_hectares,
    assigned_to,
    latitude,
    longitude,
    expected_yield
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO fields (
        name, crop_type, planting_date, stage,
        location, area_hectares, assigned_to,
        latitude, longitude, expected_yield,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        name,
        crop_type,
        planting_date,
        stage,
        location,
        area_hectares || null,
        assigned_to || null,
        latitude || null,
        longitude || null,
        expected_yield || null,
        req.user.id
      ]
    );

    const field = result.rows[0];
    res.status(201).json({ ...field, status: computeStatus(field) });

  } catch (err) {
    console.error('createField error:', err.message);
    res.status(500).json({ message: 'Could not create field.' });
  }
}

/**
 * PUT /api/fields/:id  (Admin only)
 * Full update of field metadata.
 */
async function updateField(req, res) {
  const { id } = req.params;

  const {
    name,
    crop_type,
    planting_date,
    stage,
    location,
    area_hectares,
    assigned_to,
    latitude,
    longitude,
    expected_yield
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE fields SET
        name=$1,
        crop_type=$2,
        planting_date=$3,
        stage=$4,
        location=$5,
        area_hectares=$6,
        assigned_to=$7,
        latitude=$8,
        longitude=$9,
        expected_yield=$10,
        updated_at=NOW()
      WHERE id=$11
      RETURNING *`,
      [
        name,
        crop_type,
        planting_date,
        stage,
        location,
        area_hectares || null,
        assigned_to || null,
        latitude || null,
        longitude || null,
        expected_yield || null,
        id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Field not found.' });
    }

    const field = result.rows[0];
    res.json({ ...field, status: computeStatus(field) });

  } catch (err) {
    console.error('updateField error:', err.message);
    res.status(500).json({ message: 'Could not update field.' });
  }
}

/**
 * DELETE /api/fields/:id  (Admin only)
 */
async function deleteField(req, res) {
  try {
    const result = await pool.query(
      'DELETE FROM fields WHERE id=$1 RETURNING id', [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Field not found.' });
    res.json({ message: 'Field deleted.' });
  } catch (err) {
    console.error('deleteField error:', err.message);
    res.status(500).json({ message: 'Could not delete field.' });
  }
}

// ── Field Updates (stage + notes) ────────────────────────────────────────────

/**
 * POST /api/fields/:id/updates
 * Agents update the stage and/or add observations for their assigned field.
 */
async function addFieldUpdate(req, res) {
  const { id } = req.params;
  const { new_stage, notes } = req.body;
  const agentId = req.user.id;

  try {
    // Fetch current field to validate ownership and get old stage
    const fieldRes = await pool.query('SELECT * FROM fields WHERE id=$1', [id]);
    if (!fieldRes.rows.length) return res.status(404).json({ message: 'Field not found.' });

    const field = fieldRes.rows[0];

    // Agents can only update their own assigned fields
    if (req.user.role === 'agent' && field.assigned_to !== agentId) {
      return res.status(403).json({ message: 'You are not assigned to this field.' });
    }

    const oldStage = field.stage;
    const stageToSet = new_stage || oldStage; // keep old stage if not changing

    // Update the field stage if a new stage was provided
    if (new_stage && new_stage !== oldStage) {
      await pool.query(
        'UPDATE fields SET stage=$1, updated_at=NOW() WHERE id=$2',
        [new_stage, id]
      );
    }

    // Always record the update log entry
    const updateRes = await pool.query(
      `INSERT INTO field_updates (field_id, agent_id, old_stage, new_stage, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, agentId, oldStage, stageToSet, notes || null]
    );

    res.status(201).json(updateRes.rows[0]);
  } catch (err) {
    console.error('addFieldUpdate error:', err.message);
    res.status(500).json({ message: 'Could not add field update.' });
  }
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

/**
 * GET /api/fields/stats
 * Returns aggregate stats for the dashboard.
 */
async function getStats(req, res) {
  try {
    const { role, id } = req.user;
    const whereClause = role === 'admin' ? '' : 'WHERE f.assigned_to = $1';
    const params = role === 'admin' ? [] : [id];

    // Count by stage
    const stageRes = await pool.query(
      `SELECT stage, COUNT(*) AS count
       FROM fields f ${whereClause}
       GROUP BY stage`,
      params
    );

    // All fields to compute status breakdown
    const fieldsRes = await pool.query(
      `SELECT stage, planting_date FROM fields f ${whereClause}`,
      params
    );

    const statusCounts = { Active: 0, 'At Risk': 0, Completed: 0 };
    fieldsRes.rows.forEach(f => {
      statusCounts[computeStatus(f)]++;
    });

    // Recent activity (last 5 updates)
    const recentRes = await pool.query(
      `SELECT fu.*, f.name AS field_name, u.name AS agent_name
       FROM field_updates fu
       JOIN fields f ON f.id = fu.field_id
       JOIN users u ON u.id = fu.agent_id
       ${role === 'agent' ? 'WHERE f.assigned_to = $1' : ''}
       ORDER BY fu.created_at DESC LIMIT 5`,
      params
    );

    res.json({
      total: fieldsRes.rows.length,
      byStage: stageRes.rows,
      byStatus: statusCounts,
      recentActivity: recentRes.rows,
    });
  } catch (err) {
    console.error('getStats error:', err.message);
    res.status(500).json({ message: 'Could not load stats.' });
  }
}

module.exports = {
  getFields, getField, createField, updateField, deleteField,
  addFieldUpdate, getStats,
  getFieldWeather,
};
