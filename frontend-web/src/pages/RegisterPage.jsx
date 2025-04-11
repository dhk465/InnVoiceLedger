// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
// import styles from './RegisterPage.module.css'; // Optional styles

function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState(''); // For password mismatch etc.
    const { register, authError } = useAuth(); // Get register function from context
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(''); // Clear local errors
        if (password !== confirmPassword) {
            setLocalError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
             setLocalError("Password must be at least 6 characters.");
            return;
        }

        setIsSubmitting(true);
        const success = await register(email, password); // Call register from context
        setIsSubmitting(false);
        if (success) {
            navigate('/'); // Redirect to home after successful registration
        }
        // authError from context will display API errors (like email exists)
    };

    // --- Basic Inline Styles (Similar to Login) ---
     const containerStyle = { maxWidth: '400px', margin: '5rem auto', padding: '2rem', border: '1px solid #eee', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', backgroundColor: '#fff'};
     const inputGroupStyle = { marginBottom: '1rem' };
     const labelStyle = { display: 'block', marginBottom: '5px'};
     const inputStyle = { width: '100%', padding: '10px', boxSizing: 'border-box' };
     const buttonStyle = { width: '100%', padding: '10px', backgroundColor: '#198754', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '1rem'};
     const errorStyle = { color: 'red', marginTop: '1rem', textAlign: 'center', fontSize: '0.9em'};
     const loginLinkStyle = { display: 'block', textAlign: 'center', marginTop: '1rem', fontSize: '0.9em'};
    // --- End Styles ---


    return (
         <div style={containerStyle}>
            <h2>Register</h2>
            {/* Add warning about first-user-only registration if applicable */}
            <form onSubmit={handleSubmit}>
                {/* Email Input */}
                <div style={inputGroupStyle}>
                    <label htmlFor="email" style={labelStyle}>Email</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
                </div>
                {/* Password Input */}
                <div style={inputGroupStyle}>
                    <label htmlFor="password" style={labelStyle}>Password (min 6 chars)</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle}/>
                </div>
                 {/* Confirm Password Input */}
                <div style={inputGroupStyle}>
                    <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={inputStyle}/>
                </div>
                 {/* Display Local & Auth Errors */}
                 {(localError || authError) && <p style={errorStyle}>{localError || authError}</p>}

                <button type="submit" disabled={isSubmitting} style={buttonStyle}>
                    {isSubmitting ? 'Registering...' : 'Register'}
                </button>
            </form>
            <Link to="/login" style={loginLinkStyle}>Already have an account? Login</Link>
        </div>
    );
}

export default RegisterPage;