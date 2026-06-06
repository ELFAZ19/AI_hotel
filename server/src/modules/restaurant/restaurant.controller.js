const restaurantService = require('./restaurant.service');

const getAllReservations = async (req, res, next) => {
  try {
    const reservations = await restaurantService.getAllReservations(req.query);
    res.json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

const getReservationById = async (req, res, next) => {
  try {
    const reservation = await restaurantService.getReservationById(req.params.id);
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, data: reservation });
  } catch (error) {
    next(error);
  }
};

const createReservation = async (req, res, next) => {
  try {
    const newReservation = await restaurantService.createReservation(req.body);
    res.status(201).json({ success: true, data: newReservation });
  } catch (error) {
    next(error);
  }
};

const updateReservation = async (req, res, next) => {
  try {
    const updatedReservation = await restaurantService.updateReservation(req.params.id, req.body);
    if (!updatedReservation) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, data: updatedReservation });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation
};
