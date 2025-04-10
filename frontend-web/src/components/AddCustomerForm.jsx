// src/components/AddCustomerForm.jsx
import React, { useState } from 'react';
import { createCustomer as createCustomerApi } from '../services/apiService';
// import styles from './AddCustomerForm.module.css'; // Optional CSS Module

function AddCustomerForm({ onAddCustomerSuccess, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    vatId: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!formData.name || formData.name.trim() === '') {
      setError('Customer name is required.');
      setIsSubmitting(false);
      return;
    }

    // Prepare data, trimming whitespace and handling optional fields
    const customerData = {
      name: formData.name.trim(),
      companyName: formData.companyName.trim() || null,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
      vatId: formData.vatId.trim() || null,
      notes: formData.notes.trim() || null,
    };

    try {
      const newCustomer = await createCustomerApi(customerData);
      console.log('Customer created:', newCustomer);
      if (onAddCustomerSuccess) {
        onAddCustomerSuccess(newCustomer);
      }
      if (onClose) {
         onClose();
      }
    } catch (err) {
      console.error("Error creating customer:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create customer. Please try again.');
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
  const buttonContainerStyle = { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px'};
  const buttonStyle = { padding: '8px 15px', border: 'none', borderRadius: '3px', cursor: 'pointer'};
  const submitButtonStyle = { ...buttonStyle, backgroundColor: '#28a745', color: 'white'};
  const cancelButtonStyle = { ...buttonStyle, backgroundColor: '#6c757d', color: 'white'};
  const errorStyle = { color: 'red', marginTop: '10px', fontSize: '0.9em', fontWeight: 'bold' };
  // --- End Styles ---

  return (
    // Consider className={styles.addCustomerForm}
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3>Add New Customer</h3>

      <div style={inputGroupStyle}>
        <label htmlFor="name" style={labelStyle}>Name *</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required style={inputStyle}/>
      </div>

      <div style={inputGroupStyle}>
        <label htmlFor="companyName" style={labelStyle}>Company Name</label>
        <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} style={inputStyle}/>
      </div>

      <div style={inputGroupStyle}>
        <label htmlFor="email" style={labelStyle}>Email</label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle}/>
      </div>

      <div style={inputGroupStyle}>
        <label htmlFor="phone" style={labelStyle}>Phone</label>
        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle}/>
      </div>

       <div style={inputGroupStyle}>
        <label htmlFor="address" style={labelStyle}>Address</label>
        <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows="3" style={inputStyle}></textarea>
      </div>

      <div style={inputGroupStyle}>
        <label htmlFor="vatId" style={labelStyle}>VAT / Tax ID</label>
        <input type="text" id="vatId" name="vatId" value={formData.vatId} onChange={handleChange} style={inputStyle}/>
      </div>

      <div style={inputGroupStyle}>
        <label htmlFor="notes" style={labelStyle}>Notes</label>
        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="3" style={inputStyle}></textarea>
      </div>


      {error && <p style={errorStyle}>{error}</p>}

      <div style={buttonContainerStyle}>
        <button type="button" onClick={onClose} disabled={isSubmitting} style={cancelButtonStyle}>Cancel</button>
        <button type="submit" disabled={isSubmitting} style={submitButtonStyle}>
          {isSubmitting ? 'Adding...' : 'Add Customer'}
        </button>
      </div>
    </form>
  );
}

export default AddCustomerForm;