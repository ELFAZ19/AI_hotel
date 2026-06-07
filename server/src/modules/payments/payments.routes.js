const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');
const { authenticate, authorize } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Chapa payment integration
 */

// ======================== WEBHOOK (no auth) ========================

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Chapa webhook callback (server-to-server)
 *     tags: [Payments]
 *     description: >
 *       Called by Chapa's servers when a payment event occurs.
 *       Validates the HMAC SHA256 signature in the `x-chapa-signature` header
 *       against `req.rawBody`. Do NOT call this manually.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tx_ref: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Invalid signature
 */
router.post(
  '/webhook',
  paymentsController.handleWebhook
);

// All other routes require authentication
router.use(authenticate);

// ======================== GUEST ROUTES ========================

/**
 * @swagger
 * /api/payments/initiate:
 *   post:
 *     summary: Initiate a Chapa payment for a reservation (guest only)
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
 *               amount: { type: number, example: 3000 }
 *     responses:
 *       200:
 *         description: Returns a Chapa checkout URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     checkoutUrl: { type: string, format: uri }
 *       400:
 *         description: Validation or payment initiation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/initiate',
  authorize('guest'),
  paymentsController.initiatePayment
);

/**
 * @swagger
 * /api/payments/verify/{txRef}:
 *   get:
 *     summary: Verify a payment by transaction reference (guest only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: txRef
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapa transaction reference
 *     responses:
 *       200:
 *         description: Payment verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Payment' }
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/verify/:txRef',
  authorize('guest'),
  paymentsController.verifyPayment
);

// ======================== SHARED ROUTES ========================

/**
 * @swagger
 * /api/payments/reservation/{id}:
 *   get:
 *     summary: Get payment details by reservation ID
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
 *         description: Reservation UUID
 *     responses:
 *       200:
 *         description: Payment details for the reservation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Payment' }
 *       404:
 *         description: No payment found for this reservation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/reservation/:id',
  paymentsController.getPaymentByReservationId
);

module.exports = router;
