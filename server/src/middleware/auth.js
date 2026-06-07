const jwt = require('jsonwebtoken');
const { error } = require('../utils/apiResponse');
const { pool } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'No token provided', 401);
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from DB to get role
    const result = await pool.query('SELECT id, role FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return error(res, 'User not found', 401);
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
};

const { authorize } = require('./rbac');

module.exports = {
  authenticate,
  authorize,
};
