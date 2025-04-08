'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ledger_entries', { // Table name 'ledger_entries'
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      customer_id: { // Foreign key column
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers', // Name of the referenced table
          key: 'id'           // Name of the referenced column
        },
        onUpdate: 'CASCADE',  // If customer id changes, update here
        onDelete: 'RESTRICT'  // Prevent deleting customer if they have ledger entries
      },
      item_id: { // Foreign key column
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'items',     // Name of the referenced table
          key: 'id'           // Name of the referenced column
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'  // Prevent deleting item if it's used in entries
      },
      quantity: {
        type: Sequelize.INTEGER, // Use INTEGER for whole units
        allowNull: false,
        defaultValue: 1
      },
      entry_date: { // snake_case
        type: Sequelize.DATE, // Timestamp with time zone
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      recorded_price_without_vat: { // snake_case
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false // Require recording the price at time of entry
      },
      recorded_vat_rate: { // snake_case
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false // Require recording the VAT rate at time of entry
      },
      billing_status: { // snake_case
        type: Sequelize.STRING, // Using STRING is flexible
        // Alternatively, for stricter control (requires DB support like PostgreSQL ENUM):
        // type: Sequelize.ENUM('unbilled', 'billed', 'paid'),
        allowNull: false,
        defaultValue: 'unbilled'
      },
      invoice_id: { // snake_case - Foreign key added later when Invoice table exists
        type: Sequelize.UUID,
        allowNull: true, // Starts as NULL, linked when invoice is generated
        // references: { model: 'invoices', key: 'id' }, // Add this later
        // onUpdate: 'CASCADE',
        // onDelete: 'SET NULL' // Or RESTRICT if needed
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Optional: Add indexes for faster filtering/joining
    // await queryInterface.addIndex('ledger_entries', ['customer_id']);
    // await queryInterface.addIndex('ledger_entries', ['item_id']);
    // await queryInterface.addIndex('ledger_entries', ['entry_date']);
    // await queryInterface.addIndex('ledger_entries', ['billing_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ledger_entries');
    // If using ENUM for billing_status, you might need to drop the ENUM type here in PostgreSQL:
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ledger_entries_billing_status";');
  }
};