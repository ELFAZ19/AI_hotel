const eventsService = require('./events.service');

const getAllEventSpaces = async (req, res, next) => {
  try {
    const spaces = await eventsService.getAllEventSpaces();
    res.json({ success: true, data: spaces });
  } catch (error) {
    next(error);
  }
};

const getEventSpaceById = async (req, res, next) => {
  try {
    const space = await eventsService.getEventSpaceById(req.params.id);
    if (!space) return res.status(404).json({ success: false, message: 'Event space not found' });
    res.json({ success: true, data: space });
  } catch (error) {
    next(error);
  }
};

const createEventSpace = async (req, res, next) => {
  try {
    const newSpace = await eventsService.createEventSpace(req.body);
    res.status(201).json({ success: true, data: newSpace });
  } catch (error) {
    next(error);
  }
};

const getAllEventBookings = async (req, res, next) => {
  try {
    const bookings = await eventsService.getAllEventBookings(req.query);
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

const getEventBookingById = async (req, res, next) => {
  try {
    const booking = await eventsService.getEventBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Event booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

const createEventBooking = async (req, res, next) => {
  try {
    const newBooking = await eventsService.createEventBooking(req.body);
    res.status(201).json({ success: true, data: newBooking });
  } catch (error) {
    next(error);
  }
};

const updateEventBooking = async (req, res, next) => {
  try {
    const updatedBooking = await eventsService.updateEventBooking(req.params.id, req.body);
    if (!updatedBooking) return res.status(404).json({ success: false, message: 'Event booking not found' });
    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    next(error);
  }
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
