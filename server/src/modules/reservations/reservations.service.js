const { pool } = require('../../config/db');

const getAllReservations = async ({ status, guest_id }) => {
  let query = 'SELECT * FROM reservations WHERE 1=1';
  const params = [];
  
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  if (guest_id) {
    params.push(guest_id);
    query += ` AND guest_id = $${params.length}`;
  }
  
  query += ' ORDER BY created_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
};

const getReservationById = async (id) => {
  const result = await pool.query('SELECT * FROM reservations WHERE id = $1', [id]);
  return result.rows[0];
};

const createReservation = async (data) => {
  const { guest_id, room_id, check_in, check_out, adults, children, total_price, special_requests } = data;
  const result = await pool.query(
    `INSERT INTO reservations (guest_id, room_id, check_in, check_out, adults, children, total_price, special_requests)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [guest_id, room_id, check_in, check_out, adults, children || 0, total_price, special_requests]
  );
  return result.rows[0];
};

const updateReservation = async (id, data) => {
  const { status, cancellation_note } = data;
  
  let query = 'UPDATE reservations SET status = COALESCE($1, status), updated_at = NOW()';
  const params = [status];
  
  if (status === 'confirmed') {
    query += ', confirmed_at = COALESCE(confirmed_at, NOW())';
  } else if (status === 'checked_in') {
    query += ', checked_in_at = COALESCE(checked_in_at, NOW())';
  } else if (status === 'checked_out') {
    query += ', checked_out_at = COALESCE(checked_out_at, NOW())';
  } else if (status === 'cancelled') {
    params.push(cancellation_note);
    query += `, cancelled_at = COALESCE(cancelled_at, NOW()), cancellation_note = $${params.length}`;
  }
  
  params.push(id);
  query += ` WHERE id = $${params.length} RETURNING *`;
  
  const result = await pool.query(query, params);
  return result.rows[0];
};

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation
};
