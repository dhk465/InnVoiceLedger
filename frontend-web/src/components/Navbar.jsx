import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

function Navbar() {
    // Function to determine className for NavLink (includes active state)
    const getNavLinkClass = ({ isActive }) => {
      return isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;
    };
  
    return (
      // Apply class from CSS module
      <nav className={styles.navbar}>
        <ul className={styles.navList}>
          <li><NavLink to="/" className={getNavLinkClass}>Home</NavLink></li>
          <li><NavLink to="/items" className={getNavLinkClass}>Items</NavLink></li>
          <li><NavLink to="/customers" className={getNavLinkClass}>Customers</NavLink></li>
          <li><NavLink to="/ledger" className={getNavLinkClass}>Ledger</NavLink></li>
          <li><NavLink to="/invoices" className={getNavLinkClass}>Invoices</NavLink></li>
        </ul>
      </nav>
    );
  }
  
  export default Navbar;