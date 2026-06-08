const axios = require('axios');
const crypto = require('crypto');
const { pool } = require('../../config/db');

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const CHAPA_WEBHOOK_SECRET = process.env.CHAPA_WEBHOOK_SECRET;
const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const initiatePayment = async ({ reservationId, amount, email, firstName, lastName }) => {
  const txRef = `ADANE-${reservationId.slice(0, 8)}-${Date.now()}`;
  
  const payload = {
    amount: amount.toString(),
    currency: 'ETB',
    email,
    first_name: firstName,
    last_name: lastName,
    tx_ref: txRef,
    callback_url: `${SERVER_URL}/api/payments/webhook`,
    return_url: `${CLIENT_URL}/booking/confirmation?tx_ref=${txRef}`,
    customization: {
      title: 'Adane Hotel',
      description: 'Payment for your stay'
    }
  };

  try {
    const response = await axios.post(`${CHAPA_BASE_URL}/transaction/initialize`, payload, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const chapaCheckoutUrl = response.data.data.checkout_url;

    await pool.query(
      `INSERT INTO payments (reservation_id, chapa_tx_ref, amount, chapa_checkout_url, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [reservationId, txRef, amount, chapaCheckoutUrl]
    );

    return { checkoutUrl: chapaCheckoutUrl, txRef };
  } catch (error) {
    const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error('Chapa Init Error:', error.response?.data || error.message);
    throw new Error('Payment initialization failed: ' + errorMsg);
  }
};

const verifyPayment = async (txRef) => {
  try {
    const response = await axios.get(`${CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`
      }
    });
    const data = response.data.data;

    // Fallback: If payment is successful but webhook hasn't hit yet, update DB now
    if (data.status === 'success') {
      const paymentResult = await pool.query('SELECT id, reservation_id, status FROM payments WHERE chapa_tx_ref = $1', [txRef]);
      const payment = paymentResult.rows[0];
      
      if (payment && payment.status !== 'success') {
        await pool.query(
          `UPDATE payments SET status = 'success', paid_at = NOW(), raw_response = $1, updated_at = NOW() WHERE chapa_tx_ref = $2`,
          [JSON.stringify(data), txRef]
        );
        await pool.query(
          `UPDATE reservations SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [payment.reservation_id]
        );
      }
    }

    return data;
  } catch (error) {
    throw new Error('Payment verification failed: ' + (error.response?.data?.message || error.message));
  }
};

const verifyWebhookSignature = (rawBody, chapaSignatureHeader) => {
  if (!CHAPA_WEBHOOK_SECRET) return true; // Or throw error depending on strictness
  if (!chapaSignatureHeader) return false;

  const expectedSignature = crypto
    .createHmac('sha256', CHAPA_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  // Must ensure both buffers are same length to use timingSafeEqual
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const providedBuffer = Buffer.from(chapaSignatureHeader, 'hex');

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
};

const handleWebhook = async (rawBody, signature) => {
  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    const error = new Error('Invalid signature');
    error.statusCode = 401;
    throw error;
  }

  const payload = JSON.parse(rawBody.toString());
  const { tx_ref, status } = payload;

  if (status === 'success') {
    const paymentResult = await pool.query('SELECT id, reservation_id FROM payments WHERE chapa_tx_ref = $1', [tx_ref]);
    const payment = paymentResult.rows[0];

    if (!payment) {
      throw new Error('Payment record not found');
    }

    await pool.query(
      `UPDATE payments 
       SET status = 'success', paid_at = NOW(), raw_response = $1, updated_at = NOW()
       WHERE chapa_tx_ref = $2`,
      [JSON.stringify(payload), tx_ref]
    );

    await pool.query(
      `UPDATE reservations 
       SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [payment.reservation_id]
    );
  }

  return { processed: true };
};

const getPaymentByReservationId = async (reservationId) => {
  const result = await pool.query('SELECT * FROM payments WHERE reservation_id = $1 ORDER BY created_at DESC LIMIT 1', [reservationId]);
  return result.rows[0];
};

module.exports = {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  getPaymentByReservationId
};
