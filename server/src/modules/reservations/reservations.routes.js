const express = require('express');
const router = express.Router();
const reservationsController = require('./reservations.controller');

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Hotel room reservations management
 */

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Get all reservations
 *     tags: [Reservations]
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
 *     responses:
 *       200:
 *         description: List of reservations
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
router.get('/', reservationsController.getAllReservations);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Get a reservation by ID
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
 *     responses:
 *       200:
 *         description: Reservation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Reservation' }
 *       404:
 *         description: Reservation not found
 */
router.get('/:id', reservationsController.getReservationById);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create a new reservation
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
 *               - guest_id
 *               - room_id
 *               - check_in
 *               - check_out
 *               - total_price
 *             properties:
 *               guest_id: { type: string, format: uuid }
 *               room_id: { type: string, format: uuid }
 *               check_in: { type: string, format: date }
 *               check_out: { type: string, format: date }
 *               adults: { type: integer, default: 1 }
 *               children: { type: integer, default: 0 }
 *               total_price: { type: number }
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
 *                 data: { $ref: '#/components/schemas/Reservation' }
 */
router.post('/', reservationsController.createReservation);

/**
 * @swagger
 * /api/reservations/{id}:
 *   put:
 *     summary: Update a reservation status
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: 
 *                 type: string
 *                 enum: [pending, confirmed, checked_in, checked_out, cancelled, no_show]
 *               cancellation_note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Reservation' }
 *       404:
 *         description: Reservation not found
 */
router.put('/:id', reservationsController.updateReservation);

module.exports = router;
