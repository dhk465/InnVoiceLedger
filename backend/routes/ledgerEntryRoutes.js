const express = require('express');
const router = express.Router();
const { createLedgerEntry, getLedgerEntries } = require('../controllers/ledgerEntryController');

router.route('/')
  .post(createLedgerEntry)
  .get(getLedgerEntries);

// Add '/:id' routes later

module.exports = router;