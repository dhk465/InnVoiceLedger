// src/App.jsx
import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom'; // Import Outlet
// No longer need useAuth here directly unless for other logic
// import { useAuth } from './contexts/AuthContext';

// Layout Components
import PublicLayout from './components/PublicLayout'; // <-- Import PublicLayout
import ProtectedLayout from './components/ProtectedLayout'; // <-- Import ProtectedLayout

// Route Protection Component
import ProtectedRoute from './components/ProtectedRoute';

// Page Components
import HomePage from './pages/HomePage';
import ItemsPage from './pages/ItemsPage';
import CustomersPage from './pages/CustomersPage';
import LedgerPage from './pages/LedgerPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  // Navbar rendering is now handled within ProtectedLayout

  return (
    <Routes>
      {/* Public Routes using PublicLayout */}
      <Route element={<PublicLayout />}> {/* Parent route defines layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Add other public routes like password reset here */}
      </Route>

      {/* Protected Routes using ProtectedLayout */}
      {/* Wrap the LAYOUT component with ProtectedRoute */}
      <Route element={
        <ProtectedRoute>
          <ProtectedLayout />
        </ProtectedRoute>
      }>
          {/* Nested routes render inside ProtectedLayout's <Outlet> */}
          <Route path="/" element={<HomePage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          {/* Add other protected routes here */}

          {/* Catch-all for authenticated section */}
          <Route path="*" element={<h2>404 - Page Not Found (App)</h2>} />
      </Route>

       {/* Optional: Add a top-level catch-all if needed, though the protected one covers most cases */}
       {/* <Route path="*" element={<h2>404 - Page Not Found (Root)</h2>} /> */}

    </Routes>
  );
}

export default App;