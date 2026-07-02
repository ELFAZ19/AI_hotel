/**
 * reservations.validation.js
 * Input validation middleware for the reservations module.
 */

const VALID_RESERVATION_STATUSES = [
  'pending',
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
  'no_show',
];

const isValidDate = (str) => !isNaN(Date.parse(str));
const isValidUUID = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Validate query params for GET /api/reservations
 */
const validateGetReservations = (req, res, next) => {
  const { status, guest_id } = req.query;
  const errors = [];

  if (status !== undefined && status !== '' && !VALID_RESERVATION_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_RESERVATION_STATUSES.join(', ')}`);
  }
  if (guest_id !== undefined && !isValidUUID(guest_id)) {
    errors.push('guest_id must be a valid UUID');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

/**
 * Validate body for POST /api/reservations
 */
const validateCreateReservation = (req, res, next) => {
  const { room_id, check_in, check_out, adults } = req.body;
  const errors = [];

  if (!room_id || !isValidUUID(room_id)) {
    errors.push('room_id is required and must be a valid UUID');
  }
  if (!check_in || !isValidDate(check_in)) {
    errors.push('check_in is required and must be a valid date (YYYY-MM-DD)');
  }
  if (!check_out || !isValidDate(check_out)) {
    errors.push('check_out is required and must be a valid date (YYYY-MM-DD)');
  }
  if (check_in && check_out && new Date(check_out) <= new Date(check_in)) {
    errors.push('check_out must be after check_in');
  }
  if (adults === undefined || isNaN(Number(adults)) || Number(adults) < 1) {
    errors.push('adults is required and must be at least 1');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

/**
 * Validate body for PATCH /api/reservations/:id
 */
const validateUpdateReservation = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  if (!status) {
    errors.push('status is required');
  } else if (!VALID_RESERVATION_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_RESERVATION_STATUSES.join(', ')}`);
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

module.exports = {
  validateGetReservations,
  validateCreateReservation,
  validateUpdateReservation,
};
