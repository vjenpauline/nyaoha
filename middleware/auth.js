const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to verify JWT tokens
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }

        // Check if the header follows Bearer scheme
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Invalid authentication format' });
        }

        // Extract the token
        const token = authHeader.replace('Bearer ', '');

        try {
            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Add user ID to request object
            req.userId = decoded.userId;
            
            // Proceed to the protected route
            next();
        } catch (error) {
            res.status(401).json({ message: 'Token is invalid or expired' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = auth;
