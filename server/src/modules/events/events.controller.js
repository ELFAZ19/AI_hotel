const eventsService = require('./events.service');

const getEventSpaces = async (req, res, next) => {
  try {
    const spaces = await eventsService.getEventSpaces();
    res.json({ success: true, data: spaces });
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const guestId = req.user.id;
    const { spaceId, eventName, eventType, eventDate, startTime, endTime, guestCount, notes } = req.body;
    
    const newBooking = await eventsService.createBooking({
      guestId,
      spaceId,
      eventName,
      eventType,
      eventDate,
      startTime,
      endTime,
      guestCount,
      notes
    });
    
    res.status(201).json({ success: true, data: newBooking });
  } catch (error) {
    if (error.message.includes('not available') || error.message.includes('not found') || error.message.includes('after startTime')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const guestId = req.user.id;
    const bookings = await eventsService.getMyBookings(guestId);
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const { date, status, space_id, page, limit } = req.query;
    const result = await eventsService.getAllBookings({ date, status, space_id, page, limit });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const ipAddress = req.ip;
    const { status } = req.body;
    
    const updatedBooking = await eventsService.updateStatus(req.params.id, status, staffId, ipAddress);
    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  getEventSpaces,
  createBooking,
  getMyBookings,
  getAllBookings,
  updateStatus
};
