const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin dashboard and analytics
 */

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get comprehensive hotel statistics
 *     tags: [Admin, Analytics]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves aggregated metrics for reservations, rooms, revenue, events, and restaurant bookings.
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     rooms:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         available: { type: integer }
 *                         occupied: { type: integer }
 *                         maintenance: { type: integer }
 *                     reservations:
 *                       type: object
 *                       properties:
 *                         pending: { type: integer }
 *                         confirmed: { type: integer }
 *                         checked_in: { type: integer }
 *                     finances:
 *                       type: object
 *                       properties:
 *                         total_revenue: { type: number }
 *                         pending_payments: { type: number }
 *                     restaurant:
 *                       type: object
 *                       properties:
 *                         today_reservations: { type: integer }
 *                     events:
 *                       type: object
 *                       properties:
 *                         upcoming_events: { type: integer }
 */
router.get('/stats', adminController.getDashboardStats);

module.exports = router;
