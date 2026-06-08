import api from '../lib/axios';

// ======================== ROOM TYPES ========================

/**
 * Get all room types sorted by base_price ASC
 * @returns {Promise<Array>} List of room types
 */
export const getRoomTypes = async () => {
  const { data } = await api.get('/rooms/types');
  return data;
};

// ======================== ROOMS (PUBLIC) ========================

/**
 * Get available rooms for a date range
 * @param {string} checkIn  - Check-in date (YYYY-MM-DD)
 * @param {string} checkOut - Check-out date (YYYY-MM-DD)
 * @param {number} [guests] - Minimum guest capacity
 * @returns {Promise<Array>} Available rooms with type info
 */
export const getAvailableRooms = async (checkIn, checkOut, guests) => {
  const params = { check_in: checkIn, check_out: checkOut };
  if (guests) params.guests = guests;
  const { data } = await api.get('/rooms/available', { params });
  return data;
};

/**
 * Get all rooms with optional filters
 * @param {Object} [filters] - { status, type, floor }
 * @returns {Promise<Array>} Rooms with type info and primary image
 */
export const getAllRooms = async (filters = {}) => {
  const { data } = await api.get('/rooms', { params: filters });
  return data;
};

/**
 * Get rooms grouped by type with availability counts
 * @param {string} [checkIn]  - Check-in date (YYYY-MM-DD)
 * @param {string} [checkOut] - Check-out date (YYYY-MM-DD)
 * @param {number} [guests]   - Minimum guest capacity
 * @returns {Promise<Array>} Room type summaries with availability
 */
export const getRoomSummary = async (checkIn, checkOut, guests) => {
  const params = {};
  if (checkIn) params.check_in = checkIn;
  if (checkOut) params.check_out = checkOut;
  if (guests) params.guests = guests;
  const { data } = await api.get('/rooms/summary', { params });
  return data;
};

/**
 * Get a single room by ID (includes all images)
 * @param {string} id - Room UUID
 * @returns {Promise<Object>} Full room details
 */
export const getRoomById = async (id) => {
  const { data } = await api.get(`/rooms/${id}`);
  return data;
};

// ======================== ROOMS (ADMIN) ========================

/**
 * Create a new room (admin/manager only)
 * @param {Object} data - { room_number, room_type_id, floor, status?, price_override?, description?, is_active? }
 * @returns {Promise<Object>} Created room
 */
export const createRoom = async (roomData) => {
  const { data } = await api.post('/rooms', roomData);
  return data;
};

/**
 * Update room details (admin/manager only)
 * @param {string} id       - Room UUID
 * @param {Object} roomData - Fields to update
 * @returns {Promise<Object>} Updated room
 */
export const updateRoom = async (id, roomData) => {
  const { data } = await api.put(`/rooms/${id}`, roomData);
  return data;
};

/**
 * Set a room's status (admin/manager only)
 * @param {string} id     - Room UUID
 * @param {string} status - One of: available, occupied, maintenance, inactive
 * @returns {Promise<Object>} Updated room
 */
export const setRoomStatus = async (id, status) => {
  const { data } = await api.patch(`/rooms/${id}/status`, { status });
  return data;
};

/**
 * Upload images for a room (admin/manager only)
 * @param {string}   id       - Room UUID
 * @param {FormData} formData - Images as multipart/form-data
 * @returns {Promise<Object>} Upload result
 */
export const uploadRoomImages = async (id, formData) => {
  const { data } = await api.post(`/rooms/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
