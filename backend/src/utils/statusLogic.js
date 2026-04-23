/**
 * statusLogic.js
 * Computes a field's derived status from its data.
 *
 * STATUS RULES:
 * ─────────────────────────────────────────────────────────────────
 * "Completed"  → stage is 'harvested'
 * "At Risk"    → stage is 'ready' but planting date was > 120 days
 *                ago (overdue for harvest) — OR stage is 'growing'
 *                but planting date was > 90 days ago (slow growth)
 * "Active"     → everything else (field progressing normally)
 * ─────────────────────────────────────────────────────────────────
 *
 * This keeps the logic simple and rule-based, which is transparent
 * and easy to extend with sensor data or weather signals later.
 */

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * @param {Object} field - A field row from the database
 * @param {string} field.stage
 * @param {string|Date} field.planting_date
 * @returns {'Completed'|'At Risk'|'Active'}
 */
function computeStatus(field) {
  const { stage, planting_date } = field;

  if (stage === 'harvested') return 'Completed';

  const daysSincePlanting = Math.floor(
    (Date.now() - new Date(planting_date).getTime()) / DAY_MS
  );

  if (stage === 'ready' && daysSincePlanting > 120) return 'At Risk';
  if (stage === 'growing' && daysSincePlanting > 90) return 'At Risk';

  return 'Active';
}

module.exports = { computeStatus };
