const express = require('express');
const router = express.Router();
const eventsController = require('./events.controller');

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Hotel services and event bookings
 */

/**
 * @swagger
 * /api/events/spaces:
 *   get:
 *     summary: Get all active event spaces
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of event spaces
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
router.get('/spaces', eventsController.getAllEventSpaces);

/**
 * @swagger
 * /api/events/spaces/{id}:
 *   get:
 *     summary: Get event space by ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event space details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/EventSpace' }
 *       404:
 *         description: Event space not found
 */
router.get('/spaces/:id', eventsController.getEventSpaceById);

/**
 * @swagger
 * /api/events/spaces:
 *   post:
 *     summary: Create a new event space
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
 *               - name
 *               - capacity
 *               - price_per_hour
 *             properties:
 *               name: { type: string }
 *               capacity: { type: integer }
 *               price_per_hour: { type: number }
 *               amenities: { type: array, items: { type: string } }
 *               is_active: { type: boolean }
 *     responses:
 *       201:
 *         description: Event space created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/EventSpace' }
 */
router.post('/spaces', eventsController.createEventSpace);

/**
 * @swagger
 * /api/events/bookings:
 *   get:
 *     summary: Get all event bookings
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: guest_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by guest ID
 *       - in: query
 *         name: event_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date
 *     responses:
 *       200:
 *         description: List of event bookings
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
router.get('/bookings', eventsController.getAllEventBookings);

/**
 * @swagger
 * /api/events/bookings/{id}:
 *   get:
 *     summary: Get event booking by ID
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
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/EventBooking' }
 *       404:
 *         description: Booking not found
 */
router.get('/bookings/:id', eventsController.getEventBookingById);

/**
 * @swagger
 * /api/events/bookings:
 *   post:
 *     summary: Create an event booking
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
 *               - space_id
 *               - event_name
 *               - event_date
 *               - start_time
 *               - end_time
 *               - guest_count
 *             properties:
 *               guest_id: { type: string, format: uuid }
 *               space_id: { type: integer }
 *               event_name: { type: string }
 *               event_type: { type: string }
 *               event_date: { type: string, format: date }
 *               start_time: { type: string, format: time }
 *               end_time: { type: string, format: time }
 *               guest_count: { type: integer }
 *               total_price: { type: number }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Event booking created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/EventBooking' }
 */
router.post('/bookings', eventsController.createEventBooking);

/**
 * @swagger
 * /api/events/bookings/{id}:
 *   put:
 *     summary: Update event booking status
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
 *               status: { type: string, enum: [pending, confirmed, completed, cancelled] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Event booking updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/EventBooking' }
 *       404:
 *         description: Event booking not found
 */
router.put('/bookings/:id', eventsController.updateEventBooking);

module.exports = router;
