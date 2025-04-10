const express = require('express');
const router = express.Router();

// Import controller functions
const {
  createItem,
  getAllItems,
  // getItemById, // Add later
  // updateItem, // Add later
  // deleteItem  // Add later
} = require('../controllers/itemController'); // Adjust path if needed

// Import protect
const { protect } = require('../middleware/authMiddleware');

// Apply protect middleware to all routes in this file
router.use(protect);

// Define routes (protected)
router.route('/')
  .post(createItem)
  .get(getAllItems);

// Add protected routes for /:id later

module.exports = router; // Export the router