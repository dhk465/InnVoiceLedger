'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customers', { // Table name 'customers'
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      company_name: { // Use snake_case matching the model's 'field' option
        type: Sequelize.STRING,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true, // Set to false if email is mandatory
        unique: true     // Ensure email is unique
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT, // Use TEXT for potentially longer addresses
        allowNull: true
      },
      vat_id: { // Use snake_case matching the model's 'field' option
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: { // Sequelize automatically manages 'createdAt' in model
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Default to DB timestamp
      },
      updated_at: { // Sequelize automatically manages 'updatedAt' in model
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Optional: Add indexes for faster lookups if needed
    // await queryInterface.addIndex('customers', ['email']);
    // await queryInterface.addIndex('customers', ['name']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('customers');
  }
};