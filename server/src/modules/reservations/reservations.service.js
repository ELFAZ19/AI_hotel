const { pool } = require('../../config/db');
const roomsService = require('../rooms/rooms.service');
const auditLog = require('../../utils/auditLog');

const createReservation = async ({ guestId, roomId, checkIn, checkOut, adults, children, specialRequests }) => {
  // Verify room exists and is active
  const room = await roomsService.getRoomById(roomId);
  if (!room) {
    throw new Error('Room not found or inactive');
  }

  // Call checkAvailability
  const isAvailable = await roomsService.checkAvailability({ roomId, checkIn, checkOut });
  if (!isAvailable) {
    throw new Error('Room not available for selected dates');
  }

  // Get effective price
  const effectivePrice = Number(room.effective_price);

  // Calculate nights
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  if (nights <= 0) {
    throw new Error('check_out must be after check_in');
  }

  // Calculate totalPrice
  const totalPrice = nights * effectivePrice;

  const result = await pool.query(
    `INSERT INTO reservations (guest_id, room_id, check_in, check_out, adults, children, total_price, special_requests, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
    [guestId, roomId, checkIn, checkOut, adults, children || 0, totalPrice, specialRequests]
  );
  
  return result.rows[0];
};

const getMyReservations = async (guestId) => {
  const query = `
    SELECT res.*, r.room_number, rt.name AS room_type_name, img.url AS primary_image_url
    FROM reservations res
    JOIN rooms r ON res.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    LEFT JOIN room_images img ON r.id = img.room_id AND img.is_primary = true
    WHERE res.guest_id = $1
    ORDER BY res.created_at DESC
  `;
  const result = await pool.query(query, [guestId]);
  return result.rows;
};

const getReservationById = async (id, requestingUser) => {
  const query = `
    SELECT res.*, r.room_number, r.floor, rt.name AS room_type_name, u.first_name, u.last_name, u.email
    FROM reservations res
    JOIN rooms r ON res.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    JOIN users u ON res.guest_id = u.id
    WHERE res.id = $1
  `;
  const result = await pool.query(query, [id]);
  const reservation = result.rows[0];
  
  if (!reservation) return null;

  if (requestingUser.role === 'guest' && reservation.guest_id !== requestingUser.id) {
    throw new Error('Unauthorized access to reservation');
  }

  return reservation;
};

const getAllReservations = async ({ status, check_in_from, check_in_to, room_id, guest_id, page = 1, limit = 10 }) => {
  let whereClauses = ['1=1'];
  const params = [];

  if (status) {
    params.push(status);
    whereClauses.push(`res.status = $${params.length}`);
  }
  if (check_in_from) {
    params.push(check_in_from);
    whereClauses.push(`res.check_in >= $${params.length}`);
  }
  if (check_in_to) {
    params.push(check_in_to);
    whereClauses.push(`res.check_in <= $${params.length}`);
  }
  if (room_id) {
    params.push(room_id);
    whereClauses.push(`res.room_id = $${params.length}`);
  }
  if (guest_id) {
    params.push(guest_id);
    whereClauses.push(`res.guest_id = $${params.length}`);
  }

  const whereString = whereClauses.join(' AND ');

  const countQuery = `SELECT COUNT(*) FROM reservations res WHERE ${whereString}`;
  const totalResult = await pool.query(countQuery, params);
  const total = parseInt(totalResult.rows[0].count, 10);

  let query = `
    SELECT res.*, u.first_name, u.last_name, u.email, r.room_number, rt.name AS room_type_name
    FROM reservations res
    JOIN users u ON res.guest_id = u.id
    JOIN rooms r ON res.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    WHERE ${whereString}
    ORDER BY res.created_at DESC
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

const updateReservationStatus = async (id, status, note, staffId, ipAddress) => {
  const result = await pool.query('SELECT status, room_id FROM reservations WHERE id = $1', [id]);
  const reservation = result.rows[0];
  if (!reservation) throw new Error('Reservation not found');

  const currentStatus = reservation.status;
  
  // Validate transitions
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['checked_in', 'cancelled'],
    'checked_in': ['checked_out']
  };

  if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
  }

  let updateQuery = 'UPDATE reservations SET status = $1, updated_at = NOW()';
  const params = [status];

  if (status === 'confirmed') {
    updateQuery += ', confirmed_at = NOW()';
  } else if (status === 'checked_in') {
    updateQuery += ', checked_in_at = NOW()';
  } else if (status === 'checked_out') {
    updateQuery += ', checked_out_at = NOW()';
  } else if (status === 'cancelled') {
    params.push(note || '');
    updateQuery += `, cancelled_at = NOW(), cancellation_note = $${params.length}`;
  }

  params.push(id);
  updateQuery += ` WHERE id = $${params.length} RETURNING *`;

  const updatedResult = await pool.query(updateQuery, params);
  const updatedReservation = updatedResult.rows[0];

  // Update room status
  if (status === 'checked_in') {
    await roomsService.setRoomStatus(reservation.room_id, 'occupied');
  } else if (status === 'checked_out') {
    await roomsService.setRoomStatus(reservation.room_id, 'available');
  }

  // Insert audit log
  await auditLog({
    userId: staffId,
    action: 'RESERVATION_STATUS_CHANGED',
    entity: 'reservations',
    entityId: id,
    oldValue: { status: currentStatus },
    newValue: { status },
    ipAddress
  });

  return updatedReservation;
};

const cancelReservation = async (id, guestId, note) => {
  const result = await pool.query('SELECT status, guest_id FROM reservations WHERE id = $1', [id]);
  const reservation = result.rows[0];
  
  if (!reservation) throw new Error('Reservation not found');
  
  if (reservation.guest_id !== guestId) {
    throw new Error('Unauthorized to cancel this reservation');
  }

  if (reservation.status !== 'pending' && reservation.status !== 'confirmed') {
    throw new Error('Only pending or confirmed reservations can be cancelled');
  }

  const updatedResult = await pool.query(
    `UPDATE reservations 
     SET status = 'cancelled', cancelled_at = NOW(), cancellation_note = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [note, id]
  );

  return updatedResult.rows[0];
};

module.exports = {
  createReservation,
  getMyReservations,
  getReservationById,
  getAllReservations,
  updateReservationStatus,
  cancelReservation
};
