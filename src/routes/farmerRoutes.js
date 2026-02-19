const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');

router.get('/', farmerController.getFarmers);
router.get('/:id', farmerController.getFarmerById);

module.exports = router;
