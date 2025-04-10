import React from 'react';
import { Routes, Route } from 'react-router-dom'; // <-- Import Routes and Route

// Import Components
import Navbar from './components/Navbar'; // <-- Import Navbar

// Import Page Components
import HomePage from './pages/HomePage';
import ItemsPage from './pages/ItemsPage';
import CustomersPage from './pages/CustomersPage';
import LedgerPage from './pages/LedgerPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';

// Import other pages as you create them

function App() {
  return (
    <div>
      <Navbar /> {/* <-- Render Navbar here so it appears on all pages */}
      <main style={{ padding: '0 20px' }}> {/* Add some padding around page content */}
        <Routes> {/* Define the routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          {/* Define a catch-all route for 404 Not Found (optional) */}
          <Route path="*" element={<h2>404 - Page Not Found</h2>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;