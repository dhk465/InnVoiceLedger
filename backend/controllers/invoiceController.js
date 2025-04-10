// backend/controllers/invoiceController.js
const { Op, Transaction } = require('sequelize');
const axios = require('axios');
const { Invoice, InvoiceItem, LedgerEntry, Customer, Item, BusinessSetting, sequelize } = require('../models');

const { buildInvoicePDF } = require('../services/pdfService'); // Import PDF builder
const { formatCurrency, formatDate } = require('../utils/formatting'); // Use backend formatting

const FRANKFURTER_API_URL = 'https://api.frankfurter.app';
const SETTINGS_ID = 1;

// Helper function to get exchange rate
const getExchangeRate = async (date, fromCurrency, toCurrency) => {
    // ... (previous code for getExchangeRate - no changes needed) ...
    if (fromCurrency === toCurrency) return 1.0;
    const dateParam = date ? date.toISOString().split('T')[0] : 'latest';
    try {
        const url = `${FRANKFURTER_API_URL}/${dateParam}?from=${fromCurrency}&to=${toCurrency}`;
        const response = await axios.get(url);
        if (response.data?.rates?.[toCurrency]) {
            const rate = response.data.rates[toCurrency];
            return parseFloat(rate);
        } else {
            console.warn(`Could not find rate from ${fromCurrency} to ${toCurrency} for ${dateParam}`, response.data);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching exchange rate from ${fromCurrency} to ${toCurrency} for ${dateParam}:`, error.response?.data || error.message);
        throw new Error(`Could not fetch exchange rate for ${fromCurrency} to ${toCurrency}.`);
    }
};


// @desc    Generate a new Invoice
// @route   POST /api/invoices/generate
// @access  Private
const generateInvoice = async (req, res) => {
    // ... (previous code for generateInvoice - no changes needed) ...
    let transaction;
    try {
      transaction = await sequelize.transaction();
      const { customerId, startDate, endDate, issueDate, dueDate, notes, targetCurrency } = req.body;

      // Validation
      if (!customerId || !startDate || !endDate || !issueDate || !targetCurrency) { await transaction.rollback(); return res.status(400).json({ message: 'Missing required fields: customerId, startDate, endDate, issueDate, targetCurrency' }); }
      if (typeof targetCurrency !== 'string' || targetCurrency.trim().length !== 3) { await transaction.rollback(); return res.status(400).json({ message: 'Invalid targetCurrency format. Must be 3 letters.' }); }
      const invoiceTargetCurrency = targetCurrency.trim().toUpperCase();
      const parsedStartDate = new Date(startDate); const parsedEndDate = new Date(endDate); parsedEndDate.setHours(23, 59, 59, 999);
      if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) { await transaction.rollback(); return res.status(400).json({ message: 'Invalid start or end date format.' }); }

      // 1. Find Customer & Settings
      const customer = await Customer.findByPk(customerId, { transaction });
      if (!customer) { await transaction.rollback(); return res.status(404).json({ message: 'Customer not found.' }); }
      const settings = await BusinessSetting.findByPk(SETTINGS_ID, { transaction });
      if (!settings) { await transaction.rollback(); return res.status(500).json({ message: 'Business settings not found or not seeded.' }); }

      // 2. Find unbilled Ledger Entries
      const unbilledEntries = await LedgerEntry.findAll({ where: { customerId: customerId, billingStatus: 'unbilled', entryDate: { [Op.between]: [parsedStartDate, parsedEndDate] } }, include: [{ model: Item, as: 'item', attributes: ['id', 'name', 'currency', 'unit'] }], transaction });
      if (unbilledEntries.length === 0) { await transaction.rollback(); return res.status(404).json({ message: 'No unbilled entries found for this customer in the specified date range.' }); }

      // 3. Fetch necessary Exchange Rates
      const sourceCurrencies = [...new Set(unbilledEntries.map(e => e.item?.currency).filter(c => c))];
      const rates = {};
      for (const sourceCurrency of sourceCurrencies) {
          const rate = await getExchangeRate(new Date(issueDate), sourceCurrency, invoiceTargetCurrency);
          if (rate === null) { await transaction.rollback(); return res.status(400).json({ message: `Could not find exchange rate from ${sourceCurrency} to ${invoiceTargetCurrency} for issue date ${issueDate}.` }); }
          rates[sourceCurrency] = rate;
      }

      // 4. Calculate Invoice Totals and Prepare Invoice Items
      let subtotalWithoutVAT = 0; let totalVATAmount = 0; const invoiceItemsData = [];
      for (const entry of unbilledEntries) {
          const item = entry.item;
          if (!item || !item.currency) { await transaction.rollback(); return res.status(500).json({ message: `Ledger entry ${entry.id} has invalid item/currency data.` }); }
          const originalPriceExcl = parseFloat(entry.recordedPriceWithoutVAT); const quantity = parseFloat(entry.quantity); const originalVatRate = parseFloat(entry.recordedVatRate); const originalCurrency = item.currency;
          if (isNaN(originalPriceExcl) || isNaN(quantity) || isNaN(originalVatRate)) { await transaction.rollback(); return res.status(500).json({ message: `Invalid numeric data found in ledger entry ${entry.id}.` });}
          const exchangeRate = rates[originalCurrency]; if (exchangeRate === undefined || exchangeRate === null) { await transaction.rollback(); return res.status(500).json({ message: `Internal error: Missing exchange rate for ${originalCurrency}.` }); }
          const convertedUnitPriceExcl = originalPriceExcl * exchangeRate; const lineTotalExclConverted = convertedUnitPriceExcl * quantity; const lineVatConverted = lineTotalExclConverted * (originalVatRate / 100); const lineTotalInclConverted = lineTotalExclConverted + lineVatConverted;
          subtotalWithoutVAT += lineTotalExclConverted; totalVATAmount += lineVatConverted;
          invoiceItemsData.push({
              description: item.name, quantity: quantity, unit: item.unit, originalUnitPriceWithoutVAT: originalPriceExcl, originalCurrency: originalCurrency, originalVatRate: originalVatRate,
              exchangeRateUsed: originalCurrency === invoiceTargetCurrency ? null : exchangeRate, unitPriceWithoutVAT: convertedUnitPriceExcl, vatRate: originalVatRate,
              lineTotalWithoutVAT: lineTotalExclConverted, lineVATAmount: lineVatConverted, lineTotalWithVAT: lineTotalInclConverted,
          });
      }
      const grandTotal = subtotalWithoutVAT + totalVATAmount;

      // 5. Generate Invoice Number
      const invoiceNumber = `INV-${Date.now()}`; // TODO: Replace

      // 6. Create Invoice and InvoiceItems
      const newInvoice = await Invoice.create({
        invoiceNumber: invoiceNumber, customerId: customerId, issueDate: issueDate, dueDate: dueDate || null, subtotalWithoutVAT: subtotalWithoutVAT, totalVATAmount: totalVATAmount, grandTotal: grandTotal,
        currency: invoiceTargetCurrency, status: 'issued', notes: notes || null, invoiceItems: invoiceItemsData
      }, { include: [{ model: InvoiceItem, as: 'invoiceItems' }], transaction });

      // 7. Update Ledger Entries
      const entryIdsToUpdate = unbilledEntries.map(entry => entry.id);
      await LedgerEntry.update({ billingStatus: 'billed', invoiceId: newInvoice.id }, { where: { id: entryIdsToUpdate }, transaction });

      // 8. Commit
      await transaction.commit();

      // 9. Fetch complete invoice to return
      const finalInvoice = await Invoice.findByPk(newInvoice.id, { include: [ { model: Customer, as: 'customer', attributes: ['id', 'name', 'companyName'] }, { model: InvoiceItem, as: 'invoiceItems' } ] });
      res.status(201).json(finalInvoice);

    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error generating invoice:", error);
      if (error.message?.includes('Could not fetch exchange rate')) { return res.status(400).json({ message: error.message }); }
       if (error.name === 'SequelizeValidationError') { const messages = error.errors.map(err => err.message); return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` }); }
      res.status(500).json({ message: 'Server error generating invoice.' });
    }
};

