// backend/models/Item.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Item extends Model {
  // --- ADD THIS METHOD ---
  // Static method to define associations
  static associate(models) {
    // An item type can appear in many ledger entries
    this.hasMany(models.LedgerEntry, {
      foreignKey: 'itemId', // fk column in LedgerEntry table
      as: 'ledgerEntries'      // Alias to use when eager loading
    });
  }
  // --- END OF ADDED METHOD ---

  // ... (rest of Item class definition: init method) ...
}

Item.init({
  // Model attributes correspond to table columns
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Automatically generate UUIDs
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { // Example server-side validation
      notEmpty: { msg: "Item name cannot be empty" },
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true, // Description is optional
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true, // Category is optional for now
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: { // Add unique constraint message
        msg: "SKU must be unique."
    }
  },
  // Use camelCase here, Sequelize maps it to snake_case in DB via underscored: true
  unitPriceWithoutVAT: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price_without_vat', // <--- Add this line
    validate: {
      isDecimal: { msg: "Unit price must be a decimal number" },
      min: { args: [0], msg: "Unit price cannot be negative" }
    }
  },
  vatRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'vat_rate', // <--- Add this line
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
  // createdAt and updatedAt are automatically managed by Sequelize if timestamps: true
  // No need to define them here unless you want to customize their column names (which we did via underscored: true)

}, {
  // --- Other model options ---
  sequelize,                // Pass the connection instance
  modelName: 'Item',        // The name of the model
  tableName: 'items',       // Explicitly define table name (matches migration)
  timestamps: true,         // Enable createdAt and updatedAt fields
  underscored: true,        // Use snake_case for automatically added fields (createdAt, updatedAt)
                            // AND for mapping camelCase attributes (like unitPriceWithoutVAT)
                            // to snake_case columns (unit_price_without_vat) in SQL queries.
  // paranoid: true,        // Optional: Enable soft deletes (adds deletedAt column)
});

// Optional: Define associations later (e.g., if an Item belongs to a User)
// Item.belongsTo(User, { foreignKey: 'userId' });

module.exports = Item; // Export the model for use in controllers