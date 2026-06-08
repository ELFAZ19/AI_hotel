const chapaService = require('./chapa.service');
const { pool } = require('../../config/db');

const initiatePayment = async (req, res, next) => {
  try {
    const { reservation_id, amount, email, first_name, last_name } = req.body;
    
    // Additional validation could be added here, such as verifying reservation belongs to req.user.id
    const result = await chapaService.initiatePayment({
      reservationId: reservation_id,
      amount,
      email: email || req.user.email,
      firstName: first_name || req.user.first_name,
      lastName: last_name || req.user.last_name
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    // If payment initialization fails, the room is stuck in "pending" status.
    // We must delete the reservation so the room becomes available again.
    if (req.body && req.body.reservation_id) {
      try {
        await pool.query('DELETE FROM reservations WHERE id = $1 AND status = $2', [req.body.reservation_id, 'pending']);
      } catch (dbError) {
        console.error('Failed to clean up stuck reservation:', dbError);
      }
    }
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { txRef } = req.params;
    const result = await chapaService.verifyPayment(txRef);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    // req.rawBody is captured by the modified express.json() in app.js
    const signature = req.headers['x-chapa-signature'] || req.headers['chapa-signature'];
    const result = await chapaService.handleWebhook(req.rawBody, signature);
    res.json(result);
  } catch (error) {
    // Webhook should probably return 200 even on error unless it's a signature mismatch, 
    // to prevent Chapa from retrying infinitely for logical errors.
    // But for signature errors, return 401.
    if (error.statusCode === 401) {
      return res.status(401).json({ message: error.message });
    }
    console.error('Webhook error:', error);
    res.status(200).json({ processed: false, error: error.message });
  }
};

const getPaymentByReservationId = async (req, res, next) => {
  try {
    const payment = await chapaService.getPaymentByReservationId(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  getPaymentByReservationId
};
