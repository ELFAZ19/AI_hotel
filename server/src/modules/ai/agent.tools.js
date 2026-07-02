/**
 * agent.tools.js
 * Defines ALL Gemini function-calling tool declarations and their
 * corresponding executor functions.
 *
 * Each executor receives (params, context) where context = { userId, pool }.
 */

const { pool } = require('../../config/db');
const roomsService = require('../rooms/rooms.service');
const reservationsService = require('../reservations/reservations.service');
const chapaService = require('../payments/chapa.service');

// ---------------------------------------------------------------------------
// Tool Declarations (sent to Gemini as functionDeclarations)
// ---------------------------------------------------------------------------
const TOOL_DECLARATIONS = [
  {
    name: 'getRoomAvailability',
    description:
      'CRITICAL: Check which rooms are available for a given date range and number of guests. Returns a list of available room types with true prices and real-time availability. You MUST use the data returned by this tool as your single source of truth. NEVER invent, guess, or hallucinate prices or availability.',
    parameters: {
      type: 'OBJECT',
      properties: {
        checkIn:  { type: 'STRING', description: 'Check-in date in YYYY-MM-DD format' },
        checkOut: { type: 'STRING', description: 'Check-out date in YYYY-MM-DD format' },
        guests:   { type: 'NUMBER', description: 'Number of guests (adults)' },
      },
      required: ['checkIn', 'checkOut'],
    },
  },
  {
    name: 'getRoomDetails',
    description: 'CRITICAL: Get full details of a specific room including amenities, images, and current price. Do NOT invent prices. Rely ONLY on the tool response.',
    parameters: {
      type: 'OBJECT',
      properties: {
        roomId: { type: 'STRING', description: 'UUID of the room' },
      },
      required: ['roomId'],
    },
  },
  {
    name: 'createRoomReservation',
    description:
      'Create a room reservation for the authenticated guest. Requires the user to be logged in. Returns the new reservation id and total price so payment can be initiated.',
    parameters: {
      type: 'OBJECT',
      properties: {
        roomId:          { type: 'STRING', description: 'UUID of the room to book' },
        checkIn:         { type: 'STRING', description: 'Check-in date YYYY-MM-DD' },
        checkOut:        { type: 'STRING', description: 'Check-out date YYYY-MM-DD' },
        adults:          { type: 'NUMBER', description: 'Number of adult guests' },
        children:        { type: 'NUMBER', description: 'Number of children' },
        specialRequests: { type: 'STRING', description: 'Any special requests or notes from the guest' },
      },
      required: ['roomId', 'checkIn', 'checkOut', 'adults'],
    },
  },
  {
    name: 'createRestaurantReservation',
    description: 'Create a restaurant / dining reservation for the authenticated guest. Do NOT invent availability.',
    parameters: {
      type: 'OBJECT',
      properties: {
        reservationDate: { type: 'STRING', description: 'Date in YYYY-MM-DD format' },
        reservationTime: { type: 'STRING', description: 'Time in HH:MM (24h) format' },
        partySize:       { type: 'NUMBER', description: 'Number of people dining' },
        specialRequests: { type: 'STRING', description: 'Dietary needs or other requests' },
      },
      required: ['reservationDate', 'reservationTime', 'partySize'],
    },
  },
  {
    name: 'createHallReservation',
    description: 'Create an event hall / space reservation for the authenticated guest. Do NOT invent prices or availability.',
    parameters: {
      type: 'OBJECT',
      properties: {
        spaceId:    { type: 'NUMBER', description: 'ID of the event space (integer)' },
        eventName:  { type: 'STRING', description: 'Name of the event' },
        eventType:  { type: 'STRING', description: 'Type of event e.g. wedding, conference, birthday' },
        eventDate:  { type: 'STRING', description: 'Date of event YYYY-MM-DD' },
        startTime:  { type: 'STRING', description: 'Start time HH:MM (24h)' },
        endTime:    { type: 'STRING', description: 'End time HH:MM (24h)' },
        guestCount: { type: 'NUMBER', description: 'Expected number of attendees' },
        notes:      { type: 'STRING', description: 'Additional notes or requirements' },
      },
      required: ['spaceId', 'eventName', 'eventDate', 'startTime', 'endTime', 'guestCount'],
    },
  },
  {
    name: 'createPayment',
    description:
      'Initiate a Chapa payment for an existing reservation. Returns a checkout URL the guest should visit to complete payment.',
    parameters: {
      type: 'OBJECT',
      properties: {
        reservationId: { type: 'STRING', description: 'UUID of the reservation to pay for' },
        reservationType: {
          type: 'STRING',
          description: 'Type of reservation: "room", "restaurant", or "hall"',
        },
      },
      required: ['reservationId'],
    },
  },
  {
    name: 'checkPaymentStatus',
    description: 'Check the current payment status for a given Chapa transaction reference.',
    parameters: {
      type: 'OBJECT',
      properties: {
        txRef: { type: 'STRING', description: 'Chapa transaction reference (tx_ref)' },
      },
      required: ['txRef'],
    },
  },
  {
    name: 'getUserProfile',
    description: 'Get the profile information of the currently logged-in user.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: [],
    },
  },
  {
    name: 'getMyReservations',
    description: 'Get all room reservations made by the currently authenticated user.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: [],
    },
  },
  {
    name: 'getEventSpaces',
    description: 'CRITICAL: List all available event spaces / halls with their capacities and prices. Use this data as the single source of truth. NEVER invent hall prices.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool Executors
// ---------------------------------------------------------------------------

const executeGetRoomAvailability = async ({ checkIn, checkOut, guests }) => {
  const summary = await roomsService.getRoomSummary({ checkIn, checkOut, guests });
  if (summary.length === 0) {
    return { available: false, message: 'No rooms available for the selected dates and guest count.' };
  }
  return {
    available: true,
    rooms: summary.map(r => ({
      roomTypeId: r.room_type_id,
      name: r.room_type_name,
      description: r.description,
      pricePerNight: Number(r.representative_room.effective_price),
      maxGuests: r.max_guests,
      amenities: r.amenities,
      availableCount: r.available_count,
      representativeRoomId: r.representative_room.id,
      imageUrl: r.representative_room.primary_image_url,
    })),
  };
};

const executeGetRoomDetails = async ({ roomId }) => {
  const room = await roomsService.getRoomById(roomId);
  if (!room) return { error: 'Room not found' };
  return {
    id: room.id,
    roomNumber: room.room_number,
    roomType: room.room_type_name,
    floor: room.floor,
    pricePerNight: Number(room.effective_price),
    maxGuests: room.max_guests,
    description: room.description,
    amenities: room.amenities,
    status: room.status,
    images: (room.images || []).map(img => img.url),
  };
};

const executeCreateRoomReservation = async ({ roomId, checkIn, checkOut, adults, children, specialRequests }, userId) => {
  if (!userId) {
    return { requiresLogin: true, message: 'You must be logged in to make a reservation.' };
  }
  const reservation = await reservationsService.createReservation({
    guestId: userId,
    roomId,
    checkIn,
    checkOut,
    adults,
    children: children || 0,
    specialRequests,
  });
  return {
    success: true,
    reservationId: reservation.id,
    totalPrice: Number(reservation.total_price),
    checkIn: reservation.check_in,
    checkOut: reservation.check_out,
    status: reservation.status,
    message: `Reservation created successfully. Total: ${reservation.total_price} ETB. Proceed to payment.`,
  };
};

const executeCreateRestaurantReservation = async ({ reservationDate, reservationTime, partySize, specialRequests }, userId) => {
  if (!userId) {
    return { requiresLogin: true, message: 'You must be logged in to make a restaurant reservation.' };
  }
  const result = await pool.query(
    `INSERT INTO restaurant_reservations (guest_id, reservation_date, reservation_time, party_size, special_requests)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, reservationDate, reservationTime, partySize, specialRequests || null]
  );
  const res = result.rows[0];
  return {
    success: true,
    reservationId: res.id,
    date: res.reservation_date,
    time: res.reservation_time,
    partySize: res.party_size,
    status: res.status,
    message: `Restaurant table reserved for ${partySize} guests on ${reservationDate} at ${reservationTime}.`,
  };
};

const executeCreateHallReservation = async ({ spaceId, eventName, eventType, eventDate, startTime, endTime, guestCount, notes }, userId) => {
  if (!userId) {
    return { requiresLogin: true, message: 'You must be logged in to book an event space.' };
  }
  // Calculate price
  const spaceResult = await pool.query('SELECT * FROM event_spaces WHERE id = $1 AND is_active = true', [spaceId]);
  const space = spaceResult.rows[0];
  if (!space) return { error: 'Event space not found or unavailable.' };

  // Calculate hours
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const hours = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  const totalPrice = hours * Number(space.price_per_hour);

  const result = await pool.query(
    `INSERT INTO event_bookings (guest_id, space_id, event_name, event_type, event_date, start_time, end_time, guest_count, total_price, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [userId, spaceId, eventName, eventType || null, eventDate, startTime, endTime, guestCount, totalPrice, notes || null]
  );
  const booking = result.rows[0];
  return {
    success: true,
    bookingId: booking.id,
    spaceName: space.name,
    eventDate,
    startTime,
    endTime,
    totalPrice: Number(booking.total_price),
    status: booking.status,
    message: `Event hall "${space.name}" booked for "${eventName}" on ${eventDate}. Total: ${totalPrice} ETB.`,
  };
};

const executeCreatePayment = async ({ reservationId, reservationType = 'room' }, userId) => {
  if (!userId) {
    return { requiresLogin: true, message: 'You must be logged in to make a payment.' };
  }
  // Fetch reservation + user info for Chapa
  const userResult = await pool.query(
    'SELECT email, first_name, last_name FROM users WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) return { error: 'User not found' };

  // Determine amount based on reservation type
  let amount;
  if (reservationType === 'restaurant') {
    // Restaurant reservations are usually free / low-cost, use 0 or skip payment
    return { message: 'Restaurant reservations do not require advance payment at this hotel.' };
  } else if (reservationType === 'hall') {
    const res = await pool.query('SELECT total_price FROM event_bookings WHERE id = $1 AND guest_id = $2', [reservationId, userId]);
    if (!res.rows[0]) return { error: 'Event booking not found.' };
    amount = res.rows[0].total_price;
  } else {
    const res = await pool.query('SELECT total_price FROM reservations WHERE id = $1 AND guest_id = $2', [reservationId, userId]);
    if (!res.rows[0]) return { error: 'Reservation not found or does not belong to you.' };
    amount = res.rows[0].total_price;
  }

  const payment = await chapaService.initiatePayment({
    reservationId,
    amount,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
  });

  return {
    success: true,
    checkoutUrl: payment.checkoutUrl,
    txRef: payment.txRef,
    amount: Number(amount),
    message: `Payment of ${amount} ETB initiated. Please complete your payment using the link below.`,
    paymentLink: payment.checkoutUrl,
  };
};

const executeCheckPaymentStatus = async ({ txRef }) => {
  const result = await pool.query(
    `SELECT p.status, p.amount, p.paid_at, r.status AS reservation_status
     FROM payments p
     LEFT JOIN reservations r ON p.reservation_id = r.id
     WHERE p.chapa_tx_ref = $1`,
    [txRef]
  );
  const payment = result.rows[0];
  if (!payment) return { error: 'Payment not found for this reference.' };
  return {
    paymentStatus: payment.status,
    amount: Number(payment.amount),
    paidAt: payment.paid_at,
    reservationStatus: payment.reservation_status,
    message: payment.status === 'success'
      ? 'Payment successful! Your reservation is confirmed.'
      : payment.status === 'pending'
      ? 'Payment is still pending. Please complete the payment.'
      : 'Payment failed. Please try again.',
  };
};

const executeGetUserProfile = async (_params, userId) => {
  if (!userId) return { requiresLogin: true, message: 'You must be logged in to view your profile.' };
  const result = await pool.query(
    'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = $1',
    [userId]
  );
  const user = result.rows[0];
  if (!user) return { error: 'User not found' };
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    role: user.role,
  };
};

const executeGetMyReservations = async (_params, userId) => {
  if (!userId) return { requiresLogin: true, message: 'You must be logged in to view your reservations.' };
  const reservations = await reservationsService.getMyReservations(userId);
  if (!reservations.length) return { reservations: [], message: 'You have no reservations yet.' };
  return {
    reservations: reservations.map(r => ({
      id: r.id,
      roomType: r.room_type_name,
      roomNumber: r.room_number,
      checkIn: r.check_in,
      checkOut: r.check_out,
      totalPrice: Number(r.total_price),
      status: r.status,
    })),
  };
};

const executeGetEventSpaces = async () => {
  const result = await pool.query(
    'SELECT * FROM event_spaces WHERE is_active = true ORDER BY capacity ASC'
  );
  return {
    spaces: result.rows.map(s => ({
      id: s.id,
      name: s.name,
      capacity: s.capacity,
      pricePerHour: Number(s.price_per_hour),
      amenities: s.amenities,
    })),
  };
};

// ---------------------------------------------------------------------------
// Dispatcher — called by the agent after Gemini requests a tool call
// ---------------------------------------------------------------------------
const executeTool = async (toolName, toolParams, userId) => {
  try {
    switch (toolName) {
      case 'getRoomAvailability':        return await executeGetRoomAvailability(toolParams);
      case 'getRoomDetails':             return await executeGetRoomDetails(toolParams);
      case 'createRoomReservation':      return await executeCreateRoomReservation(toolParams, userId);
      case 'createRestaurantReservation':return await executeCreateRestaurantReservation(toolParams, userId);
      case 'createHallReservation':      return await executeCreateHallReservation(toolParams, userId);
      case 'createPayment':              return await executeCreatePayment(toolParams, userId);
      case 'checkPaymentStatus':         return await executeCheckPaymentStatus(toolParams);
      case 'getUserProfile':             return await executeGetUserProfile(toolParams, userId);
      case 'getMyReservations':          return await executeGetMyReservations(toolParams, userId);
      case 'getEventSpaces':             return await executeGetEventSpaces();
      default: return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    return { error: err.message };
  }
};

module.exports = {
  TOOL_DECLARATIONS,
  executeTool,
};
