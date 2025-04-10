// backend/migrations/YYYY...-create-invoice-item-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoice_items', { // Table name 'invoice_items'
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      invoice_id: { // Foreign key
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'invoices', // References the 'invoices' table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If invoice is deleted, delete its line items too
      },
      description: {
        type: Sequelize.STRING, // Store description snapshot
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2), // Allow fractional quantities
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      unit_price_without_vat: { // Use snake_case
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      vat_rate: { // Use snake_case
        type: Sequelize.DECIMAL(5, 2), // Store the rate applied
        allowNull: false
      },
      line_total_without_vat: { // Use snake_case
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false
      },
      line_vat_amount: { // Use snake_case
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false
      },
      line_total_with_vat: { // Use snake_case
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false
      },
      // Optional: Add original_item_id if needed
      // original_item_id: {
      //   type: Sequelize.UUID,
      //   allowNull: true,
      //   references: { model: 'items', key: 'id' },
      //   onUpdate: 'CASCADE',
      //   onDelete: 'SET NULL' // Or RESTRICT
      // },
      created_at: { // Use snake_case
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: { // Use snake_case
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    // Optional: Add index on invoice_id for faster joining
    await queryInterface.addIndex('invoice_items', ['invoice_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('invoice_items');
  }
};