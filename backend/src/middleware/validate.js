/**
 * validate.js (middleware)
 * Reads express-validator errors and returns a 422 if any exist.
 * Place after validation chains in route definitions.
 */

const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

module.exports = validate;
