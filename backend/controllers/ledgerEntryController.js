// backend/controllers/ledgerEntryController.js
const { Op } = require('sequelize'); // Import Sequelize operators like Op.between, Op.or etc.
const { LedgerEntry, Customer, Item } = require('../models'); // Import models using central index

// @desc    Create a new Ledger Entry
// @route   POST /api/ledger
// @access  Public (Protected via router middleware)
const createLedgerEntry = async (req, res) => {
  try {
    // --- Destructure required and optional fields from request body ---
    const { customerId, itemId, quantity, startDate, endDate, notes } = req.body;

    // --- Input Validation ---
    if (!customerId || !itemId || quantity === undefined || !startDate) {
      return res.status(400).json({ message: 'Missing required fields: customerId, itemId, quantity, startDate' });
    }
    // Validate quantity
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0 || !Number.isInteger(numQuantity)) { // Ensure positive integer
        return res.status(400).json({ message: 'Quantity must be a positive whole number.' });
    }
    // Validate dates
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ message: 'Invalid start date format.' });
    }
    let parsedEndDate = null; // Default end date to null
    if (endDate && endDate !== '') { // Only parse if endDate is provided and not empty
        parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
            return res.status(400).json({ message: 'Invalid end date format.' });
        }
        // Ensure end date is not before start date
        if (parsedEndDate < parsedStartDate) {
            return res.status(400).json({ message: 'End date cannot be before start date.' });
        }
    }
    // --- End Validation ---

    // --- Check Foreign Key Existence ---
    // Find the referenced Item to get current price/VAT and validate existence
    const item = await Item.findByPk(itemId, { attributes: ['id', 'unitPriceWithoutVAT', 'vatRate', 'currency', 'unit', 'name'] }); // Fetch only needed fields
    if (!item) {
        return res.status(404).json({ message: `Item with ID ${itemId} not found.` });
    }
    // Validate Customer existence
    const customer = await Customer.findByPk(customerId, { attributes: ['id', 'name'] }); // Fetch minimal fields for validation
    if (!customer) {
        return res.status(404).json({ message: `Customer with ID ${customerId} not found.` });
    }
    // --- End FK Check ---


    // --- Create Ledger Entry ---
    const newEntry = await LedgerEntry.create({
      customerId,
      itemId,
      quantity: numQuantity,
      startDate: parsedStartDate, // Use validated start date
      endDate: parsedEndDate,    // Use validated end date (null if not provided/invalid)
      notes: notes || null,      // Use notes or null
      // Snapshot the price/rate from the Item at the time of entry
      recordedPriceWithoutVAT: item.unitPriceWithoutVAT,
      recordedVatRate: item.vatRate,
      billingStatus: 'unbilled', // Default status
      // invoiceId starts as null by default
    });
    // --- End Create ---

    // --- Fetch created entry with details for response ---
    // Optional: Respond with the created entry including associated data
    // Useful for frontend to display details immediately
    const entryWithDetails = await LedgerEntry.findByPk(newEntry.id, {
         include: [
            // Include associated customer, selecting specific attributes
            { model: Customer, as: 'customer', attributes: ['id', 'name'] },
            // Include associated item, selecting specific attributes
            { model: Item, as: 'item', attributes: ['id', 'name', 'unit'] }
        ]
    });

    // Send success response
    res.status(201).json(entryWithDetails || newEntry); // Fallback to basic entry if include fails

  } catch (error) {
     // --- Error Handling ---
     console.error("Error creating ledger entry:", error);
     // Handle known Sequelize validation errors
     if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => err.message);
        return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` });
     }
     // Handle foreign key constraint errors (if somehow validation passed but DB fails)
     if (error.name === 'SequelizeForeignKeyConstraintError') {
         return res.status(400).json({ message: 'Invalid customerId or itemId referenced.' });
     }
     // Handle other potential database errors
      if (error.name === 'SequelizeDatabaseError') {
        return res.status(400).json({ message: `Database Error: ${error.message}` });
    }
    // Generic server error fallback
    res.status(500).json({ message: 'Server error creating ledger entry.' });
  }
};

// @desc    Get Ledger Entries (with optional filtering)
// @route   GET /api/ledger
// @access  Public (Protected via router middleware)
const getLedgerEntries = async (req, res) => {
  try {
    // Destructure potential query parameters for filtering
    const { customerId, itemId, startDate: filterStartDate, endDate: filterEndDate, billingStatus } = req.query;

    // Build the 'where' clause for the Sequelize query dynamically
    const whereClause = {};
    if (customerId) whereClause.customerId = customerId;
    if (itemId) whereClause.itemId = itemId;
    if (billingStatus) whereClause.billingStatus = billingStatus;

    // --- Handle Date Range Filtering (Find overlapping entries) ---
    if (filterStartDate || filterEndDate) {
        const start = filterStartDate ? new Date(filterStartDate) : null;
        const end = filterEndDate ? new Date(filterEndDate) : null;
        // Validate parsed dates
        const validStart = start && !isNaN(start);
        const validEnd = end && !isNaN(end);

        if (validStart) start.setHours(0, 0, 0, 0); // Set to start of day
        if (validEnd) end.setHours(23, 59, 59, 999); // Set to end of day

        if (validStart && validEnd) {
            // Condition for overlap: Entry starts before filter ends AND entry ends after filter starts
            // Need to handle null endDate in entries correctly
            whereClause[Op.and] = [
                { startDate: { [Op.lte]: end } }, // Entry starts on or before the filter end date
                {
                    [Op.or]: [
                        { endDate: { [Op.gte]: start } }, // Entry ends on or after the filter start date
                        { endDate: { [Op.is]: null } }      // Or the entry has no end date (ongoing)
                    ]
                }
            ];
        } else if (validStart) {
            // Find entries ending on or after start date (or ongoing)
             whereClause[Op.or] = [
                { endDate: { [Op.gte]: start } },
                { endDate: { [Op.is]: null } }
             ];
        } else if (validEnd) {
            // Find entries starting on or before end date
            whereClause.startDate = { [Op.lte]: end };
        }
    }
    // --- End Date Range Filtering ---

    // Find all ledger entries matching the where clause
    const entries = await LedgerEntry.findAll({
      where: whereClause,
      include: [ // Eager load associated data for display
        {
          model: Customer,
          as: 'customer', // Use alias defined in association
          attributes: ['id', 'name', 'companyName'] // Select only needed customer fields
        },
        {
          model: Item,
          as: 'item', // Use alias defined in association
          attributes: ['id', 'name', 'unit', 'currency'] // Select only needed item fields
        }
        // Note: Invoice association is not included by default here, load if needed
      ],
      // Order results, e.g., by start date descending
      order: [['startDate', 'DESC'], ['createdAt', 'DESC']]
    });

    // Send the list of entries
    res.status(200).json(entries);

  } catch (error) {
    // --- Error Handling ---
    console.error("Error fetching ledger entries:", error);
    // Handle potential invalid date format errors from query params
     if (error instanceof Error && (error.message.includes("Invalid date"))) {
        return res.status(400).json({ message: 'Invalid date format provided for filtering.' });
    }
    // Generic server error fallback
    res.status(500).json({ message: 'Server error fetching ledger entries.' });
  }
};

// Export the controller functions
module.exports = {
  createLedgerEntry,
  getLedgerEntries,
  // Add getLedgerEntryById, updateLedgerEntry, deleteLedgerEntry later
};