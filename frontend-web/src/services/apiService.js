// src/services/apiService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// --- Item Functions ---
export const getItems = async () => {
  try { const response = await apiClient.get('/items'); return response.data; }
  catch (error) { console.error('Error fetching items:', error); throw error; }
};
export const createItem = async (itemData) => {
  try { const response = await apiClient.post('/items', itemData); return response.data; }
  catch (error) { console.error('Error creating item:', error); throw error; }
};

// --- Customer Functions ---
export const getCustomers = async () => {
  try { const response = await apiClient.get('/customers'); return response.data; }
  catch (error) { console.error('Error fetching customers:', error); throw error; }
};
export const createCustomer = async (customerData) => {
  try { const response = await apiClient.post('/customers', customerData); return response.data; }
  catch (error) { console.error('Error creating customer:', error); throw error; }
};

// --- Ledger Functions ---
export const getLedgerEntries = async (params = {}) => {
  try { const response = await apiClient.get('/ledger', { params }); return response.data; }
  catch (error) { console.error('Error fetching ledger entries:', error); throw error; }
};
export const createLedgerEntry = async (entryData) => {
  try { const response = await apiClient.post('/ledger', entryData); return response.data; }
  catch (error) { console.error('Error creating ledger entry:', error); throw error; }
};

// --- Invoice Functions ---
/**
 * Fetches a list of all invoices.
 * @returns {Promise<Array>} - Promise resolving to an array of invoices.
 */
export const getInvoices = async () => {
  try {
    const response = await apiClient.get('/invoices');
    return response.data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

/**
 * Sends a request to generate a new invoice.
 * @param {object} generationData - Data needed for generation { customerId, startDate, endDate, issueDate, targetCurrency, dueDate?, notes? }
 * @returns {Promise<object>} - Promise resolving to the newly generated invoice object.
 */
export const generateInvoice = async (generationData) => {
  try {
    const response = await apiClient.post('/invoices/generate', generationData);
    return response.data;
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error; // Let the calling component handle UI feedback
  }
};

// --- Get single invoice by ID ---
/**
 * Fetches a single invoice by its ID, including details.
 * @param {string} invoiceId - The UUID of the invoice.
 * @returns {Promise<object>} - Promise resolving to the detailed invoice object.
 */
export const getInvoiceById = async (invoiceId) => {
  if (!invoiceId) throw new Error("Invoice ID is required."); // Basic validation
  try {
      const response = await apiClient.get(`/invoices/${invoiceId}`);
      return response.data;
  } catch (error) {
      console.error(`Error fetching invoice by ID ${invoiceId}:`, error);
      throw error; // Re-throw for component handling
  }
};

// --- Helper to get PDF download URL ---
/**
 * Returns the absolute URL to download the PDF for a given invoice ID.
 * @param {string} invoiceId - The UUID of the invoice.
 * @returns {string} - The full URL for the PDF download endpoint.
 */
export const getInvoicePdfUrl = (invoiceId) => {
  if (!invoiceId) throw new Error("Invoice ID is required.");
  // Construct the full URL based on the API base
  return `${API_BASE_URL}/invoices/${invoiceId}/pdf`;
};

// --- Alternative: Function to fetch PDF blob using Axios (if auth needed) ---
/*
export const downloadInvoicePdfBlob = async (invoiceId) => {
  if (!invoiceId) throw new Error("Invoice ID is required.");
  try {
      const url = `/invoices/${invoiceId}/pdf`; // Relative path for apiClient
      const response = await apiClient.get(url, {
          responseType: 'blob', // Important: Ask axios to handle response as a binary blob
          // Add Authorization header here if needed later
          // headers: { 'Authorization': `Bearer ${your_token}` }
      });
      return response.data; // Returns the Blob object
  } catch (error) {
      console.error(`Error downloading PDF blob for invoice ${invoiceId}:`, error);
      throw error;
  }
};
*/