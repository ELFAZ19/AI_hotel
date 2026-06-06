const { pool } = require('../../config/db');

const getAllReservations = async ({ status, guest_id, date }) => {
  let query = 'SELECT * FROM restaurant_reservations WHERE 1=1';
  const params = [];
  
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  if (guest_id) {
    params.push(guest_id);
    query += ` AND guest_id = $${params.length}`;
  }
  if (date) {
    params.push(date);
    query += ` AND reservation_date = $${params.length}`;
  }
  
  query += ' ORDER BY reservation_date DESC, reservation_time DESC';
  const result = await pool.query(query, params);
  return result.rows;
};

const getReservationById = async (id) => {
  const result = await pool.query('SELECT * FROM restaurant_reservations WHERE id = $1', [id]);
  return result.rows[0];
};

const createReservation = async (data) => {
  const { guest_id, reservation_date, reservation_time, party_size, special_requests } = data;
  const result = await pool.query(
    `INSERT INTO restaurant_reservations (guest_id, reservation_date, reservation_time, party_size, special_requests)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [guest_id, reservation_date, reservation_time, party_size, special_requests]
  );
  return result.rows[0];
};

const updateReservation = async (id, data) => {
  const { status, special_requests, party_size } = data;
  const result = await pool.query(
    `UPDATE restaurant_reservations 
     SET status = COALESCE($1, status),
         special_requests = COALESCE($2, special_requests),
         party_size = COALESCE($3, party_size),
         updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [status, special_requests, party_size, id]
  );
  return result.rows[0];
};

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation
};
