const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin dashboard and reporting endpoints
 */

// All admin routes require authentication and proper authorization
router.use(authenticate);
router.use(authorize('admin', 'manager'));

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard overview statistics (admin/manager only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics including overview, revenue, occupancy, and recent reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/DashboardStats' }
 */
router.get('/stats', adminController.getDashboardStats);

/**
 * @swagger
 * /api/admin/reports/revenue:
 *   get:
 *     summary: Get daily revenue report (admin/manager only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Array of daily revenue and reservation counts
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
 *                       date: { type: string, format: date }
 *                       revenue: { type: number }
 *                       reservations_count: { type: integer }
 *       400:
 *         description: Missing from or to parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/reports/revenue', adminController.getRevenueReport);

/**
 * @swagger
 * /api/admin/reports/occupancy:
 *   get:
 *     summary: Get daily occupancy report (admin/manager only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Array of daily occupancy statistics
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
 *                       date: { type: string, format: date }
 *                       occupied: { type: integer }
 *                       total: { type: integer }
 *                       occupancy_rate: { type: number }
 *       400:
 *         description: Missing from or to parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/reports/occupancy', adminController.getOccupancyReport);

module.exports = router;
