const { pool } = require('../../config/db');
const auditLog = require('../../utils/auditLog');

const getEventSpaces = async () => {
  const result = await pool.query('SELECT * FROM event_spaces WHERE is_active = true');
  return result.rows;
};

const checkSpaceAvailability = async ({ spaceId, date, startTime, endTime }) => {
  const result = await pool.query(
    `SELECT 1 FROM event_bookings 
     WHERE space_id = $1 
       AND event_date = $2 
       AND status NOT IN ('cancelled')
       AND start_time < $4 AND end_time > $3 
     LIMIT 1`,
    [spaceId, date, startTime, endTime]
  );
  return result.rowCount === 0;
};

const createBooking = async ({ guestId, spaceId, eventName, eventType, eventDate, startTime, endTime, guestCount, notes }) => {
  // Check space exists and get price
  const spaceResult = await pool.query('SELECT price_per_hour FROM event_spaces WHERE id = $1 AND is_active = true', [spaceId]);
  if (spaceResult.rows.length === 0) {
    throw new Error('Event space not found or inactive');
  }
  const pricePerHour = Number(spaceResult.rows[0].price_per_hour);

  // Check availability
  const isAvailable = await checkSpaceAvailability({ spaceId, date: eventDate, startTime, endTime });
  if (!isAvailable) {
    throw new Error('Event space is not available for the selected time');
  }

  // Calculate hours
  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  const hours = endHour - startHour;

  if (hours <= 0) {
    throw new Error('endTime must be after startTime');
  }

  // Calculate total price
  const totalPrice = hours * pricePerHour;

  const result = await pool.query(
    `INSERT INTO event_bookings (guest_id, space_id, event_name, event_type, event_date, start_time, end_time, guest_count, total_price, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending') RETURNING *`,
    [guestId, spaceId, eventName, eventType, eventDate, startTime, endTime, guestCount, totalPrice, notes]
  );

  return result.rows[0];
};

const getMyBookings = async (guestId) => {
  const query = `
    SELECT eb.*, es.name AS space_name, es.price_per_hour
    FROM event_bookings eb
    JOIN event_spaces es ON eb.space_id = es.id
    WHERE eb.guest_id = $1
    ORDER BY eb.event_date DESC, eb.start_time DESC
  `;
  const result = await pool.query(query, [guestId]);
  return result.rows;
};

const getAllBookings = async ({ date, status, space_id, page = 1, limit = 10 }) => {
  let whereClauses = ['1=1'];
  const params = [];

  if (date) {
    params.push(date);
    whereClauses.push(`eb.event_date = $${params.length}`);
  }
  if (status) {
    params.push(status);
    whereClauses.push(`eb.status = $${params.length}`);
  }
  if (space_id) {
    params.push(space_id);
    whereClauses.push(`eb.space_id = $${params.length}`);
  }

  const whereString = whereClauses.join(' AND ');

  const countQuery = `SELECT COUNT(*) FROM event_bookings eb WHERE ${whereString}`;
  const totalResult = await pool.query(countQuery, params);
  const total = parseInt(totalResult.rows[0].count, 10);

  let query = `
    SELECT eb.*, u.first_name, u.last_name, u.email, u.phone, es.name AS space_name
    FROM event_bookings eb
    JOIN users u ON eb.guest_id = u.id
    JOIN event_spaces es ON eb.space_id = es.id
    WHERE ${whereString}
    ORDER BY eb.event_date DESC, eb.start_time DESC
  `;

  const offset = (page - 1) * limit;
  params.push(limit);
  query += ` LIMIT $${params.length}`;
  params.push(offset);
  query += ` OFFSET $${params.length}`;

  const result = await pool.query(query, params);

  return {
    data: result.rows,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit)
  };
};

const updateStatus = async (id, status, staffId, ipAddress) => {
  const result = await pool.query('SELECT status FROM event_bookings WHERE id = $1', [id]);
  const booking = result.rows[0];
  
  if (!booking) {
    throw new Error('Event booking not found');
  }

  const currentStatus = booking.status;

  const updatedResult = await pool.query(
    `UPDATE event_bookings 
     SET status = $1, updated_at = NOW() 
     WHERE id = $2 RETURNING *`,
    [status, id]
  );

  // Insert audit log
  await auditLog({
    userId: staffId,
    action: 'EVENT_STATUS_CHANGED',
    entity: 'event_bookings',
    entityId: id,
    oldValue: { status: currentStatus },
    newValue: { status },
    ipAddress
  });

  return updatedResult.rows[0];
};

module.exports = {
  getEventSpaces,
  checkSpaceAvailability,
  createBooking,
  getMyBookings,
  getAllBookings,
  updateStatus
};
