const { pool } = require('../../config/db');
const { deleteImage } = require('../../middleware/upload');

const TYPE_DEFAULT_IMAGES = {
  1: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop',
  2: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200&auto=format&fit=crop',
  3: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop',
  4: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200&auto=format&fit=crop',
};

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
  return result.rows.map((r) => ({
    ...r,
    primary_image_url: r.primary_image_url || TYPE_DEFAULT_IMAGES[r.room_type_id] || TYPE_DEFAULT_IMAGES[1],
  }));
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
  if (!room.images || room.images.length === 0) {
    const defaultUrl = TYPE_DEFAULT_IMAGES[room.room_type_id] || TYPE_DEFAULT_IMAGES[1];
    room.images = [{ id: 'default', url: defaultUrl, is_primary: true }];
  }
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
  // Exclude 'pending' reservations older than 15 minutes (unpaid/abandoned),
  // as well as terminal statuses. This prevents stale unpaid reservations from
  // permanently blocking a room.
  const result = await pool.query(
    `SELECT 1 FROM reservations WHERE room_id = $1
     AND status NOT IN ('cancelled', 'checked_out', 'no_show')
     AND NOT (status = 'pending' AND created_at < NOW() - INTERVAL '15 minutes')
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
  // Exclude rooms with conflicting reservations (excluding expired pending reservations)
  query += ` AND r.id NOT IN (
    SELECT room_id FROM reservations
    WHERE status NOT IN ('cancelled', 'checked_out', 'no_show')
      AND NOT (status = 'pending' AND created_at < NOW() - INTERVAL '15 minutes')
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

// ---------- Room Summary (grouped by type) ----------
const getRoomSummary = async ({ checkIn, checkOut, guests }) => {
  // 1. Get all room types
  const typesResult = await pool.query('SELECT * FROM room_types ORDER BY base_price ASC');
  const roomTypes = typesResult.rows;

  const summary = [];

  for (const type of roomTypes) {
    // Skip types that don't fit the guest requirement
    if (guests && type.max_guests < Number(guests)) continue;

    // 2. Get all active rooms of this type
    const roomsResult = await pool.query(
      `SELECT r.*, 
              COALESCE(r.price_override, $2) AS effective_price,
              img.url AS primary_image_url
       FROM rooms r
       LEFT JOIN room_images img ON r.id = img.room_id AND img.is_primary = true
       WHERE r.room_type_id = $1 AND r.is_active = true
       ORDER BY r.room_number ASC`,
      [type.id, type.base_price]
    );

    const totalRooms = roomsResult.rows;
    const totalCount = totalRooms.length;

    if (totalCount === 0) continue; // No rooms of this type exist

    let availableRooms;

    if (checkIn && checkOut) {
      // 3. Find which rooms have conflicting reservations (excluding expired pending)
      const bookedResult = await pool.query(
        `SELECT DISTINCT room_id FROM reservations
         WHERE status NOT IN ('cancelled', 'checked_out', 'no_show')
           AND NOT (status = 'pending' AND created_at < NOW() - INTERVAL '15 minutes')
           AND check_in < $2 AND check_out > $1
           AND room_id IN (SELECT id FROM rooms WHERE room_type_id = $3 AND is_active = true)`,
        [checkIn, checkOut, type.id]
      );
      const bookedRoomIds = new Set(bookedResult.rows.map(r => r.room_id));
      availableRooms = totalRooms.filter(r => !bookedRoomIds.has(r.id));
    } else {
      // No date filter: show all non-maintenance rooms as "available"
      availableRooms = totalRooms.filter(r => r.status === 'available');
    }

    const availableCount = availableRooms.length;

    // Pick a representative room (first available, or first overall if none available)
    const representativeRoom = availableRooms[0] || totalRooms[0];

    // Parse amenities
    let amenities = type.amenities;
    if (typeof amenities === 'string') {
      try { amenities = JSON.parse(amenities); } catch { amenities = []; }
    }

    summary.push({
      room_type_id: type.id,
      room_type_name: type.name,
      description: type.description,
      base_price: type.base_price,
      max_guests: type.max_guests,
      amenities: amenities || [],
      total_count: totalCount,
      available_count: availableCount,
      representative_room: {
        id: representativeRoom.id,
        room_number: representativeRoom.room_number,
        floor: representativeRoom.floor,
        effective_price: Number(representativeRoom.effective_price),
        primary_image_url: representativeRoom.primary_image_url || TYPE_DEFAULT_IMAGES[type.id] || TYPE_DEFAULT_IMAGES[1],
        status: representativeRoom.status,
      },
    });
  }

  return summary;
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
  // Summary
  getRoomSummary,
};

