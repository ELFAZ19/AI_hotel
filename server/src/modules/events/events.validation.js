const VALID_EVENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const validateCreateEventBooking = (req, res, next) => {
  const { spaceId, eventName, eventDate, startTime, endTime, guestCount } = req.body;
  const errors = [];

  if (!spaceId || isNaN(Number(spaceId))) {
    errors.push('spaceId is required and must be an integer');
  }
  if (!eventName || typeof eventName !== 'string' || eventName.trim() === '') {
    errors.push('eventName is required');
  }
  if (!eventDate || isNaN(Date.parse(eventDate))) {
    errors.push('eventDate is required and must be a valid date (YYYY-MM-DD)');
  }

  // Validate times and full hour increments
  const timeRegex = /^([01]\d|2[0-3]):(00)$/;
  if (!startTime || !timeRegex.test(startTime)) {
    errors.push('startTime is required and must be in full hour increments (e.g., "14:00")');
  }
  if (!endTime || !timeRegex.test(endTime)) {
    errors.push('endTime is required and must be in full hour increments (e.g., "18:00")');
  }

  if (startTime && endTime && timeRegex.test(startTime) && timeRegex.test(endTime)) {
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    if (endHour <= startHour) {
      errors.push('endTime must be after startTime on the same day');
    }
  }

  if (guestCount === undefined || isNaN(Number(guestCount)) || Number(guestCount) < 1) {
    errors.push('guestCount is required and must be at least 1');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

const validateUpdateEventStatus = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  if (!status) {
    errors.push('status is required');
  } else if (!VALID_EVENT_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_EVENT_STATUSES.join(', ')}`);
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

module.exports = {
  validateCreateEventBooking,
  validateUpdateEventStatus
};
