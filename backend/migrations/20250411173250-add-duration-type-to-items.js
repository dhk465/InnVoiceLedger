'use strict';
// Optional: Define allowed types here too for consistency in migration
// const ALLOWED_DURATION_TYPES = ['day', 'night'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('Adding duration_type column to items table...');
      await queryInterface.addColumn('items', 'duration_type', {
        type: Sequelize.STRING,
        allowNull: true, // Allow null for items not based on duration
        after: 'unit' // Optional placement
        // Optional: Add CHECK constraint if desired, though ENUM might be better if list is fixed
        // constraint: Sequelize.CHECK('duration_type IN (...)')
      }, { transaction });

      // Optional: Update existing 'night' or 'day' unit items to have corresponding duration_type
      console.log("Updating existing items based on unit ('day', 'night')...");
      await queryInterface.sequelize.query(
        `UPDATE "items" SET "duration_type" = 'day' WHERE "unit" = 'day' AND "duration_type" IS NULL;`,
        { transaction }
      );
       await queryInterface.sequelize.query(
        `UPDATE "items" SET "duration_type" = 'night' WHERE "unit" = 'night' AND "duration_type" IS NULL;`,
        { transaction }
      );

      await transaction.commit();
      console.log('Successfully added duration_type to items table.');
    } catch (error) {
       await transaction.rollback();
       console.error('Failed to add duration_type to items table:', error);
       throw error;
    }
  },

  async down (queryInterface, Sequelize) {
     const transaction = await queryInterface.sequelize.transaction();
     try {
        console.log('Removing duration_type column from items table...');
        await queryInterface.removeColumn('items', 'duration_type', { transaction });
        await transaction.commit();
        console.log('Successfully removed duration_type from items table.');
     } catch (error) {
        await transaction.rollback();
        console.error('Failed to remove duration_type from items table:', error);
        throw error;
     }
  }
};