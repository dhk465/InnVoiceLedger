// src/pages/InvoicesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getInvoices } from '../services/apiService';
// --- Import useLocale hook ---
import { useLocale } from '../contexts/LocaleContext';
// --- Import centralized formatting functions ---
import { formatCurrency, formatDate } from '../utils/formatting';
// --- Import CSS Module ---
import styles from './InvoicesPage.module.css';

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // --- Get current locale code from context ---
  const { currentLocaleCode } = useLocale();

  // Function to fetch invoices
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

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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
            invoices.map(invoice => (
              <tr key={invoice.id}>
                {/* Invoice Number Link */}
                <td>
                  <Link to={`/invoices/${invoice.id}`} title="View Details" className={styles.invoiceLink}>
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                {/* Customer Info */}
                <td>
                  {invoice.customer?.name || 'N/A'}
                  {invoice.customer?.companyName ? ` (${invoice.customer.companyName})` : ''}
                </td>
                {/* Formatted Dates using locale */}
                <td>{formatDate(invoice.issueDate, currentLocaleCode)}</td>
                <td>{formatDate(invoice.dueDate, currentLocaleCode)}</td>
                {/* Formatted Currency using locale */}
                <td style={{ textAlign: 'right' }}>
                  {formatCurrency(invoice.grandTotal, invoice.currency, currentLocaleCode)}
                </td>
                {/* Currency Code */}
                <td>{invoice.currency}</td>
                {/* Status */}
                <td>{invoice.status}</td>
                {/* Actions Cell */}
                <td>
                  {/* Download button - handler defined previously */}
                  {/* <button onClick={() => handleDownloadClick(invoice.id)} className={styles.actionButton}>Download</button> */}
                   <button disabled title="Download PDF - TODO" className={styles.actionButton}>Download</button>
                </td>
              </tr>
            ))
          ) : (
            // No Invoices Row
            <tr className={styles.noInvoicesRow}>
              <td colSpan="8">No invoices found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default InvoicesPage;