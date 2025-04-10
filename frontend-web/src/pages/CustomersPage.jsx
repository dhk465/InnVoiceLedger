// src/pages/CustomersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getCustomers } from '../services/apiService';
import AddCustomerForm from '../components/AddCustomerForm';
import styles from './CustomersPage.module.css';

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError('Failed to load customers. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomerClick = () => {
    setIsAddFormVisible(true);
  };

  const handleCloseForm = () => {
    setIsAddFormVisible(false);
  };

  const handleAddCustomerSuccess = (newCustomer) => {
    setCustomers(prevCustomers => [newCustomer, ...prevCustomers]);
    handleCloseForm();
    console.log("Successfully added customer:", newCustomer.name);
  };

  if (isLoading) {
    return <div className={styles.loadingMessage}>Loading customers...</div>;
  }

  if (error) {
    return <div className={styles.errorMesssage}>Error: {error}</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2>Manage Customers</h2>
        <p>List of customers for assigning ledger entries and invoices.</p>
      </div>

      {!isAddFormVisible ? (
        <button
          className={styles.addCustomerButton}
          onClick={handleAddCustomerClick}
        >
          + Add New Customer
        </button>
      ) : (
        <AddCustomerForm
          onAddCustomerSuccess={handleAddCustomerSuccess}
          onClose={handleCloseForm}
        />
      )}

      <table className={styles.customersTable}>
        {/* === Ensure no extra whitespace within thead/tr/th === */}
        <thead>
          <tr>
            <th>Name</th>
            <th>Company Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>VAT ID</th>
            {/* <th>Actions</th> */}
          </tr>
        </thead>
        {/* === Ensure no extra whitespace within tbody/tr/td === */}
        <tbody>
          {customers.length > 0
           ? customers.map(customer => (
              // No whitespace between opening <tr> and first <td>
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.companyName || '-'}</td>
                <td>{customer.email || '-'}</td>
                <td>{customer.phone || '-'}</td>
                <td>{customer.vatId || '-'}</td>
                {/* <td><button>Edit</button> <button>Delete</button></td> */}
              </tr> // No whitespace between last <td> and closing </tr>
            ))
           : (// No whitespace between opening <tr> and first <td>
              <tr className={styles.noCustomersRow}>
                <td colSpan="5">No customers found. Add a new customer to get started.</td>
              </tr> // No whitespace between last <td> and closing </tr>
            )
          }
        </tbody>
      </table>
    </div>
  );
}

export default CustomersPage;