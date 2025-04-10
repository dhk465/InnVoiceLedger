// backend/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const { generateInvoice, getInvoices, getInvoiceById, downloadInvoicePDF } = require('../controllers/invoiceController');

// Route to generate a new invoice
router.post('/generate', generateInvoice);

// Route to get list of invoices
router.get('/', getInvoices);

// Route to get single invoice by ID
// Make sure this is defined AFTER specific routes like '/generate' if they could conflict
router.get('/:id', getInvoiceById);

// --- Route to download PDF ---
router.get('/:id/pdf', downloadInvoicePDF);

module.exports = router;