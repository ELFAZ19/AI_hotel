const express = require('express');
const router = express.Router();
const reservationsController = require('./reservations.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const {
  validateCreateReservation,
  validateGetReservations,
  validateUpdateReservation,
} = require('./reservations.validation');

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Room reservation management
 */

// All reservation routes require authentication
router.use(authenticate);

// ======================== GUEST ROUTES ========================

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create a new reservation (guest only)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_id
 *               - check_in
 *               - check_out
 *               - adults
 *             properties:
 *               room_id: { type: string, format: uuid, description: "ID of the room to reserve" }
 *               check_in: { type: string, format: date, example: "2025-08-01" }
 *               check_out: { type: string, format: date, example: "2025-08-03" }
 *               adults: { type: integer, minimum: 1, example: 2 }
 *               children: { type: integer, default: 0 }
 *               special_requests: { type: string, example: "Late check-in please" }
 *     responses:
 *       201:
 *         description: Reservation created with calculated total_price
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Reservation' }
 *       400:
 *         description: Room not available or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  validateCreateReservation,
  reservationsController.createReservation
);

/**
 * @swagger
 * /api/reservations/my:
 *   get:
 *     summary: Get my reservations (guest only)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the authenticated guest's reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Reservation' }
 */
router.get(
  '/my',
  reservationsController.getMyReservations
);

/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   patch:
 *     summary: Cancel a reservation (guest only, own reservations)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *     responses:
 *       200:
 *         description: Reservation cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Reservation' }
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/:id/cancel',
  reservationsController.cancelReservation
);

// ======================== STAFF ROUTES ========================

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Get all reservations (staff only)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, checked_in, checked_out, cancelled, no_show]
 *         description: Filter by status
 *       - in: query
 *         name: check_in_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start of check-in date range
 *       - in: query
 *         name: check_in_to
 *         schema:
 *           type: string
 *           format: date
 *         description: End of check-in date range
 *       - in: query
 *         name: room_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by room
 *       - in: query
 *         name: guest_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by guest
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
 *         description: Paginated list of reservations with guest/room info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Reservation' }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  validateGetReservations,
  reservationsController.getAllReservations
);

/**
 * @swagger
 * /api/reservations/{id}/status:
 *   patch:
 *     summary: Update reservation status (staff only)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
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
 *                 enum: [pending, confirmed, checked_in, checked_out, cancelled, no_show]
 *     responses:
 *       200:
 *         description: Reservation status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Reservation' }
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/:id/status',
  authorize('admin', 'manager', 'receptionist'),
  validateUpdateReservation,
  reservationsController.updateReservationStatus
);

// ======================== SHARED ROUTES ========================

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Get reservation by ID (guests see own, staff see any)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reservation UUID
 *     responses:
 *       200:
 *         description: Full reservation details with room and guest info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Reservation' }
 *       403:
 *         description: Access denied (guest trying to view another guest's reservation)
 *       404:
 *         description: Reservation not found
 */
router.get(
  '/:id',
  reservationsController.getReservationById
);

module.exports = router;
