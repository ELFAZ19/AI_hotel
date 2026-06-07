const reservationsService = require('./reservations.service');

const createReservation = async (req, res, next) => {
  try {
    const guestId = req.user.id;
    const { room_id, check_in, check_out, adults, children, special_requests } = req.body;
    
    const newReservation = await reservationsService.createReservation({
      guestId,
      roomId: room_id,
      checkIn: check_in,
      checkOut: check_out,
      adults,
      children,
      specialRequests: special_requests
    });
    
    res.status(201).json({ success: true, data: newReservation });
  } catch (error) {
    if (error.message.includes('Room not available') || error.message.includes('after check_in')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const getMyReservations = async (req, res, next) => {
  try {
    const guestId = req.user.id;
    const reservations = await reservationsService.getMyReservations(guestId);
    res.json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

const getReservationById = async (req, res, next) => {
  try {
    const reservation = await reservationsService.getReservationById(req.params.id, req.user);
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, data: reservation });
  } catch (error) {
    if (error.message === 'Unauthorized access to reservation') {
      return res.status(403).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const getAllReservations = async (req, res, next) => {
  try {
    const { status, check_in_from, check_in_to, room_id, guest_id, page, limit } = req.query;
    const result = await reservationsService.getAllReservations({
      status, check_in_from, check_in_to, room_id, guest_id, page, limit
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const updateReservationStatus = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const ipAddress = req.ip;
    const { status, note } = req.body;
    
    const updatedReservation = await reservationsService.updateReservationStatus(
      req.params.id, status, note, staffId, ipAddress
    );
    res.json({ success: true, data: updatedReservation });
  } catch (error) {
    if (error.message.includes('Invalid status transition') || error.message.includes('Reservation not found')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const cancelReservation = async (req, res, next) => {
  try {
    const guestId = req.user.id;
    const { note } = req.body;
    const updatedReservation = await reservationsService.cancelReservation(req.params.id, guestId, note);
    res.json({ success: true, data: updatedReservation });
  } catch (error) {
    if (error.message.includes('Unauthorized') || error.message.includes('Only pending') || error.message.includes('not found')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getReservationById,
  getAllReservations,
  updateReservationStatus,
  cancelReservation
};
