/**
 * auth.js (middleware)
 * Verifies the JWT on protected routes and attaches the decoded
 * user payload to req.user for use in controllers.
 */

const jwt = require('jsonwebtoken');

/**
 * Protects any route. Must be used before role guards.
 */
function authenticate(req, res, next) {
  // Token arrives as: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

/**
 * Role guard — restrict route to admins only.
 * Must be called AFTER authenticate().
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
