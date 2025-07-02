// src/pages/Verify.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import * as jwtDecode from 'jwt-decode'; // REMOVED: No longer needed, using custom parseJWT
import '../styles/Verify.css'; // add whatever styles you like

// Custom parseJWT function (copied from your first snippet)
function parseJWT(token) {
  if (!token) throw new Error('Missing token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(b64).split('').map(ch => '%' + ch.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  );
  return JSON.parse(json);
}

function Verify() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || {}; // Still using this destructuring, as it's fine

  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // NOTE: Still using relative path for fetch, as you didn't ask to change API_URL
      const res = await fetch('/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Verification failed');
        setLoading(false);
        return;
      }

      // Check for token existence before parsing
      if (!data.token) {
        alert('Verification succeeded, but no token was received.');
        setLoading(false);
        return;
      }

      // 1. Decode the token using the custom parseJWT function
      let decodedUser = {};
      try {
        const decoded = parseJWT(data.token); // <-- Changed to use custom parseJWT
        decodedUser = {
          id: decoded.id, // Assuming 'id' is the correct property in the JWT payload here
          email: decoded.email,
          role: decoded.role,
          banned: decoded.banned
        };
      } catch (err) {
        console.error('JWT decoding failed:', err);
        alert('Verification succeeded, but could not process your login. Token might be invalid.');
        setLoading(false);
        return;
      }

      // 2. Explicitly store the token in localStorage
      localStorage.setItem('token', data.token); // <-- Added explicit localStorage.setItem

      // 3. Call your context login to update AuthContext state
      login(data.token, decodedUser);

      // 4. Navigate based on their role
      if (decodedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/Dashboard'); // Still navigating to Dashboard as per original second snippet
      }
    } catch (err) {
      console.error('OTP verify error:', err);
      alert('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vauth-card">
      <h2>Verify OTP</h2>
      <p>Please enter the OTP sent to <strong>{email}</strong></p>
      <form onSubmit={handleSubmit} className="verify-form">
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={e => setOTP(e.target.value)}
          required
        />
        <button type="submit" className="btn solid" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify OTP'}
        </button>
      </form>
    </div>
  );
}

export default Verify;