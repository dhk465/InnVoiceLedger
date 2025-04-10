// backend/models/InvoiceItem.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database'); // Ensure path is correct

class InvoiceItem extends Model {
  static associate(models) {
    // Each InvoiceItem belongs to one Invoice
    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice'
    });
    // Optional: Link back to the original Item definition if needed
    // this.belongsTo(models.Item, { foreignKey: 'originalItemId', as: 'originalItem' });
  }
}

InvoiceItem.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  invoiceId: { // Foreign key to Invoice
    type: DataTypes.UUID,
    allowNull: false,
    field: 'invoice_id',
    // references added in migration
  },
  // --- Snapshot data from the time of invoicing ---
  description: { // Copied from Item name/description or Ledger notes
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2), // Use DECIMAL to allow fractional quantities
    allowNull: false,
  },
  unit: { // e.g., pcs, hour, night
    type: DataTypes.STRING,
    allowNull: false,
  },

  // --- Original Values (From Ledger Entry/Item) ---
  originalUnitPriceWithoutVAT: { // Renamed field (was unitPriceWithoutVAT before migration)
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'original_unit_price_without_vat' // Matches migration column name
  },
  originalCurrency: { // New field
      type: DataTypes.STRING(3),
      allowNull: false,
      field: 'original_currency' // Matches migration column name
  },
  originalVatRate: { // Renamed field (was vatRate before migration)
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'original_vat_rate' // Matches migration column name
  },

  // --- Conversion Info (If applicable) ---
  exchangeRateUsed: { // New field
      type: DataTypes.DECIMAL(14, 6), // Store rate with precision
      allowNull: true, // Null if originalCurrency === invoiceCurrency
      field: 'exchange_rate_used' // Matches migration column name
  },

  // --- Converted Values (In Invoice Currency) ---
  // These fields now store the price/rate AFTER conversion
  unitPriceWithoutVAT: { // New field (replaces the old unitPriceWithoutVAT concept)
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price_without_vat', // Matches migration column name
    comment: 'Unit price in INVOICE currency after conversion'
  },
   vatRate: { // New field (replaces the old vatRate concept for the line item)
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'vat_rate', // Matches migration column name
    comment: 'VAT Rate percentage applied for this line'
  },

  // --- Calculated amounts for this line (IN INVOICE CURRENCY) ---
  // These fields remain, but are calculated based on CONVERTED prices now
  lineTotalWithoutVAT: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'line_total_without_vat'
  },
  lineVATAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'line_vat_amount'
  },
  lineTotalWithVAT: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'line_total_with_vat'
  },

  // Optional originalItemId: { ... }
  // createdAt, updatedAt managed by Sequelize
}, {
  sequelize,
  modelName: 'InvoiceItem',
  tableName: 'invoice_items',
  timestamps: true,
  underscored: true,
});

module.exports = InvoiceItem;