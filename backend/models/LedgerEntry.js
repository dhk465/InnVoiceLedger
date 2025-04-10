// backend/models/LedgerEntry.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database'); // Ensure path is correct

class LedgerEntry extends Model {
  // Static method to define associations
  static associate(models) {
    // An entry belongs to one Customer
    this.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });
    // An entry references one Item type
    this.belongsTo(models.Item, {
      foreignKey: 'itemId',
      as: 'item'
    });
    // --- UPDATED: ADD ASSOCIATION ---
    // A billed entry belongs to one Invoice
    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId', // This FK needs to be added via migration
      as: 'invoice',
      allowNull: true // Important: Entry is not initially linked to an invoice
    });
    // --- END ASSOCIATION ---
  }
}

LedgerEntry.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'customer_id',
    // 'references' defined in migration
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'item_id',
    // 'references' defined in migration
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      isInt: { msg: "Quantity must be an integer" },
      min: { args: [1], msg: "Quantity must be at least 1" },
    }
  },
  entryDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'entry_date'
  },
  recordedPriceWithoutVAT: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'recorded_price_without_vat',
    validate: {
        isDecimal: true,
        min: 0
    }
  },
  recordedVatRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'recorded_vat_rate',
     validate: {
        isDecimal: true,
        min: 0
    }
  },
  billingStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unbilled',
    field: 'billing_status',
    validate: {
      isIn: [['unbilled', 'billed', 'paid']]
    }
  },
  // --- UPDATED: Add invoiceId field definition ---
  // This field links the ledger entry to an invoice once billed
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: true, // Starts null
    field: 'invoice_id',
    // Foreign key constraint added via migration
  },
  // --- END UPDATE ---
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