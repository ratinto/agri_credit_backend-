const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'agri-credit-secret-key-2026';
const JWT_EXPIRY = '7d'; // 7 days

/**
 * Generate JWT token
 */
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken,
    JWT_SECRET
};
