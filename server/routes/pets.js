const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, petController.getPets);
router.post('/', authMiddleware, petController.createPet);
router.get('/:petId/service-history', authMiddleware, petController.getServiceHistory);
router.get('/:id', authMiddleware, petController.getPetById);
router.put('/:id', authMiddleware, petController.updatePet);
router.delete('/:id', authMiddleware, petController.deletePet);

module.exports = router;