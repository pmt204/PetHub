const express = require('express');
const router = express.Router();
const {
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctorController');

router.route('/').post(createDoctor);

router.route('/:id').put(updateDoctor).delete(deleteDoctor);

module.exports = router;