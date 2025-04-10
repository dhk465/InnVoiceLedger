// src/components/AddItemForm.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { createItem as createItemApi } from '../services/apiService';
// import styles from './AddItemForm.module.css'; // Use if you created CSS Module

// Helper to safely parse float, returning null if invalid
const safeParseFloat = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

function AddItemForm({ onAddItemSuccess, onClose }) {
  // --- State ---
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', sku: '',
    unitPriceWithoutVAT: '', // Input field value (string)
    currency: 'CZK',
    vatRate: '', // Input field value (string)
    unit: 'pcs',
  });
  // State to hold the value of the price including VAT input
  const [unitPriceIncludingVAT, setUnitPriceIncludingVAT] = useState(''); // Input field value (string)
  // State to track which price field the user is primarily editing
  const [priceInputMode, setPriceInputMode] = useState('excludeVAT'); // 'excludeVAT' or 'includeVAT'

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // --- Input Change Handler ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Sanitize numerical inputs
    if (name === 'unitPriceWithoutVAT' || name === 'unitPriceIncludingVAT' || name === 'vatRate') {
        // Allow only numbers and one decimal point
        processedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    }
    // Handle currency uppercase
    if (name === 'currency') {
        processedValue = value.toUpperCase();
    }

    // Update specific state for price including VAT
    if (name === 'unitPriceIncludingVAT') {
        setUnitPriceIncludingVAT(processedValue);
    } else {
        // Update general formData for other fields
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  // --- Calculation Logic ---
  // Recalculate derived price whenever primary price or VAT rate changes
  // Use useCallback to memoize the calculation logic if needed, though direct useEffect is fine here
  useEffect(() => {
    const priceExcl = safeParseFloat(formData.unitPriceWithoutVAT);
    const priceIncl = safeParseFloat(unitPriceIncludingVAT);
    const rate = safeParseFloat(formData.vatRate);

    // Avoid calculations if rate is invalid or zero
    if (rate === null || rate < 0) {
        // Optionally clear the derived field or show a warning
        if (priceInputMode === 'excludeVAT') setUnitPriceIncludingVAT('');
        else setFormData(prev => ({ ...prev, unitPriceWithoutVAT: '' }));
        return;
    }

    const vatMultiplier = 1 + rate / 100;

    if (priceInputMode === 'excludeVAT') {
      // Calculate price *including* VAT if price *without* VAT is valid
      if (priceExcl !== null) {
        const calculatedIncl = (priceExcl * vatMultiplier).toFixed(2); // Calculate and round
        setUnitPriceIncludingVAT(calculatedIncl);
      } else {
         setUnitPriceIncludingVAT(''); // Clear if input is invalid
      }
    } else { // priceInputMode === 'includeVAT'
      // Calculate price *without* VAT if price *including* VAT is valid
      if (priceIncl !== null && vatMultiplier !== 0) {
        const calculatedExcl = (priceIncl / vatMultiplier).toFixed(2); // Calculate and round
        setFormData(prev => ({ ...prev, unitPriceWithoutVAT: calculatedExcl }));
      } else {
         setFormData(prev => ({ ...prev, unitPriceWithoutVAT: '' })); // Clear if input is invalid
      }
    }
    // Dependencies: run when the mode changes, or relevant input values change
  }, [formData.unitPriceWithoutVAT, unitPriceIncludingVAT, formData.vatRate, priceInputMode]);


  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Parse numbers for validation and API call
    const priceExclNum = safeParseFloat(formData.unitPriceWithoutVAT);
    const priceInclNum = safeParseFloat(unitPriceIncludingVAT);
    const rateNum = safeParseFloat(formData.vatRate);
    const currency = formData.currency.trim();

    // --- Final Validation ---
    if (!formData.name || !currency || rateNum === null) {
        setError('Name, Currency, and VAT Rate are required.');
        setIsSubmitting(false);
        return;
    }
    if (currency.length !== 3) {
        setError('Currency must be a 3-letter code.');
        setIsSubmitting(false);
        return;
    }
     if (rateNum < 0) {
        setError('VAT Rate cannot be negative.');
        setIsSubmitting(false);
        return;
     }

    // Determine the definitive priceWithoutVAT based on the input mode
    let finalPriceWithoutVAT;
    const vatMultiplier = 1 + rateNum / 100;

    if (priceInputMode === 'excludeVAT') {
        if (priceExclNum === null || priceExclNum < 0) {
            setError('Price (w/o VAT) must be a valid non-negative number.');
            setIsSubmitting(false);
            return;
        }
        finalPriceWithoutVAT = priceExclNum;
    } else { // priceInputMode === 'includeVAT'
        if (priceInclNum === null || priceInclNum < 0) {
            setError('Price (incl. VAT) must be a valid non-negative number.');
            setIsSubmitting(false);
            return;
        }
        if (vatMultiplier <= 0) { // Avoid division by zero or negative multiplier
            setError('Cannot calculate price without VAT with the given VAT Rate.');
            setIsSubmitting(false);
            return;
        }
        // Recalculate precisely for submission to avoid potential rounding issues from display
        finalPriceWithoutVAT = priceInclNum / vatMultiplier;
    }
    // --- End Final Validation & Calculation ---


    try {
      // Prepare final data object for the API
      const itemData = {
        name: formData.name.trim(),
        unitPriceWithoutVAT: finalPriceWithoutVAT, // Send the calculated canonical value
        currency: currency,
        vatRate: rateNum,
        unit: formData.unit || 'pcs', // Use default if empty
        description: formData.description || null,
        category: formData.category || null,
        sku: formData.sku || null,
      };

      console.log("Submitting itemData:", itemData); // Debug log

      const newItem = await createItemApi(itemData);
      console.log('Item created:', newItem);

      if (onAddItemSuccess) {
        onAddItemSuccess(newItem);
      }
      if (onClose) {
         onClose();
      }

    } catch (err) {
      console.error("Error creating item:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create item. Please check connection or contact support.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Styles (Keep or replace with CSS Modules) ---
  const formStyle = { border: '1px solid #ccc', padding: '20px', marginTop: '20px', borderRadius: '5px', backgroundColor: '#f9f9f9', maxWidth: '600px'}; // Limit width
  const inputGroupStyle = { marginBottom: '15px' };
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold'};
  const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '3px'};
  const radioGroupStyle = { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' };
  const radioLabelStyle = { fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' };
  const buttonContainerStyle = { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px'};
  const buttonStyle = { padding: '8px 15px', border: 'none', borderRadius: '3px', cursor: 'pointer'};
  const submitButtonStyle = { ...buttonStyle, backgroundColor: '#28a745', color: 'white'};
  const cancelButtonStyle = { ...buttonStyle, backgroundColor: '#6c757d', color: 'white'};
  const errorStyle = { color: 'red', marginTop: '10px', fontSize: '0.9em', fontWeight: 'bold' };
  const derivedPriceStyle = { fontStyle: 'italic', color: '#555', fontSize: '0.9em', marginTop: '3px'};
  // --- End Styles ---

  return (
    // Consider adding CSS Module class: className={styles.addItemForm}
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3>Add New Item/Service</h3>

      {/* Name Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="name" style={labelStyle}>Name *</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required style={inputStyle}/>
      </div>

      {/* --- Price Input Mode Selection --- */}
      <div style={inputGroupStyle}>
          <label style={labelStyle}>Price Input Method *</label>
          <div style={radioGroupStyle}>
              <label style={radioLabelStyle}>
                  <input
                      type="radio"
                      name="priceInputMode"
                      value="excludeVAT"
                      checked={priceInputMode === 'excludeVAT'}
                      onChange={() => setPriceInputMode('excludeVAT')}
                  />
                  Enter Price WITHOUT VAT
              </label>
              <label style={radioLabelStyle}>
                  <input
                      type="radio"
                      name="priceInputMode"
                      value="includeVAT"
                      checked={priceInputMode === 'includeVAT'}
                      onChange={() => setPriceInputMode('includeVAT')}
                  />
                  Enter Price INCLUDING VAT
              </label>
          </div>
      </div>

      {/* VAT Rate Input (Needed for calculations) */}
      <div style={inputGroupStyle}>
        <label htmlFor="vatRate" style={labelStyle}>VAT Rate (%) *</label>
        <input
            type="text" // Use text to allow easier input control via regex
            inputMode="decimal" // Hint for mobile keyboards
            id="vatRate"
            name="vatRate"
            value={formData.vatRate}
            onChange={handleChange}
            required
            placeholder="e.g., 21 or 10.5"
            style={inputStyle}
         />
      </div>

      {/* Price WITHOUT VAT Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="unitPriceWithoutVAT" style={labelStyle}>
            Price (w/o VAT) {priceInputMode === 'excludeVAT' ? '*' : ''}
        </label>
        <input
            type="text"
            inputMode="decimal"
            id="unitPriceWithoutVAT"
            name="unitPriceWithoutVAT"
            value={formData.unitPriceWithoutVAT}
            onChange={handleChange}
            required={priceInputMode === 'excludeVAT'} // Required only if this is the primary input
            style={inputStyle}
            disabled={priceInputMode === 'includeVAT'} // Disable if entering price incl. VAT
         />
         {priceInputMode === 'includeVAT' && formData.unitPriceWithoutVAT && (
             <div style={derivedPriceStyle}>Calculated: {formData.unitPriceWithoutVAT}</div>
         )}
      </div>

      {/* Price INCLUDING VAT Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="unitPriceIncludingVAT" style={labelStyle}>
            Price (incl. VAT) {priceInputMode === 'includeVAT' ? '*' : ''}
        </label>
        <input
            type="text"
            inputMode="decimal"
            id="unitPriceIncludingVAT"
            name="unitPriceIncludingVAT"
            value={unitPriceIncludingVAT} // Use separate state variable
            onChange={handleChange}
            required={priceInputMode === 'includeVAT'} // Required only if this is the primary input
            style={inputStyle}
            disabled={priceInputMode === 'excludeVAT'} // Disable if entering price excl. VAT
        />
         {priceInputMode === 'excludeVAT' && unitPriceIncludingVAT && (
             <div style={derivedPriceStyle}>Calculated: {unitPriceIncludingVAT}</div>
         )}
      </div>

      {/* Currency Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="currency" style={labelStyle}>Currency *</label>
        <input
            type="text"
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            required maxLength="3" placeholder="e.g., CZK"
            style={{...inputStyle, textTransform: 'uppercase'}}
        />
      </div>

      {/* Unit Input */}
       <div style={inputGroupStyle}>
        <label htmlFor="unit" style={labelStyle}>Unit</label>
        <input type="text" id="unit" name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g., pcs, hour, night, kg" style={inputStyle}/>
      </div>

      {/* Category Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="category" style={labelStyle}>Category</label>
        <input type="text" id="category" name="category" value={formData.category} onChange={handleChange} style={inputStyle}/>
      </div>

      {/* SKU Input */}
       <div style={inputGroupStyle}>
        <label htmlFor="sku" style={labelStyle}>SKU / Code</label>
        <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} style={inputStyle}/>
      </div>

      {/* Description Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="description" style={labelStyle}>Description</label>
        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3" style={inputStyle}></textarea>
      </div>

      {/* Error Display */}
      {error && <p style={errorStyle}>{error}</p>}

      {/* Action Buttons */}
      <div style={buttonContainerStyle}>
        <button type="button" onClick={onClose} disabled={isSubmitting} style={cancelButtonStyle}>Cancel</button>
        <button type="submit" disabled={isSubmitting} style={submitButtonStyle}>
          {isSubmitting ? 'Adding...' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}

export default AddItemForm;