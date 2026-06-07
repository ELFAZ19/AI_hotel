/**
 * rooms.validation.js
 * Input validation middleware for the rooms module.
 * Uses plain JS validation (no external library dependency).
 */

const VALID_ROOM_STATUSES = ['available', 'occupied', 'maintenance', 'inactive'];

/**
 * Validate body for POST /api/rooms/types
 */
const validateCreateRoomType = (req, res, next) => {
  const { name, base_price, max_guests } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }
  if (base_price === undefined || base_price === null) {
    errors.push('base_price is required');
  } else if (isNaN(Number(base_price)) || Number(base_price) < 0) {
    errors.push('base_price must be a non-negative number');
  }
  if (max_guests !== undefined && (isNaN(Number(max_guests)) || Number(max_guests) < 1)) {
    errors.push('max_guests must be a positive integer');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

/**
 * Validate body for POST /api/rooms
 */
const validateCreateRoom = (req, res, next) => {
  const { room_number, room_type_id, floor, status } = req.body;
  const errors = [];

  if (!room_number || typeof room_number !== 'string' || room_number.trim() === '') {
    errors.push('room_number is required');
  }
  if (!room_type_id || isNaN(Number(room_type_id))) {
    errors.push('room_type_id is required and must be a valid integer');
  }
  if (floor === undefined || floor === null || isNaN(Number(floor))) {
    errors.push('floor is required and must be a number');
  }
  if (status !== undefined && !VALID_ROOM_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_ROOM_STATUSES.join(', ')}`);
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

/**
 * Validate body for PUT /api/rooms/:id
 */
const validateUpdateRoom = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  if (status !== undefined && !VALID_ROOM_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_ROOM_STATUSES.join(', ')}`);
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

/**
 * Validate query params for GET /api/rooms
 */
const validateGetRooms = (req, res, next) => {
  const { status } = req.query;

  if (status !== undefined && !VALID_ROOM_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status "${status}". Must be one of: ${VALID_ROOM_STATUSES.join(', ')}`,
    });
  }
  next();
};

module.exports = {
  validateCreateRoomType,
  validateCreateRoom,
  validateUpdateRoom,
  validateGetRooms,
};
