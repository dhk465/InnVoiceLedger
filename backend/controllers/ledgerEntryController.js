const { Op } = require('sequelize'); // Import Op for operators like 'between'
// Import required models from central db export
const { LedgerEntry, Customer, Item } = require('../models');


// @desc    Create a new Ledger Entry
// @route   POST /api/ledger
// @access  Public (for now)
const createLedgerEntry = async (req, res) => {
  try {
    const { customerId, itemId, quantity, entryDate, notes } = req.body;

    // --- Validation ---
    if (!customerId || !itemId || quantity === undefined) { // Check quantity for undefined/null
      return res.status(400).json({ message: 'Missing required fields: customerId, itemId, quantity' });
    }
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) { // Basic quantity validation
        return res.status(400).json({ message: 'Quantity must be a positive number.' });
    }


    // Find the referenced Item to get current price/VAT and validate existence
    const item = await Item.findByPk(itemId);
    if (!item) {
        return res.status(404).json({ message: `Item with ID ${itemId} not found.` });
    }
    // Validate Customer existence
    const customer = await Customer.findByPk(customerId);
     if (!customer) {
        return res.status(404).json({ message: `Customer with ID ${customerId} not found.` });
    }
    // --- End Validation ---

    const newEntry = await LedgerEntry.create({
      customerId,
      itemId,
      quantity: numQuantity, // Use validated number
      entryDate: entryDate ? new Date(entryDate) : new Date(), // Allow specific date or default to now
      notes,
      // Record price/VAT from the Item at the time of entry
      recordedPriceWithoutVAT: item.unitPriceWithoutVAT,
      recordedVatRate: item.vatRate,
      billingStatus: 'unbilled', // Default status
    });

    // Optional: Respond with the created entry including associated data
    // Useful for frontend to display details immediately
    const entryWithDetails = await LedgerEntry.findByPk(newEntry.id, {
         include: [
            { model: Customer, as: 'customer', attributes: ['id', 'name'] }, // Use alias 'customer'
            { model: Item, as: 'item', attributes: ['id', 'name', 'unit'] } // Use alias 'item'
        ]
    });

    res.status(201).json(entryWithDetails || newEntry);

  } catch (error) {
     console.error("Error creating ledger entry:", error);
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => err.message);
        return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` });
    }
     if (error.name === 'SequelizeForeignKeyConstraintError') {
         // This error might occur if somehow customerId/itemId passed initial check but failed DB constraint
         return res.status(400).json({ message: 'Database constraint error: Invalid customerId or itemId.' });
     }
      if (error.name === 'SequelizeDatabaseError') {
        return res.status(400).json({ message: `Database Error: ${error.message}` });
    }
    res.status(500).json({ message: 'Server error creating ledger entry.' });
  }
};

// @desc    Get Ledger Entries (with filtering)
// @route   GET /api/ledger
// @access  Public (for now)
const getLedgerEntries = async (req, res) => {
  try {
    // Destructure query parameters
    const { customerId, itemId, startDate, endDate, billingStatus } = req.query;

    // Build the where clause dynamically based on provided filters
    const whereClause = {};
    if (customerId) whereClause.customerId = customerId;
    if (itemId) whereClause.itemId = itemId;
    if (billingStatus) whereClause.billingStatus = billingStatus;

    // Handle date range filtering
    if (startDate || endDate) {
        whereClause.entryDate = {};
        if (startDate) {
            // Ensure startDate is parsed correctly and represents start of the day
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            whereClause.entryDate[Op.gte] = start;
        }
        if (endDate) {
            // Ensure endDate is parsed correctly and represents end of the day
             const end = new Date(endDate);
             end.setHours(23, 59, 59, 999);
            whereClause.entryDate[Op.lte] = end;
        }
    }

    const entries = await LedgerEntry.findAll({
      where: whereClause,
      include: [ // Eager load associated data using defined aliases
        {
          model: Customer,
          as: 'customer', // Use the alias defined in LedgerEntry.associate
          attributes: ['id', 'name', 'companyName'] // Select only needed customer fields
        },
        {
          model: Item,
          as: 'item', // Use the alias defined in LedgerEntry.associate
          attributes: ['id', 'name', 'unit', 'description'] // Select only needed item fields
        }
      ],
      order: [['entryDate', 'DESC'], ['createdAt', 'DESC']] // Show most recent first
    });

    res.status(200).json(entries);

  } catch (error) {
    console.error("Error fetching ledger entries:", error);
    // Handle potential invalid date format errors
     if (error instanceof Error && (error.message.includes("Invalid date") || error.name === 'TypeError')) {
        return res.status(400).json({ message: 'Invalid date format provided for startDate or endDate.' });
    }
    res.status(500).json({ message: 'Server error fetching ledger entries.' });
  }
};

// TODO: Add getLedgerEntryById, updateLedgerEntry, deleteLedgerEntry later

module.exports = {
  createLedgerEntry,
  getLedgerEntries,
};