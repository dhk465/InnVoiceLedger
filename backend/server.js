// backend/server.js

// Import necessary modules
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import only connectDB initially
const { connectDB } = require('./config/database'); // Ensure path is correct
// Import the central db object which contains models and sequelize instance
const db = require('./models'); // Node automatically looks for index.js

// Import API route handlers
const itemRoutes = require('./routes/itemRoutes');
const customerRoutes = require('./routes/customerRoutes');
const ledgerEntryRoutes = require('./routes/ledgerEntryRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

// --- Connect to Database (Test Connection) ---
connectDB();

// --- Initialize Express App ---
const app = express();

// --- Define Port ---
const PORT = process.env.PORT || 3001;

// --- Global Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('InnVoice Ledger Backend API is running!');
});
app.use('/api/items', itemRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/ledger', ledgerEntryRoutes);
app.use('/api/invoices', invoiceRoutes);

// --- Centralized Error Handling (Placeholder) ---
// app.use((err, req, res, next) => { ... });

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});