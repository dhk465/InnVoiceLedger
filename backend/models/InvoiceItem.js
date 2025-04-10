// backend/models/InvoiceItem.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class InvoiceItem extends Model {
  static associate(models) {
    this.belongsTo(models.Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
    // Optional: Link back to Item
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
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'invoice_id',
    // references added in migration
  },
  // --- Snapshot data from the time of invoicing ---
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // --- Original Values (From Ledger Entry/Item) ---
  originalUnitPriceWithoutVAT: { // Renamed for clarity
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'original_unit_price_without_vat'
  },
  originalCurrency: { // Store the original currency of the ledger entry item
      type: DataTypes.STRING(3),
      allowNull: false,
      field: 'original_currency'
  },
  originalVatRate: { // Renamed for clarity (was just vatRate)
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'original_vat_rate'
  },
  // --- Conversion Info (If applicable) ---
  exchangeRateUsed: { // Rate used to convert from original to invoice currency
      type: DataTypes.DECIMAL(14, 6), // Store rate with precision
      allowNull: true, // Null if originalCurrency === invoiceCurrency
      field: 'exchange_rate_used'
  },
  // --- Converted Values (In Invoice Currency) ---
  // These replace the previous single price/vat fields
  unitPriceWithoutVAT: { // Price per unit IN INVOICE CURRENCY
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price_without_vat' // Keep same name, now represents converted price
  },
   vatRate: { // VAT Rate applied (usually same as original, but store explicitly)
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'vat_rate'
  },
  // --- Calculated amounts for this line (IN INVOICE CURRENCY) ---
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
  // --- Optional originalItemId ---
  // createdAt, updatedAt managed by Sequelize
}, {
  sequelize,
  modelName: 'InvoiceItem',
  tableName: 'invoice_items',
  timestamps: true,
  underscored: true,
});

module.exports = InvoiceItem;