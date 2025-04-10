// backend/routes/ledgerEntryRoutes.js
const express = require('express');
const router = express.Router();
const { createLedgerEntry, getLedgerEntries } = require('../controllers/ledgerEntryController');
// --- Import protect middleware ---
const { protect } = require('../middleware/authMiddleware');

// --- Apply protect middleware to all routes in this file ---
router.use(protect);

// Define protected routes
router.route('/')
  .post(createLedgerEntry)
  .get(getLedgerEntries);

// Add protected routes for /:id (getLedgerEntryById, updateLedgerEntry, deleteLedgerEntry) later

module.exports = router;