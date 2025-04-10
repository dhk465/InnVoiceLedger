// backend/models/BusinessSetting.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class BusinessSetting extends Model {
  // No associations needed for this simple model yet
}

BusinessSetting.init({
  // Using a fixed ID allows easy retrieval/update of the single settings record
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1, // Fixed ID for the single settings row
    allowNull: false,
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: true, // Allow fields to be optional initially
    field: 'business_name',
  },
  defaultCurrency: {
    type: DataTypes.STRING(3),
    allowNull: false, // Require a default currency
    defaultValue: 'EUR', // Sensible default, owner should update
    field: 'default_currency',
    validate: {
      isUppercase: true,
      len: [3,3]
    }
  },
  // Add other fields later: address, vatId, logoUrl, bankDetails etc.
  address: {
      type: DataTypes.TEXT,
      allowNull: true,
  },
  vatId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'vat_id'
  },
  // Timestamps are good practice
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at' // Define field name if needed by underscored:true
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at' // Define field name if needed by underscored:true
  }
}, {
  sequelize,
  modelName: 'BusinessSetting',
  tableName: 'business_settings',
  timestamps: true, // Enable timestamps
  underscored: true, // Use snake_case
});

module.exports = BusinessSetting;