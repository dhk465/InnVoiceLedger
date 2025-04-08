const express = require('express');
const router = express.Router();
const { createCustomer, getAllCustomers } = require('../controllers/customerController');

router.route('/')
  .post(createCustomer)
  .get(getAllCustomers);

// Add '/:id' routes later

module.exports = router;