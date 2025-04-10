// backend/controllers/businessSettingController.js
const { BusinessSetting } = require('../models'); // Import model

const SETTINGS_ID = 1; // Use the fixed ID for the single settings row

// @desc    Get Business Settings
// @route   GET /api/settings
// @access  Private (needs auth later)
const getSettings = async (req, res) => {
    try {
        const settings = await BusinessSetting.findByPk(SETTINGS_ID);
        if (!settings) {
            // This shouldn't happen if seeding worked, but handle defensively
            return res.status(404).json({ message: 'Business settings not found.' });
        }
        res.status(200).json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: 'Server error fetching settings.' });
    }
};

// @desc    Update Business Settings
// @route   PUT /api/settings
// @access  Private (needs auth later)
const updateSettings = async (req, res) => {
    try {
        // Allow updating specific fields
        const { businessName, defaultCurrency, address, vatId } = req.body;

        // Find the settings record
        const settings = await BusinessSetting.findByPk(SETTINGS_ID);
        if (!settings) {
            return res.status(404).json({ message: 'Business settings not found.' });
        }

        // Prepare update data, only including fields that were provided in the request
        const updateData = {};
        if (businessName !== undefined) updateData.businessName = businessName.trim() || null;
        if (defaultCurrency !== undefined) {
             if (typeof defaultCurrency === 'string' && defaultCurrency.trim().length === 3) {
                 updateData.defaultCurrency = defaultCurrency.trim().toUpperCase();
             } else {
                 return res.status(400).json({ message: 'Invalid default currency format. Must be 3 letters.' });
             }
        }
        if (address !== undefined) updateData.address = address.trim() || null;
        if (vatId !== undefined) updateData.vatId = vatId.trim() || null;

        // Update the record
        await settings.update(updateData);

        res.status(200).json(settings); // Return updated settings

    } catch (error) {
        console.error("Error updating settings:", error);
         if (error.name === 'SequelizeValidationError') {
             const messages = error.errors.map(err => err.message);
             return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: 'Server error updating settings.' });
    }
};

module.exports = {
    getSettings,
    updateSettings,
};