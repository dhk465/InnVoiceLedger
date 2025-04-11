// backend/models/Item.js
const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

const ALLOWED_UNITS = [
  "pcs",
  "night",
  "day",
  "hour",
  "kg",
  "litre",
  "service",
  "other",
];
// --- NEW: Allowed duration types ---
const ALLOWED_DURATION_TYPES = ["day", "night"]; // Add more if needed (e.g., 'hour')

class Item extends Model {
  static associate(models) {
    this.hasMany(models.LedgerEntry, {
      foreignKey: "itemId",
      as: "ledgerEntries",
    });
  }
}

Item.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    sku: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: { msg: "SKU must be unique." },
    },
    unitPriceWithoutVAT: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "unit_price_without_vat",
      validate: { isDecimal: true, min: 0 },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      validate: { isUppercase: true, len: [3, 3] },
    },
    vatRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: "vat_rate",
      validate: { isDecimal: true, min: 0 },
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pcs",
      validate: {
        isIn: {
          args: [ALLOWED_UNITS],
          msg: `Unit must be one of: ${ALLOWED_UNITS.join(", ")}`,
        },
      },
    },
    // --- ADDED: Duration Type Field ---
    durationType: {
      type: DataTypes.STRING,
      allowNull: true, // Null if duration calculation doesn't apply (e.g., for 'pcs')
      field: "duration_type",
      validate: {
        isIn: {
          // Optional: Validate against allowed duration types if set
          args: [ALLOWED_DURATION_TYPES],
          msg: `Duration type must be one of: ${ALLOWED_DURATION_TYPES.join(
            ", "
          )}`,
        },
      },
    },
    // --- END ADD ---
    // createdAt, updatedAt managed by Sequelize
  },
  {
    sequelize,
    modelName: "Item",
    tableName: "items",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Item;
