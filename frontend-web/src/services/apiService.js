// src/services/apiService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create the base axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// --- Axios Request Interceptor ---
// Automatically add the Authorization header if a token exists in localStorage
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config; // Continue with the request config
    },
    (error) => {
        // Handle request errors (e.g., network issues before sending)
        return Promise.reject(error);
    }
);

// --- Axios Response Interceptor (Optional but Recommended) ---
// Handle common responses like 401 Unauthorized globally
apiClient.interceptors.response.use(
    (response) => {
        // Any status code within 2xx cause this function to trigger
        return response;
    },
    (error) => {
        // Any status codes outside 2xx cause this function to trigger
        if (error.response && error.response.status === 401) {
            // Handle Unauthorized errors (e.g., invalid token, expired token)
            console.error("API Request Unauthorized (401):", error.response.data.message);
            // Clear potentially invalid token and redirect to login
            localStorage.removeItem('authToken');
            // Check if we are already on login page to prevent loops
            if (window.location.pathname !== '/login') {
                 // Use window.location for simplicity here, or integrate with router history
                 alert('Your session has expired or is invalid. Please log in again.'); // Simple alert
                 window.location.href = '/login'; // Force redirect
            }
        }
        // Return the error so that specific catch blocks in components/forms can still handle it
        return Promise.reject(error);
    }
);


// --- Auth Functions ---
export const login = async (email, password) => {
    // Note: No try/catch here, let the interceptor or calling component handle errors
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data; // { user: {...}, token: "..." }
};

export const register = async (email, password) => {
    const response = await apiClient.post('/auth/register', { email, password });
    return response.data; // { user: {...}, token: "...", message: "..." }
};

export const getMe = async () => {
    // Token is automatically added by the request interceptor
    const response = await apiClient.get('/auth/me');
    return response.data; // User object (without password hash)
};
// --- End Auth Functions ---


// --- Item Functions ---
export const getItems = async () => {
    const response = await apiClient.get('/items'); return response.data;
};
export const createItem = async (itemData) => {
    const response = await apiClient.post('/items', itemData); return response.data;
};

// --- Customer Functions ---
export const getCustomers = async () => {
    const response = await apiClient.get('/customers'); return response.data;
};
export const createCustomer = async (customerData) => {
    const response = await apiClient.post('/customers', customerData); return response.data;
};

// --- Ledger Functions ---
export const getLedgerEntries = async (params = {}) => {
    const response = await apiClient.get('/ledger', { params }); return response.data;
};
export const createLedgerEntry = async (entryData) => {
    const response = await apiClient.post('/ledger', entryData); return response.data;
};

// --- Invoice Functions ---
export const getInvoices = async () => {
    const response = await apiClient.get('/invoices'); return response.data;
};
export const generateInvoice = async (generationData) => {
    const response = await apiClient.post('/invoices/generate', generationData); return response.data;
};
export const getInvoiceById = async (invoiceId) => {
    if (!invoiceId) throw new Error("Invoice ID is required.");
    const response = await apiClient.get(`/invoices/${invoiceId}`); return response.data;
};
export const getInvoicePdfUrl = (invoiceId) => {
    if (!invoiceId) throw new Error("Invoice ID is required.");
    return `${API_BASE_URL}/invoices/${invoiceId}/pdf`;
};

// --- END ---