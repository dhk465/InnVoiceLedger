// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'; // Added useCallback
// --- UPDATED: Import getMe ---
import { login as loginApi, register as registerApi, getMe as getMeApi } from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken') || null);
    // --- isLoading now truly means "checking initial auth state" ---
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // --- Memoized function to fetch user data using token ---
    // useCallback prevents this function from causing unnecessary re-renders
    const fetchAndSetUser = useCallback(async (currentToken) => {
        if (!currentToken) {
             setUser(null);
             setIsLoading(false); // No token, definitely not loading auth state
             return; // Exit early
        }
        // We have a token, start the loading process for this check
        setIsLoading(true);
        try {
            console.log("AuthProvider: Verifying token by fetching user data...");
            // Use the getMe API call which relies on the axios interceptor to add the token
            const currentUser = await getMeApi();
            if (currentUser) {
                setUser(currentUser); // Set user data if fetch is successful
                console.log("AuthProvider: User data set.", currentUser);
            } else {
                 // This case might happen if API returns empty success for some reason
                 throw new Error('No user data returned');
            }
        } catch (error) {
            console.error("AuthProvider: Token verification failed or user fetch failed:", error);
            // Clear invalid token from storage and state
            localStorage.removeItem('authToken');
            setToken(null);
            setUser(null);
        } finally {
             // Finished checking auth state
             setIsLoading(false);
        }
    }, []); // No dependencies needed for this function itself

    // --- Effect to verify token on initial load OR when token state changes ---
    useEffect(() => {
        const currentToken = localStorage.getItem('authToken'); // Check storage directly too
        setToken(currentToken); // Sync state with storage initially
        fetchAndSetUser(currentToken); // Attempt to fetch user based on token found
    }, [fetchAndSetUser]); // Run only once on mount initially due to fetchAndSetUser memoization

    // --- Login Function ---
    const login = async (email, password) => {
        try {
            setAuthError(null);
            const response = await loginApi(email, password);
            if (response.token && response.user) {
                localStorage.setItem('authToken', response.token);
                setToken(response.token); // Update token state
                setUser(response.user);   // Update user state immediately
                // No need to call fetchAndSetUser here, we got user data directly
                console.log("AuthProvider: Login successful.");
                return true;
            }
             return false;
        } catch (error) {
            console.error("Login failed:", error);
            const message = error.response?.data?.message || 'Login failed. Please check credentials.';
            setAuthError(message);
             localStorage.removeItem('authToken');
             setToken(null);
             setUser(null);
            return false;
        }
    };

     // --- Register Function ---
    const register = async (email, password) => {
         try {
            setAuthError(null);
            const response = await registerApi(email, password);
            if (response.token && response.user) {
                localStorage.setItem('authToken', response.token);
                setToken(response.token);
                setUser(response.user);
                 console.log("AuthProvider: Registration successful.");
                return true;
            }
             return false;
        } catch (error) {
             console.error("Registration failed:", error);
             const message = error.response?.data?.message || 'Registration failed. Please try again.';
             setAuthError(message);
              localStorage.removeItem('authToken');
              setToken(null);
              setUser(null);
             return false;
        }
    };

    // --- Logout Function ---
    const logout = () => {
        console.log("AuthProvider: Logging out.");
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        setAuthError(null); // Clear any previous auth errors
    };

    // Value provided by the context
    const value = {
        user,
        token, // Keep token available if needed, though user object is primary check now
        isLoading, // Crucial: indicates if initial auth check is complete
        authError,
        login,
        logout,
        register,
        isAuthenticated: !!user, // Check for user object presence now
    };

    return (
        <AuthContext.Provider value={value}>
            {children} {/* Render children immediately, ProtectedRoute handles loading state */}
        </AuthContext.Provider>
    );
};

// Custom hook to consume the context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) { // Changed check to undefined, as null is a valid initial state
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};