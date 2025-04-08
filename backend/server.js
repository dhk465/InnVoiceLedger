const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import only connectDB initially - sequelize instance comes from models/index now
const { connectDB } = require('./config/database');
// Import the central db object which contains models and sequelize instance
const db = require('./models'); // Node automatically looks for index.js

// Import API route handlers
const itemRoutes = require('./routes/itemRoutes');
const customerRoutes = require('./routes/customerRoutes');
const ledgerEntryRoutes = require('./routes/ledgerEntryRoutes');

// --- Connect to Database (Test Connection) ---
connectDB(); // Still good practice to explicitly test connection on startup

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

// --- Centralized Error Handling (Placeholder) ---
// app.use((err, req, res, next) => { ... });

// --- Start Server ---
// Verify models loaded (optional check using db object from require('./models'))
// console.log('Models available in server:', Object.keys(db).filter(k => k!=='sequelize' && k!=='Sequelize'));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});