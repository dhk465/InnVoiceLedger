// backend/migrations/YYYY...-add-invoiceId-to-ledger-entries.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('Checking/Adding invoice_id FOREIGN KEY constraint and index to ledger_entries...');
    // --- Add the FOREIGN KEY constraint ---
    // This assumes the 'invoice_id' column already exists but lacks the constraint
    await queryInterface.addConstraint('ledger_entries', {
      fields: ['invoice_id'], // Column in ledger_entries table
      type: 'foreign key',
      name: 'ledger_entries_invoice_id_fkey', // Optional custom name for the constraint
      references: {
        table: 'invoices', // Table name it references
        field: 'id',       // Column name in the referenced table
      },
      onDelete: 'SET NULL', // If invoice is deleted, set invoice_id to NULL
      onUpdate: 'CASCADE', // If invoice id changes, update here
    });
    console.log('FOREIGN KEY constraint for invoice_id added.');

    // --- Add the INDEX ---
    // It's good practice to index foreign keys
    await queryInterface.addIndex('ledger_entries', ['invoice_id']);
    console.log('Index for invoice_id added.');
  },

  async down(queryInterface, Sequelize) {
    console.log('Removing invoice_id FOREIGN KEY constraint and index from ledger_entries...');
    // Remove index first
    await queryInterface.removeIndex('ledger_entries', ['invoice_id']);
    console.log('Index for invoice_id removed.');
    // Remove constraint (use the name if you specified one, otherwise default name might vary)
    await queryInterface.removeConstraint('ledger_entries', 'ledger_entries_invoice_id_fkey');
    console.log('FOREIGN KEY constraint for invoice_id removed.');
    // Note: This 'down' method does NOT remove the invoice_id COLUMN itself,
    // as we assume it existed before this migration ran in this scenario.
    // If you wanted a 'down' to fully revert, it would need to also remove the column.
  }
};