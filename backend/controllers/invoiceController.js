// backend/controllers/invoiceController.js
const { Op, Transaction } = require("sequelize");
const axios = require("axios");
// Ensure all required models are imported correctly from the central index
const {
  Invoice,
  InvoiceItem,
  LedgerEntry,
  Customer,
  Item,
  BusinessSetting,
  sequelize,
} = require("../models");
// Import helper functions
const {
  calculateNightsBetween,
  calculateDaysInclusive,
} = require("../utils/calculationHelpers");
const { buildInvoicePDF } = require("../services/pdfService");
const { formatCurrency, formatDate } = require("../utils/formatting"); // Backend formatting utils

// Constants
const FRANKFURTER_API_URL = "https://api.frankfurter.app";
const SETTINGS_ID = 1; // Assuming a single row for settings with ID 1

// --- Helper function to get exchange rate ---
const getExchangeRate = async (date, fromCurrency, toCurrency) => {
  // If currencies are the same, the rate is 1
  if (fromCurrency === toCurrency) {
    return 1.0;
  }
  // Format date for API (YYYY-MM-DD) or use 'latest'
  const dateParam = date ? date.toISOString().split("T")[0] : "latest";
  try {
    // Construct the API URL
    const url = `${FRANKFURTER_API_URL}/${dateParam}?from=${fromCurrency}&to=${toCurrency}`;
    // console.log(`Fetching rate from: ${url}`); // Optional debug log
    // Make the API call
    const response = await axios.get(url);
    // Check if the response contains the rate for the target currency
    if (
      response.data &&
      response.data.rates &&
      response.data.rates[toCurrency]
    ) {
      const rate = response.data.rates[toCurrency];
      // console.log(`Rate ${fromCurrency} -> ${toCurrency} on ${dateParam}: ${rate}`); // Optional debug log
      return parseFloat(rate); // Return the rate as a number
    } else {
      // Log a warning if the rate couldn't be found
      console.warn(
        `Could not find rate from ${fromCurrency} to ${toCurrency} for ${dateParam}`,
        response.data
      );
      return null; // Indicate rate was not found
    }
  } catch (error) {
    // Log detailed error if the API call fails
    console.error(
      `Error fetching exchange rate from ${fromCurrency} to ${toCurrency} for ${dateParam}:`,
      error.response?.data || error.message
    );
    // Throw a specific error to be caught by the calling function
    throw new Error(
      `Could not fetch exchange rate for ${fromCurrency} to ${toCurrency}.`
    );
  }
};

