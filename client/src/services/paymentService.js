import api from '../lib/axios';

/**
 * Initiate a Chapa payment for a reservation (guest only)
 * @param {string} reservationId - Reservation UUID
 * @param {number} amount        - Payment amount
 * @returns {Promise<Object>} { checkoutUrl } — redirect user to this URL
 */
export const initiatePayment = async (reservationId, amount) => {
  const { data } = await api.post('/payments/initiate', {
    reservation_id: reservationId,
    amount,
  });
  return data;
};

/**
 * Verify a payment by its Chapa transaction reference (guest only)
 * @param {string} txRef - Chapa transaction reference
 * @returns {Promise<Object>} Payment verification result
 */
export const verifyPayment = async (txRef) => {
  const { data } = await api.get(`/payments/verify/${txRef}`);
  return data;
};

/**
 * Get payment details by reservation ID
 * @param {string} reservationId - Reservation UUID
 * @returns {Promise<Object>} Payment details for the reservation
 */
export const getPaymentByReservation = async (reservationId) => {
  const { data } = await api.get(`/payments/reservation/${reservationId}`);
  return data;
};
