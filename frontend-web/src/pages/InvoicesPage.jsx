// src/pages/InvoicesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getInvoices } from '../services/apiService'; // Import API function
// Import shared currency formatting function if needed or define locally
import { formatCurrency } from '../utils/formatting'; // Assuming you create this util file
// --- Optional: Create and import CSS Module ---
import styles from './InvoicesPage.module.css'; // Example path

// Simple fallback currency formatter if not importing from utils
const formatCurrencyLocal = (amount, currencyCode) => {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || typeof currencyCode !== 'string' || currencyCode.length !== 3) {
        const rawAmount = amount != null ? String(amount) : '-';
        const rawCurrency = currencyCode != null ? String(currencyCode) : '';
        return `${rawAmount} ${rawCurrency}`.trim();
      }
      try {
        return new Intl.NumberFormat('en', { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numAmount);
      } catch (e) { return `${numAmount.toFixed(2)} ${currencyCode}`; }
};


function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError('Failed to load invoices. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

   // Helper for formatting date
   const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        // DateOnly fields from Sequelize might not need time part
        return new Date(dateString + 'T00:00:00Z').toLocaleDateString(undefined, { // Add time part for correct local date
            year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' // Specify UTC if needed
        });
    } catch(e) { return dateString; }
  }


  if (isLoading) {
    // Apply styles if module exists
    return <div className={styles?.loadingMessage || ''} style={!styles?.loadingMessage ? { fontStyle: 'italic', color: '#6c757d', padding: '1rem' } : {}}>Loading invoices...</div>;
  }

  if (error) {
    // Apply styles if module exists
    return <div className={styles?.errorMesssage || ''} style={!styles?.errorMesssage ? { color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' } : {}}>Error: {error}</div>;
  }

  return (
    // Apply styles if module exists
    <div className={styles?.pageContainer || ''} style={!styles?.pageContainer ? { padding: '1rem'} : {}}>
      <div className={styles?.header || ''} style={!styles?.header ? { marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #dee2e6'} : {}}>
        <h2>Manage Invoices</h2>
        <p>List of generated invoices.</p>
        {/* Add "Generate Invoice" button/section here later */}
      </div>

      {/* Apply styles if module exists */}
      <table className={styles?.invoicesTable || ''} style={!styles?.invoicesTable ? { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' } : {}}>
        <thead>
          <tr>
            <th>Inv. Number</th>
            <th>Customer</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Total Amount</th>
            <th>Currency</th>
            <th>Status</th>
            {/* <th>Actions</th> */}
          </tr>
        </thead>
        <tbody>
          {invoices.length > 0 ? (
            invoices.map(invoice => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNumber}</td>
                {/* Use optional chaining for safety */}
                <td>{invoice.customer?.name || 'N/A'} {invoice.customer?.companyName ? `(${invoice.customer.companyName})` : ''}</td>
                <td>{formatDate(invoice.issueDate)}</td>
                <td>{formatDate(invoice.dueDate)}</td>
                <td style={{ textAlign: 'right' }}>
                  {formatCurrencyLocal(invoice.grandTotal, invoice.currency)}
                </td>
                <td>{invoice.currency}</td>
                <td>{invoice.status}</td>
                {/* Add View/Download buttons later */}
                {/* <td><button>View</button> <button>Download</button></td> */}
              </tr>
            ))
          ) : (
             // Apply styles if module exists
            <tr className={styles?.noInvoicesRow || ''} style={!styles?.noInvoicesRow ? { fontStyle: 'italic' } : {}}>
              {/* Adjust colSpan */}
              <td colSpan="7">No invoices found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default InvoicesPage;