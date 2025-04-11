// src/components/Navbar.jsx
import React from 'react';
// Using NavLink for active class handling
import { NavLink, useNavigate } from 'react-router-dom';
// Import the CSS module
import styles from './Navbar.module.css';
// Import auth context hook
import { useAuth } from '../contexts/AuthContext';
// Import locale
import { useLocale } from '../contexts/LocaleContext';

function Navbar() {
  // Get user and logout function from context
  const { logout, user } = useAuth();
  // Get locale context functions/data
  const { currentLocaleCode, supportedLocales, changeLocale } = useLocale();
  // Hook for programmatic navigation (after logout)
  const navigate = useNavigate();

  // Function passed to NavLink to apply active styles
  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;
  };

  // Logout handler
  const handleLogout = () => {
    logout(); // Call context logout function
    navigate('/login'); // Redirect to login page
  };

  // Handle locale change
  const handleLocaleChange = (event) => {
    changeLocale(event.target.value);
  };

  return (
    // Apply the main navbar class which includes display: flex
    <nav className={styles.navbar}>

      {/* Left Section: Navigation Links */}
      {/* This ul is the first flex item */}
      <ul className={styles.navList}>
        <li><NavLink to="/" className={getNavLinkClass}>Home</NavLink></li>
        <li><NavLink to="/items" className={getNavLinkClass}>Items</NavLink></li>
        <li><NavLink to="/customers" className={getNavLinkClass}>Customers</NavLink></li>
        <li><NavLink to="/ledger" className={getNavLinkClass}>Ledger</NavLink></li>
        <li><NavLink to="/invoices" className={getNavLinkClass}>Invoices</NavLink></li>
      </ul>

      {/* Right Section: User Info and Logout */}
      {/* This div is the second flex item */}
      <div className={styles.navActions}>
          {/* Display user email if user object exists */}
          {user && <span className={styles.userInfo}>Logged in as: {user.email}</span>}

          {/* --- Locale Switcher --- */}
          <select value={currentLocaleCode} onChange={handleLocaleChange} className={styles.localeSelect}>
              {supportedLocales.map(locale => (
                  <option key={locale.code} value={locale.code}>
                      {locale.name} {/* Display language name */}
                  </option>
              ))}
          </select>
          {/* --- End Locale Switcher --- */}

          {/* Logout button */}
          <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
          </button>
      </div>

    </nav>
  );
}

export default Navbar;