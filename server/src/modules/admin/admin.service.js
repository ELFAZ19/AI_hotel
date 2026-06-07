const { pool } = require('../../config/db');

const getDashboardStats = async () => {
  // 1. Overview stats
  const totalRoomsResult = await pool.query("SELECT COUNT(*) FROM rooms");
  const totalRooms = parseInt(totalRoomsResult.rows[0].count, 10);

  const availableRoomsResult = await pool.query("SELECT COUNT(*) FROM rooms WHERE status = 'available'");
  const availableRooms = parseInt(availableRoomsResult.rows[0].count, 10);

  const occupiedRoomsResult = await pool.query("SELECT COUNT(*) FROM rooms WHERE status = 'occupied'");
  const occupiedRooms = parseInt(occupiedRoomsResult.rows[0].count, 10);

  const totalGuestsResult = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'guest'");
  const totalGuests = parseInt(totalGuestsResult.rows[0].count, 10);

  const totalReservationsResult = await pool.query("SELECT COUNT(*) FROM reservations");
  const totalReservations = parseInt(totalReservationsResult.rows[0].count, 10);

  // 2. Revenue stats
  const revenueResult = await pool.query(`
    SELECT 
      COALESCE(SUM(CASE WHEN paid_at::date = CURRENT_DATE THEN amount ELSE 0 END), 0) as today,
      COALESCE(SUM(CASE WHEN DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as this_month,
      COALESCE(SUM(CASE WHEN DATE_TRUNC('year', paid_at) = DATE_TRUNC('year', CURRENT_DATE) THEN amount ELSE 0 END), 0) as this_year
    FROM payments 
    WHERE status = 'success'
  `);
  
  const revenue = {
    today: parseFloat(revenueResult.rows[0].today),
    thisMonth: parseFloat(revenueResult.rows[0].this_month),
    thisYear: parseFloat(revenueResult.rows[0].this_year)
  };

  // 3. Occupancy rate
  let occupancyRate = 0;
  if (totalRooms > 0) {
    occupancyRate = Math.round((occupiedRooms / totalRooms) * 100 * 10) / 10;
  }

  // 4. Recent reservations
  const recentReservationsResult = await pool.query(`
    SELECT 
      r.id, r.status, r.total_price,
      u.first_name, u.last_name,
      rm.room_number
    FROM reservations r
    JOIN users u ON r.guest_id = u.id
    JOIN rooms rm ON r.room_id = rm.id
    ORDER BY r.created_at DESC
    LIMIT 5
  `);
  
  const recentReservations = recentReservationsResult.rows.map(row => ({
    id: row.id,
    guestName: `${row.first_name} ${row.last_name}`,
    roomNumber: row.room_number,
    status: row.status,
    totalPrice: parseFloat(row.total_price)
  }));

  // 5. Revenue by month
  const revenueByMonthResult = await pool.query(`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', paid_at), 'YYYY-MM') as month,
      SUM(amount) as revenue
    FROM payments
    WHERE status = 'success' 
      AND paid_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
    GROUP BY DATE_TRUNC('month', paid_at)
    ORDER BY month ASC
  `);

  const revenueByMonth = revenueByMonthResult.rows.map(row => ({
    month: row.month,
    revenue: parseFloat(row.revenue)
  }));

  return {
    overview: {
      totalRooms,
      availableRooms,
      occupiedRooms,
      totalGuests,
      totalReservations
    },
    revenue,
    occupancyRate,
    recentReservations,
    revenueByMonth
  };
};

const getRevenueReport = async ({ from, to }) => {
  const result = await pool.query(`
    SELECT 
      paid_at::date as date, 
      SUM(amount) as revenue,
      COUNT(DISTINCT reservation_id) as reservations_count
    FROM payments
    WHERE status = 'success'
      AND paid_at::date >= $1::date
      AND paid_at::date <= $2::date
    GROUP BY paid_at::date
    ORDER BY paid_at::date ASC
  `, [from, to]);

  return result.rows.map(row => ({
    date: row.date.toISOString().split('T')[0],
    revenue: parseFloat(row.revenue),
    reservations_count: parseInt(row.reservations_count, 10)
  }));
};

const getOccupancyReport = async ({ from, to }) => {
  // A simple daily occupancy report:
  // For each day in the range, how many rooms were occupied.
  // We can generate a series of dates and join with reservations.
  
  const result = await pool.query(`
    WITH date_series AS (
      SELECT generate_series($1::date, $2::date, '1 day'::interval)::date as report_date
    ),
    total_rooms AS (
      SELECT COUNT(*) as tr FROM rooms
    )
    SELECT 
      ds.report_date as date,
      COUNT(DISTINCT r.room_id) as occupied,
      (SELECT tr FROM total_rooms) as total
    FROM date_series ds
    LEFT JOIN reservations r ON 
      r.status IN ('confirmed', 'checked_in') 
      AND ds.report_date >= r.check_in 
      AND ds.report_date < r.check_out
    GROUP BY ds.report_date
    ORDER BY ds.report_date ASC
  `, [from, to]);

  return result.rows.map(row => {
    const occupied = parseInt(row.occupied, 10);
    const total = parseInt(row.total, 10);
    const occupancy_rate = total > 0 ? Math.round((occupied / total) * 100 * 10) / 10 : 0;
    
    return {
      date: row.date.toISOString().split('T')[0],
      occupied,
      total,
      occupancy_rate
    };
  });
};

module.exports = {
  getDashboardStats,
  getRevenueReport,
  getOccupancyReport
};
