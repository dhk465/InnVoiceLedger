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

// Define routes mapping to controller functions

// Route for GET /api/items and POST /api/items
router.route('/')
  .get(getAllItems)
  .post(createItem);

// Routes for specific items by ID (will add later)
// Example:
// router.route('/:id')
//   .get(getItemById)
//   .put(updateItem)
//   .delete(deleteItem);

module.exports = router; // Export the router