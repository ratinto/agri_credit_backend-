const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');

// POST /api/v1/crop/add - Add new crop
router.post('/add', cropController.addCrop);

// GET /api/v1/crop/:farm_id - Get all crops for a farm
router.get('/:farm_id', cropController.getCropsByFarm);

// GET /api/v1/crop/details/:crop_id - Get specific crop details
router.get('/details/:crop_id', cropController.getCropDetails);

// PUT /api/v1/crop/update/:crop_id - Update crop status/harvest info
router.put('/update/:crop_id', cropController.updateCrop);

module.exports = router;
