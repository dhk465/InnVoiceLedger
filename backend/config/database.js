// backend/config/database.js
const { Sequelize } = require('sequelize');

// Load environment variables from backend/.env
// Ensure this path is correct relative to where server.js is run (usually the backend root)
require('dotenv').config();

// Create a new Sequelize instance using environment variables
// These variables should be defined in your backend/.env file
const sequelize = new Sequelize(
  process.env.DB_NAME,      // Database name
  process.env.DB_USER,      // Database username
  process.env.DB_PASSWORD,  // Database password
  {
    host: process.env.DB_HOST,        // Database host (e.g., 'localhost' for local Docker)
    port: process.env.DB_PORT,        // Database port (e.g., 5432)
    dialect: process.env.DB_DIALECT || 'postgres', // Specify the database type
    logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log SQL in dev only
    // logging: false, // Or disable logging completely

    pool: { // Optional: Configure connection pooling for performance
      max: 5,     // Maximum number of connections in pool
      min: 0,     // Minimum number of connections in pool
      acquire: 30000, // Maximum time (ms) to try acquiring a connection before throwing error
      idle: 10000   // Maximum time (ms) a connection can be idle before being released
    }
    // Add dialectOptions here if needed (e.g., for SSL in production)
    // dialectOptions: {
    //   ssl: {
    //     require: true,
    //     rejectUnauthorized: false // Adjust for production CAs
    //   }
    // }
  }
);

// Function to test the database connection asynchronously
const connectDB = async () => {
  try {
    // Test the connection by trying to authenticate
    await sequelize.authenticate();
    console.log(`Database connection established successfully to ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}.`);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    // Exit the application process if the database connection fails on startup
    process.exit(1);
  }
};

// Export the configured sequelize instance AND the connection function
// The 'sequelize' instance will be used by your models
module.exports = { sequelize, connectDB };