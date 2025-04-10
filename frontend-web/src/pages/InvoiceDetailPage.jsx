// src/pages/InvoiceDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import useParams to get ID from URL
import { getInvoiceById } from '../services/apiService';
import { formatCurrency, formatDate } from '../utils/formatting'; // Use formatting helpers
import styles from './InvoiceDetailPage.module.css'; // Create CSS Module

function InvoiceDetailPage() {
    const { id: invoiceId } = useParams(); // Get the 'id' parameter from the route '/invoices/:id'
    const [invoice, setInvoice] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInvoiceDetails = useCallback(async () => {
        if (!invoiceId) return; // Don't fetch if ID is missing
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
    }, [invoiceId]); // Dependency: fetch when invoiceId changes

    useEffect(() => {
        fetchInvoiceDetails();
    }, [fetchInvoiceDetails]);

    // --- Render Logic ---
    if (isLoading) { return <div className={styles.loadingMessage}>Loading invoice details...</div>; }
    if (error) { return <div className={styles.errorMesssage}>Error: {error}</div>; }
    if (!invoice) { return <div className={styles.errorMesssage}>Invoice data could not be loaded.</div>; } // Should be caught by error state generally

    // --- Display Invoice Details ---
    const { customer } = invoice; // Destructure customer for easier access

    return (
        <div className={styles.pageContainer}>
            <Link to="/invoices" className={styles.backLink}>← Back to Invoices</Link>

            <div className={styles.invoiceHeader}>
                <h1>Invoice #{invoice.invoiceNumber}</h1>
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
                    <p><strong>Issue Date:</strong> {formatDate(invoice.issueDate)}</p>
                    <p><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</p>
                    <p><strong>Currency:</strong> {invoice.currency}</p>
                    {/* Add Business Details Snapshot here later */}
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
                            {/* Show original price/currency */}
                            <td className={styles.rightAlign}>
                                {formatCurrency(item.originalUnitPriceWithoutVAT, item.originalCurrency)}
                            </td>
                            {/* Show rate if conversion happened */}
                            <td className={styles.centerAlign}>{item.exchangeRateUsed ? parseFloat(item.exchangeRateUsed).toFixed(4) : '-'}</td>
                            {/* Show converted unit price */}
                            <td className={styles.rightAlign}>
                                {formatCurrency(item.unitPriceWithoutVAT, invoice.currency)}
                            </td>
                            <td className={styles.rightAlign}>{parseFloat(item.originalVatRate).toFixed(2)}%</td>
                            {/* Show final line total */}
                            <td className={styles.rightAlign}>
                                {formatCurrency(item.lineTotalWithVAT, invoice.currency)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Invoice Totals */}
            <div className={styles.totalsSection}>
                <p><strong>Subtotal (excl. VAT):</strong> {formatCurrency(invoice.subtotalWithoutVAT, invoice.currency)}</p>
                <p><strong>Total VAT:</strong> {formatCurrency(invoice.totalVATAmount, invoice.currency)}</p>
                <h3><strong>Grand Total:</strong> {formatCurrency(invoice.grandTotal, invoice.currency)}</h3>
            </div>

             {/* Invoice Notes */}
             {invoice.notes && (
                 <div className={styles.notesSection}>
                    <h2>Notes:</h2>
                    <p style={{ whiteSpace: 'pre-line' }}>{invoice.notes}</p>
                 </div>
             )}

            {/* Add Download Button later */}
            {/* <button>Download PDF</button> */}
        </div>
    );
}

export default InvoiceDetailPage;