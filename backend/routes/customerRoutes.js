// backend/routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const { createCustomer, getAllCustomers } = require('../controllers/customerController');
// --- Import protect middleware ---
const { protect } = require('../middleware/authMiddleware');

// --- Apply protect middleware to all routes in this file ---
router.use(protect);

// Define protected routes
router.route('/')
  .post(createCustomer)
  .get(getAllCustomers);

// Add protected routes for /:id (getCustomerById, updateCustomer, deleteCustomer) later

module.exports = router;