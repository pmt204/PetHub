const express = require('express');
const router = express.Router();
const paymentMoMoController = require('../controllers/paymentMoMoController');

router.get('/momo_return', paymentMoMoController.momoReturn);

router.post('/momo_notify', paymentMoMoController.momoNotify);

router.post('/create', paymentMoMoController.createMoMoPaymentLink);

module.exports = router;