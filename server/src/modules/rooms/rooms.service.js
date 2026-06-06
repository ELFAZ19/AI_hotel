const { pool } = require('../../config/db');

const getAllRoomTypes = async () => {
  const result = await pool.query('SELECT * FROM room_types ORDER BY base_price ASC');
  return result.rows;
};

const getRoomTypeById = async (id) => {
  const result = await pool.query('SELECT * FROM room_types WHERE id = $1', [id]);
  return result.rows[0];
};

const createRoomType = async (data) => {
  const { name, description, base_price, max_guests, amenities } = data;
  const result = await pool.query(
    `INSERT INTO room_types (name, description, base_price, max_guests, amenities)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, description, base_price, max_guests, amenities ? JSON.stringify(amenities) : '[]']
  );
  return result.rows[0];
};

const getAllRooms = async ({ status, type }) => {
  let query = `
    SELECT r.*, rt.name as room_type_name, rt.base_price as room_type_price
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    params.push(status);
    query += ` AND r.status = $${params.length}`;
  }
  if (type) {
    params.push(type);
    query += ` AND r.room_type_id = $${params.length}`;
  }
  
  query += ' ORDER BY r.room_number ASC';
  const result = await pool.query(query, params);
  return result.rows;
};

const getRoomById = async (id) => {
  const result = await pool.query(`
    SELECT r.*, rt.name as room_type_name, rt.base_price, rt.amenities
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    WHERE r.id = $1
  `, [id]);
  return result.rows[0];
};

const createRoom = async (data) => {
  const { room_number, room_type_id, floor, status, price_override, description, is_active } = data;
  const result = await pool.query(
    `INSERT INTO rooms (room_number, room_type_id, floor, status, price_override, description, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [room_number, room_type_id, floor, status || 'available', price_override, description, is_active !== undefined ? is_active : true]
  );
  return result.rows[0];
};

const updateRoom = async (id, data) => {
  const { status, price_override, description, is_active } = data;
  const result = await pool.query(
    `UPDATE rooms 
     SET status = COALESCE($1, status), 
         price_override = COALESCE($2, price_override), 
         description = COALESCE($3, description), 
         is_active = COALESCE($4, is_active), 
         updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [status, price_override, description, is_active, id]
  );
  return result.rows[0];
};

module.exports = {
  getAllRoomTypes,
  getRoomTypeById,
  createRoomType,
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom
};
