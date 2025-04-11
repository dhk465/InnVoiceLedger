// src/components/PublicLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom'; // Outlet renders nested routes

function PublicLayout() {
  // No Navbar here, just renders the matched child route (Login or Register)
  return <Outlet />;
}

export default PublicLayout;