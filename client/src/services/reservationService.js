import api from '../lib/axios';

// ======================== GUEST ROUTES ========================

/**
 * Create a new reservation (guest only)
 * @param {Object} data - { room_id, check_in, check_out, adults, children?, special_requests? }
 * @returns {Promise<Object>} Created reservation with calculated total_price
 */
export const createReservation = async (reservationData) => {
  const { data } = await api.post('/reservations', reservationData);
  return data;
};

/**
 * Get all reservations for the authenticated guest
 * @returns {Promise<Array>} List of the guest's reservations
 */
export const getMyReservations = async () => {
  const { data } = await api.get('/reservations/my');
  return data;
};

/**
 * Get a single reservation by ID (guests see own, staff see any)
 * @param {string} id - Reservation UUID
 * @returns {Promise<Object>} Full reservation details with room and guest info
 */
export const getReservationById = async (id) => {
  const { data } = await api.get(`/reservations/${id}`);
  return data;
};

/**
 * Cancel a reservation (guest only, own reservations)
 * @param {string} id   - Reservation UUID
 * @param {string} note - Optional cancellation note
 * @returns {Promise<Object>} Cancelled reservation
 */
export const cancelReservation = async (id, note) => {
  const { data } = await api.patch(`/reservations/${id}/cancel`, { note });
  return data;
};

// ======================== STAFF ROUTES ========================

/**
 * Get all reservations with filters (staff only)
 * @param {Object} [filters] - { status, check_in_from, check_in_to, room_id, guest_id, page, limit }
 * @returns {Promise<Object>} { data, total, page, totalPages }
 */
export const getAllReservations = async (filters = {}) => {
  const { data } = await api.get('/reservations', { params: filters });
  return data;
};

/**
 * Update a reservation's status (staff only)
 * @param {string} id   - Reservation UUID
 * @param {Object} data - { status } — one of: pending, confirmed, checked_in, checked_out, cancelled, no_show
 * @returns {Promise<Object>} Updated reservation
 */
export const updateReservationStatus = async (id, statusData) => {
  const { data } = await api.patch(`/reservations/${id}/status`, statusData);
  return data;
};
