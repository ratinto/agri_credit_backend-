const express = require('express');
const router = express.Router();
const validationController = require('../controllers/validationController');

// GET /api/v1/validation/ndvi/:farm_id - Fetch NDVI for a farm
router.get('/ndvi/:farm_id', validationController.fetchNDVI);

// GET /api/v1/validation/weather/:farm_id - Fetch weather data
router.get('/weather/:farm_id', validationController.fetchWeather);

// GET /api/v1/validation/market-price/:crop - Fetch market price
router.get('/market-price/:crop', validationController.fetchMarketPrice);

module.exports = router;
