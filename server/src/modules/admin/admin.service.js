const { pool } = require('../../config/db');

const getDashboardStats = async () => {
  // Execute multiple count queries in parallel
  const [
    totalRooms,
    availableRooms,
    activeReservations,
    totalRevenue
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM rooms'),
    pool.query("SELECT COUNT(*) FROM rooms WHERE status = 'available'"),
    pool.query("SELECT COUNT(*) FROM reservations WHERE status IN ('pending', 'confirmed', 'checked_in')"),
    pool.query("SELECT SUM(amount) FROM payments WHERE status = 'success'")
  ]);

  return {
    totalRooms: parseInt(totalRooms.rows[0].count),
    availableRooms: parseInt(availableRooms.rows[0].count),
    activeReservations: parseInt(activeReservations.rows[0].count),
    totalRevenue: parseFloat(totalRevenue.rows[0].sum || 0)
  };
};

module.exports = {
  getDashboardStats
};
