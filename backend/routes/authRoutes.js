// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware (created next)

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private route - requires valid token
router.get('/me', protect, getMe); // Apply protect middleware here

module.exports = router;