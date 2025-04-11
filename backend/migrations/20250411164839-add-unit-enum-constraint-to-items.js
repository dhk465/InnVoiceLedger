'use strict';

// Define allowed units centrally - Must match model
const ALLOWED_UNITS = ['pcs', 'night', 'day', 'hour', 'kg', 'litre', 'service', 'other'];
// Define names for clarity and easier modification
const ENUM_NAME = 'enum_items_unit';
const TABLE_NAME = 'items';
const COLUMN_NAME = 'unit';
const DEFAULT_VALUE = 'pcs';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // --- UP function: Applies the migration ---
  async up (queryInterface, Sequelize) {
    // Use a transaction to ensure all steps succeed or fail together
    const transaction = await queryInterface.sequelize.transaction();
    try {
        console.log(`Creating ENUM type ${ENUM_NAME}...`);
        // 1. Create the custom ENUM type in PostgreSQL
        await queryInterface.sequelize.query(
            `CREATE TYPE "${ENUM_NAME}" AS ENUM(${ALLOWED_UNITS.map(v => `'${v}'`).join(',')});`,
            { transaction }
        );
        console.log(`ENUM type ${ENUM_NAME} created.`);

        console.log(`Dropping existing DEFAULT constraint on ${TABLE_NAME}.${COLUMN_NAME}...`);
        // 2. Drop the existing default value constraint (important before type change)
        // This assumes the default constraint name follows a standard pattern.
        // If this fails, find the exact name using psql (\d items) or pgAdmin and replace it.
        try {
             await queryInterface.sequelize.query(
                `ALTER TABLE "${TABLE_NAME}" ALTER COLUMN "${COLUMN_NAME}" DROP DEFAULT;`,
                { transaction }
             );
             console.log(`Dropped existing DEFAULT constraint successfully.`);
        } catch(e) {
            // Log warning but continue if dropping default fails (might not exist)
            console.warn(`Could not drop default constraint (may not exist): ${e.message}`);
        }

        console.log(`Altering ${TABLE_NAME}.${COLUMN_NAME} column type to ${ENUM_NAME}...`);
        // 3. Change the column's data type to the new ENUM type
        // The USING clause attempts to cast existing string values to the ENUM type.
        // This requires existing values in the 'unit' column to be members of ALLOWED_UNITS.
        await queryInterface.changeColumn(TABLE_NAME, COLUMN_NAME, {
             type: `"${ENUM_NAME}" USING "${COLUMN_NAME}"::"${ENUM_NAME}"`, // Use raw query for USING clause
             // We re-apply allowNull and defaultValue after the type change.
         }, { transaction });
         console.log(`Column type changed to ${ENUM_NAME}.`);

        console.log(`Setting new DEFAULT value for ${TABLE_NAME}.${COLUMN_NAME}...`);
         // 4. Add the default value constraint back, explicitly casting to the ENUM type
         await queryInterface.sequelize.query(
            `ALTER TABLE "${TABLE_NAME}" ALTER COLUMN "${COLUMN_NAME}" SET DEFAULT '${DEFAULT_VALUE}'::"${ENUM_NAME}";`,
            { transaction }
         );
         console.log(`New DEFAULT constraint set successfully.`);

         console.log(`Ensuring NOT NULL constraint on ${TABLE_NAME}.${COLUMN_NAME}...`);
         // 5. Ensure the NOT NULL constraint is still present (changeColumn might drop it)
         await queryInterface.changeColumn(TABLE_NAME, COLUMN_NAME, {
            type: `"${ENUM_NAME}"`, // Referencing the type again
            allowNull: false
         }, { transaction });
         console.log(`NOT NULL constraint ensured.`);

        // If all steps were successful, commit the transaction
        await transaction.commit();
        console.log(`Successfully applied ENUM constraint and default to ${TABLE_NAME}.${COLUMN_NAME}.`);

    } catch (error) {
        // If any step failed, roll back the entire transaction
        await transaction.rollback();
        console.error(`Failed to apply ENUM constraint:`, error);
        // Provide specific feedback if the type already exists (from a previous failed run)
        if (error.message?.includes(`type "${ENUM_NAME}" already exists`)) {
            console.warn(`Enum type ${ENUM_NAME} already exists. Migration may have failed partially. Manual cleanup might be required before retrying.`);
        } else if (error.message?.includes(`default for column "${COLUMN_NAME}"`)) {
             console.error(`Specific error altering default: ${error.message}. Check default constraint name and value.`);
        }
        // Rethrow the error so Sequelize CLI knows the migration failed
        throw error;
     }
  },

  // --- DOWN function: Reverts the migration ---
  async down (queryInterface, Sequelize) {
     // Use a transaction for multi-step rollbacks
     const transaction = await queryInterface.sequelize.transaction();
     try {
         console.log(`Reverting ${TABLE_NAME}.${COLUMN_NAME} column to STRING...`);
         // 1. Change the column type back to STRING first.
         // We lose the ENUM constraint, but keep the data as text.
         // Need to remove default first potentially.
         try {
             await queryInterface.sequelize.query(
                 `ALTER TABLE "${TABLE_NAME}" ALTER COLUMN "${COLUMN_NAME}" DROP DEFAULT;`,
                 { transaction }
             );
         } catch (e) { console.warn(`Could not drop default constraint during revert (may not exist): ${e.message}`); }

         await queryInterface.changeColumn(TABLE_NAME, COLUMN_NAME, {
             type: Sequelize.STRING, // Change back to plain string
             allowNull: false, // Keep NOT NULL if it was there
             // Re-apply string default AFTER changing type
             // defaultValue: DEFAULT_VALUE
         }, { transaction });

          // Re-apply default value constraint suitable for STRING type
         await queryInterface.sequelize.query(
            `ALTER TABLE "${TABLE_NAME}" ALTER COLUMN "${COLUMN_NAME}" SET DEFAULT '${DEFAULT_VALUE}';`,
            { transaction }
         );


         console.log(`Dropping ENUM type ${ENUM_NAME}...`);
         // 2. Drop the custom ENUM type from the database
         await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUM_NAME}";`, { transaction });

         // Commit the transaction if all revert steps succeed
         await transaction.commit();
         console.log(`Successfully reverted ${TABLE_NAME}.${COLUMN_NAME} constraint and type.`);
     } catch(error) {
         // Rollback transaction if any revert step fails
         await transaction.rollback();
         console.error(`Failed to revert ${TABLE_NAME}.${COLUMN_NAME} constraint:`, error);
         throw error;
     }
  }
};