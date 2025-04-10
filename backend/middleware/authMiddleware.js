// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Need User model to fetch user data

const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header (Bearer schema)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1) Get token from header
            token = req.headers.authorization.split(' ')[1]; // "Bearer TOKEN" -> "TOKEN"

            // 2) Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3) Find user based on token payload (e.g., id)
            // Fetch user data but exclude password hash
            req.user = await User.findByPk(decoded.id);
             // We use .toJSON() later or rely on the model's prototype override

            if (!req.user) {
                // User belonging to token no longer exists
                throw new Error('User not found');
            }

            // Grant access to the protected route
            next();

        } catch (error) {
            console.error('Authentication Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed.' }); // Unauthorized
        }
    }

    // If no token found in header
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token.' });
    }
};

module.exports = { protect };