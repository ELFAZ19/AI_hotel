const { pool } = require('../../config/db');

const getAllPayments = async () => {
  const result = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
  return result.rows;
};

const getPaymentById = async (id) => {
  const result = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
  return result.rows[0];
};

const initializePayment = async (data) => {
  const { reservation_id, amount, currency } = data;
  // In a real implementation, you would call Chapa API here to initialize
  // and get the checkout URL.
  // const chapaResponse = await chapa.initialize({ ... })
  
  const chapa_tx_ref = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const chapa_checkout_url = `https://checkout.chapa.co/checkout/payment-link/${chapa_tx_ref}`; // Mock URL
  
  const result = await pool.query(
    `INSERT INTO payments (reservation_id, chapa_tx_ref, amount, currency, chapa_checkout_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [reservation_id, chapa_tx_ref, amount, currency || 'ETB', chapa_checkout_url]
  );
  
  return result.rows[0];
};

const updatePaymentStatus = async (chapa_tx_ref, status, raw_response) => {
  // Map Chapa status to our enum: 'pending', 'success', 'failed', 'refunded'
  let mappedStatus = 'pending';
  if (status === 'success' || status === 'successful') mappedStatus = 'success';
  if (status === 'failed') mappedStatus = 'failed';
  
  const result = await pool.query(
    `UPDATE payments 
     SET status = $1, raw_response = $2, paid_at = CASE WHEN $1 = 'success' THEN NOW() ELSE paid_at END
     WHERE chapa_tx_ref = $3 RETURNING *`,
    [mappedStatus, raw_response, chapa_tx_ref]
  );
  
  return result.rows[0];
};

module.exports = {
  getAllPayments,
  getPaymentById,
  initializePayment,
  updatePaymentStatus
};
