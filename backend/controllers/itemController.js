// backend/controllers/itemController.js
const { Item } = require("../models"); // Uses central export

// @desc    Create a new Item
// @route   POST /api/items
// @access  Public (Protected via router)
const createItem = async (req, res) => {
  try {
    // Get data from request body
    const {
      name,
      description,
      category,
      sku,
      unitPriceWithoutVAT,
      currency,
      vatRate,
      unit, // Get unit from body (frontend will send selected value)
    } = req.body;

    // --- Basic Validation (Model handles unit specifics) ---
    if (
      name === undefined ||
      unitPriceWithoutVAT === undefined ||
      currency === undefined ||
      vatRate === undefined ||
      unit === undefined
    ) {
      // Check unit too
      return res
        .status(400)
        .json({
          message:
            "Missing required fields: name, unitPriceWithoutVAT, currency, vatRate, unit",
        });
    }
    if (name.trim() === "") {
      return res.status(400).json({ message: "Item name cannot be empty" });
    }
    if (!currency || currency.trim().length !== 3) {
      return res
        .status(400)
        .json({ message: "Currency must be a 3-letter code." });
    }
    // --- End Basic Validation ---

    // Create new item instance - Model validation handles 'unit' check now
    const newItem = await Item.create({
      name: name.trim(),
      description: description || null,
      category: category || null,
      sku: sku ? sku.trim() : null,
      unitPriceWithoutVAT: parseFloat(unitPriceWithoutVAT), // Ensure number
      currency: currency.trim().toUpperCase(),
      vatRate: parseFloat(vatRate), // Ensure number
      unit: unit, // Pass the unit from the request body
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating item:", error);
    // Existing catch block handles SequelizeValidationError (which now includes unit check)
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message);
      return res
        .status(400)
        .json({ message: `Validation Error: ${messages.join(", ")}` });
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "Conflict: An item with this SKU already exists." });
    }
    if (error.name === "SequelizeDatabaseError") {
      return res
        .status(400)
        .json({ message: `Database Error: ${error.message}` });
    }
    // Generic fallback
    res.status(500).json({ message: "Server error while creating item" });
  }
};

// @desc    Get all Items
// @route   GET /api/items
// @access  Public (Protected via router)
const getAllItems = async (req, res) => {
  try {
    const items = await Item.findAll({
      order: [["name", "ASC"]],
    });
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Server error while fetching items" });
  }
};

// Export controller functions
module.exports = {
  createItem,
  getAllItems,
  // Add update/delete/getById later
};
