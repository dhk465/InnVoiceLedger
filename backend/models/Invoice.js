// backend/models/Invoice.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Invoice extends Model {
  static associate(models) {
    // Invoice belongs to one Customer
    this.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });
    // Invoice has many InvoiceItems (representing the lines on the invoice)
    this.hasMany(models.InvoiceItem, {
      foreignKey: 'invoiceId',
      as: 'invoiceItems' // Use this alias for eager loading lines
    });
    // An Invoice is generated from potentially many Ledger Entries
    // We track this relationship via the 'invoiceId' on the LedgerEntry side.
    // So, Invoice hasMany LedgerEntry
    this.hasMany(models.LedgerEntry, {
        foreignKey: 'invoiceId', // Nullable FK in LedgerEntry
        as: 'billedEntries'      // Alias to see which entries are on this invoice
    });
  }
}

Invoice.init({
  id: { // Primary key
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  invoiceNumber: { // Unique, sequential invoice number
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'invoice_number'
  },
  customerId: { // Foreign key to Customer
    type: DataTypes.UUID,
    allowNull: false,
    field: 'customer_id',
    // references added in migration
  },
  issueDate: { // Date the invoice was generated
    type: DataTypes.DATEONLY, // Store only the date part
    allowNull: false,
    field: 'issue_date'
  },
  dueDate: { // Date the invoice is due
    type: DataTypes.DATEONLY,
    allowNull: true, // Or false depending on requirements
    field: 'due_date'
  },
  // Store calculated totals on the invoice record
  subtotalWithoutVAT: {
      type: DataTypes.DECIMAL(12, 2), // Increased precision for totals
      allowNull: false,
      field: 'subtotal_without_vat'
  },
  totalVATAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'total_vat_amount'
  },
  grandTotal: { // subtotalWithoutVAT + totalVATAmount
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'grand_total'
  },
  currency: { // Currency for all amounts on this invoice
      type: DataTypes.STRING(3),
      allowNull: false,
  },
  status: { // Status of the invoice itself
      type: DataTypes.STRING, // Could be ENUM('draft', 'issued', 'paid', 'overdue', 'cancelled')
      allowNull: false,
      defaultValue: 'issued', // Or 'draft' initially
  },
  notes: { // Optional notes specific to the invoice
      type: DataTypes.TEXT,
      allowNull: true,
  },
  // Store business details used at the time of invoice generation (snapshot)
  // This prevents issues if business details change later
  businessDetailsSnapshot: {
      type: DataTypes.JSONB, // Use JSONB for structured data in PostgreSQL
      allowNull: true, // Or make required based on needs
      field: 'business_details_snapshot'
  },
  customerDetailsSnapshot: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'customer_details_snapshot'
  },
  // createdAt, updatedAt managed by Sequelize
}, {
  sequelize,
  modelName: 'Invoice',
  tableName: 'invoices',
  timestamps: true,
  underscored: true,
});

module.exports = Invoice;