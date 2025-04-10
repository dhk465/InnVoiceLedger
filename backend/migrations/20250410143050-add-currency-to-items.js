'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'items', // Table name
      'currency', // New column name
      {
        type: Sequelize.STRING(3),
        allowNull: false,
        // Add a default temporarily ONLY if you have existing data in the 'items' table
        // Choose a sensible default ('CZK', 'EUR', 'USD', or even 'XXX')
        // COMMENT OUT or REMOVE this line if your 'items' table is currently empty
        defaultValue: 'CZK',
        after: 'unit_price_without_vat' // Optional: Place column after price
      }
    );

    // Optional: If you added a defaultValue above only for the migration,
    // uncomment the following block AFTER running the migration successfully
    // to remove the default constraint from the database column.
    /*
    await queryInterface.changeColumn('items', 'currency', {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: null // Remove default
    });
    console.log("Removed temporary default value from 'items.currency' column.");
    */
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('items', 'currency');
  }
};