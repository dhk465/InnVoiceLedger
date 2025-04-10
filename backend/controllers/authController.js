// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Helper to generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId }, // Payload: typically user ID, maybe role
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } // Use expiry from .env or default
    );
};

// @desc    Register a new User (Simplified - First user becomes owner/admin?)
// @route   POST /api/auth/register
// @access  Public (Only for initial setup or specific logic)
const registerUser = async (req, res) => {
    // !! WARNING: Basic registration. In real app, control who can register.
    // Perhaps only allow registration if NO users exist yet?
    const userCount = await User.count();
    if (userCount > 0) { // Simple protection: only allow first user registration via API
       return res.status(403).json({ message: 'Registration not allowed.' });
    }

    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }
     if (password.length < 6) { // Example minimum length
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered.' }); // 409 Conflict
        }

        // Create user (password hashing is handled by the model hook)
        const newUser = await User.create({
            email: email.toLowerCase(),
            passwordHash: password // Pass plain password, hook will hash it
        });

        // Generate token upon successful registration
        const token = generateToken(newUser.id);

        // Don't send password hash back
        const userResponse = newUser.toJSON(); // Uses the prototype override

        res.status(201).json({
            user: userResponse,
            token: token,
            message: 'User registered successfully.'
        });

    } catch (error) {
        console.error("Error registering user:", error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};


// @desc    Authenticate User & Get Token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ where: { email: email.toLowerCase() } });

        // Check if user exists and password matches
        // Use the instance method 'isValidPassword' we defined in the model
        if (user && (await user.isValidPassword(password))) {
            // Generate token
            const token = generateToken(user.id);

            // Send back user info (without hash) and token
            res.status(200).json({
                user: user.toJSON(), // Excludes password hash
                token: token
            });
        } else {
            // Generic error for invalid credentials
            res.status(401).json({ message: 'Invalid email or password.' }); // Unauthorized
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// @desc    Get current logged-in user data (requires token)
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    // User data is attached to req.user by the protect middleware (created next)
    if (req.user) {
        res.status(200).json(req.user); // req.user should already be sanitized (no hash)
    } else {
        // Should not happen if protect middleware is working
        res.status(404).json({ message: 'User not found (token invalid or missing).' });
    }
};


module.exports = {
    registerUser,
    loginUser,
    getMe,
};