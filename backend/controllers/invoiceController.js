// backend/controllers/invoiceController.js
const { Op, Transaction } = require('sequelize');
const axios = require('axios');
const { Invoice, InvoiceItem, LedgerEntry, Customer, Item, BusinessSetting, sequelize } = require('../models');

const FRANKFURTER_API_URL = 'https://api.frankfurter.app';
const SETTINGS_ID = 1;

// Helper function to get exchange rate
const getExchangeRate = async (date, fromCurrency, toCurrency) => {
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


// @desc    Generate a new Invoice from unbilled ledger entries with currency conversion
// @route   POST /api/invoices/generate
// @access  Private (needs auth later)
const generateInvoice = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const { customerId, startDate, endDate, issueDate, dueDate, notes, targetCurrency } = req.body;

    // Validation
    if (!customerId || !startDate || !endDate || !issueDate || !targetCurrency) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Missing required fields: customerId, startDate, endDate, issueDate, targetCurrency' });
    }
    if (typeof targetCurrency !== 'string' || targetCurrency.trim().length !== 3) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Invalid targetCurrency format. Must be 3 letters.' });
    }
    const invoiceTargetCurrency = targetCurrency.trim().toUpperCase();
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    parsedEndDate.setHours(23, 59, 59, 999);
    if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
         await transaction.rollback();
        return res.status(400).json({ message: 'Invalid start or end date format.' });
    }

    // 1. Find Customer & Settings
    const customer = await Customer.findByPk(customerId, { transaction });
    if (!customer) { await transaction.rollback(); return res.status(404).json({ message: 'Customer not found.' }); }
    const settings = await BusinessSetting.findByPk(SETTINGS_ID, { transaction });
    if (!settings) { await transaction.rollback(); return res.status(500).json({ message: 'Business settings not found or not seeded.' }); }

    // 2. Find unbilled Ledger Entries
    const unbilledEntries = await LedgerEntry.findAll({
      where: { customerId: customerId, billingStatus: 'unbilled', entryDate: { [Op.between]: [parsedStartDate, parsedEndDate] } },
      include: [{ model: Item, as: 'item', attributes: ['id', 'name', 'currency', 'unit'] }],
      transaction
    });
    if (unbilledEntries.length === 0) { await transaction.rollback(); return res.status(404).json({ message: 'No unbilled entries found for this customer in the specified date range.' }); }

    // 3. Fetch necessary Exchange Rates
    // --- FIXED: Removed TypeScript cast 'as string[]' ---
    const sourceCurrencies = [...new Set(unbilledEntries.map(e => e.item?.currency).filter(c => c))];
    // --- END FIX ---
    const rates = {};

    for (const sourceCurrency of sourceCurrencies) {
        const rate = await getExchangeRate(new Date(issueDate), sourceCurrency, invoiceTargetCurrency);
        if (rate === null) {
            await transaction.rollback();
            return res.status(400).json({ message: `Could not find exchange rate from ${sourceCurrency} to ${invoiceTargetCurrency} for issue date ${issueDate}.` });
        }
        rates[sourceCurrency] = rate;
    }

    // 4. Calculate Invoice Totals and Prepare Invoice Items
    let subtotalWithoutVAT = 0;
    let totalVATAmount = 0;
    const invoiceItemsData = [];

    for (const entry of unbilledEntries) {
        const item = entry.item;
        if (!item || !item.currency) { await transaction.rollback(); return res.status(500).json({ message: `Ledger entry ${entry.id} has invalid item/currency data.` }); }

        const originalPriceExcl = parseFloat(entry.recordedPriceWithoutVAT);
        const quantity = parseFloat(entry.quantity);
        const originalVatRate = parseFloat(entry.recordedVatRate);
        const originalCurrency = item.currency;
        if (isNaN(originalPriceExcl) || isNaN(quantity) || isNaN(originalVatRate)) { await transaction.rollback(); return res.status(500).json({ message: `Invalid numeric data found in ledger entry ${entry.id}.` }); }

        const exchangeRate = rates[originalCurrency];
        if (exchangeRate === undefined || exchangeRate === null) { await transaction.rollback(); return res.status(500).json({ message: `Internal error: Missing exchange rate for ${originalCurrency}.` }); }

        const convertedUnitPriceExcl = originalPriceExcl * exchangeRate;
        const lineTotalExclConverted = convertedUnitPriceExcl * quantity;
        const lineVatConverted = lineTotalExclConverted * (originalVatRate / 100);
        const lineTotalInclConverted = lineTotalExclConverted + lineVatConverted;

        subtotalWithoutVAT += lineTotalExclConverted;
        totalVATAmount += lineVatConverted;

        invoiceItemsData.push({
            description: item.name, quantity: quantity, unit: item.unit,
            originalUnitPriceWithoutVAT: originalPriceExcl,
            originalCurrency: originalCurrency,
            originalVatRate: originalVatRate,
            exchangeRateUsed: originalCurrency === invoiceTargetCurrency ? null : exchangeRate,
            unitPriceWithoutVAT: convertedUnitPriceExcl,
            vatRate: originalVatRate,
            lineTotalWithoutVAT: lineTotalExclConverted,
            lineVATAmount: lineVatConverted,
            lineTotalWithVAT: lineTotalInclConverted,
        });
    }
    const grandTotal = subtotalWithoutVAT + totalVATAmount;

    // 5. Generate Invoice Number
    const invoiceNumber = `INV-${Date.now()}`; // TODO: Replace

    // 6. Create Invoice and InvoiceItems records
    const newInvoice = await Invoice.create({
      invoiceNumber: invoiceNumber, customerId: customerId, issueDate: issueDate, dueDate: dueDate || null,
      subtotalWithoutVAT: subtotalWithoutVAT, totalVATAmount: totalVATAmount, grandTotal: grandTotal,
      currency: invoiceTargetCurrency, status: 'issued', notes: notes || null,
      // TODO: Add snapshots
      invoiceItems: invoiceItemsData
    }, { include: [{ model: InvoiceItem, as: 'invoiceItems' }], transaction });

    // 7. Update Ledger Entries
    const entryIdsToUpdate = unbilledEntries.map(entry => entry.id);
    await LedgerEntry.update(
      { billingStatus: 'billed', invoiceId: newInvoice.id },
      { where: { id: entryIdsToUpdate }, transaction }
    );

    // 8. Commit transaction
    await transaction.commit();

    // 9. Fetch complete invoice to return
    const finalInvoice = await Invoice.findByPk(newInvoice.id, {
        include: [
            { model: Customer, as: 'customer', attributes: ['id', 'name', 'companyName'] },
            { model: InvoiceItem, as: 'invoiceItems' }
        ]
    });

    res.status(201).json(finalInvoice);

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error generating invoice:", error);
    if (error.message?.includes('Could not fetch exchange rate')) { return res.status(400).json({ message: error.message }); }
     if (error.name === 'SequelizeValidationError') { const messages = error.errors.map(err => err.message); return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` }); }
    res.status(500).json({ message: 'Server error generating invoice.' });
  }
};

module.exports = { generateInvoice };