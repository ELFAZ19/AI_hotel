const express = require('express');
const router = express.Router();
const restaurantController = require('./restaurant.controller');

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Hotel services and restaurant reservations
 */

/**
 * @swagger
 * /api/restaurant:
 *   get:
 *     summary: Get all restaurant reservations
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by reservation status
 *       - in: query
 *         name: guest_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by guest ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by reservation date
 *     responses:
 *       200:
 *         description: List of restaurant reservations
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
router.get('/', restaurantController.getAllReservations);

/**
 * @swagger
 * /api/restaurant/{id}:
 *   get:
 *     summary: Get a restaurant reservation by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/RestaurantReservation' }
 *       404:
 *         description: Reservation not found
 */
router.get('/:id', restaurantController.getReservationById);

/**
 * @swagger
 * /api/restaurant:
 *   post:
 *     summary: Create a new restaurant reservation
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guest_id
 *               - reservation_date
 *               - reservation_time
 *               - party_size
 *             properties:
 *               guest_id: { type: string, format: uuid }
 *               reservation_date: { type: string, format: date }
 *               reservation_time: { type: string, format: time }
 *               party_size: { type: integer }
 *               special_requests: { type: string }
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/RestaurantReservation' }
 */
router.post('/', restaurantController.createReservation);

/**
 * @swagger
 * /api/restaurant/{id}:
 *   put:
 *     summary: Update a restaurant reservation
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: 
 *                 type: string
 *                 enum: [pending, confirmed, seated, completed, cancelled]
 *               special_requests:
 *                 type: string
 *               party_size:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Reservation updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/RestaurantReservation' }
 *       404:
 *         description: Reservation not found
 */
router.put('/:id', restaurantController.updateReservation);

module.exports = router;
