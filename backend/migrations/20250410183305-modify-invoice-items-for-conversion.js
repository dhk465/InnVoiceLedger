'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use a transaction for multi-step migrations
    const transaction = await queryInterface.sequelize.transaction();
    try {
        console.log('Renaming columns in invoice_items...');
        // 1. Explicitly RENAME existing columns first
        await queryInterface.renameColumn(
            'invoice_items', // table name
            'unit_price_without_vat', // current column name
            'original_unit_price_without_vat', // NEW column name
            { transaction }
        );
        await queryInterface.renameColumn(
            'invoice_items',
            'vat_rate',
            'original_vat_rate',
            { transaction }
        );
        console.log('Columns renamed.');

        console.log('Adding new columns to invoice_items...');
        // 2. ADD the new columns needed for conversion details
        await queryInterface.addColumn('invoice_items', 'original_currency', {
            type: Sequelize.STRING(3),
            allowNull: false, // Constraint should work now on empty table
            after: 'original_unit_price_without_vat' // Optional placement
        }, { transaction });

        await queryInterface.addColumn('invoice_items', 'exchange_rate_used', {
            type: Sequelize.DECIMAL(14, 6),
            allowNull: true,
            after: 'original_currency'
        }, { transaction });

         // 3. ADD back the columns to store CONVERTED values (in invoice currency)
         await queryInterface.addColumn('invoice_items', 'unit_price_without_vat', {
             type: Sequelize.DECIMAL(10, 2),
             allowNull: false,
             comment: 'Unit price in INVOICE currency after conversion',
             after: 'exchange_rate_used'
         }, { transaction });

         await queryInterface.addColumn('invoice_items', 'vat_rate', {
             type: Sequelize.DECIMAL(5, 2),
             allowNull: false,
             comment: 'VAT Rate percentage applied for this line',
             after: 'unit_price_without_vat'
         }, { transaction });
        console.log('New columns added.');

        await transaction.commit();
        console.log('Successfully modified invoice_items table for currency conversion.');

    } catch (error) {
        await transaction.rollback();
        console.error('Failed to modify invoice_items table:', error);
        throw error;
    }
  },

  async down(queryInterface, Sequelize) {
     const transaction = await queryInterface.sequelize.transaction();
     try {
        console.log('Reverting modifications to invoice_items table...');
        await queryInterface.removeColumn('invoice_items', 'vat_rate', { transaction });
        await queryInterface.removeColumn('invoice_items', 'unit_price_without_vat', { transaction });
        await queryInterface.removeColumn('invoice_items', 'exchange_rate_used', { transaction });
        await queryInterface.removeColumn('invoice_items', 'original_currency', { transaction });
        console.log('Columns removed.');

        console.log('Renaming columns back...');
        await queryInterface.renameColumn('invoice_items', 'original_vat_rate', 'vat_rate', { transaction });
        await queryInterface.renameColumn('invoice_items', 'original_unit_price_without_vat', 'unit_price_without_vat', { transaction });
        console.log('Columns renamed back.');

        await transaction.commit();
        console.log('Successfully reverted invoice_items table modifications.');
     } catch (error) {
        await transaction.rollback();
        console.error('Failed to revert invoice_items table modifications:', error);
        throw error;
     }
  }
};