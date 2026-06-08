import api from '../lib/axios';

/**
 * Create a restaurant reservation (Guest only)
 * @param {Object} data - { date, time, partySize, specialRequests }
 * @returns {Promise<Object>}
 */
export const createRestaurantReservation = async (data) => {
  const response = await api.post('/restaurant/reservations', data);
  return response.data;
};

/**
 * Get guest's own restaurant reservations
 * @returns {Promise<Array>} List of reservations
 */
export const getMyDiningReservations = async () => {
  const response = await api.get('/restaurant/reservations/my');
  return response.data;
};

/**
 * Get all restaurant reservations (Admin/Staff only)
 * @param {Object} params - { date, status, page, limit }
 * @returns {Promise<Object>} Paginated reservations { data, total, page, totalPages }
 */
export const getAllDiningReservations = async (params = {}) => {
  const response = await api.get('/restaurant/reservations', { params });
  return response.data;
};

/**
 * Update restaurant reservation status (Admin/Staff only)
 * @param {string} id - Reservation ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated reservation
 */
export const updateDiningReservationStatus = async (id, status) => {
  const response = await api.patch(`/restaurant/reservations/${id}/status`, { status });
  return response.data;
};
