// backend/models/Customer.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database'); // Ensure path is correct

class Customer extends Model {
  // Static method to define associations
  static associate(models) {
    // A customer can have many ledger entries
    this.hasMany(models.LedgerEntry, {
      foreignKey: 'customerId',
      as: 'ledgerEntries'
    });
    // --- UPDATED: ADD ASSOCIATION ---
    // A customer can have many invoices
    this.hasMany(models.Invoice, {
      foreignKey: 'customerId',
      as: 'invoices'
    });
    // --- END ASSOCIATION ---
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
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'company_name'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
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
  vatId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'vat_id'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // createdAt and updatedAt automatically added
}, {
  sequelize,
  modelName: 'Customer',
  tableName: 'customers',
  timestamps: true,
  underscored: true,
});

module.exports = Customer;