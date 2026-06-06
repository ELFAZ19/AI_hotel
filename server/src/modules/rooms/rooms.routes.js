const express = require('express');
const router = express.Router();
const roomsController = require('./rooms.controller');
// const { authenticate, authorize } = require('../../middleware/authMiddleware'); 
// Assuming there might be auth middleware later

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Room and Room Type management
 */

/**
 * @swagger
 * /api/rooms/types:
 *   get:
 *     summary: Get all room types
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: List of room types
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
 */
router.get('/types/:id', roomsController.getRoomTypeById);

/**
 * @swagger
 * /api/rooms/types:
 *   post:
 *     summary: Create a new room type
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
 *               name: { type: string }
 *               description: { type: string }
 *               base_price: { type: number }
 *               max_guests: { type: integer, default: 2 }
 *               amenities: { type: array, items: { type: string } }
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
router.post('/types', roomsController.createRoomType);

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by room status
 *       - in: query
 *         name: type
 *         schema:
 *           type: integer
 *         description: Filter by room type ID
 *     responses:
 *       200:
 *         description: List of rooms
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
 * /api/rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Room details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Room' }
 *       404:
 *         description: Room not found
 */
router.get('/:id', roomsController.getRoomById);

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room
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
 *               room_number: { type: string }
 *               room_type_id: { type: integer }
 *               floor: { type: integer }
 *               status: { type: string, enum: [available, occupied, maintenance, inactive] }
 *               price_override: { type: number }
 *               description: { type: string }
 *               is_active: { type: boolean }
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
router.post('/', roomsController.createRoom);

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Update room details
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
 */
router.put('/:id', roomsController.updateRoom);

module.exports = router;
