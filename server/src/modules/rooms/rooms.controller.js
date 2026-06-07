const roomsService = require('./rooms.service');

const getAllRoomTypes = async (req, res, next) => {
  try {
    const roomTypes = await roomsService.getAllRoomTypes();
    res.json({ success: true, data: roomTypes });
  } catch (error) {
    next(error);
  }
};

const getRoomTypeById = async (req, res, next) => {
  try {
    const roomType = await roomsService.getRoomTypeById(req.params.id);
    if (!roomType) return res.status(404).json({ success: false, message: 'Room type not found' });
    res.json({ success: true, data: roomType });
  } catch (error) {
    next(error);
  }
};

const createRoomType = async (req, res, next) => {
  try {
    const newRoomType = await roomsService.createRoomType(req.body);
    res.status(201).json({ success: true, data: newRoomType });
  } catch (error) {
    next(error);
  }
};

const getAllRooms = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const rooms = await roomsService.getAllRooms({ status, type });
    res.json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const room = await roomsService.getRoomById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const newRoom = await roomsService.createRoom(req.body);
    res.status(201).json({ success: true, data: newRoom });
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const updatedRoom = await roomsService.updateRoom(req.params.id, req.body);
    if (!updatedRoom) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: updatedRoom });
  } catch (error) {
    next(error);
  }
};

const getAvailableRooms = async (req, res, next) => {
  try {
    const { check_in, check_out, guests, room_type_id } = req.query;
    if (!check_in || !check_out) {
      return res.status(400).json({ success: false, message: 'check_in and check_out are required' });
    }
    const rooms = await roomsService.getAvailableRooms({
      checkIn: check_in,
      checkOut: check_out,
      guests,
      roomTypeId: room_type_id
    });
    res.json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRoomTypes,
  getRoomTypeById,
  createRoomType,
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  getAvailableRooms
};
