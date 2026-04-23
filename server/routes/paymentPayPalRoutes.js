const express = require('express');
const router = express.Router();
const paymentPayPalController = require('../controllers/paymentPayPalController');
const authMiddleware = require('../middleware/authMiddleware'); 

router.post('/create-order', authMiddleware, paymentPayPalController.createOrder);

router.post('/capture-order', authMiddleware, paymentPayPalController.captureOrder);

module.exports = router;