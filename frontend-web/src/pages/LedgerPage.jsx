// src/pages/LedgerPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
// API Service functions
import { getLedgerEntries, getCustomers, generateInvoice } from '../services/apiService';
// Child Component
import AddLedgerEntryForm from '../components/AddLedgerEntryForm';
// Styles for this page
import styles from './LedgerPage.module.css';
// Formatting utility (optional)
// import { formatDateTime } from '../utils/formatting';

function LedgerPage() {
  // --- State ---
  const [entries, setEntries] = useState([]); // Ledger entries list
  const [isLoading, setIsLoading] = useState(true); // Loading state for entries
  const [error, setError] = useState(null); // Error fetching entries
  const [isAddFormVisible, setIsAddFormVisible] = useState(false); // Toggle for AddLedgerEntryForm

  // State for Invoice Generation Form
  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true); // Separate loading for dropdown
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('CZK'); // Default or fetch from settings
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false); // Loading state for generation button
  const [generationError, setGenerationError] = useState(null); // Error during generation
  const [generationSuccess, setGenerationSuccess] = useState(null); // Success message after generation
  // --- End State ---


  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    // Set loading states at the beginning
    setIsLoading(true);
    setIsLoadingCustomers(true);
    setError(null); // Clear previous errors
    try {
      // Fetch entries and customers in parallel
      const [entriesData, customerData] = await Promise.all([
        getLedgerEntries(), // TODO: Add filters based on state later
        getCustomers()
      ]);
      setEntries(entriesData || []); // Update entries state
      setCustomers(customerData || []); // Update customers state for dropdown
    } catch (err) {
      console.error("Failed to fetch ledger data:", err);
      setError('Failed to load ledger data. Please try again later.');
    } finally {
      // Clear loading states regardless of outcome
      setIsLoading(false);
      setIsLoadingCustomers(false);
    }
  }, []); // Dependencies: Empty for now, add filters later

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Run effect when fetchData function reference changes (which is only on mount here)


  // --- Event Handlers ---
  const handleAddEntryClick = () => { setIsAddFormVisible(true); };
  const handleCloseLedgerForm = () => { setIsAddFormVisible(false); };

  // Callback for when a new ledger entry is successfully added
  const handleAddEntrySuccess = (newEntry) => {
      setEntries(prev => [newEntry, ...prev]); // Prepend new entry to the list
      handleCloseLedgerForm(); // Close the form
      console.log("Successfully added ledger entry for:", newEntry?.customer?.name);
  };

  // Handler for submitting the invoice generation form
  const handleGenerateInvoice = async (e) => {
      e.preventDefault(); // Prevent default form submission
      // Clear previous messages
      setGenerationError(null);
      setGenerationSuccess(null);

      // Basic validation
      if (!selectedCustomerId || !startDate || !endDate || !targetCurrency || !issueDate) {
          setGenerationError("Please select a customer, date range, issue date, and target currency.");
          return;
      }
      setIsGenerating(true); // Show loading state on button
      try {
          const generationData = {
              customerId: selectedCustomerId, startDate, endDate, issueDate, targetCurrency,
              // dueDate and notes could be added from optional form fields here
          };
          const newInvoice = await generateInvoice(generationData); // Call API
          setGenerationSuccess(`Invoice ${newInvoice.invoiceNumber} generated successfully! Check the Invoices page.`);
          // Refetch ledger entries to update their 'billed' status in the list
          fetchData();
          // Optionally reset form fields after successful generation
          // setSelectedCustomerId(''); setStartDate(''); setEndDate(''); setIssueDate(new Date().toISOString().split('T')[0]);
      } catch(err) {
          console.error("Invoice generation failed:", err);
          // Display error message from backend response if available
          setGenerationError(err.response?.data?.message || "Failed to generate invoice.");
      } finally {
          setIsGenerating(false); // Hide loading state on button
      }
  };


  // --- Helper Functions ---
  // Use util if created: import { formatDateTime } from '../utils/formatting';
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) {
      console.warn(`Could not format datetime ${dateString}:`, e);
      return dateString;
    }
  }


  // --- Render Logic ---
  if (isLoading) { return <div className={styles.loadingMessage}>Loading ledger entries...</div>; }
  if (error) { return <div className={styles.errorMesssage}>Error: {error}</div>; }

  return (
    // Use CSS Module classes for layout and elements
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2>Ledger / Activity Log</h2>
        <p>Record of items/services consumed or used by customers.</p>
      </div>

      {/* --- Invoice Generation Section --- */}
      <div className={styles.invoiceGenSection}>
        <h4>Generate Invoice</h4>
        {isLoadingCustomers ? <p className={styles.loadingMessage}>Loading customers...</p> : (
            <form onSubmit={handleGenerateInvoice}>
                <div className={styles.genFormGrid}> {/* Use grid/flex for layout */}
                    {/* Customer Select */}
                    <div className={styles.formGroup}>
                        <label htmlFor="genInvCustomer" className={styles.formLabel}>Customer:*</label>
                        <select id="genInvCustomer" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} required className={styles.formSelect}>
                            <option value="" disabled>Select Customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>)}
                        </select>
                    </div>
                    {/* Date Inputs */}
                    <div className={styles.formGroup}>
                        <label htmlFor="genInvStart" className={styles.formLabel}>Start Date:*</label>
                        <input id="genInvStart" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={styles.formInput} />
                    </div>
                     <div className={styles.formGroup}>
                        <label htmlFor="genInvEnd" className={styles.formLabel}>End Date:*</label>
                        <input id="genInvEnd" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className={styles.formInput} />
                    </div>
                    {/* Issue Date */}
                     <div className={styles.formGroup}>
                        <label htmlFor="genInvIssue" className={styles.formLabel}>Issue Date:*</label>
                        <input id="genInvIssue" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required className={styles.formInput} />
                    </div>
                    {/* Target Currency */}
                     <div className={styles.formGroup}>
                        <label htmlFor="genInvCurrency" className={styles.formLabel}>Target Currency:*</label>
                         <input id="genInvCurrency" type="text" value={targetCurrency} onChange={e => setTargetCurrency(e.target.value.toUpperCase())} required maxLength="3" placeholder="e.g. EUR" className={styles.formInputShort}/>
                    </div>
                    {/* Submit Button */}
                     <div className={styles.formGroup}>
                        {/* Add empty label or adjust grid for alignment */}
                        <label className={styles.formLabel}> </label>
                        <button type="submit" disabled={isGenerating} className={styles.generateButton}>
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </button>
                     </div>
                </div>
                 {/* Generation Messages */}
                 {generationError && <p className={styles.genErrorMessage}>{generationError}</p>}
                 {generationSuccess && <p className={styles.genSuccessMessage}>{generationSuccess}</p>}
            </form>
        )}
      </div>
      {/* --- END INVOICE GEN SECTION --- */}


      {/* Add Ledger Entry Button/Form */}
      {!isAddFormVisible ? (
        <button className={styles.addEntryButton} onClick={handleAddEntryClick}>
          + Add Ledger Entry
        </button>
      ) : ( <AddLedgerEntryForm onAddEntrySuccess={handleAddEntrySuccess} onClose={handleCloseLedgerForm} /> )}

      {/* Ledger Entries Table */}
      <table className={styles.ledgerTable}>
        {/* --- Ensure no whitespace --- */}
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
        <tbody>
          {entries.length > 0
           ? entries.map(entry => (
              <tr key={entry.id}>
                <td>{formatDateTime(entry.entryDate)}</td>
                <td>{entry.customer?.name || 'N/A'}</td>
                <td>{entry.item?.name || 'N/A'}</td>
                <td>{entry.quantity}</td>
                <td>{entry.item?.unit || '-'}</td>
                <td>{entry.notes || '-'}</td>
                <td>{entry.billingStatus}</td>
                {/* <td><button>Edit</button></td> */}
              </tr>
            ))
           : (
              <tr className={styles.noEntriesRow}>
                <td colSpan="7">No ledger entries found.</td>
              </tr>
            )
          }
        </tbody>
      </table>
    </div>
  );
}

export default LedgerPage;