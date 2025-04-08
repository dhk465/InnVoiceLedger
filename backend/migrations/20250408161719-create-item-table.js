'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('items', { // Match table name in model options ('items')
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID, // Use UUID
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sku: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true // Ensure SKU is unique if provided
      },
      unit_price_without_vat: { // Use snake_case matching underscored: true in model
        type: Sequelize.DECIMAL(10, 2), // Specify precision and scale
        allowNull: false
      },
      vat_rate: { // Use snake_case
        type: Sequelize.DECIMAL(5, 2), // Specify precision and scale
        allowNull: false,
        defaultValue: 0.00
      },
      unit: { // Use snake_case
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pcs'
      },
      created_at: { // Use snake_case
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Optional: Set default DB timestamp
      },
      updated_at: { // Use snake_case
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Optional: Set default DB timestamp
      }
    });

    // Optional: Add indexes for frequently queried columns
    // await queryInterface.addIndex('items', ['category']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('items');
  }
};