// @desc    Generate a new Invoice from unbilled ledger entries with currency conversion & duration multiplier
// @route   POST /api/invoices/generate
// @access  Private (needs auth later)
const generateInvoice = async (req, res) => {
  let transaction; // Define transaction variable accessible in catch block
  try {
    // Start a database transaction
    transaction = await sequelize.transaction();

    // Destructure required data from request body
    const {
      customerId,
      startDate,
      endDate,
      issueDate,
      dueDate,
      notes,
      targetCurrency,
    } = req.body;

    // --- Input Validation ---
    if (
      !customerId ||
      !startDate ||
      !endDate ||
      !issueDate ||
      !targetCurrency
    ) {
      await transaction.rollback();
      return res
        .status(400)
        .json({
          message:
            "Missing required fields: customerId, startDate, endDate, issueDate, targetCurrency",
        });
    }
    // Validate target currency format
    if (
      typeof targetCurrency !== "string" ||
      targetCurrency.trim().length !== 3
    ) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Invalid targetCurrency format. Must be 3 letters." });
    }
    const invoiceTargetCurrency = targetCurrency.trim().toUpperCase();

    // Parse and validate dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    // Set time parts for accurate range matching
    parsedStartDate.setHours(0, 0, 0, 0);
    parsedEndDate.setHours(23, 59, 59, 999);
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Invalid start or end date format." });
    }
    if (parsedEndDate < parsedStartDate) {
      await transaction.rollback();
      return res
        .status(400)
        .json({
          message: "End date cannot be before start date for invoice period.",
        });
    }
    // --- End Validation ---

    // 1. Find Customer & Business Settings (within transaction)
    const customer = await Customer.findByPk(customerId, { transaction });
    if (!customer) {
      await transaction.rollback();
      return res.status(404).json({ message: "Customer not found." });
    }
    const settings = await BusinessSetting.findByPk(SETTINGS_ID, {
      transaction,
    });
    if (!settings) {
      await transaction.rollback();
      return res
        .status(500)
        .json({ message: "Business settings not found or not seeded." });
    }

    // 2. Find unbilled Ledger Entries overlapping the period (within transaction)
    const unbilledEntries = await LedgerEntry.findAll({
      where: {
        customerId: customerId,
        billingStatus: "unbilled",
        // Overlap Condition: Entry starts <= period ends AND (Entry ends >= period starts OR Entry end is NULL)
        [Op.and]: [
          { startDate: { [Op.lte]: parsedEndDate } },
          {
            [Op.or]: [
              { endDate: { [Op.gte]: parsedStartDate } },
              { endDate: { [Op.is]: null } },
            ],
          },
        ],
      },
      // Include associated item to get its currency, name, unit, and durationType
      include: [
        {
          model: Item,
          as: "item",
          attributes: ["id", "name", "currency", "unit", "durationType"],
        },
      ], // Added durationType
      transaction,
    });

    // Check if any entries were found
    if (unbilledEntries.length === 0) {
      await transaction.rollback();
      return res
        .status(404)
        .json({
          message:
            "No unbilled entries found for this customer overlapping the specified date range.",
        });
    }

    // 3. Fetch necessary Exchange Rates for the issue date
    const sourceCurrencies = [
      ...new Set(unbilledEntries.map((e) => e.item?.currency).filter((c) => c)),
    ];
    const rates = {}; // Cache fetched rates {<SOURCE_CURRENCY>: <RATE_TO_TARGET>}

    for (const sourceCurrency of sourceCurrencies) {
      const rate = await getExchangeRate(
        new Date(issueDate),
        sourceCurrency,
        invoiceTargetCurrency
      );
      if (rate === null) {
        // Handle missing rate
        await transaction.rollback();
        return res
          .status(400)
          .json({
            message: `Could not find exchange rate from ${sourceCurrency} to ${invoiceTargetCurrency} for issue date ${issueDate}.`,
          });
      }
      rates[sourceCurrency] = rate;
    }

    // 4. Calculate Invoice Totals (in target currency) and Prepare Invoice Items data
    let subtotalWithoutVAT = 0; // Accumulator for subtotal in target currency
    let totalVATAmount = 0; // Accumulator for VAT amount in target currency
    const invoiceItemsData = []; // Array to hold data for creating InvoiceItem records

    for (const entry of unbilledEntries) {
      const item = entry.item;
      // Basic data integrity checks
      if (!item || !item.currency) {
        await transaction.rollback();
        return res
          .status(500)
          .json({
            message: `Ledger entry ${entry.id} has invalid item/currency data.`,
          });
      }

      const originalPriceExcl = parseFloat(entry.recordedPriceWithoutVAT);
      const quantity = parseFloat(entry.quantity); // User-entered quantity
      const originalVatRate = parseFloat(entry.recordedVatRate);
      const originalCurrency = item.currency;
      const entryStartDate = entry.startDate ? new Date(entry.startDate) : null;
      // Use end date if present, otherwise fallback to start date for point-in-time/ongoing
      const entryEndDate = entry.endDate
        ? new Date(entry.endDate)
        : entryStartDate;

      if (
        isNaN(originalPriceExcl) ||
        isNaN(quantity) ||
        isNaN(originalVatRate) ||
        !entryStartDate ||
        isNaN(entryStartDate.getTime())
      ) {
        await transaction.rollback();
        return res
          .status(500)
          .json({
            message: `Invalid numeric or date data found in ledger entry ${entry.id}.`,
          });
      }

      // Get the relevant exchange rate
      const exchangeRate = rates[originalCurrency];
      if (exchangeRate === undefined || exchangeRate === null) {
        await transaction.rollback();
        return res
          .status(500)
          .json({
            message: `Internal error: Missing exchange rate for ${originalCurrency}.`,
          });
      }

      // Perform currency conversion for unit price
      const convertedUnitPriceExcl = originalPriceExcl * exchangeRate;

      // --- Calculate Duration Multiplier ---
      let durationMultiplier = 1; // Default to 1 (no duration impact)
      let durationUnit = null; // e.g., 'days', 'nights'

      if (item.durationType && entryEndDate) {
        // Check if item has a duration type and entry has an end date (even if same as start)
        if (item.durationType === "night") {
          const nights = calculateNightsBetween(entryStartDate, entryEndDate);
          if (nights !== null && nights > 0) {
            durationMultiplier = nights;
            durationUnit = "nights";
          } else {
            console.warn(
              `Could not calculate nights for entry ${entry.id}, using multiplier 1.`
            );
          }
        } else if (item.durationType === "day") {
          const days = calculateDaysInclusive(entryStartDate, entryEndDate);
          if (days !== null && days > 0) {
            durationMultiplier = days;
            durationUnit = "days";
          } else {
            console.warn(
              `Could not calculate days for entry ${entry.id}, using multiplier 1.`
            );
          }
        }
        // Add logic for other types like 'hour' if needed
      }
      // --- End Duration Calculation ---

      // --- Calculate final line totals including duration multiplier ---
      const lineTotalExclConverted =
        convertedUnitPriceExcl * quantity * durationMultiplier;
      const lineVatConverted = lineTotalExclConverted * (originalVatRate / 100);
      const lineTotalInclConverted = lineTotalExclConverted + lineVatConverted;

      // Add calculated totals (in target currency) to the invoice accumulators
      subtotalWithoutVAT += lineTotalExclConverted;
      totalVATAmount += lineVatConverted;

      // --- Prepare the data object for this specific InvoiceItem record ---
      invoiceItemsData.push({
        // invoiceId set via association
        // Modify description to include quantity and duration if applicable
        description: `${item.name}${
          durationUnit
            ? ` (${quantity} x ${durationMultiplier} ${durationUnit})`
            : quantity !== 1
            ? ` (${quantity} ${item.unit})`
            : ""
        }`,
        quantity: quantity * durationMultiplier, // Store the EFFECTIVE quantity (base quantity * duration)
        unit: item.unit, // Store the base unit
        // Original values
        originalUnitPriceWithoutVAT: originalPriceExcl,
        originalCurrency: originalCurrency,
        originalVatRate: originalVatRate,
        // Conversion info
        exchangeRateUsed:
          originalCurrency === invoiceTargetCurrency ? null : exchangeRate,
        // Converted values (in invoice currency) - Price PER BASE UNIT
        unitPriceWithoutVAT: convertedUnitPriceExcl,
        vatRate: originalVatRate, // The rate applied
        // Calculated line totals (in invoice currency) based on effective quantity
        lineTotalWithoutVAT: lineTotalExclConverted,
        lineVATAmount: lineVatConverted,
        lineTotalWithVAT: lineTotalInclConverted,
        // Optional: Store calculated durationMultiplier and durationUnit on InvoiceItem model/table?
      });
    }
    // Calculate final grand total
    const grandTotal = subtotalWithoutVAT + totalVATAmount;

    // 5. Generate Invoice Number (Replace with a robust method later)
    const invoiceNumber = `INV-${Date.now()}`;

    // 6. Create the main Invoice record and associated InvoiceItem records within the transaction
    const newInvoice = await Invoice.create(
      {
        invoiceNumber: invoiceNumber,
        customerId: customerId,
        issueDate: issueDate, // Use provided issueDate
        dueDate: dueDate || null, // Use provided dueDate or null
        subtotalWithoutVAT: subtotalWithoutVAT, // Calculated total in target currency
        totalVATAmount: totalVATAmount, // Calculated total in target currency
        grandTotal: grandTotal, // Calculated total in target currency
        currency: invoiceTargetCurrency, // The final currency of the invoice
        status: "issued", // Default status, could be 'draft'
        notes: notes || null,
        // TODO: Add businessDetailsSnapshot and customerDetailsSnapshot from fetched 'settings' and 'customer' objects
        invoiceItems: invoiceItemsData, // Use Sequelize's include syntax for bulk creating associated items
      },
      {
        include: [{ model: InvoiceItem, as: "invoiceItems" }], // Specify the association alias
        transaction, // Ensure this creation is part of the transaction
      }
    );

    // 7. Update the processed Ledger Entries (within transaction)
    const entryIdsToUpdate = unbilledEntries.map((entry) => entry.id);
    await LedgerEntry.update(
      { billingStatus: "billed", invoiceId: newInvoice.id }, // Set status to 'billed' and link to the new invoice ID
      { where: { id: entryIdsToUpdate }, transaction } // Apply update only to the included entries
    );

    // 8. If all steps succeeded, commit the transaction
    await transaction.commit();

    // 9. Fetch the complete invoice with included associations to return to the client
    const finalInvoice = await Invoice.findByPk(newInvoice.id, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "companyName"],
        },
        { model: InvoiceItem, as: "invoiceItems" }, // Includes all fields of InvoiceItem
      ],
      // No transaction needed for this final fetch after commit
    });

    // Send the newly created and fetched invoice object back
    res.status(201).json(finalInvoice);
  } catch (error) {
    // If any error occurred, rollback the transaction if it was started
    if (transaction) await transaction.rollback();

    // Log the error for debugging
    console.error("Error generating invoice:", error);

    // Send appropriate error response back to client
    if (error.message?.includes("Could not fetch exchange rate")) {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message);
      return res
        .status(400)
        .json({ message: `Validation Error: ${messages.join(", ")}` });
    }
    // Add check for database errors if needed for more specific feedback
    if (error.name === "SequelizeDatabaseError") {
      console.error("DB Error SQL:", error.sql); // Log SQL for debugging (be careful in prod)
      return res
        .status(500)
        .json({ message: "Database error during invoice generation." });
    }
    // Default server error
    res.status(500).json({ message: "Server error generating invoice." });
  }
};

