// backend/controllers/itemController.js
const { Item } = require('../models'); // Uses central export

// @desc    Create a new Item
// @route   POST /api/items
// @access  Public (for now)
const createItem = async (req, res) => {
  try {
    const {
      name, description, category, sku,
      unitPriceWithoutVAT, currency, // <-- Expect currency in body
      vatRate, unit
    } = req.body;

    // --- Updated Validation ---
    if (name === undefined || unitPriceWithoutVAT === undefined || currency === undefined || vatRate === undefined) {
      return res.status(400).json({ message: 'Missing required fields: name, unitPriceWithoutVAT, currency, vatRate' });
    }
    if (name.trim() === '') {
      return res.status(400).json({ message: 'Item name cannot be empty' });
    }
    if (!currency || currency.trim().length !== 3) {
       return res.status(400).json({ message: 'Currency must be a 3-letter code (e.g., CZK, EUR).' });
    }
    // --- End Updated Validation ---

    const newItem = await Item.create({
      name: name.trim(),
      description,
      category,
      sku: sku ? sku.trim() : null,
      unitPriceWithoutVAT,
      currency: currency.trim().toUpperCase(), // <-- Pass currency to create
      vatRate,
      unit
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
      order: [['name', 'ASC']]
    });
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Server error while fetching items' });
  }
};

module.exports = {
  createItem,
  getAllItems,
};