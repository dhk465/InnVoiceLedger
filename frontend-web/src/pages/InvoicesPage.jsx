// src/pages/InvoicesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
// Import Link for navigation
import { Link } from 'react-router-dom';
// Import API service function
import { getInvoices, getInvoicePdfUrl } from '../services/apiService';
// Import formatting utilities
import { formatCurrency, formatDate } from '../utils/formatting';
// Import CSS module for styling
import styles from './InvoicesPage.module.css';

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

// Simple fallback date formatter if not importing from utils
const formatDateLocal = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00Z');
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
    } catch(e) { return dateString; }
};


function InvoicesPage() {
  // State for invoices list, loading, and errors
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch invoices, memoized with useCallback
  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getInvoices(); // Call the API
      setInvoices(data); // Update state
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError('Failed to load invoices. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array - fetch function doesn't change

  // useEffect to call fetchInvoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]); // Depends on the fetchInvoices function reference


  // Use imported formatters or local fallbacks
  const displayFormatCurrency = typeof formatCurrency === 'function' ? formatCurrency : formatCurrencyLocal;
  const displayFormatDate = typeof formatDate === 'function' ? formatDate : formatDateLocal;


  // --- Handler for download button click ---
  const handleDownloadClick = (invoiceId) => {
    if (!invoiceId) return;
    try {
        const pdfUrl = getInvoicePdfUrl(invoiceId);
        // Open the URL in a new tab - browser handles download/display
        window.open(pdfUrl, '_blank');
    } catch (err) {
        console.error("Error getting PDF URL:", err);
        // Optionally show an error to the user
        alert("Could not generate download link.");
    }

    // --- Alternative using Axios blob download (more complex) ---
    /*
    const downloadBlob = async (invoiceId) => {
        try {
            const blob = await downloadInvoicePdfBlob(invoiceId);
            // Create a link element to trigger download
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            // Extract filename suggestion from backend header (if possible) or create one
            const filename = `Invoice-${invoiceId}.pdf`; // Basic filename
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href); // Clean up blob URL
        } catch (err) {
            console.error("Error downloading PDF blob:", err);
            alert("Failed to download PDF.");
        }
    }
    // downloadBlob(invoiceId); // Call this instead of window.open
    */
    // --- End Alternative ---
  };

  // --- Render Logic ---
  if (isLoading) {
    return <div className={styles.loadingMessage}>Loading invoices...</div>;
  }

  if (error) {
    return <div className={styles.errorMesssage}>Error: {error}</div>;
  }

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.header}>
        <h2>Manage Invoices</h2>
        <p>List of generated invoices.</p>
        {/* Placeholder for future actions like bulk export or generate button */}
      </div>

      {/* Invoices Table */}
      <table className={styles.invoicesTable}>
        <thead>
          <tr>
            <th>Inv. Number</th>
            <th>Customer</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Total Amount</th>
            <th>Currency</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length > 0 ? (
            // Map through the fetched invoices
            invoices.map(invoice => (
              <tr key={invoice.id}>
                {/* Invoice Number as a Link to the detail page */}
                <td>
                  <Link to={`/invoices/${invoice.id}`} title="View Details" className={styles.invoiceLink}>
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                {/* Customer Name (with company name if available) */}
                <td>
                  {invoice.customer?.name || 'N/A'}
                  {invoice.customer?.companyName ? ` (${invoice.customer.companyName})` : ''}
                </td>
                {/* Formatted Dates */}
                <td>{displayFormatDate(invoice.issueDate)}</td>
                <td>{displayFormatDate(invoice.dueDate)}</td>
                {/* Formatted Total Amount */}
                <td style={{ textAlign: 'right' }}>
                  {displayFormatCurrency(invoice.grandTotal, invoice.currency)}
                </td>
                {/* Currency Code */}
                <td>{invoice.currency}</td>
                {/* Status */}
                <td>{invoice.status}</td>
                {/* Actions Cell */}
                <td>
                  <button
                    onClick={() => handleDownloadClick(invoice.id)}
                    className={styles.actionButton}
                    title="Download PDF"
                  >
                    Download
                  </button>
                  {/* Add Edit button later if needed */}
                </td>
                {/* <td><button>Download</button></td> */}
              </tr>
            ))
          ) : (
            // Row displayed when no invoices are found
            <tr className={styles.noInvoicesRow}>
              {/* Adjust colSpan according to the number of columns */}
              <td colSpan="8">No invoices found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default InvoicesPage;