// backend/models/Customer.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Customer extends Model {
  // Static method to define associations
  static associate(models) {
    // A customer can have many ledger entries
    this.hasMany(models.LedgerEntry, {
      foreignKey: 'customerId', // fk column in LedgerEntry table
      as: 'ledgerEntries'      // Alias to use when eager loading
    });
    // A customer can have many invoices (define later)
    // this.hasMany(models.Invoice, { foreignKey: 'customerId', as: 'invoices' });
  }
}

Customer.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Customer name cannot be empty" },
    }
  },
  companyName: { // Optional
    type: DataTypes.STRING,
    allowNull: true,
    field: 'company_name' // Explicit snake_case mapping
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true, // Or false if required
    unique: true,
    validate: {
      isEmail: { msg: "Must be a valid email address" },
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  vatId: { // Tax ID, e.g., DIČ in CZ
    type: DataTypes.STRING,
    allowNull: true,
    field: 'vat_id'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // createdAt and updatedAt automatically added by timestamps: true
}, {
  sequelize,
  modelName: 'Customer',
  tableName: 'customers',
  timestamps: true,
  underscored: true, // Use snake_case for columns
});

module.exports = Customer;