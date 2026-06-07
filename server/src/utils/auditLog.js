const { pool } = require('../config/db');

const auditLog = async ({ userId, action, entity, entityId, oldValue, newValue, ipAddress }) => {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, old_value, new_value, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, action, entity, entityId,
     JSON.stringify(oldValue || {}),
     JSON.stringify(newValue || {}),
     ipAddress || null]
  );
};

module.exports = auditLog;