// @desc    Get all Invoices (basic list)
// @route   GET /api/invoices
// @access  Private (Protected via router middleware)
const getInvoices = async (req, res) => {
  try {
    // TODO: Add filtering (by customer, date range, status) and pagination later
    const invoices = await Invoice.findAll({
      include: [
        // Include customer name for display in list view
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "companyName"], // Select only needed fields
        },
      ],
      order: [
        ["issueDate", "DESC"],
        ["invoiceNumber", "DESC"],
      ], // Order by date descending, then number
    });
    res.status(200).json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Server error fetching invoices." });
  }
};

// @desc    Get single Invoice by ID including line items
// @route   GET /api/invoices/:id
// @access  Private (Protected via router middleware)
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params; // Get invoice ID from route parameter

    // Find the invoice by primary key
    const invoice = await Invoice.findByPk(id, {
      // Include associated data needed for the detail view
      include: [
        {
          model: Customer,
          as: "customer", // Include full customer details
        },
        {
          model: InvoiceItem,
          as: "invoiceItems", // Include all line items associated with the invoice
        },
        // Optional: Include billed ledger entries
        // { model: LedgerEntry, as: 'billedEntries', attributes: ['id', 'startDate', 'endDate'] }
      ],
    });

    // Check if invoice exists
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    // TODO: Fetch/include Business Settings snapshot if needed

    res.status(200).json(invoice); // Return the detailed invoice object
  } catch (error) {
    console.error(`Error fetching invoice by ID (${req.params.id}):`, error);
    res.status(500).json({ message: "Server error fetching invoice details." });
  }
};

