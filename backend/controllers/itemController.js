const { Item } = require('../models'); // Import Item model from central db export

// @desc    Create a new Item
// @route   POST /api/items
// @access  Public (for now)
const createItem = async (req, res) => {
  try {
    // Get data from request body
    const {
      name,
      description,
      category,
      sku,
      unitPriceWithoutVAT, // Expect camelCase from JSON request
      vatRate,             // Expect camelCase from JSON request
      unit
    } = req.body;

    // Basic validation
    if (name === undefined || unitPriceWithoutVAT === undefined || vatRate === undefined) {
      return res.status(400).json({ message: 'Missing required fields: name, unitPriceWithoutVAT, vatRate' });
    }
    if (name.trim() === '') {
        return res.status(400).json({ message: 'Item name cannot be empty' });
    }

    // Create new item instance using model fields (which are camelCase)
    const newItem = await Item.create({
      name: name.trim(),
      description,
      category,
      sku: sku ? sku.trim() : null,
      unitPriceWithoutVAT,
      vatRate,
      unit // Will use default 'pcs' from model if not provided
    });

    res.status(201).json(newItem);

  } catch (error) {
    console.error('Error creating item:', error);
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => err.message);
        return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Conflict: An item with this SKU already exists.' });
    }
     if (error.name === 'SequelizeDatabaseError') {
        return res.status(400).json({ message: `Database Error: ${error.message}` });
    }
    res.status(500).json({ message: 'Server error while creating item' });
  }
};

// @desc    Get all Items
// @route   GET /api/items
// @access  Public (for now)
const getAllItems = async (req, res) => {
  try {
    const items = await Item.findAll({
      order: [['name', 'ASC']] // Optional: Order items alphabetically by name
    });
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Server error while fetching items' });
  }
};

// TODO: Add getItemById, updateItem, deleteItem later

module.exports = {
  createItem,
  getAllItems,
};