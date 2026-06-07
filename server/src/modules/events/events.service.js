const { pool } = require('../../config/db');

const getAllEventSpaces = async () => {
  const result = await pool.query('SELECT * FROM event_spaces WHERE is_active = true ORDER BY name ASC');
  return result.rows;
};

const getEventSpaceById = async (id) => {
  const result = await pool.query('SELECT * FROM event_spaces WHERE id = $1', [id]);
  return result.rows[0];
};

const createEventSpace = async (data) => {
  const { name, capacity, price_per_hour, amenities, is_active } = data;
  const result = await pool.query(
    `INSERT INTO event_spaces (name, capacity, price_per_hour, amenities, is_active)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, capacity, price_per_hour, amenities ? JSON.stringify(amenities) : '[]', is_active !== undefined ? is_active : true]
  );
  return result.rows[0];
};

const VALID_EVENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const getAllEventBookings = async ({ status, guest_id, event_date }) => {
  // Validate status against the event_status enum before hitting the DB
  if (status !== undefined && status !== null && status !== '') {
    if (!VALID_EVENT_STATUSES.includes(status)) {
      const err = new Error(`Invalid status value "${status}". Must be one of: ${VALID_EVENT_STATUSES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
  }

  let query = 'SELECT * FROM event_bookings WHERE 1=1';
  const params = [];
  
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  if (guest_id) {
    params.push(guest_id);
    query += ` AND guest_id = $${params.length}`;
  }
  if (event_date) {
    params.push(event_date);
    query += ` AND event_date = $${params.length}`;
  }
  
  query += ' ORDER BY event_date DESC, start_time DESC';
  const result = await pool.query(query, params);
  return result.rows;
};

const getEventBookingById = async (id) => {
  const result = await pool.query(`
    SELECT eb.*, es.name as space_name 
    FROM event_bookings eb
    JOIN event_spaces es ON eb.space_id = es.id
    WHERE eb.id = $1
  `, [id]);
  return result.rows[0];
};

const createEventBooking = async (data) => {
  const { guest_id, space_id, event_name, event_type, event_date, start_time, end_time, guest_count, total_price, notes } = data;
  const result = await pool.query(
    `INSERT INTO event_bookings (guest_id, space_id, event_name, event_type, event_date, start_time, end_time, guest_count, total_price, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [guest_id, space_id, event_name, event_type, event_date, start_time, end_time, guest_count, total_price, notes]
  );
  return result.rows[0];
};

const updateEventBooking = async (id, data) => {
  const { status, notes } = data;
  const result = await pool.query(
    `UPDATE event_bookings 
     SET status = COALESCE($1, status),
         notes = COALESCE($2, notes),
         updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [status, notes, id]
  );
  return result.rows[0];
};

module.exports = {
  getAllEventSpaces,
  getEventSpaceById,
  createEventSpace,
  getAllEventBookings,
  getEventBookingById,
  createEventBooking,
  updateEventBooking
};
