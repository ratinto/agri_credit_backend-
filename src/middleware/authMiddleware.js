const { verifyToken } = require('../utils/jwtHelper');

/**
 * Middleware to authenticate JWT token
 */
const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'No token provided. Access denied.' 
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify token
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({ 
                error: 'Invalid or expired token. Access denied.' 
            });
        }

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(500).json({ 
            error: 'Authentication error',
            message: error.message 
        });
    }
};

module.exports = authMiddleware;
