const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  createDoctorReview, 
} = require('../controllers/doctorController');

const authMiddleware = require('../middleware/authMiddleware');

router.route('/').get(getAllDoctors);
router.route('/:id').get(getDoctorById);

router.route('/:id/reviews').post(authMiddleware, createDoctorReview);

module.exports = router;