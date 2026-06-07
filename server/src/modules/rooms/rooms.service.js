const { pool } = require('../../config/db');
const { deleteImage } = require('../../middleware/upload');

// ---------- Helper ----------
const getPrimaryImageUrl = (images) => {
  const primary = images.find((img) => img.is_primary);
  return primary ? primary.url : null;
};

// ---------- Room Types ----------
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

// ---------- Rooms ----------
const getAllRooms = async ({ status, type, floor }) => {
  let query = `
    SELECT r.*, rt.name AS room_type_name, rt.base_price, rt.amenities,
           COALESCE(r.price_override, rt.base_price) AS effective_price,
           img.url AS primary_image_url
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    LEFT JOIN room_images img ON r.id = img.room_id AND img.is_primary = true
    WHERE r.is_active = true
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
  if (floor) {
    params.push(floor);
    query += ` AND r.floor = $${params.length}`;
  }
  query += ' ORDER BY r.room_number ASC';
  const result = await pool.query(query, params);
  return result.rows;
};

const getRoomById = async (id) => {
  const roomResult = await pool.query(
    `SELECT r.*, rt.name AS room_type_name, rt.base_price, rt.amenities,
            COALESCE(r.price_override, rt.base_price) AS effective_price
     FROM rooms r
     JOIN room_types rt ON r.room_type_id = rt.id
     WHERE r.id = $1 AND r.is_active = true`,
    [id]
  );
  const room = roomResult.rows[0];
  if (!room) return null;
  const imagesResult = await pool.query(
    `SELECT id, url, public_id, is_primary FROM room_images WHERE room_id = $1 ORDER BY id ASC`,
    [id]
  );
  room.images = imagesResult.rows;
  return room;
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

const deleteRoom = async (id) => {
  const result = await pool.query(
    `UPDATE rooms SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

// ---------- Availability ----------
const checkAvailability = async ({ roomId, checkIn, checkOut }) => {
  const result = await pool.query(
    `SELECT 1 FROM reservations WHERE room_id = $1
     AND status NOT IN ('cancelled', 'checked_out', 'no_show')
     AND check_in < $3 AND check_out > $2 LIMIT 1`,
    [roomId, checkIn, checkOut]
  );
  return result.rowCount === 0;
};

const getAvailableRooms = async ({ checkIn, checkOut, guests, roomTypeId }) => {
  // Base query for active rooms
  let query = `
    SELECT r.*, rt.base_price, rt.name AS room_type_name,
           COALESCE(r.price_override, rt.base_price) AS effective_price,
           img.url AS primary_image_url
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    LEFT JOIN room_images img ON r.id = img.room_id AND img.is_primary = true
    WHERE r.is_active = true
  `;
  const params = [];
  if (guests) {
    params.push(guests);
    query += ` AND rt.max_guests >= $${params.length}`;
  }
  if (roomTypeId) {
    params.push(roomTypeId);
    query += ` AND r.room_type_id = $${params.length}`;
  }
  // Exclude rooms with conflicting reservations
  query += ` AND r.id NOT IN (
    SELECT room_id FROM reservations
    WHERE status NOT IN ('cancelled', 'checked_out', 'no_show')
      AND check_in < $${params.length + 2} AND check_out > $${params.length + 1}
  )`;
  params.push(checkIn, checkOut);
  query += ' ORDER BY r.room_number ASC';
  const result = await pool.query(query, params);
  return result.rows;
};

// ---------- Images ----------
const addRoomImages = async (roomId, files) => {
  // files: array of multer file objects, each has path, filename, etc.
  const inserted = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const url = file.path; // Cloudinary storage returns URL in path
    const publicId = file.filename; // Cloudinary public_id
    const isPrimary = i === 0; // first image is primary
    const result = await pool.query(
      `INSERT INTO room_images (room_id, url, public_id, is_primary)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [roomId, url, publicId, isPrimary]
    );
    inserted.push(result.rows[0]);
    // If this is the first image, ensure other images are not primary
    if (isPrimary) {
      await pool.query(`UPDATE room_images SET is_primary = FALSE WHERE room_id = $1 AND id <> $2`, [roomId, result.rows[0].id]);
    }
  }
  return inserted;
};

const deleteRoomImage = async (imageId, publicId) => {
  // Remove from DB
  await pool.query('DELETE FROM room_images WHERE id = $1', [imageId]);
  // Delete from Cloudinary
  if (publicId) {
    await deleteImage(publicId);
  }
  return true;
};

const setRoomStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE rooms SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0];
};

module.exports = {
  // Room Types
  getAllRoomTypes,
  getRoomTypeById,
  createRoomType,
  // Rooms
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  // Availability
  checkAvailability,
  getAvailableRooms,
  // Images
  addRoomImages,
  deleteRoomImage,
  // Status
  setRoomStatus,
};

