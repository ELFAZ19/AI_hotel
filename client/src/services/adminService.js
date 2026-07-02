import api from '../lib/axios';

// ======================== DASHBOARD ========================

export const getDashboardStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data;
};

// ======================== REPORTS ========================

/**
 * Get daily revenue report for a date range
 * @param {string} from - Start date (YYYY-MM-DD)
 * @param {string} to   - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of { date, revenue, reservations_count }
 */
export const getRevenueReport = async (from, to) => {
  const { data } = await api.get('/admin/reports/revenue', { params: { from, to } });
  return data;
};

/**
 * Get daily occupancy report for a date range
 * @param {string} from - Start date (YYYY-MM-DD)
 * @param {string} to   - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of { date, occupied, total, occupancy_rate }
 */
export const getOccupancyReport = async (from, to) => {
  const { data } = await api.get('/admin/reports/occupancy', { params: { from, to } });
  return data;
};

// ======================== USER MANAGEMENT ========================

/**
 * Get all users with optional filters
 * @param {Object} params - { role, search, page, limit }
 */
export const getAllUsers = async (params = {}) => {
  const { data } = await api.get('/admin/users', { params });
  return data;
};

/**
 * Get a user by ID including their recent reservations
 * @param {string} id - User UUID
 */
export const getUserById = async (id) => {
  const { data } = await api.get(`/admin/users/${id}`);
  return data;
};

/**
 * Update a user's role
 * @param {string} id   - User UUID
 * @param {string} role - One of: guest, receptionist, manager, admin
 */
export const updateUserRole = async (id, role) => {
  const { data } = await api.patch(`/admin/users/${id}/role`, { role });
  return data;
};

/**
 * Delete a user account
 * @param {string} id - User UUID
 */
export const deleteUser = async (id) => {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
};

// ======================== RESERVATION OVERRIDE ========================

/**
 * Override a reservation's status (bypasses normal transition rules)
 * @param {string} id     - Reservation UUID
 * @param {string} status - Target status
 * @param {string} [note] - Optional note
 */
export const overrideReservationStatus = async (id, status, note) => {
  const { data } = await api.patch(`/admin/reservations/${id}/status`, { status, note });
  return data;
};
