'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', { // Table name 'invoices'
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      invoice_number: { // Use snake_case
        type: Sequelize.STRING,
        allowNull: false,
        unique: true // Ensure invoice numbers are unique
      },
      customer_id: { // Foreign key
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers', // References the 'customers' table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // Prevent deleting customer if they have invoices
      },
      issue_date: { // Use snake_case
        type: Sequelize.DATEONLY, // Store only date
        allowNull: false
      },
      due_date: { // Use snake_case
        type: Sequelize.DATEONLY,
        allowNull: true // Allow due date to be optional
      },
      subtotal_without_vat: { // Use snake_case
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false
      },
      total_vat_amount: { // Use snake_case
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false
      },
      grand_total: { // Use snake_case
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false
      },
      currency: {
          type: Sequelize.STRING(3),
          allowNull: false,
      },
      status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'issued',
      },
      notes: {
          type: Sequelize.TEXT,
          allowNull: true,
      },
      business_details_snapshot: { // Use snake_case
          type: Sequelize.JSONB, // Use JSONB for efficient JSON storage in Postgres
          allowNull: true,
      },
      customer_details_snapshot: { // Use snake_case
          type: Sequelize.JSONB,
          allowNull: true,
      },
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
    // Optional: Add index on invoice_number for faster lookups
    await queryInterface.addIndex('invoices', ['invoice_number']);
    // Optional: Add index on customer_id
    await queryInterface.addIndex('invoices', ['customer_id']);
     // Optional: Add index on issue_date
    await queryInterface.addIndex('invoices', ['issue_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('invoices');
  }
};