// @desc    Download Invoice as PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private (Protected via router middleware)
const downloadInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch the invoice with all necessary details for the PDF generation service
    const invoice = await Invoice.findByPk(id, {
      include: [
        // Include full customer details needed for PDF header
        { model: Customer, as: "customer" },
        // Include all associated line items
        { model: InvoiceItem, as: "invoiceItems" },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    // --- Prepare for PDF Generation ---
    // Set appropriate HTTP headers for PDF response
    const filename = `Invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
    res.setHeader("Content-disposition", `attachment; filename="${filename}"`); // Suggests download with filename
    res.setHeader("Content-type", "application/pdf"); // Sets the correct MIME type

    // --- Call PDF Builder Service ---
    // The service function takes the invoice data and the writable response stream
    buildInvoicePDF(invoice.toJSON(), res); // Pass plain JSON object and the response stream

    // buildInvoicePDF calls doc.end() which finishes the response stream
  } catch (error) {
    console.error(
      `Error generating PDF for invoice ID (${req.params.id}):`,
      error
    );
    // Attempt to send an error response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error generating invoice PDF." });
    } else {
      // If stream already started, log error and end response if possible
      console.error(
        "Headers already sent, cannot send JSON error response for PDF generation failure."
      );
      res.end();
    }
  }
};

// Export all controller functions
module.exports = {
  generateInvoice,
  getInvoices,
  getInvoiceById,
  downloadInvoicePDF,
};
