const express = require('express');
const router = express.Router();
const trustScoreController = require('../controllers/trustScoreController');

// Trust Score routes
router.post('/calculate/:farmer_id', trustScoreController.calculateTrustScore);
router.get('/:farmer_id', trustScoreController.getTrustScore);

module.exports = router;
