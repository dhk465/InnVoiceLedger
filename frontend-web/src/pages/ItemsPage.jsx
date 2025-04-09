import React, { useState, useEffect } from "react";
import { getItems } from "../services/apiService"; // Import the API function

// --- Recommended: Add a CSS Module for this page ---
// import styles from './ItemsPage.module.css';
// Create src/pages/ItemsPage.module.css for styling the table/list

function ItemsPage() {
  // State for storing the list of items
  const [items, setItems] = useState([]);
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true);
  // State for error message
  const [error, setError] = useState(null);

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    // Define an async function inside useEffect to call the API
    const fetchItems = async () => {
      try {
        setIsLoading(true); // Start loading
        setError(null); // Reset error state
        const data = await getItems(); // Call the API service function
        setItems(data); // Update state with fetched items
      } catch (err) {
        console.error("Failed to fetch items:", err);
        setError("Failed to load items. Please try again later."); // Set error message
      } finally {
        setIsLoading(false); // Stop loading regardless of success/error
      }
    };

    fetchItems(); // Call the async function

    // Cleanup function (optional) - runs if component unmounts
    // return () => { /* Potential cleanup like aborting fetch */ };
  }, []); // Empty dependency array means this effect runs only once on mount

  // --- Render Logic ---
  if (isLoading) {
    return <div>Loading items...</div>; // Show loading indicator
  }

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>; // Show error message
  }

  return (
    <div>
      {" "}
      {/* Consider using className={styles.itemsContainer} */}
      <h2>Manage Items</h2>
      <p>List of available items/services.</p>
      {/* Add Item Button (for later) */}
      {/* <button>Add New Item</button> */}
      {/* Simple Table to display items */}
      {/* Consider className={styles.itemsTable} */}
      <table
        border="1"
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price (w/o VAT)</th>
            <th>VAT Rate (%)</th>
            <th>Unit</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category || "-"}</td>
                <td>{parseFloat(item.unitPriceWithoutVAT).toFixed(2)}</td>
                <td>{parseFloat(item.vatRate).toFixed(2)}%</td>
                <td>{item.unit}</td>
                <td>{item.description || "-"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No items found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ItemsPage;
