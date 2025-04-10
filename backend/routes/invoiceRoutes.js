// backend/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const { generateInvoice } = require('../controllers/invoiceController');

router.post('/generate', generateInvoice);

// TODO: Add GET routes later

module.exports = router;