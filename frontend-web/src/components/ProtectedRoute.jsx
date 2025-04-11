// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
    // --- UPDATED: Rely primarily on isLoading and user ---
    const { user, isLoading } = useAuth(); // Get isLoading from context
    const location = useLocation();

    // --- Show loading indicator while initial auth check runs ---
    if (isLoading) {
        // This prevents rendering children or redirecting before we know the auth state
        return <div>Checking authentication...</div>; // Or your app's loading spinner
    }

    // --- If loading is finished and there's no user object, redirect ---
    if (!user) {
        console.log("ProtectedRoute: No user found, redirecting to login.");
        // Redirect to login, saving the intended destination
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // --- If loading is finished and user exists, render the requested component ---
    return children;
}

export default ProtectedRoute;