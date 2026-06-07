const express = require('express');
const router = express.Router();
const eventsController = require('./events.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const {
  validateCreateEventBooking,
  validateUpdateEventStatus
} = require('./events.validation');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event spaces and bookings management
 */

// ======================== PUBLIC ROUTES ========================

/**
 * @swagger
 * /api/events/spaces:
 *   get:
 *     summary: Get all active event spaces
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of active event spaces
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/EventSpace' }
 */
router.get('/spaces', eventsController.getEventSpaces);

// Authentication required for the rest
router.use(authenticate);

// ======================== GUEST ROUTES ========================

/**
 * @swagger
 * /api/events/bookings:
 *   post:
 *     summary: Create an event booking (guest only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - spaceId
 *               - eventName
 *               - eventDate
 *               - startTime
 *               - endTime
 *               - guestCount
 *             properties:
 *               spaceId: { type: integer, example: 1 }
 *               eventName: { type: string, example: "Wedding Reception" }
 *               eventType: { type: string, example: "Wedding" }
 *               eventDate: { type: string, format: date, example: "2025-08-20" }
 *               startTime: { type: string, example: "14:00" }
 *               endTime: { type: string, example: "22:00" }
 *               guestCount: { type: integer, minimum: 1, example: 150 }
 *               notes: { type: string, example: "Need catering setup" }
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/EventBooking' }
 *       400:
 *         description: Validation error or time conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/bookings',
  authorize('guest'),
  validateCreateEventBooking,
  eventsController.createBooking
);

/**
 * @swagger
 * /api/events/bookings/my:
 *   get:
 *     summary: Get my event bookings (guest only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guest's own event bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/EventBooking' }
 */
router.get(
  '/bookings/my',
  authorize('guest'),
  eventsController.getMyBookings
);

// ======================== STAFF ROUTES ========================

/**
 * @swagger
 * /api/events/bookings:
 *   get:
 *     summary: Get all event bookings (staff only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by event date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: space_id
 *         schema:
 *           type: integer
 *         description: Filter by space ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of all event bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/EventBooking' }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get(
  '/bookings',
  authorize('admin', 'manager', 'receptionist'),
  eventsController.getAllBookings
);

/**
 * @swagger
 * /api/events/bookings/{id}/status:
 *   patch:
 *     summary: Update event booking status (staff only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event booking UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated (change logged in audit_logs)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/EventBooking' }
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/bookings/:id/status',
  authorize('admin', 'manager', 'receptionist'),
  validateUpdateEventStatus,
  eventsController.updateStatus
);

module.exports = router;
