// backend/config/config.json
require('dotenv').config({ path: '../.env' }); // Load .env file from backend directory

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, // Add port if not default 5432
    dialect: process.env.DB_DIALECT || "postgres" // Use dialect from env or default
  },
  test: { // Placeholder for test environment
    username: process.env.DB_USER_TEST, // Example: Use different vars for test DB
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_NAME_TEST,
    host: "127.0.0.1",
    dialect: "postgres"
  },
  production: { // Placeholder for production environment
    username: process.env.DB_USER_PROD, // Example: Use different vars for prod DB
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_NAME_PROD,
    host: process.env.DB_HOST_PROD,
    port: process.env.DB_PORT_PROD,
    dialect: "postgres",
    // Add production-specific options like dialectOptions for SSL if needed
    // dialectOptions: {
    //   ssl: {
    //     require: true,
    //     rejectUnauthorized: false // Adjust based on CA setup
    //   }
    // }
  }
};