// backend/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const { sequelize } = require('../config/database'); // Ensure path is correct

const basename = path.basename(__filename);
const db = {}; // Object to hold all our models

// Read all files in the current directory (__dirname)
fs
  .readdirSync(__dirname)
  .filter(file => {
    // Filter criteria:
    return (
      file.indexOf('.') !== 0 && // Not a hidden file
      file !== basename &&      // Not this index.js file
      file.slice(-3) === '.js' && // Must end with .js
      file.indexOf('.test.js') === -1 // Exclude test files
    );
  })
  .forEach(file => {
    // For each model file found, require it.
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

// Log final list including new models
console.log("Models loaded and associated:", Object.keys(db).filter(k => k !== 'sequelize' && k !== 'Sequelize').join(', '));

module.exports = db; // Export the db object