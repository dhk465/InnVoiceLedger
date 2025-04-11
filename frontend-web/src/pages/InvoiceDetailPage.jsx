// src/pages/InvoiceDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInvoiceById, getInvoicePdfUrl } from '../services/apiService'; // Added getInvoicePdfUrl
// --- Import useLocale hook ---
import { useLocale } from '../contexts/LocaleContext';
// --- Import centralized formatting functions ---
import { formatCurrency, formatDate } from '../utils/formatting';
// --- Import CSS Module ---
import styles from './InvoiceDetailPage.module.css';

function InvoiceDetailPage() {
    const { id: invoiceId } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // --- Get current locale code from context ---
    const { currentLocaleCode } = useLocale();

    // Fetch invoice details function
    const fetchInvoiceDetails = useCallback(async () => {
        if (!invoiceId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await getInvoiceById(invoiceId);
            setInvoice(data);
        } catch (err) {
            console.error("Failed to fetch invoice details:", err);
            setError(err.response?.status === 404 ? 'Invoice not found.' : 'Failed to load invoice details.');
        } finally {
            setIsLoading(false);
        }
    }, [invoiceId]); // Re-fetch if invoiceId changes

    // Fetch data on mount
    useEffect(() => {
        fetchInvoiceDetails();
    }, [fetchInvoiceDetails]);

    // --- Download Handler ---
    const handleDownloadClick = () => {
        if (!invoiceId) return;
        try {
            const pdfUrl = getInvoicePdfUrl(invoiceId);
            window.open(pdfUrl, '_blank'); // Open PDF link in new tab
        } catch (err) {
            console.error("Error getting PDF URL:", err);
            alert("Could not generate download link.");
        }
    };
    // --- End Download Handler ---


    // --- Render Logic ---
    if (isLoading) { return <div className={styles.loadingMessage}>Loading invoice details...</div>; }
    if (error) { return <div className={styles.errorMesssage}>Error: {error}</div>; }
    if (!invoice) { return <div className={styles.errorMesssage}>Invoice data could not be loaded.</div>; }

    const { customer } = invoice; // Destructure for convenience

    return (
        <div className={styles.pageContainer}>
            <Link to="/invoices" className={styles.backLink}>← Back to Invoices</Link>

            <div className={styles.invoiceHeader}>
                <h1>Invoice #{invoice.invoiceNumber}</h1>
                {/* --- Added Download Button --- */}
                <button onClick={handleDownloadClick} className={styles.downloadButton}>Download PDF</button>
                {/* --- End Add --- */}
                <div className={styles.status}>Status: {invoice.status}</div>
            </div>

            <div className={styles.detailsGrid}>
                {/* Customer Details */}
                <div className={styles.customerDetails}>
                    <h2>Bill To:</h2>
                    <p><strong>{customer?.name || 'N/A'}</strong></p>
                    {customer?.companyName && <p>{customer.companyName}</p>}
                    {customer?.address && <p style={{ whiteSpace: 'pre-line' }}>{customer.address}</p>}
                    {customer?.email && <p>Email: {customer.email}</p>}
                    {customer?.phone && <p>Phone: {customer.phone}</p>}
                    {customer?.vatId && <p>VAT ID: {customer.vatId}</p>}
                </div>

                {/* Invoice Meta Details */}
                <div className={styles.metaDetails}>
                    {/* Use locale for date formatting */}
                    <p><strong>Issue Date:</strong> {formatDate(invoice.issueDate, currentLocaleCode)}</p>
                    <p><strong>Due Date:</strong> {formatDate(invoice.dueDate, currentLocaleCode)}</p>
                    <p><strong>Currency:</strong> {invoice.currency}</p>
                    {/* TODO: Add Business Details Snapshot Display */}
                </div>
            </div>

            {/* Invoice Line Items */}
            <h2>Items:</h2>
            <table className={styles.itemsTable}>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Original Price</th>
                        <th>Rate Used</th>
                        <th>Unit Price ({invoice.currency})</th>
                        <th>VAT Rate</th>
                        <th>Line Total ({invoice.currency})</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.invoiceItems?.map(item => (
                        <tr key={item.id}>
                            <td>{item.description}</td>
                            <td className={styles.centerAlign}>{item.quantity}</td>
                            <td className={styles.centerAlign}>{item.unit}</td>
                            {/* Use locale for original price currency formatting */}
                            <td className={styles.rightAlign}>
                                {formatCurrency(item.originalUnitPriceWithoutVAT, item.originalCurrency, currentLocaleCode)}
                            </td>
                            {/* Exchange Rate */}
                            <td className={styles.centerAlign}>{item.exchangeRateUsed ? parseFloat(item.exchangeRateUsed).toFixed(4) : '-'}</td>
                            {/* Use locale for converted unit price formatting */}
                            <td className={styles.rightAlign}>
                                {formatCurrency(item.unitPriceWithoutVAT, invoice.currency, currentLocaleCode)}
                            </td>
                            {/* VAT Rate */}
                            <td className={styles.rightAlign}>{parseFloat(item.originalVatRate).toFixed(2)}%</td>
                            {/* Use locale for final line total formatting */}
                            <td className={styles.rightAlign}>
                                {formatCurrency(item.lineTotalWithVAT, invoice.currency, currentLocaleCode)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Invoice Totals */}
            <div className={styles.totalsSection}>
                {/* Use locale for totals currency formatting */}
                <p><strong>Subtotal (excl. VAT):</strong> {formatCurrency(invoice.subtotalWithoutVAT, invoice.currency, currentLocaleCode)}</p>
                <p><strong>Total VAT:</strong> {formatCurrency(invoice.totalVATAmount, invoice.currency, currentLocaleCode)}</p>
                <h3><strong>Grand Total:</strong> {formatCurrency(invoice.grandTotal, invoice.currency, currentLocaleCode)}</h3>
            </div>

             {/* Invoice Notes */}
             {invoice.notes && (
                 <div className={styles.notesSection}>
                    <h2>Notes:</h2>
                    <p style={{ whiteSpace: 'pre-line' }}>{invoice.notes}</p>
                 </div>
             )}

        </div>
    );
}

export default InvoiceDetailPage;