// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Use the auth hook
import { useNavigate, useLocation, Link } from 'react-router-dom'; // For redirection
// import styles from './LoginPage.module.css'; // Optional styles

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, authError } = useAuth(); // Get login function and errors from context
    const navigate = useNavigate(); // Hook for navigation
    const location = useLocation(); // Hook to get previous location

    // Determine where to redirect after login
    const from = location.state?.from?.pathname || '/'; // Redirect to previous page or home

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await login(email, password); // Call login function from context
        setIsSubmitting(false);
        if (success) {
            navigate(from, { replace: true }); // Redirect on success
        }
        // Error message is handled by displaying authError from context
    };

    // --- Basic Inline Styles ---
    const containerStyle = { maxWidth: '400px', margin: '5rem auto', padding: '2rem', border: '1px solid #eee', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', backgroundColor: '#fff'};
    const inputGroupStyle = { marginBottom: '1rem' };
    const labelStyle = { display: 'block', marginBottom: '5px'};
    const inputStyle = { width: '100%', padding: '10px', boxSizing: 'border-box' };
    const buttonStyle = { width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '1rem'};
    const errorStyle = { color: 'red', marginTop: '1rem', textAlign: 'center', fontSize: '0.9em'};
    const registerLinkStyle = { display: 'block', textAlign: 'center', marginTop: '1rem', fontSize: '0.9em'};
    // --- End Styles ---

    return (
        <div style={containerStyle}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div style={inputGroupStyle}>
                    <label htmlFor="email" style={labelStyle}>Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>
                <div style={inputGroupStyle}>
                    <label htmlFor="password" style={labelStyle}>Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>
                 {authError && <p style={errorStyle}>{authError}</p>}
                <button type="submit" disabled={isSubmitting} style={buttonStyle}>
                    {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
            </form>
             {/* Link to Register Page (Optional) */}
             {/* Add a check here if registration should be hidden after first user */}
             <Link to="/register" style={registerLinkStyle}>Need an account? Register</Link>
        </div>
    );
}

export default LoginPage;