// Function to get list of invoices
// @desc    Get all Invoices (basic list)
// @route   GET /api/invoices
// @access  Private (needs auth later)
const getInvoices = async (req, res) => {
    try {
        // Add filtering/pagination later
        const invoices = await Invoice.findAll({
            include: [ // Include customer name for display
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'companyName'] // Select only needed fields
                }
            ],
            order: [['issueDate', 'DESC'], ['invoiceNumber', 'DESC']] // Order by date, then number
        });
        res.status(200).json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ message: 'Server error fetching invoices.' });
    }
};

// Function to get a single invoice by ID
// @desc    Get single Invoice by ID
// @route   GET /api/invoices/:id
// @access  Private (needs auth later)
const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params; // Get ID from route parameter

        // Find the invoice by primary key
        const invoice = await Invoice.findByPk(id, {
            // Include associated data needed for display
            include: [
                {
                    model: Customer,
                    as: 'customer', // Include customer details
                    attributes: ['id', 'name', 'companyName', 'email', 'phone', 'address', 'vatId'] // Specify needed fields
                },
                {
                    model: InvoiceItem,
                    as: 'invoiceItems', // Include all line items associated with the invoice
                    // No need to include Item again here unless originalItemId is stored and needed
                }
                // Optionally include associated Ledger Entries if needed:
                // { model: LedgerEntry, as: 'billedEntries', attributes: ['id', 'entryDate'] }
            ]
        });

        // Check if invoice exists
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found.' });
        }

        // TODO: Potentially fetch Business Settings snapshot here if not stored on invoice
        // Or just rely on the snapshot stored on the invoice record itself later

        res.status(200).json(invoice); // Return the detailed invoice object

    } catch (error) {
        console.error(`Error fetching invoice by ID (${req.params.id}):`, error);
        res.status(500).json({ message: 'Server error fetching invoice details.' });
    }
};

// --- Function to download Invoice PDF ---
// @desc    Download Invoice as PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private
const downloadInvoicePDF = async (req, res) => {
    try {
        const { id } = req.params;
        // Fetch the invoice with all necessary details for the PDF
        const invoice = await Invoice.findByPk(id, {
            include: [
                { model: Customer, as: 'customer' }, // Include full customer needed for PDF
                { model: InvoiceItem, as: 'invoiceItems' } // Include line items
            ]
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found.' });
        }

        // --- Prepare for PDF Generation ---
        // Set headers for PDF download
        const filename = `Invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`); // Suggest download
        res.setHeader('Content-type', 'application/pdf'); // Set MIME type

        // --- Call PDF Builder ---
        // buildInvoicePDF function takes the data and the response stream
        buildInvoicePDF(invoice.toJSON(), res); // Pass plain JSON object and the response stream

        // The 'doc.end()' call inside buildInvoicePDF will end the response stream

    } catch (error) {
        console.error(`Error generating PDF for invoice ID (${req.params.id}):`, error);
        // If headers were already sent, we might not be able to send JSON error
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error generating invoice PDF.' });
        } else {
            // If stream started, try to end it abruptly? Difficult to handle cleanly.
            console.error("Headers already sent, cannot send JSON error response for PDF generation failure.");
            res.end(); // End the stream if possible
        }
    }
};

module.exports = {
    generateInvoice,
    getInvoices,
    getInvoiceById,
    downloadInvoicePDF,
  };