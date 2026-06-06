const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management and webhook integration
 */

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Payment' }
 */
router.get('/', paymentsController.getAllPayments);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
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
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Payment' }
 *       404:
 *         description: Payment not found
 */
router.get('/:id', paymentsController.getPaymentById);

/**
 * @swagger
 * /api/payments/initialize:
 *   post:
 *     summary: Initialize a new Chapa payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservation_id
 *               - amount
 *             properties:
 *               reservation_id: { type: string, format: uuid }
 *               amount: { type: number }
 *               currency: { type: string, default: 'ETB' }
 *     responses:
 *       201:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Payment' }
 */
router.post('/initialize', paymentsController.initializePayment);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Chapa webhook endpoint
 *     tags: [Payments]
 *     description: Receives payment status updates from Chapa.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trx_ref: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Webhook received successfully
 */
router.post('/webhook', paymentsController.handleWebhook); // For Chapa webhook

module.exports = router;
