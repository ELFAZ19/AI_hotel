const restaurantService = require('./restaurant.service');

const createReservation = async (req, res, next) => {
  try {
    const guestId = req.user.id;
    const { date, time, partySize, specialRequests } = req.body;
    
    const newReservation = await restaurantService.createReservation({
      guestId,
      date,
      time,
      partySize,
      specialRequests
    });
    
    res.status(201).json({ success: true, data: newReservation });
  } catch (error) {
    next(error);
  }
};

const getMyReservations = async (req, res, next) => {
  try {
    const guestId = req.user.id;
    const reservations = await restaurantService.getMyReservations(guestId);
    res.json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

const getAllReservations = async (req, res, next) => {
  try {
    const { date, status, page, limit } = req.query;
    const result = await restaurantService.getAllReservations({ date, status, page, limit });
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
    
    const updatedReservation = await restaurantService.updateStatus(req.params.id, status, staffId, ipAddress);
    res.json({ success: true, data: updatedReservation });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateStatus
};
