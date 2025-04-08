const { Customer } = require('../models'); // Import Customer model from central db export

// @desc    Create a new Customer
// @route   POST /api/customers
// @access  Public (for now)
const createCustomer = async (req, res) => {
  try {
    const { name, companyName, email, phone, address, vatId, notes } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Customer name is required.' });
    }

    const newCustomer = await Customer.create({
      name: name.trim(),
      companyName,
      email: email ? email.trim().toLowerCase() : null,
      phone,
      address,
      vatId,
      notes
    });
    res.status(201).json(newCustomer);

  } catch (error) {
    console.error("Error creating customer:", error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors.map(err => err.message);
        // Use 409 Conflict for unique constraint errors if possible
        const statusCode = error.name === 'SequelizeUniqueConstraintError' ? 409 : 400;
        return res.status(statusCode).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error creating customer.' });
  }
};

// @desc    Get all Customers
// @route   GET /api/customers
// @access  Public (for now)
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({ order: [['name', 'ASC']] });
    res.status(200).json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: 'Server error fetching customers.' });
  }
};

// TODO: Add getCustomerById, updateCustomer, deleteCustomer later as needed

module.exports = {
  createCustomer,
  getAllCustomers,
};