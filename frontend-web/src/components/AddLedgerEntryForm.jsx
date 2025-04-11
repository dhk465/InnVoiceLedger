// src/components/AddLedgerEntryForm.jsx
import React, { useState, useEffect } from 'react';
// Import API service functions
import { createLedgerEntry, getCustomers, getItems } from '../services/apiService';
// Import CSS module (optional, if you created styles)
// import styles from './AddLedgerEntryForm.module.css';

// Helper to safely parse float, returning null if invalid
const safeParseFloat = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

// Accept props: onAddEntrySuccess, onClose, and defaultDate
function AddLedgerEntryForm({ onAddEntrySuccess, onClose, defaultDate }) {
  // --- State ---
  const [formData, setFormData] = useState({
    customerId: '', // Holds the selected customer ID
    itemId: '',     // Holds the selected item ID
    quantity: '1',   // Default quantity
    // Initialize entryDate with defaultDate prop if provided, otherwise empty string
    entryDate: defaultDate || '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for submit button
  const [error, setError] = useState(null); // Error message display

  // State for dropdown options
  const [customers, setCustomers] = useState([]); // List of customers for select dropdown
  const [items, setItems] = useState([]); // List of items for select dropdown
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true); // Loading state for dropdown data

  // --- Effects ---
  // Fetch data for Customer and Item dropdowns when the component mounts
  useEffect(() => {
    const fetchDataForDropdowns = async () => {
      setIsLoadingDropdowns(true); // Set loading true
      setError(null); // Clear previous errors specific to dropdown loading
      try {
        // Fetch both customer and item lists concurrently
        const [customerData, itemData] = await Promise.all([
          getCustomers(),
          getItems()
        ]);
        setCustomers(customerData || []); // Update state, handle potential null response
        setItems(itemData || []);
      } catch (err) {
        console.error("Error fetching data for form dropdowns:", err);
        setError("Could not load customers or items for selection."); // Set error for user
      } finally {
        setIsLoadingDropdowns(false); // Set loading false
      }
    };
    fetchDataForDropdowns();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to update the form's entryDate if the defaultDate prop changes
  // Useful if the parent component re-renders the form with a new default date
  useEffect(() => {
      // Update the form field only if the prop has a value
      // If the prop becomes null/undefined (e.g., form closed and reopened via button),
      // this keeps the existing state unless explicitly cleared elsewhere (like in onClose)
      if (defaultDate) {
          setFormData(prev => ({ ...prev, entryDate: defaultDate }));
      }
      // If you always want the form date to reflect the prop, even if prop becomes null:
      // setFormData(prev => ({ ...prev, entryDate: defaultDate || '' }));

  }, [defaultDate]); // Rerun this effect if the defaultDate prop changes

  // --- Handlers ---
  // Update form state when any input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Basic sanitization for quantity input (allow only positive integers)
    if (name === 'quantity') {
        processedValue = value.replace(/[^0-9]/g, ''); // Remove non-digits
        // Ensure quantity is at least 1, default back to 1 if empty or invalid
        if (processedValue === '' || parseInt(processedValue, 10) <= 0 || isNaN(parseInt(processedValue, 10))) {
             processedValue = '1'; // Set/reset to default 1
        }
    }
    // Update the corresponding field in formData state
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  // Handle the form submission process
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default HTML form submission
    setError(null); // Clear previous submission errors

    // Frontend validation before sending to API
    if (!formData.customerId || !formData.itemId) {
      setError('Please select both a customer and an item.');
      return;
    }
    const quantityNum = parseInt(formData.quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
        setError('Quantity must be a positive whole number.');
        return;
    }

    setIsSubmitting(true); // Set loading state for submission button

    try {
      // Prepare data object for the API call
      const entryData = {
        customerId: formData.customerId,
        itemId: formData.itemId,
        quantity: quantityNum,
        // Only include entryDate if the user actually provided one
        // Otherwise, let the backend default to CURRENT_TIMESTAMP
        ...(formData.entryDate && { entryDate: formData.entryDate }),
        notes: formData.notes.trim() || null, // Send null if notes are empty/whitespace
      };

      // Call the API service function to create the entry
      const newEntry = await createLedgerEntry(entryData);
      console.log('Ledger entry created:', newEntry);

      // Call the success callback function passed from the parent component
      if (onAddEntrySuccess) {
        onAddEntrySuccess(newEntry); // Pass the newly created entry data back
      }
      // Call the close callback function passed from the parent
      if (onClose) {
         onClose(); // Close the form/modal
      }
      // Optionally reset form state here if needed, though closing usually suffices
      // setFormData({ customerId: '', itemId: '', quantity: '1', entryDate: '', notes: '' });

    } catch (err) {
      // Handle errors during API call
      console.error("Error creating ledger entry:", err);
      // Display error message from backend response if available, otherwise generic message
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create ledger entry. Please try again.');
      }
    } finally {
      setIsSubmitting(false); // Reset submission loading state
    }
  };

  // --- Styles (Using basic inline styles for now) ---
  // Consider moving these to a AddLedgerEntryForm.module.css file
  const formStyle = { border: '1px solid #ccc', padding: '20px', marginTop: '20px', borderRadius: '5px', backgroundColor: '#f9f9f9', maxWidth: '600px', marginBottom: '20px'};
  const inputGroupStyle = { marginBottom: '15px' };
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em'};
  const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '3px', fontSize: '0.95rem'};
  const selectStyle = { ...inputStyle }; // Base select style on input style
  const buttonContainerStyle = { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px'};
  const buttonStyle = { padding: '8px 15px', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500'};
  const submitButtonStyle = { ...buttonStyle, backgroundColor: '#28a745', color: 'white'};
  const cancelButtonStyle = { ...buttonStyle, backgroundColor: '#6c757d', color: 'white'};
  const errorStyle = { color: 'red', marginTop: '10px', fontSize: '0.9em', fontWeight: 'bold' };
  const loadingDropdownStyle = { fontStyle: 'italic', color: '#6c757d', padding: '1rem', textAlign: 'center'};
  // --- End Styles ---

  // Display loading message while fetching dropdown data
  if (isLoadingDropdowns) {
      return <div style={loadingDropdownStyle}>Loading form options...</div>;
  }

  // Render the form
  return (
    // Apply base form style/class
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3>Add Ledger Entry (Consumption/Usage)</h3>

      {/* Customer Select Dropdown */}
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
            {/* Map through fetched customers to create options */}
            {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.companyName ? `(${customer.companyName})` : ''}
                </option>
            ))}
        </select>
      </div>

      {/* Item Select Dropdown */}
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
            {/* Map through fetched items to create options */}
            {items.map(item => (
                <option key={item.id} value={item.id}>
                    {item.name} ({item.currency}) {/* Show currency in dropdown */}
                </option>
            ))}
        </select>
      </div>

      {/* Quantity Input */}
      <div style={inputGroupStyle}>
          <label htmlFor="quantity" style={labelStyle}>Quantity *</label>
          <input
              type="number"
              inputMode="numeric" // Hint for mobile
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1" // HTML5 validation
              step="1" // HTML5 validation
              style={inputStyle}
          />
      </div>

      {/* Entry Date Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="entryDate" style={labelStyle}>Date / Time (Optional)</label>
        <input
            type="datetime-local" // Input type for date and time
            id="entryDate"
            name="entryDate"
            value={formData.entryDate} // Value controlled by state (includes defaultDate)
            onChange={handleChange}
            style={inputStyle}
        />
         {/* Helper text */}
         <small style={{color: '#6c757d', display:'block', marginTop:'3px'}}>Leave blank to use current time.</small>
      </div>

      {/* Notes Textarea */}
      <div style={inputGroupStyle}>
        <label htmlFor="notes" style={labelStyle}>Notes</label>
        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="3" style={inputStyle}></textarea>
      </div>

      {/* Display submission errors */}
      {error && <p style={errorStyle}>{error}</p>}

      {/* Form Action Buttons */}
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