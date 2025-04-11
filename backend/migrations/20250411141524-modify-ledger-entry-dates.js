// backend/migrations/YYYY...-modify-ledger-entry-dates.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('Adding startDate and endDate columns to ledger_entries...');
      // Add new columns first, allowing NULL temporarily if migrating data
      await queryInterface.addColumn('ledger_entries', 'start_date', {
        type: Sequelize.DATE,
        allowNull: true, // Allow null during transition
        after: 'quantity' // Optional placement
      }, { transaction });

      await queryInterface.addColumn('ledger_entries', 'end_date', {
        type: Sequelize.DATE,
        allowNull: true, // End date can be optional
        after: 'start_date'
      }, { transaction });

      console.log('Migrating existing entryDate data (if any)...');
      // Copy data from old entry_date to new start_date and end_date
      // Sets end_date = start_date for existing point-in-time entries
      await queryInterface.sequelize.query(
        `UPDATE "ledger_entries" SET "start_date" = "entry_date", "end_date" = "entry_date" WHERE "entry_date" IS NOT NULL;`,
        { transaction }
      );
      console.log('Data migration complete.');

      console.log('Applying NOT NULL constraint to start_date...');
      // Now that data is potentially migrated, make startDate NOT NULL
      await queryInterface.changeColumn('ledger_entries', 'start_date', {
        type: Sequelize.DATE,
        allowNull: false // Apply NOT NULL constraint
      }, { transaction });

      console.log('Removing old entry_date column...');
      // Finally, remove the old column
      await queryInterface.removeColumn('ledger_entries', 'entry_date', { transaction });

      // Add indexes for faster date range queries
      await queryInterface.addIndex('ledger_entries', ['start_date'], { transaction });
      await queryInterface.addIndex('ledger_entries', ['end_date'], { transaction });

      await transaction.commit();
      console.log('Successfully modified ledger_entries table for date ranges.');

    } catch (error) {
      await transaction.rollback();
      console.error('Failed to modify ledger_entries table:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverting this is complex and potentially lossy if data used date ranges
    const transaction = await queryInterface.sequelize.transaction();
    try {
        console.log('Reverting ledger_entries date changes...');
        await queryInterface.removeIndex('ledger_entries', ['start_date'], { transaction });
        await queryInterface.removeIndex('ledger_entries', ['end_date'], { transaction });

        // Add back entry_date (allow null initially)
        await queryInterface.addColumn('ledger_entries', 'entry_date', {
            type: Sequelize.DATE,
            allowNull: true // Allow null temporarily
        }, { transaction });

        console.log('Attempting to copy start_date back to entry_date...');
        // Copy start_date back (best guess for reversal)
         await queryInterface.sequelize.query(
            `UPDATE "ledger_entries" SET "entry_date" = "start_date" WHERE "start_date" IS NOT NULL;`,
            { transaction }
         );
         // Make entry_date NOT NULL (if it was originally)
         await queryInterface.changeColumn('ledger_entries', 'entry_date', {
            type: Sequelize.DATE,
            allowNull: false
         }, { transaction });


        console.log('Removing startDate and endDate columns...');
        await queryInterface.removeColumn('ledger_entries', 'end_date', { transaction });
        await queryInterface.removeColumn('ledger_entries', 'start_date', { transaction });

        await transaction.commit();
        console.log('Successfully reverted ledger_entries date modifications (data loss may occur).');
    } catch (error) {
        await transaction.rollback();
        console.error('Failed to revert ledger_entries modifications:', error);
        throw error;
    }
  }
};