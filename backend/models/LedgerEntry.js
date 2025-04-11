// backend/models/LedgerEntry.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database'); // Ensure path is correct

class LedgerEntry extends Model {
  // Static method to define associations with other models
  static associate(models) {
    // Each LedgerEntry belongs to one Customer
    this.belongsTo(models.Customer, {
      foreignKey: 'customerId', // Foreign key in this (LedgerEntry) table
      as: 'customer'         // Alias used for eager loading (e.g., include: [{ model: Customer, as: 'customer' }])
    });
    // Each LedgerEntry references one Item type definition
    this.belongsTo(models.Item, {
      foreignKey: 'itemId',     // Foreign key in this table
      as: 'item'             // Alias used for eager loading
    });
    // Each LedgerEntry MAY belong to one Invoice (after being billed)
    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId', // Foreign key in this table (nullable)
      as: 'invoice',         // Alias used for eager loading
      allowNull: true        // Explicitly state relation is optional here too
    });
  }
}

// Initialize the LedgerEntry model with its attributes and options
LedgerEntry.init({
  // Primary Key
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Generate UUID automatically
    primaryKey: true,
    allowNull: false,
  },
  // Foreign Key to Customers table
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'customer_id', // Map to snake_case column
    // The actual foreign key constraint ('references') is defined in the migration
  },
  // Foreign Key to Items table
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'item_id', // Map to snake_case column
    // Constraint defined in migration
  },
  // Quantity of the item/service used
  quantity: {
    type: DataTypes.INTEGER, // Assuming whole numbers for quantity
    allowNull: false,
    defaultValue: 1, // Default to 1 if not specified
    validate: {
      isInt: { msg: "Quantity must be an integer" },
      min: { args: [1], msg: "Quantity must be at least 1" } // Basic validation
    }
  },

  // --- UPDATED: Replaced entryDate ---
  // Start date/time of the service/consumption
  startDate: {
    type: DataTypes.DATE, // Stores date and time with timezone info
    allowNull: false,     // Start date is required
    field: 'start_date'   // Map to snake_case column
  },
  // End date/time of the service/consumption (optional)
  endDate: {
    type: DataTypes.DATE, // Stores date and time with timezone info
    allowNull: true,      // Allow null if it's a point-in-time event or ongoing
    field: 'end_date'     // Map to snake_case column
  },
  // --- END DATE UPDATE ---

  // Snapshot of the price at the time of entry
  recordedPriceWithoutVAT: {
    type: DataTypes.DECIMAL(10, 2), // Price per unit
    allowNull: false,
    field: 'recorded_price_without_vat',
    validate: {
        isDecimal: { msg: "Recorded price must be a decimal number" },
        min: { args: [0], msg: "Recorded price cannot be negative" }
    }
  },
  // Snapshot of the VAT rate at the time of entry
  recordedVatRate: {
    type: DataTypes.DECIMAL(5, 2), // VAT Rate percentage
    allowNull: false,
    field: 'recorded_vat_rate',
     validate: {
        isDecimal: { msg: "Recorded VAT rate must be a decimal number" },
        min: { args: [0], msg: "Recorded VAT rate cannot be negative" }
    }
  },
  // Status indicating if this entry is included in an invoice
  billingStatus: {
    type: DataTypes.STRING, // Or use ENUM for stricter control: DataTypes.ENUM('unbilled', 'billed', 'paid')
    allowNull: false,
    defaultValue: 'unbilled', // Default to unbilled
    field: 'billing_status',
    validate: {
      isIn: { // Ensure value is one of the allowed statuses
        args: [['unbilled', 'billed', 'paid']],
        msg: "Invalid billing status"
      }
    }
  },
  // Foreign key to Invoices table (set when billed)
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: true, // Starts null, linked later
    field: 'invoice_id',
    // Constraint ('references') defined in migration
  },
  // Optional notes for this specific ledger entry
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // createdAt and updatedAt are managed by Sequelize due to timestamps: true below
}, {
  // Model options
  sequelize,                // Pass the configured Sequelize instance
  modelName: 'LedgerEntry', // Name used in Sequelize methods (e.g., db.LedgerEntry)
  tableName: 'ledger_entries', // Explicitly set the table name in the database
  timestamps: true,         // Automatically add createdAt and updatedAt columns
  underscored: true,        // Use snake_case for columns (createdAt -> created_at) and foreign keys
});

// Export the model
module.exports = LedgerEntry;