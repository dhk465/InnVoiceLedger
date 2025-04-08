// Import the Express library
const express = require('express');

// Import dotenv and configure it to load variables from .env file
require('dotenv').config(); // Make sure to call config()

// Create an instance of the Express application
const app = express();

// Define the port the server will listen on
// Use the PORT environment variable if available, otherwise default to 3001
const PORT = process.env.PORT || 3001;

// Define a simple route for the root URL ('/')
app.get('/', (req, res) => {
  res.send('Hello from InnVoice Ledger Backend!'); // Send a simple text response
});

// Start the server and listen for incoming requests on the specified port
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});