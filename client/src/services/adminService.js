import api from '../lib/axios';

/**
 * Get dashboard overview statistics (admin/manager only)
 * Includes overview counts, revenue, occupancy, and recent reservations
 * @returns {Promise<Object>} Dashboard stats
 */
export const getDashboardStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data;
};

/**
 * Get daily revenue report for a date range (admin/manager only)
 * @param {string} from - Start date (YYYY-MM-DD)
 * @param {string} to   - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of { date, revenue, reservations_count }
 */
export const getRevenueReport = async (from, to) => {
  const { data } = await api.get('/admin/reports/revenue', {
    params: { from, to },
  });
  return data;
};

/**
 * Get daily occupancy report for a date range (admin/manager only)
 * @param {string} from - Start date (YYYY-MM-DD)
 * @param {string} to   - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of { date, occupied, total, occupancy_rate }
 */
export const getOccupancyReport = async (from, to) => {
  const { data } = await api.get('/admin/reports/occupancy', {
    params: { from, to },
  });
  return data;
};
