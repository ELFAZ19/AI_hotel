const express = require('express');
const router = express.Router();
const roomsController = require('./rooms.controller');
const { authenticate, authorize } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Room and Room Type management
 */

// ======================== ROOM TYPES ========================

/**
 * @swagger
 * /api/rooms/types:
 *   get:
 *     summary: Get all room types
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: List of room types sorted by base_price ASC
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/RoomType' }
 */
router.get('/types', roomsController.getAllRoomTypes);

/**
 * @swagger
 * /api/rooms/types/{id}:
 *   get:
 *     summary: Get room type by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room type ID
 *     responses:
 *       200:
 *         description: Room type details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/RoomType' }
 *       404:
 *         description: Room type not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/types/:id', roomsController.getRoomTypeById);

/**
 * @swagger
 * /api/rooms/types:
 *   post:
 *     summary: Create a new room type (admin/manager only)
 *     tags: [Rooms]
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
 *               - base_price
 *             properties:
 *               name: { type: string, example: "Deluxe Suite" }
 *               description: { type: string, example: "Spacious suite with sea view" }
 *               base_price: { type: number, example: 3500 }
 *               max_guests: { type: integer, default: 2, example: 4 }
 *               amenities: { type: array, items: { type: string }, example: ["WiFi", "AC", "Mini Bar"] }
 *     responses:
 *       201:
 *         description: Created room type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/RoomType' }
 */
router.post('/types', authenticate, authorize('admin', 'manager'), roomsController.createRoomType);

// ======================== ROOMS ========================

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all active rooms
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, occupied, maintenance, inactive]
 *         description: Filter by room status
 *       - in: query
 *         name: type
 *         schema:
 *           type: integer
 *         description: Filter by room type ID
 *       - in: query
 *         name: floor
 *         schema:
 *           type: integer
 *         description: Filter by floor number
 *     responses:
 *       200:
 *         description: List of rooms with type info and primary image
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Room' }
 */
router.get('/', roomsController.getAllRooms);

/**
 * @swagger
 * /api/rooms/available:
 *   get:
 *     summary: Get rooms available for a date range
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: check_in
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-in date (YYYY-MM-DD)
 *       - in: query
 *         name: check_out
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-out date (YYYY-MM-DD)
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *         description: Minimum guest capacity required
 *       - in: query
 *         name: room_type_id
 *         schema:
 *           type: integer
 *         description: Filter by room type
 *     responses:
 *       200:
 *         description: List of available rooms (no conflicting reservations)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Room' }
 *       400:
 *         description: Missing check_in or check_out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/available', roomsController.getAvailableRooms);

/**
 * @swagger
 * /api/rooms/summary:
 *   get:
 *     summary: Get rooms grouped by type with availability count
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: check_in
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-in date (YYYY-MM-DD) for availability check
 *       - in: query
 *         name: check_out
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-out date (YYYY-MM-DD) for availability check
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *         description: Minimum guest capacity required
 *     responses:
 *       200:
 *         description: Room types with availability counts and a representative room
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       room_type_id: { type: integer }
 *                       room_type_name: { type: string }
 *                       description: { type: string }
 *                       base_price: { type: number }
 *                       max_guests: { type: integer }
 *                       amenities: { type: array, items: { type: string } }
 *                       total_count: { type: integer }
 *                       available_count: { type: integer }
 *                       representative_room: { type: object }
 */
router.get('/summary', roomsController.getRoomSummary);

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Get room by ID (includes all images)
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room UUID
 *     responses:
 *       200:
 *         description: Full room details with images array
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Room' }
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', roomsController.getRoomById);

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room (admin/manager only)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_number
 *               - room_type_id
 *               - floor
 *             properties:
 *               room_number: { type: string, example: "401" }
 *               room_type_id: { type: integer, example: 1 }
 *               floor: { type: integer, example: 4 }
 *               status: { type: string, enum: [available, occupied, maintenance, inactive], default: available }
 *               price_override: { type: number, nullable: true, example: 2000 }
 *               description: { type: string }
 *               is_active: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Created room
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Room' }
 */
router.post('/', authenticate, authorize('admin', 'manager'), roomsController.createRoom);

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Update room details (admin/manager only)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [available, occupied, maintenance, inactive] }
 *               price_override: { type: number }
 *               description: { type: string }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated room
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Room' }
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), roomsController.updateRoom);

module.exports = router;
