// src/components/AddLedgerEntryForm.jsx
import React, { useState, useEffect } from 'react';
import { createLedgerEntry } from '../services/apiService';
// Import functions to fetch customers and items for dropdowns
import { getCustomers } from '../services/apiService';
import { getItems } from '../services/apiService';
// import styles from './AddLedgerEntryForm.module.css'; // Optional CSS

function AddLedgerEntryForm({ onAddEntrySuccess, onClose }) {
  // Form State
  const [formData, setFormData] = useState({
    customerId: '', // Will hold the selected customer ID
    itemId: '',     // Will hold the selected item ID
    quantity: '1',   // Default quantity
    entryDate: '',  // Optional date input, default handled by backend if empty
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // State for dropdown options
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

  // Fetch data for dropdowns on component mount
  useEffect(() => {
    const fetchDataForDropdowns = async () => {
      setIsLoadingDropdowns(true);
      try {
        // Fetch both concurrently
        const [customerData, itemData] = await Promise.all([
          getCustomers(),
          getItems()
        ]);
        setCustomers(customerData || []); // Handle potential null/undefined response
        setItems(itemData || []);
      } catch (err) {
        console.error("Error fetching data for form dropdowns:", err);
        setError("Could not load customers or items for selection."); // Inform user
      } finally {
        setIsLoadingDropdowns(false);
      }
    };
    fetchDataForDropdowns();
  }, []); // Empty array: Fetch only once on mount

  // Handle regular input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
     // Basic quantity sanitization
    if (name === 'quantity') {
        processedValue = value.replace(/[^0-9]/g, ''); // Allow only digits
        if (processedValue === '' || parseInt(processedValue, 10) <= 0) {
            processedValue = '1'; // Default to 1 if empty or non-positive
        }
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.customerId || !formData.itemId) {
      setError('Please select both a customer and an item.');
      return;
    }
    const quantityNum = parseInt(formData.quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
        setError('Quantity must be a positive whole number.');
        return;
    }


    setIsSubmitting(true);

    try {
      const entryData = {
        customerId: formData.customerId,
        itemId: formData.itemId,
        quantity: quantityNum,
        // Only send entryDate if user provided one
        ...(formData.entryDate && { entryDate: formData.entryDate }),
        notes: formData.notes.trim() || null,
      };

      const newEntry = await createLedgerEntry(entryData);
      console.log('Ledger entry created:', newEntry);
      if (onAddEntrySuccess) {
        onAddEntrySuccess(newEntry);
      }
      if (onClose) {
         onClose();
      }
      // Reset form? Optional. Maybe keep customer selected.
      // setFormData({ customerId: '', itemId: '', quantity: '1', entryDate: '', notes: '' });

    } catch (err) {
      console.error("Error creating ledger entry:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create ledger entry. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Basic Inline Styles (Replace with CSS Modules Preferred) ---
  const formStyle = { border: '1px solid #ccc', padding: '20px', marginTop: '20px', borderRadius: '5px', backgroundColor: '#f9f9f9', maxWidth: '600px'};
  const inputGroupStyle = { marginBottom: '15px' };
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold'};
  const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '3px'};
  const selectStyle = { ...inputStyle }; // Use same base style for select
  const buttonContainerStyle = { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px'};
  const buttonStyle = { padding: '8px 15px', border: 'none', borderRadius: '3px', cursor: 'pointer'};
  const submitButtonStyle = { ...buttonStyle, backgroundColor: '#28a745', color: 'white'};
  const cancelButtonStyle = { ...buttonStyle, backgroundColor: '#6c757d', color: 'white'};
  const errorStyle = { color: 'red', marginTop: '10px', fontSize: '0.9em', fontWeight: 'bold' };
  // --- End Styles ---

  if (isLoadingDropdowns) {
      return <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '1rem' }}>Loading customer/item list...</div>;
  }


  return (
    // Consider className={styles.addLedgerEntryForm}
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3>Add Ledger Entry (Consumption/Usage)</h3>

      <div style={inputGroupStyle}>
        <label htmlFor="customerId" style={labelStyle}>Customer *</label>
        <select
            id="customerId"
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            required
            style={selectStyle}
        >
            <option value="" disabled>-- Select a Customer --</option>
            {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.companyName ? `(${customer.companyName})` : ''}
                </option>
            ))}
        </select>
      </div>

      <div style={inputGroupStyle}>
        <label htmlFor="itemId" style={labelStyle}>Item/Service *</label>
        <select
            id="itemId"
            name="itemId"
            value={formData.itemId}
            onChange={handleChange}
            required
            style={selectStyle}
        >
            <option value="" disabled>-- Select an Item/Service --</option>
            {items.map(item => (
                <option key={item.id} value={item.id}>
                    {item.name} ({item.currency})
                </option>
            ))}
        </select>
      </div>

      <div style={inputGroupStyle}>
          <label htmlFor="quantity" style={labelStyle}>Quantity *</label>
          <input
              type="number" // Use number type, but handle sanitization
              inputMode="numeric" // Hint for mobile keyboards
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1" // Set minimum via HTML5 validation as well
              step="1" // Allow only whole numbers
              style={inputStyle}
          />
      </div>

      <div style={inputGroupStyle}>
        <label htmlFor="entryDate" style={labelStyle}>Date / Time (Optional)</label>
        <input
            type="datetime-local" // Input for date and time
            id="entryDate"
            name="entryDate"
            value={formData.entryDate}
            onChange={handleChange}
            style={inputStyle}
        />
         <small style={{color: '#6c757d', display:'block', marginTop:'3px'}}>Leave blank to use current time.</small>
      </div>

      <div style={inputGroupStyle}>
        <label htmlFor="notes" style={labelStyle}>Notes</label>
        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="3" style={inputStyle}></textarea>
      </div>


      {error && <p style={errorStyle}>{error}</p>}

      <div style={buttonContainerStyle}>
        <button type="button" onClick={onClose} disabled={isSubmitting} style={cancelButtonStyle}>Cancel</button>
        <button type="submit" disabled={isSubmitting} style={submitButtonStyle}>
          {isSubmitting ? 'Adding...' : 'Add Entry'}
        </button>
      </div>
    </form>
  );
}

export default AddLedgerEntryForm;