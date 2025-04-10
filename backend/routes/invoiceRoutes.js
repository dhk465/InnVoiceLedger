// backend/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
// --- UPDATED: Import getInvoices ---
const { generateInvoice, getInvoices /*, getInvoiceById */ } = require('../controllers/invoiceController');

// Route to generate a new invoice
router.post('/generate', generateInvoice);

// --- ADDED: Route to get list of invoices ---
router.get('/', getInvoices);

// TODO: Add route to get single invoice later
// router.get('/:id', getInvoiceById);

module.exports = router;