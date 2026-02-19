const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/v1/auth/register - Register new farmer
router.post('/register', authController.registerFarmer);

// POST /api/v1/auth/login - Login farmer
router.post('/login', authController.loginFarmer);

// POST /api/v1/auth/reset-password - Reset password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
