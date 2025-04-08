// backend/models/LedgerEntry.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class LedgerEntry extends Model {
  // Static method to define associations
  static associate(models) {
    // An entry belongs to one Customer
    this.belongsTo(models.Customer, {
      foreignKey: 'customerId', // fk column in this table
      as: 'customer'         // Alias to use when eager loading
    });
    // An entry references one Item type
    this.belongsTo(models.Item, {
      foreignKey: 'itemId',     // fk column in this table
      as: 'item'             // Alias to use when eager loading
    });
    // An entry might belong to one Invoice (define later)
    // this.belongsTo(models.Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
  }
}

LedgerEntry.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  // Foreign Keys will be added via associations or explicitly here/in migration
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'customer_id', // Explicit snake_case mapping
    // 'references' defined in migration for constraint
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'item_id', // Explicit snake_case mapping
    // 'references' defined in migration for constraint
  },
  quantity: {
    type: DataTypes.INTEGER, // Or DECIMAL if fractional quantities needed
    allowNull: false,
    defaultValue: 1,
    validate: {
      isInt: { msg: "Quantity must be an integer" }, // Adjust if DECIMAL
      min: { args: [1], msg: "Quantity must be at least 1" }, // Adjust if zero/negative allowed
    }
  },
  entryDate: { // When the item/service was consumed/used
    type: DataTypes.DATE, // Timestamp with time zone
    allowNull: false,
    defaultValue: DataTypes.NOW, // Default to time of creation
    field: 'entry_date'
  },
  // Store price/VAT at time of entry for historical accuracy
  recordedPriceWithoutVAT: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false, // Or true if you want to allow falling back to item's current price
    field: 'recorded_price_without_vat',
    validate: { // Basic validation
        isDecimal: true,
        min: 0
    }
  },
  recordedVatRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false, // Or true
    field: 'recorded_vat_rate',
     validate: {
        isDecimal: true,
        min: 0
    }
  },
  billingStatus: {
    type: DataTypes.STRING, // Or DataTypes.ENUM('unbilled', 'billed', 'paid')
    allowNull: false,
    defaultValue: 'unbilled',
    field: 'billing_status',
    validate: {
      isIn: [['unbilled', 'billed', 'paid']] // Ensure valid status
    }
  },
  invoiceId: { // Link to the Invoice table (for later)
    type: DataTypes.UUID,
    allowNull: true, // Null until billed
    field: 'invoice_id',
    // 'references' defined in migration
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // createdAt, updatedAt automatically added
}, {
  sequelize,
  modelName: 'LedgerEntry',
  tableName: 'ledger_entries',
  timestamps: true,
  underscored: true,
});

module.exports = LedgerEntry;