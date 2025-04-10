// src/pages/ItemsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getItems } from '../services/apiService';
import AddItemForm from '../components/AddItemForm';
import styles from './ItemsPage.module.css';

function ItemsPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getItems();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch items:", err);
      setError('Failed to load items. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItemClick = () => {
    setIsAddFormVisible(true);
  };

  const handleCloseForm = () => {
    setIsAddFormVisible(false);
  };

  const handleAddItemSuccess = (newItem) => {
    setItems(prevItems => [newItem, ...prevItems]);
    handleCloseForm();
    console.log("Successfully added item:", newItem.name);
  };

  // Helper function for currency formatting
  const formatCurrency = (amount, currencyCode) => {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || typeof currencyCode !== 'string' || currencyCode.length !== 3) {
        const rawAmount = amount != null ? String(amount) : '-';
        const rawCurrency = currencyCode != null ? String(currencyCode) : '';
        return `${rawAmount} ${rawCurrency}`.trim();
      }
      try {
        return new Intl.NumberFormat('en', {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numAmount);
      } catch (e) {
        console.warn(`Could not format currency ${currencyCode}:`, e);
        return `${numAmount.toFixed(2)} ${currencyCode}`;
      }
    };

  // --- Helper to calculate price including VAT ---
  const calculatePriceInclVAT = (priceExcl, vatRate) => {
      const numPriceExcl = parseFloat(priceExcl);
      const numVatRate = parseFloat(vatRate);
      // Check if inputs are valid numbers
      if (isNaN(numPriceExcl) || isNaN(numVatRate) || numVatRate < 0) {
          return null; // Indicate calculation couldn't be done
      }
      const vatMultiplier = 1 + numVatRate / 100;
      return numPriceExcl * vatMultiplier;
  };


  if (isLoading) {
    return <div className={styles.loadingMessage}>Loading items...</div>;
  }

  if (error) {
    return <div className={styles.errorMesssage}>Error: {error}</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2>Manage Items</h2>
        <p>List of available items/services for generating invoices.</p>
      </div>

      {!isAddFormVisible ? (
        <button
          className={styles.addItemButton}
          onClick={handleAddItemClick}
        >
          + Add New Item
        </button>
      ) : (
        <AddItemForm
          onAddItemSuccess={handleAddItemSuccess}
          onClose={handleCloseForm}
        />
      )}

      <table className={styles.itemsTable}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            {/* Use 'Price (excl. VAT)' for clarity */}
            <th>Price (excl. VAT)</th>
            {/* --- ADDED HEADER --- */}
            <th>Price (incl. VAT)</th>
            {/* --- END ADDED HEADER --- */}
            <th>VAT Rate (%)</th>
            <th>Unit</th>
            <th>Description</th>
            {/* <th>Actions</th> */}
          </tr>
        </thead>
        <tbody>
          {items.length > 0
           ? items.map(item => {
              // Calculate price incl VAT for this item
              const priceInclVAT = calculatePriceInclVAT(item.unitPriceWithoutVAT, item.vatRate);

              return (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category || '-'}</td>
                  {/* Price Excl VAT */}
                  <td style={{ textAlign: 'right' }}>
                    {formatCurrency(item.unitPriceWithoutVAT, item.currency)}
                  </td>
                  {/* --- ADDED CELL --- */}
                  {/* Price Incl VAT */}
                  <td style={{ textAlign: 'right' }}>
                    {/* Format the calculated value, show '-' if calculation failed */}
                    {priceInclVAT !== null ? formatCurrency(priceInclVAT, item.currency) : '-'}
                  </td>
                  {/* --- END ADDED CELL --- */}
                  <td style={{ textAlign: 'right' }}>
                    {parseFloat(item.vatRate).toFixed(2)}%
                  </td>
                  <td>{item.unit}</td>
                  <td>{item.description || '-'}</td>
                  {/* <td><button>Edit</button> <button>Delete</button></td> */}
                </tr>
              );
             })
           : (
              <tr className={styles.noItemsRow}>
                {/* --- Update colSpan --- */}
                <td colSpan="7">No items found. Add a new item to get started.</td>
                {/* --- End Update --- */}
              </tr>
            )
          }
        </tbody>
      </table>
    </div>
  );
}

export default ItemsPage;