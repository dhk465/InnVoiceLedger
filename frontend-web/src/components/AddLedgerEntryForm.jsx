// src/components/AddLedgerEntryForm.jsx
import React, { useState, useEffect } from 'react';
import { createLedgerEntry, getCustomers, getItems } from '../services/apiService';
// import styles from './AddLedgerEntryForm.module.css';

function AddLedgerEntryForm({ onAddEntrySuccess, onClose, defaultDate }) {
  // --- State ---
  const [formData, setFormData] = useState({
    customerId: '',
    itemId: '',
    quantity: '1',
    startDate: defaultDate || '',
    endDate: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
  // --- NEW: State for selected item unit ---
  const [selectedItemUnit, setSelectedItemUnit] = useState('pcs');
  // --- END NEW ---

  // Fetch dropdown data effect
  useEffect(() => {
    const fetchDataForDropdowns = async () => {
        setIsLoadingDropdowns(true); setError(null);
        try {
            const [customerData, itemData] = await Promise.all([getCustomers(), getItems()]);
            setCustomers(customerData || []); setItems(itemData || []);
            // Set initial unit based on default or first item? Maybe not needed.
        } catch (err) { console.error("Error fetching dropdowns:", err); setError("Could not load customers/items."); }
        finally { setIsLoadingDropdowns(false); }
    };
    fetchDataForDropdowns();
  }, []);

  // Effect to update form if defaultDate prop changes
  useEffect(() => {
      if (defaultDate) { setFormData(prev => ({ ...prev, startDate: defaultDate })); }
  }, [defaultDate]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'quantity') {
        processedValue = value.replace(/[^0-9]/g, '');
        if (processedValue === '' || parseInt(processedValue, 10) <= 0 || isNaN(parseInt(processedValue, 10))) {
             processedValue = '1';
        }
    }
    // --- ADDED: Update selected unit when Item changes ---
    if (name === 'itemId') {
        const selectedItem = items.find(item => item.id === value);
        setSelectedItemUnit(selectedItem?.unit || 'pcs'); // Update unit state
    }
    // --- END ADD ---
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  // Handle form submission (no changes needed here for quantity logic)
  const handleSubmit = async (e) => {
      e.preventDefault(); setError(null);
      if (!formData.customerId || !formData.itemId || !formData.startDate) { setError('Customer, Item, and Start Date required.'); return; }
      const quantityNum = parseInt(formData.quantity, 10);
      if (isNaN(quantityNum) || quantityNum <= 0) { setError('Quantity must be positive.'); return; }
      if (formData.endDate && formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) { setError('End Date cannot be before Start Date.'); return; }

      setIsSubmitting(true);
      try {
          const entryData = {
              customerId: formData.customerId, itemId: formData.itemId, quantity: quantityNum,
              startDate: formData.startDate, endDate: formData.endDate || null, notes: formData.notes.trim() || null,
          };
          const newEntry = await createLedgerEntry(entryData);
          if (onAddEntrySuccess) { onAddEntrySuccess(newEntry); }
          if (onClose) { onClose(); }
      } catch (err) {
          console.error("Error creating ledger entry:", err);
          setError(err.response?.data?.message || 'Failed to create entry.');
      } finally { setIsSubmitting(false); }
  };

  // --- Styles (as before or use CSS Modules) ---
  const formStyle = { border: '1px solid #ccc', padding: '20px', marginTop: '20px', borderRadius: '5px', backgroundColor: '#f9f9f9', maxWidth: '600px', marginBottom: '20px'};
  const inputGroupStyle = { marginBottom: '15px' };
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em'};
  const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '3px', fontSize: '0.95rem'};
  const selectStyle = { ...inputStyle };
  const buttonContainerStyle = { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px'};
  const buttonStyle = { padding: '8px 15px', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500'};
  const submitButtonStyle = { ...buttonStyle, backgroundColor: '#28a745', color: 'white'};
  const cancelButtonStyle = { ...buttonStyle, backgroundColor: '#6c757d', color: 'white'};
  const errorStyle = { color: 'red', marginTop: '10px', fontSize: '0.9em', fontWeight: 'bold' };
  const loadingDropdownStyle = { fontStyle: 'italic', color: '#6c757d', padding: '1rem', textAlign: 'center'};
  const unitLabelStyle = { marginLeft: '5px', fontStyle: 'italic', color: '#6c757d', fontWeight: 'normal' }; // Style for unit hint

  // --- End Styles ---

  if (isLoadingDropdowns) { return <div style={loadingDropdownStyle}>Loading form options...</div>; }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3>Add Ledger Entry</h3>
        {/* Customer Select */}
        <div style={inputGroupStyle}>
            <label htmlFor="customerId" style={labelStyle}>Customer *</label>
            <select id="customerId" name="customerId" value={formData.customerId} onChange={handleChange} required style={selectStyle}>
                 <option value="" disabled>-- Select a Customer --</option>
                 {customers.map(c => ( <option key={c.id} value={c.id}>{c.name}{c.companyName ? ` (${c.companyName})` : ''}</option> ))}
            </select>
        </div>
        {/* Item Select */}
        <div style={inputGroupStyle}>
            <label htmlFor="itemId" style={labelStyle}>Item/Service *</label>
            <select id="itemId" name="itemId" value={formData.itemId} onChange={handleChange} required style={selectStyle}>
                 <option value="" disabled>-- Select an Item/Service --</option>
                 {items.map(item => ( <option key={item.id} value={item.id}>{item.name} ({item.currency})</option> ))}
            </select>
        </div>
        {/* Quantity Input */}
        <div style={inputGroupStyle}>
            {/* --- UPDATED Label --- */}
            <label htmlFor="quantity" style={labelStyle}>
                Quantity *
                {/* Show unit dynamically */}
                {formData.itemId && <span style={unitLabelStyle}>({selectedItemUnit || 'pcs'})</span>}
            </label>
            {/* --- END UPDATE --- */}
            <input type="number" inputMode="numeric" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} required min="1" step="1" style={inputStyle}/>
        </div>

        {/* Date Inputs */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
            <div style={{...inputGroupStyle, flex: 1}}>
                <label htmlFor="startDate" style={labelStyle}>Start Date / Time *</label>
                <input type="datetime-local" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required style={inputStyle}/>
            </div>
            <div style={{...inputGroupStyle, flex: 1}}>
                <label htmlFor="endDate" style={labelStyle}>End Date / Time (Optional)</label>
                <input type="datetime-local" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} min={formData.startDate || undefined} style={inputStyle}/>
                <small style={{color: '#6c757d', display:'block', marginTop:'3px'}}>Leave blank if same as start.</small>
            </div>
        </div>

        {/* Notes */}
        <div style={inputGroupStyle}>
            <label htmlFor="notes" style={labelStyle}>Notes</label>
            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="3" style={inputStyle}></textarea>
        </div>
        {/* Error Display */}
        {error && <p style={errorStyle}>{error}</p>}
        {/* Buttons */}
        <div style={buttonContainerStyle}>
            <button type="button" onClick={onClose} disabled={isSubmitting} style={cancelButtonStyle}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={submitButtonStyle}> {isSubmitting ? 'Adding...' : 'Add Entry'} </button>
        </div>
    </form>
  );
}
export default AddLedgerEntryForm;