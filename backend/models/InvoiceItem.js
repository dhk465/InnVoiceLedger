// backend/models/InvoiceItem.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class InvoiceItem extends Model {
  static associate(models) {
    // Each InvoiceItem belongs to one Invoice
    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice'
    });
    // Optional: Link back to the original Item definition if needed, but mainly rely on snapshot data
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
    type: DataTypes.DECIMAL(10, 2), // Use DECIMAL to allow fractional quantities if needed (e.g., 1.5 hours)
    allowNull: false,
  },
  unit: { // e.g., pcs, hour, night
    type: DataTypes.STRING,
    allowNull: false,
  },
  unitPriceWithoutVAT: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price_without_vat'
  },
  vatRate: { // VAT rate percentage applied to this line
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'vat_rate'
  },
  // --- Calculated amounts for this line ---
  lineTotalWithoutVAT: { // quantity * unitPriceWithoutVAT
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'line_total_without_vat'
  },
  lineVATAmount: { // lineTotalWithoutVAT * (vatRate / 100)
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'line_vat_amount'
  },
  lineTotalWithVAT: { // lineTotalWithoutVAT + lineVATAmount
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'line_total_with_vat'
  },
  // originalItemId: { // Optional: Link back to the Item ID if needed for reporting
  //   type: DataTypes.UUID,
  //   allowNull: true,
  //   field: 'original_item_id',
  // }
  // createdAt, updatedAt managed by Sequelize
}, {
  sequelize,
  modelName: 'InvoiceItem',
  tableName: 'invoice_items',
  timestamps: true, // Keep timestamps for audit purposes
  underscored: true,
});

module.exports = InvoiceItem;