/**
 * userRoutes.js
 * All user management is admin-only.
 */

const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getUsers, getAgents, createUser, deleteUser } = require('../controllers/userController');

router.use(authenticate, requireAdmin);

router.get('/', getUsers);
router.get('/agents', getAgents);
router.post('/', createUser);
router.delete('/:id', deleteUser);

module.exports = router;
