// src/pages/LedgerPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getLedgerEntries } from '../services/apiService';
import AddLedgerEntryForm from '../components/AddLedgerEntryForm';
// --- Import the specific CSS Module ---
import styles from './LedgerPage.module.css';

function LedgerPage() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  // const [filters, setFilters] = useState({}); // For later filtering

  const fetchEntries = useCallback(async (/* currentFilters */) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLedgerEntries(); // Pass filters later
      setEntries(data);
    } catch (err) {
      console.error("Failed to fetch ledger entries:", err);
      setError('Failed to load ledger entries. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  // }, [/* filters */]);
  }, []);


  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleAddEntryClick = () => {
    setIsAddFormVisible(true);
  };

  const handleCloseForm = () => {
    setIsAddFormVisible(false);
  };

  const handleAddEntrySuccess = (newEntry) => {
    setEntries(prevEntries => [newEntry, ...prevEntries]);
    handleCloseForm();
    console.log("Successfully added ledger entry for:", newEntry?.customer?.name);
  };

  // Helper for formatting date/time
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) { return dateString; }
  }

  // --- Render Logic ---
  if (isLoading) {
    return <div className={styles.loadingMessage}>Loading ledger entries...</div>;
  }

  if (error) {
    return <div className={styles.errorMesssage}>Error: {error}</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2>Ledger / Activity Log</h2>
        <p>Record of items/services consumed or used by customers.</p>
        {/* Filtering UI Placeholder */}
      </div>

      {!isAddFormVisible ? (
        <button
          className={styles.addEntryButton} // Use specific class
          onClick={handleAddEntryClick}
        >
          + Add Ledger Entry
        </button>
      ) : (
        <AddLedgerEntryForm
          onAddEntrySuccess={handleAddEntrySuccess}
          onClose={handleCloseForm}
        />
      )}

      {/* Apply specific table class */}
      <table className={styles.ledgerTable}>
        {/* === Ensure no extra whitespace within thead/tr/th === */}
        <thead>
          <tr>
            <th>Date / Time</th>
            <th>Customer</th>
            <th>Item/Service</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Notes</th>
            <th>Status</th>
            {/* <th>Actions</th> */}
          </tr>
        </thead>
        {/* === Ensure no extra whitespace within tbody/tr/td === */}
        <tbody>
          {entries.length > 0
           ? entries.map(entry => (
              // No whitespace here
              <tr key={entry.id}>
                <td>{formatDateTime(entry.entryDate)}</td>
                <td>{entry.customer?.name || 'N/A'}</td>
                <td>{entry.item?.name || 'N/A'}</td>
                {/* Use CSS Module for alignment (defined in css file) */}
                <td>{entry.quantity}</td>
                <td>{entry.item?.unit || '-'}</td>
                <td>{entry.notes || '-'}</td>
                {/* Use CSS Module for alignment (defined in css file) */}
                <td>{entry.billingStatus}</td>
                {/* <td><button>Edit</button></td> */}
              </tr> // No whitespace here
            ))
           : (// No whitespace here
              <tr className={styles.noEntriesRow}>
                {/* Update colSpan */}
                <td colSpan="7">No ledger entries found.</td>
              </tr> // No whitespace here
            )
          }
        </tbody>
      </table>
    </div>
  );
}

export default LedgerPage;