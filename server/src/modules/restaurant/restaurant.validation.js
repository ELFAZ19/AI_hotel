const VALID_RESTAURANT_STATUSES = ['pending', 'confirmed', 'seated', 'completed', 'cancelled'];

const validateCreateRestaurantReservation = (req, res, next) => {
  const { date, time, partySize } = req.body;
  const errors = [];

  if (!date || isNaN(Date.parse(date))) {
    errors.push('date is required and must be a valid date (YYYY-MM-DD)');
  } else {
    // Validate date is not in the past
    const reservationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reservationDate < today) {
      errors.push('date cannot be in the past');
    }
  }

  if (!time || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
    errors.push('time is required and must be in HH:mm format');
  }

  if (partySize === undefined || isNaN(Number(partySize)) || Number(partySize) < 1) {
    errors.push('partySize is required and must be at least 1');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

const validateUpdateRestaurantStatus = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  if (!status) {
    errors.push('status is required');
  } else if (!VALID_RESTAURANT_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_RESTAURANT_STATUSES.join(', ')}`);
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

module.exports = {
  validateCreateRestaurantReservation,
  validateUpdateRestaurantStatus
};
