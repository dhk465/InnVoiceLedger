import axios from 'axios';

// Define the base URL of your backend API
// Make sure this matches the port your backend is running on (from backend/.env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';


// Create an axios instance with default settings
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Add any other default headers here if needed (e.g., Authorization later)
  }
});

// Function to fetch all items
export const getItems = async () => {
  try {
    const response = await apiClient.get('/items'); // Makes GET request to baseURL + /items
    return response.data; // Return the data part of the response (the array of items)
  } catch (error) {
    console.error('Error fetching items:', error);
    // Handle error appropriately - maybe re-throw, return null, or return an error object
    // For now, re-throwing allows the component to catch it
    throw error;
  }
};

// Function to create a new item
export const createItem = async (itemData) => {
  try {
    const response = await apiClient.post('/items', itemData); // Makes POST request
    return response.data; // Return the newly created item data
  } catch (error) {
    console.error('Error creating item:', error);
    // Re-throw the error so the form can catch it and display messages
    throw error;
  }
};

// --- Customer Functions (NEW) ---
export const getCustomers = async () => {
  try {
    const response = await apiClient.get('/customers');
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error; // Re-throw for component handling
  }
};

export const createCustomer = async (customerData) => {
  try {
    const response = await apiClient.post('/customers', customerData);
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error; // Re-throw for form handling
  }
};
// --- End Customer Functions ---

// --- Add functions for other endpoints later ---
// export const getLedgerEntries = async (params) => { ... apiClient.get('/ledger', { params }) ... };
// export const createLedgerEntry = async (entryData) => { ... apiClient.post('/ledger', entryData) ... };

// Export the configured apiClient if needed elsewhere, otherwise just export functions
// export default apiClient;