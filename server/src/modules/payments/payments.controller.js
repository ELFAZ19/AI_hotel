const paymentsService = require('./payments.service');

const getAllPayments = async (req, res, next) => {
  try {
    const payments = await paymentsService.getAllPayments();
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentsService.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const initializePayment = async (req, res, next) => {
  try {
    const paymentData = await paymentsService.initializePayment(req.body);
    res.status(201).json({ success: true, data: paymentData });
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    // Chapa sends webhook event, we should verify the signature in a real app
    // Here we assume simple payload containing status
    const { trx_ref, status } = req.body;
    await paymentsService.updatePaymentStatus(trx_ref, status, req.body);
    res.status(200).send('OK');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  initializePayment,
  handleWebhook
};
