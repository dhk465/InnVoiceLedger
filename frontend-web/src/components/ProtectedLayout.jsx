// src/components/ProtectedLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar'; // Import the Navbar
import { useAuth } from '../contexts/AuthContext'; // Still needed for conditional rendering check

function ProtectedLayout() {
  const { user, isLoading } = useAuth(); // Check auth status

  // While checking initial auth, maybe show a loader or nothing specific here,
  // as the ProtectedRoute component itself handles the main loading state before rendering this layout.
  // However, checking here prevents navbar flash if user exists but then auth fails.
  if (isLoading) {
    return <div>Loading App Shell...</div>; // Or null or a spinner
  }

  // If done loading but no user, this layout shouldn't technically render
  // because ProtectedRoute wrapper would redirect. But as a safeguard:
  if (!user) {
    return null; // Or redirect, though ProtectedRoute should handle it
  }

  // Render Navbar and the nested protected route content
  return (
    <div>
      <Navbar />
      <main style={{ padding: '0 20px' }}>
        <Outlet /> {/* Child route (ItemsPage, etc.) renders here */}
      </main>
    </div>
  );
}

export default ProtectedLayout;