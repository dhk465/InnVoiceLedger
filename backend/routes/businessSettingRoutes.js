// backend/routes/businessSettingRoutes.js
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/businessSettingController');
// --- Import protect middleware ---
const { protect } = require('../middleware/authMiddleware');

// --- Apply protect middleware to all routes in this file ---
router.use(protect);

// Define protected routes (mounted at /api/settings)
router.route('/')
    .get(getSettings)
    .put(updateSettings);

module.exports = router;