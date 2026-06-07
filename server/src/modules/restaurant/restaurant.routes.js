const express = require('express');
const router = express.Router();
const restaurantController = require('./restaurant.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const {
  validateCreateRestaurantReservation,
  validateUpdateRestaurantStatus
} = require('./restaurant.validation');

/**
 * @swagger
 * tags:
 *   name: Restaurant
 *   description: Restaurant reservation management
 */

router.use(authenticate);

// ======================== GUEST ROUTES ========================

/**
 * @swagger
 * /api/restaurant/reservations:
 *   post:
 *     summary: Create a restaurant reservation (guest only)
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - time
 *               - partySize
 *             properties:
 *               date: { type: string, format: date, example: "2025-08-15" }
 *               time: { type: string, example: "19:30" }
 *               partySize: { type: integer, minimum: 1, example: 4 }
 *               specialRequests: { type: string, example: "Window seat please" }
 *     responses:
 *       201:
 *         description: Restaurant reservation created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/RestaurantReservation' }
 *       400:
 *         description: Validation error (e.g. past date)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/reservations',
  authorize('guest'),
  validateCreateRestaurantReservation,
  restaurantController.createReservation
);

/**
 * @swagger
 * /api/restaurant/reservations/my:
 *   get:
 *     summary: Get my restaurant reservations (guest only)
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guest's own restaurant reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/RestaurantReservation' }
 */
router.get(
  '/reservations/my',
  authorize('guest'),
  restaurantController.getMyReservations
);

// ======================== STAFF ROUTES ========================

/**
 * @swagger
 * /api/restaurant/reservations:
 *   get:
 *     summary: Get all restaurant reservations (staff only)
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by reservation date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, seated, completed, cancelled, no_show]
 *         description: Filter by status
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
 *         description: Paginated list with guest contact details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/RestaurantReservation' }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get(
  '/reservations',
  authorize('admin', 'manager', 'receptionist'),
  restaurantController.getAllReservations
);

/**
 * @swagger
 * /api/restaurant/reservations/{id}/status:
 *   patch:
 *     summary: Update restaurant reservation status (staff only)
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restaurant reservation UUID
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
 *                 enum: [pending, confirmed, seated, completed, cancelled, no_show]
 *     responses:
 *       200:
 *         description: Status updated (change logged in audit_logs)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/RestaurantReservation' }
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/reservations/:id/status',
  authorize('admin', 'manager', 'receptionist'),
  validateUpdateRestaurantStatus,
  restaurantController.updateStatus
);

module.exports = router;
