// backend/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const { generateInvoice, getInvoices, getInvoiceById, downloadInvoicePDF } = require('../controllers/invoiceController');
// --- Import protect middleware ---
const { protect } = require('../middleware/authMiddleware');

// --- Apply protect middleware to all routes in this file ---
router.use(protect);

// Define protected routes
router.post('/generate', generateInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.get('/:id/pdf', downloadInvoicePDF);

module.exports = router;