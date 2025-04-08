'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
// Import the configured sequelize instance directly from database.js
const { sequelize } = require('../config/database'); // Adjust path if needed

const basename = path.basename(__filename); // Gets the name of this file (index.js)
// const env = process.env.NODE_ENV || 'development'; // Not strictly needed here as sequelize is pre-configured
const db = {}; // Object to hold all our models

// Read all files in the current directory (__dirname)
fs
  .readdirSync(__dirname)
  .filter(file => {
    // Filter criteria:
    return (
      file.indexOf('.') !== 0 && // Not a hidden file (like .DS_Store)
      file !== basename &&      // Not this index.js file itself
      file.slice(-3) === '.js' && // Must end with .js
      file.indexOf('.test.js') === -1 // Exclude test files
    );
  })
  .forEach(file => {
    // For each model file found, require it.
    // Our model files (Item.js, etc.) export the Model class directly.
    // The model definition uses the imported 'sequelize' instance from config/database.js
    const model = require(path.join(__dirname, file));
    // Store the model in our db object, using the model's name (e.g., 'Item') as the key
    db[model.name] = model;
  });

// Call the 'associate' static method on each model if it exists
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    console.log(`Associating model: ${modelName}`);
    db[modelName].associate(db); // Pass the db object containing all models
  }
});

// Export the sequelize instance and the Sequelize library itself
db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log("Models loaded and associated:", Object.keys(db).filter(k => k !== 'sequelize' && k !== 'Sequelize').join(', '));

module.exports = db; // Export the db object containing models, sequelize instance, and Sequelize class