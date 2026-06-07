const { pool } = require('../../config/db');
const auditLog = require('../../utils/auditLog');

const createReservation = async ({ guestId, date, time, partySize, specialRequests }) => {
  const result = await pool.query(
    `INSERT INTO restaurant_reservations (guest_id, reservation_date, reservation_time, party_size, special_requests, status)
     VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
    [guestId, date, time, partySize, specialRequests]
  );
  return result.rows[0];
};

const getMyReservations = async (guestId) => {
  const result = await pool.query(
    `SELECT * FROM restaurant_reservations 
     WHERE guest_id = $1 
     ORDER BY reservation_date DESC, reservation_time DESC`,
    [guestId]
  );
  return result.rows;
};

const getAllReservations = async ({ date, status, page = 1, limit = 10 }) => {
  let whereClauses = ['1=1'];
  const params = [];

  if (date) {
    params.push(date);
    whereClauses.push(`rr.reservation_date = $${params.length}`);
  }
  if (status) {
    params.push(status);
    whereClauses.push(`rr.status = $${params.length}`);
  }

  const whereString = whereClauses.join(' AND ');

  const countQuery = `SELECT COUNT(*) FROM restaurant_reservations rr WHERE ${whereString}`;
  const totalResult = await pool.query(countQuery, params);
  const total = parseInt(totalResult.rows[0].count, 10);

  let query = `
    SELECT rr.*, u.first_name, u.last_name, u.email, u.phone
    FROM restaurant_reservations rr
    JOIN users u ON rr.guest_id = u.id
    WHERE ${whereString}
    ORDER BY rr.reservation_date DESC, rr.reservation_time DESC
  `;

  const offset = (page - 1) * limit;
  params.push(limit);
  query += ` LIMIT $${params.length}`;
  params.push(offset);
  query += ` OFFSET $${params.length}`;

  const result = await pool.query(query, params);

  return {
    data: result.rows,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit)
  };
};

const updateStatus = async (id, status, staffId, ipAddress) => {
  const result = await pool.query('SELECT status FROM restaurant_reservations WHERE id = $1', [id]);
  const reservation = result.rows[0];
  
  if (!reservation) {
    throw new Error('Restaurant reservation not found');
  }

  const currentStatus = reservation.status;

  const updatedResult = await pool.query(
    `UPDATE restaurant_reservations 
     SET status = $1, updated_at = NOW() 
     WHERE id = $2 RETURNING *`,
    [status, id]
  );

  // Insert audit log
  await auditLog({
    userId: staffId,
    action: 'RESTAURANT_STATUS_CHANGED',
    entity: 'restaurant_reservations',
    entityId: id,
    oldValue: { status: currentStatus },
    newValue: { status },
    ipAddress
  });

  return updatedResult.rows[0];
};

module.exports = {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateStatus
};
