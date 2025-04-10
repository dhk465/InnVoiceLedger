// backend/controllers/invoiceController.js
const { Op, Transaction } = require('sequelize');
const { Invoice, InvoiceItem, LedgerEntry, Customer, Item, sequelize } = require('../models');
// Add a helper for generating invoice numbers later

// @desc    Generate a new Invoice from unbilled ledger entries
// @route   POST /api/invoices/generate
// @access  Private (needs auth later)
const generateInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { customerId, startDate, endDate, issueDate, dueDate, notes } = req.body;

    // Validation
    if (!customerId || !startDate || !endDate || !issueDate) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Missing required fields: customerId, startDate, endDate, issueDate' });
    }
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    parsedEndDate.setHours(23, 59, 59, 999);
    if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
         await transaction.rollback();
        return res.status(400).json({ message: 'Invalid start or end date format.' });
    }

    // Find Customer
    const customer = await Customer.findByPk(customerId, { transaction });
    if (!customer) { await transaction.rollback(); return res.status(404).json({ message: 'Customer not found.' }); }
    // TODO: Fetch Business Settings

    // Find unbilled Ledger Entries
    const unbilledEntries = await LedgerEntry.findAll({
      where: { customerId: customerId, billingStatus: 'unbilled', entryDate: { [Op.between]: [parsedStartDate, parsedEndDate] } },
      include: [{ model: Item, as: 'item' }],
      transaction
    });
    if (unbilledEntries.length === 0) { await transaction.rollback(); return res.status(404).json({ message: 'No unbilled entries found for this customer in the specified date range.' }); }

    // Ensure same currency
    const firstCurrency = unbilledEntries[0].item?.currency;
    if (!firstCurrency) { await transaction.rollback(); return res.status(500).json({ message: 'Currency missing on ledger item.' }); }
    const hasMixedCurrencies = unbilledEntries.some(entry => entry.item?.currency !== firstCurrency);
    if (hasMixedCurrencies) { await transaction.rollback(); return res.status(400).json({ message: 'Cannot generate invoice with mixed currencies in ledger entries.' }); }
    const invoiceCurrency = firstCurrency;

    // Calculate Totals and Prepare Invoice Items
    let subtotalWithoutVAT = 0;
    let totalVATAmount = 0;
    const invoiceItemsData = [];
    for (const entry of unbilledEntries) {
        if (!entry.item) { await transaction.rollback(); return res.status(500).json({ message: `Ledger entry ${entry.id} is missing associated item data.` }); }
        const priceExcl = parseFloat(entry.recordedPriceWithoutVAT);
        const quantity = parseFloat(entry.quantity);
        const vatRate = parseFloat(entry.recordedVatRate);
        if (isNaN(priceExcl) || isNaN(quantity) || isNaN(vatRate)) { await transaction.rollback(); return res.status(500).json({ message: `Invalid numeric data found in ledger entry ${entry.id}.` });}

        const lineTotalExcl = priceExcl * quantity;
        const lineVat = lineTotalExcl * (vatRate / 100);
        const lineTotalIncl = lineTotalExcl + lineVat;
        subtotalWithoutVAT += lineTotalExcl;
        totalVATAmount += lineVat;
        invoiceItemsData.push({
            description: entry.item.name, quantity: quantity, unit: entry.item.unit,
            unitPriceWithoutVAT: priceExcl, vatRate: vatRate, lineTotalWithoutVAT: lineTotalExcl,
            lineVATAmount: lineVat, lineTotalWithVAT: lineTotalIncl,
        });
    }
    const grandTotal = subtotalWithoutVAT + totalVATAmount;

    // Generate Invoice Number (Replace with better logic later)
    const invoiceNumber = `INV-${Date.now()}`;

    // Create Invoice and InvoiceItems
    const newInvoice = await Invoice.create({
      invoiceNumber: invoiceNumber, customerId: customerId, issueDate: issueDate, dueDate: dueDate || null,
      subtotalWithoutVAT: subtotalWithoutVAT, totalVATAmount: totalVATAmount, grandTotal: grandTotal,
      currency: invoiceCurrency, status: 'issued', notes: notes || null,
      // TODO: Add snapshots
      invoiceItems: invoiceItemsData
    }, { include: [{ model: InvoiceItem, as: 'invoiceItems' }], transaction });

    // Update Ledger Entries
    const entryIdsToUpdate = unbilledEntries.map(entry => entry.id);
    await LedgerEntry.update(
      { billingStatus: 'billed', invoiceId: newInvoice.id }, // Set status and link invoiceId
      { where: { id: entryIdsToUpdate }, transaction }
    );

    // Commit transaction
    await transaction.commit();

    // Fetch complete invoice to return
    const finalInvoice = await Invoice.findByPk(newInvoice.id, {
        include: [
            { model: Customer, as: 'customer', attributes: ['id', 'name', 'companyName'] },
            { model: InvoiceItem, as: 'invoiceItems' }
        ]
    });

    res.status(201).json(finalInvoice);

  } catch (error) {
    await transaction.rollback(); // Rollback on any error
    console.error("Error generating invoice:", error);
    res.status(500).json({ message: 'Server error generating invoice.' });
  }
};

module.exports = { generateInvoice };