// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Custom parseJWT function
function parseJWT(token) {
  if (!token) throw new Error('Missing token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(b64)
      .split('')
      .map(ch => '%' + ch.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );

  return JSON.parse(json);
}

function Login() {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [googleRole, setGoogleRole] = useState('Customer');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleLoginChange = e => {
    if (e && e.target) {
      const { name, value } = e.target;
      setLoginData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogin = async e => {
    e.preventDefault();
    
    // Read directly from DOM elements to handle password manager autofills robustly
    const emailVal = e.target.elements.email?.value || loginData.email;
    const passwordVal = e.target.elements.password?.value || loginData.password;
    
    try {
      const res = await fetch('/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, password: passwordVal })
      });
      const data = await res.json();

      if (res.ok) {
        if (!data.token) { // Added check for missing token in response
          alert('Invalid login response: No token received.');
          return;
        }

        let decodedUser = {};
        try {
          const decodedToken = parseJWT(data.token); // Changed to use custom parseJWT
          decodedUser = {
            id: decodedToken.id,
            email: decodedToken.email,
            role: decodedToken.role,
            banned: decodedToken.banned
          };
        } catch (err) {
          console.error('JWT decoding failed:', err);
          alert('Login successful, but user info could not be decoded. Token might be invalid.');
          return;
        }

        // Explicitly storing token in localStorage
        localStorage.setItem('token', data.token);

        login(data.token, decodedUser);
        navigate(decodedUser.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error.');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleLogin} className="auth-form">
        <h2>{t('loginHeader') || 'Login'}</h2>
        <input type="email" name="email" placeholder={t('emailPlaceholder') || 'Email'} value={loginData.email} onChange={handleLoginChange} required />
        <input type="password" name="password" placeholder={t('passwordPlaceholder') || 'Password'} value={loginData.password} onChange={handleLoginChange} required />
        <button type="submit">{t('loginHeader') || 'Login'}</button>

        <div className="mb-3 w-100 text-start">
          <label className="form-label fw-semibold mb-1 text-muted" style={{ fontSize: '0.85rem' }}>
            {t('selectRoleGoogle') || 'Select Role for Google Sign-In (if new)'}
          </label>
          <select 
            value={googleRole} 
            onChange={(e) => setGoogleRole(e.target.value)} 
            className="form-select p-2 w-100" 
            style={{ borderRadius: '8px', border: '1px solid #ccc', background: 'var(--bg-input)', color: 'var(--text-color)' }}
          >
            <option value="Customer">{t('roleCustomer') || 'Customer'}</option>
            <option value="Farmer">{t('roleFarmer') || 'Farmer'}</option>
          </select>
        </div>

        <a href={`${process.env.REACT_APP_API_URL || ''}/auth/google?role=${googleRole}`} className="google-login-btn">
          <img src="https://i.postimg.cc/3NGKBY4V/google-icon.png" alt="Google" />
          {t('loginWithGoogle') || 'Login with Google'}
        </a>
        <p>{t('noAccount') || "Don't have an account?"} <a href="/signup">{t('signupHeader') || 'Sign Up'}</a></p>
      </form>
    </div>
  );
}

export default Login;