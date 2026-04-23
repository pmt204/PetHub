const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentVNPayController');

router.get('/vnpay_return', paymentController.vnpayReturn);

router.get('/vnpay_ipn', paymentController.vnpayIPN);

router.post('/create', paymentController.generatePaymentLink);

module.exports = router;