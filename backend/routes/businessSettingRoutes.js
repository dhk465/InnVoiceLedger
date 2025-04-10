// backend/routes/businessSettingRoutes.js
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/businessSettingController');

// Assuming fixed ID 1 for settings, route doesn't need an ID parameter
router.route('/') // Route will be mounted at /api/settings
    .get(getSettings)
    .put(updateSettings);

module.exports = router;