const { pool } = require('../../config/db');

const getDashboardStats = async () => {
  // 1. Overview stats
  const totalRoomsResult = await pool.query("SELECT COUNT(*) FROM rooms WHERE is_active = true");
  const totalRooms = parseInt(totalRoomsResult.rows[0].count, 10);

  const availableRoomsResult = await pool.query("SELECT COUNT(*) FROM rooms WHERE status = 'available' AND is_active = true");
  const availableRooms = parseInt(availableRoomsResult.rows[0].count, 10);

  const occupiedRoomsResult = await pool.query("SELECT COUNT(*) FROM rooms WHERE status = 'occupied' AND is_active = true");
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
  const result = await pool.query(`
    WITH date_series AS (
      SELECT generate_series($1::date, $2::date, '1 day'::interval)::date as report_date
    ),
    total_rooms AS (
      SELECT COUNT(*) as tr FROM rooms WHERE is_active = true
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

// ======================== USER MANAGEMENT ========================

const getAllUsers = async ({ role, search, page = 1, limit = 20 }) => {
  let whereClauses = ['1=1'];
  const params = [];

  if (role) {
    params.push(role);
    whereClauses.push(`u.role = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }

  const whereString = whereClauses.join(' AND ');
  const countResult = await pool.query(`SELECT COUNT(*) FROM users u WHERE ${whereString}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (page - 1) * limit;
  params.push(limit);
  params.push(offset);

  const result = await pool.query(`
    SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.phone, u.created_at,
           COUNT(r.id) AS reservation_count
    FROM users u
    LEFT JOIN reservations r ON r.guest_id = u.id
    WHERE ${whereString}
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `, params);

  return {
    data: result.rows,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit)
  };
};

const getUserById = async (id) => {
  const userResult = await pool.query(
    `SELECT id, first_name, last_name, email, role, phone, created_at FROM users WHERE id = $1`,
    [id]
  );
  if (!userResult.rows[0]) return null;
  const user = userResult.rows[0];

  const reservationsResult = await pool.query(`
    SELECT res.id, res.status, res.check_in, res.check_out, res.total_price, rm.room_number, rt.name AS room_type_name
    FROM reservations res
    JOIN rooms rm ON res.room_id = rm.id
    JOIN room_types rt ON rm.room_type_id = rt.id
    WHERE res.guest_id = $1
    ORDER BY res.created_at DESC
    LIMIT 10
  `, [id]);

  user.recent_reservations = reservationsResult.rows;
  return user;
};

const updateUserRole = async (id, role) => {
  const validRoles = ['guest', 'receptionist', 'manager', 'admin'];
  if (!validRoles.includes(role)) throw new Error(`role must be one of: ${validRoles.join(', ')}`);
  const result = await pool.query(
    `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, first_name, last_name, email, role`,
    [role, id]
  );
  return result.rows[0];
};

const deleteUser = async (id) => {
  // Soft: just remove the user (cascades on reservations should be handled at DB level)
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0];
};

// ======================== RESERVATION OVERRIDE ========================

const overrideReservationStatus = async ({ id, status, note, staffId }) => {
  const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];
  if (!validStatuses.includes(status)) throw new Error(`Invalid status: ${status}`);

  const result = await pool.query('SELECT status FROM reservations WHERE id = $1', [id]);
  if (!result.rows[0]) throw new Error('Reservation not found');

  const updateResult = await pool.query(`
    UPDATE reservations SET status = $1, updated_at = NOW()
    WHERE id = $2 RETURNING *
  `, [status, id]);

  return updateResult.rows[0];
};

module.exports = {
  getDashboardStats,
  getRevenueReport,
  getOccupancyReport,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  overrideReservationStatus,
};
