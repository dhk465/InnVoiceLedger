// backend/models/Item.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database'); // Ensure this path is correct

class Item extends Model {
  // Static method to define associations
  static associate(models) {
    // An item type can appear in many ledger entries
    this.hasMany(models.LedgerEntry, {
      foreignKey: 'itemId',
      as: 'ledgerEntries'
    });
  }
}

Item.init({
  // Model attributes correspond to table columns
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
      notEmpty: { msg: "Item name cannot be empty" },
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: {
        msg: "SKU must be unique."
    }
  },
  unitPriceWithoutVAT: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price_without_vat',
    validate: {
      isDecimal: { msg: "Unit price must be a decimal number" },
      min: { args: [0], msg: "Unit price cannot be negative" }
    }
  },
  // --- ADDED CURRENCY FIELD ---
  currency: {
    type: DataTypes.STRING(3), // Store 3-letter ISO 4217 code
    allowNull: false,
    validate: {
      isUppercase: { msg: "Currency code must be uppercase" },
      len: { args: [3,3], msg: "Currency code must be 3 letters" }
    }
    // No 'field' needed if column name matches attribute name (currency)
  },
  // --- END ADDED CURRENCY FIELD ---
  vatRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'vat_rate',
    validate: {
      isDecimal: { msg: "VAT rate must be a decimal number" },
      min: { args: [0], msg: "VAT rate cannot be negative" }
    }
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pcs'
  },
  // createdAt and updatedAt managed by Sequelize

}, {
  // --- Other model options ---
  sequelize,
  modelName: 'Item',
  tableName: 'items',
  timestamps: true,
  underscored: true,
});

module.exports = Item;