// src/components/AddItemForm.jsx
import React, { useState, useEffect } from "react"; // Removed unused useCallback
import { createItem as createItemApi } from "../services/apiService";
// import styles from './AddItemForm.module.css'; // Optional CSS Module

// Define allowed units - keep this in sync with backend model validation
const ALLOWED_UNITS = [
  "pcs",
  "night",
  "day",
  "hour",
  "kg",
  "litre",
  "service",
  "other",
];

// Helper to safely parse float, returning null if invalid
const safeParseFloat = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

function AddItemForm({ onAddItemSuccess, onClose }) {
  // --- State ---
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    sku: "",
    unitPriceWithoutVAT: "",
    currency: "CZK", // Default currency
    vatRate: "",
    unit: ALLOWED_UNITS[0], // Default to the first allowed unit ('pcs')
  });
  const [unitPriceIncludingVAT, setUnitPriceIncludingVAT] = useState(""); // For the second price input
  const [priceInputMode, setPriceInputMode] = useState("excludeVAT"); // Track which price is being entered
  const [isSubmitting, setIsSubmitting] = useState(false); // Form submission loading state
  const [error, setError] = useState(null); // Form submission error message
  // --- END State ---

  // --- Effect for Price Calculation ---
  // Automatically calculate one price field when the other or VAT rate changes
  useEffect(() => {
    const priceExcl = safeParseFloat(formData.unitPriceWithoutVAT);
    const priceIncl = safeParseFloat(unitPriceIncludingVAT);
    const rate = safeParseFloat(formData.vatRate);

    // Stop calculation if rate is invalid or negative
    if (rate === null || rate < 0) {
      if (priceInputMode === "excludeVAT") setUnitPriceIncludingVAT("");
      else setFormData((prev) => ({ ...prev, unitPriceWithoutVAT: "" }));
      return;
    }

    const vatMultiplier = 1 + rate / 100;

    if (priceInputMode === "excludeVAT") {
      // Calculate price *including* VAT if price *without* VAT is valid
      if (priceExcl !== null) {
        const calculatedIncl = (priceExcl * vatMultiplier).toFixed(2);
        setUnitPriceIncludingVAT(calculatedIncl);
      } else {
        setUnitPriceIncludingVAT(""); // Clear derived field if input is invalid
      }
    } else {
      // priceInputMode === 'includeVAT'
      // Calculate price *without* VAT if price *including* VAT is valid
      if (priceIncl !== null && vatMultiplier !== 0 && vatMultiplier > 0) {
        // Ensure multiplier is valid positive
        const calculatedExcl = (priceIncl / vatMultiplier).toFixed(2);
        setFormData((prev) => ({
          ...prev,
          unitPriceWithoutVAT: calculatedExcl,
        }));
      } else {
        setFormData((prev) => ({ ...prev, unitPriceWithoutVAT: "" })); // Clear derived field if input is invalid
      }
    }
  }, [
    formData.unitPriceWithoutVAT,
    unitPriceIncludingVAT,
    formData.vatRate,
    priceInputMode,
  ]); // Dependencies

  // --- Handlers ---
  // Generic handler for most input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;

    // Handle radio buttons specifically for 'unit'
    if (type === "radio" && name === "unit") {
      if (checked) {
        // Update only if this radio becomes checked
        processedValue = value;
      } else {
        return; // If a radio is deselected, do nothing (another will become selected)
      }
    }
    // Sanitize numerical inputs (allow only numbers and one decimal point)
    else if (
      name === "unitPriceWithoutVAT" ||
      name === "unitPriceIncludingVAT" ||
      name === "vatRate"
    ) {
      processedValue = value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    }
    // Ensure currency code is uppercase
    else if (name === "currency") {
      processedValue = value.toUpperCase();
    }

    // Update the specific state for the 'Price (incl. VAT)' input
    if (name === "unitPriceIncludingVAT") {
      setUnitPriceIncludingVAT(processedValue);
    }
    // Update the main formData state for all other inputs (including unit radio)
    else {
      setFormData((prev) => ({ ...prev, [name]: processedValue }));
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default page reload
    setError(null); // Clear previous errors
    setIsSubmitting(true); // Set loading state

    // Parse numbers from form state for validation and API call
    const priceExclNum = safeParseFloat(formData.unitPriceWithoutVAT);
    const priceInclNum = safeParseFloat(unitPriceIncludingVAT);
    const rateNum = safeParseFloat(formData.vatRate);
    const currency = formData.currency.trim();

    // --- Final Validation before Submit ---
    if (!formData.name || !currency || rateNum === null || !formData.unit) {
      setError("Name, Currency, VAT Rate, and Unit are required.");
      setIsSubmitting(false);
      return;
    }
    if (currency.length !== 3) {
      setError("Currency must be a 3-letter code.");
      setIsSubmitting(false);
      return;
    }
    if (rateNum < 0) {
      setError("VAT Rate cannot be negative.");
      setIsSubmitting(false);
      return;
    }

    // Determine the definitive priceWithoutVAT based on the input mode selected
    let finalPriceWithoutVAT;
    const vatMultiplier = 1 + rateNum / 100;

    if (priceInputMode === "excludeVAT") {
      if (priceExclNum === null || priceExclNum < 0) {
        setError("Price (w/o VAT) must be a valid non-negative number.");
        setIsSubmitting(false);
        return;
      }
      finalPriceWithoutVAT = priceExclNum;
    } else {
      // priceInputMode === 'includeVAT'
      if (priceInclNum === null || priceInclNum < 0) {
        setError("Price (incl. VAT) must be a valid non-negative number.");
        setIsSubmitting(false);
        return;
      }
      if (vatMultiplier <= 0) {
        // Avoid division by zero or issues with negative VAT rates
        setError("Cannot calculate price without VAT with the given VAT Rate.");
        setIsSubmitting(false);
        return;
      }
      // Recalculate precisely for submission from the 'includeVAT' input value
      finalPriceWithoutVAT = priceInclNum / vatMultiplier;
    }
    // --- End Final Validation & Calculation ---

    try {
      // Prepare the final data object to send to the backend API
      const itemData = {
        name: formData.name.trim(),
        unitPriceWithoutVAT: finalPriceWithoutVAT, // Send the canonical calculated value
        currency: currency,
        vatRate: rateNum,
        unit: formData.unit, // Send the unit selected via radio button
        // Send null for optional fields if they are empty/whitespace only
        description: formData.description.trim() || null,
        category: formData.category.trim() || null,
        sku: formData.sku.trim() || null,
      };

      console.log("Submitting itemData:", itemData); // Debug log

      // Call the API service function
      const newItem = await createItemApi(itemData);
      console.log("Item created:", newItem);

      // Call the success callback prop if provided
      if (onAddItemSuccess) {
        onAddItemSuccess(newItem);
      }
      // Call the close callback prop if provided
      if (onClose) {
        onClose();
      }
    } catch (err) {
      // Handle errors from the API call
      console.error("Error creating item:", err);
      // Display error message from backend response or a generic fallback
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(
          "Failed to create item. Please check connection or contact support."
        );
      }
    } finally {
      setIsSubmitting(false); // Reset loading state
    }
  };

  // --- Styles Definitions (Using inline styles for now) ---
  const formStyle = {
    border: "1px solid #ccc",
    padding: "20px",
    marginTop: "20px",
    borderRadius: "5px",
    backgroundColor: "#f9f9f9",
    maxWidth: "600px",
  };
  const inputGroupStyle = { marginBottom: "15px" };
  const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    fontSize: "0.9em",
  };
  const inputStyle = {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    border: "1px solid #ccc",
    borderRadius: "3px",
    fontSize: "0.95rem",
  };
  const radioGroupStyle = {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    marginBottom: "10px",
    flexWrap: "wrap",
  };
  const radioLabelStyle = {
    fontWeight: "normal",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    cursor: "pointer",
    fontSize: "0.95em",
  };
  const unitRadioGroupStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px 15px",
    border: "1px solid #eee",
    padding: "10px",
    borderRadius: "4px",
    backgroundColor: "#fff",
  };
  const unitRadioLabelStyle = {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    cursor: "pointer",
    fontWeight: "normal",
    fontSize: "0.95em",
  };
  const buttonContainerStyle = {
    marginTop: "20px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  };
  const buttonStyle = {
    padding: "8px 15px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "500",
  };
  const submitButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#28a745",
    color: "white",
  };
  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#6c757d",
    color: "white",
  };
  const errorStyle = {
    color: "red",
    marginTop: "10px",
    fontSize: "0.9em",
    fontWeight: "bold",
  };
  const derivedPriceStyle = {
    fontStyle: "italic",
    color: "#555",
    fontSize: "0.9em",
    marginTop: "3px",
  };
  // --- END Styles ---

  return (
    // Apply base form style/class
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3>Add New Item/Service</h3>

      {/* Name Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="name" style={labelStyle}>
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          style={inputStyle}
        />
      </div>
      {/* Price Input Mode Selection */}
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Price Input Method *</label>
        <div style={radioGroupStyle}>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              name="priceInputMode"
              value="excludeVAT"
              checked={priceInputMode === "excludeVAT"}
              onChange={() => setPriceInputMode("excludeVAT")}
            />
            Excl. VAT
          </label>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              name="priceInputMode"
              value="includeVAT"
              checked={priceInputMode === "includeVAT"}
              onChange={() => setPriceInputMode("includeVAT")}
            />
            Incl. VAT
          </label>
        </div>
      </div>
      {/* VAT Rate Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="vatRate" style={labelStyle}>
          VAT Rate (%) *
        </label>
        <input
          type="text"
          inputMode="decimal"
          id="vatRate"
          name="vatRate"
          value={formData.vatRate}
          onChange={handleChange}
          required
          placeholder="e.g., 21"
          style={inputStyle}
        />
      </div>
      {/* Price Excl VAT Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="unitPriceWithoutVAT" style={labelStyle}>
          Price (w/o VAT) {priceInputMode === "excludeVAT" ? "*" : ""}
        </label>
        <input
          type="text"
          inputMode="decimal"
          id="unitPriceWithoutVAT"
          name="unitPriceWithoutVAT"
          value={formData.unitPriceWithoutVAT}
          onChange={handleChange}
          required={priceInputMode === "excludeVAT"}
          style={inputStyle}
          disabled={priceInputMode === "includeVAT"}
        />
        {priceInputMode === "includeVAT" && formData.unitPriceWithoutVAT && (
          <div style={derivedPriceStyle}>
            Calculated: {formData.unitPriceWithoutVAT}
          </div>
        )}
      </div>
      {/* Price Incl VAT Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="unitPriceIncludingVAT" style={labelStyle}>
          Price (incl. VAT) {priceInputMode === "includeVAT" ? "*" : ""}
        </label>
        <input
          type="text"
          inputMode="decimal"
          id="unitPriceIncludingVAT"
          name="unitPriceIncludingVAT"
          value={unitPriceIncludingVAT}
          onChange={handleChange}
          required={priceInputMode === "includeVAT"}
          style={inputStyle}
          disabled={priceInputMode === "excludeVAT"}
        />
        {priceInputMode === "excludeVAT" && unitPriceIncludingVAT && (
          <div style={derivedPriceStyle}>
            Calculated: {unitPriceIncludingVAT}
          </div>
        )}
      </div>
      {/* Currency Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="currency" style={labelStyle}>
          Currency *
        </label>
        <input
          type="text"
          id="currency"
          name="currency"
          value={formData.currency}
          onChange={handleChange}
          required
          maxLength="3"
          placeholder="e.g., CZK"
          style={{
            ...inputStyle,
            textTransform: "uppercase",
            maxWidth: "100px",
          }}
        />
      </div>

      {/* --- Unit Radio Buttons --- */}
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Unit *</label>
        <div style={unitRadioGroupStyle}>
          {ALLOWED_UNITS.map((unitValue) => (
            <label key={unitValue} style={unitRadioLabelStyle}>
              <input
                type="radio"
                name="unit" // Same name ensures only one can be selected
                value={unitValue}
                checked={formData.unit === unitValue} // Control checked state
                onChange={handleChange} // Use shared handler
                required // HTML5 validation
              />
              {/* Display user-friendly label */}
              {unitValue.charAt(0).toUpperCase() + unitValue.slice(1)}
            </label>
          ))}
        </div>
      </div>
      {/* --- END Unit Radio Buttons --- */}

      {/* Category Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="category" style={labelStyle}>
          Category
        </label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>
      {/* SKU Input */}
      <div style={inputGroupStyle}>
        <label htmlFor="sku" style={labelStyle}>
          SKU / Code
        </label>
        <input
          type="text"
          id="sku"
          name="sku"
          value={formData.sku}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>
      {/* Description Textarea */}
      <div style={inputGroupStyle}>
        <label htmlFor="description" style={labelStyle}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          style={inputStyle}
        ></textarea>
      </div>
      {/* Error Display */}
      {error && <p style={errorStyle}>{error}</p>}
      {/* Buttons */}
      <div style={buttonContainerStyle}>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          style={cancelButtonStyle}
        >
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} style={submitButtonStyle}>
          {" "}
          {isSubmitting ? "Adding..." : "Add Item"}{" "}
        </button>
      </div>
    </form>
  );
}
export default AddItemForm;
