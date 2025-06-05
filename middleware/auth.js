const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to verify JWT tokens
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const auth = async (req, res, next) => {
    // get the authorization header from the request
    const authHeader = req.headers['authorization'];
    // check if the authorization header is present and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    // extract the token from the authorization header
    const token = authHeader.split(' ')[1];

    try {
        // verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        // attach the user id from the token to the request object
        req.user = { id: decoded.userId || decoded.id };
        // call the next middleware function
        next();
    } catch (err) {
        // handle token verification errors
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
