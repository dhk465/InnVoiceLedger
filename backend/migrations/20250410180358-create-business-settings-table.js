'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('business_settings', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER // Using fixed INTEGER ID
        // If not using fixed ID, use UUID:
        // type: Sequelize.UUID,
        // defaultValue: Sequelize.UUIDV4
      },
      business_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      default_currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR' // Match model default
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      vat_id: {
        type: Sequelize.STRING,
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

    // Optional: Seed the initial settings row since we use a fixed ID
    await queryInterface.bulkInsert('business_settings', [{
        id: 1, // Fixed ID
        default_currency: 'EUR', // Default currency
        created_at: new Date(),
        updated_at: new Date()
    }], {});
    console.log('Seeded initial business settings row with ID 1.');

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('business_settings');
  }
};