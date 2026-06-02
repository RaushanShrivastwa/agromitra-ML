// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Signup.css'; // Assuming you have a CSS file for styling
import { useAuth } from '../context/AuthContext'; // Assuming you have an AuthContext for managing auth state
import { useLanguage } from '../context/LanguageContext';

function Signup() {
  const [signupData, setSignupData] = useState({ name: '', email: '', phno: '', password: '', role: 'Farmer' });
  const [otpLoading, setOtpLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSignupChange = e => {
    if (e && e.target) {
      const { name, value } = e.target;
      setSignupData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSignup = async e => {
    e.preventDefault();
    if (otpLoading) return;

    // Read directly from DOM elements to handle password manager autofills robustly
    const nameVal = e.target.elements.name?.value || signupData.name;
    const emailVal = e.target.elements.email?.value || signupData.email;
    const phnoVal = e.target.elements.phno?.value || signupData.phno;
    const passwordVal = e.target.elements.password?.value || signupData.password;
    const roleVal = e.target.elements.role?.value || signupData.role;

    const payload = {
      name: nameVal,
      email: emailVal,
      phno: phnoVal,
      password: passwordVal,
      role: roleVal
    };

    setOtpLoading(true);
    try {
      const res = await fetch('/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        navigate('/verify', { state: { email: emailVal } });
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSignup} className="auth-form">
        <h2>{t('signupHeader') || 'Sign Up'}</h2>
        <input type="text" name="name" placeholder={t('namePlaceholder') || 'Name'} value={signupData.name} onChange={handleSignupChange} required />
        <input type="email" name="email" placeholder={t('emailPlaceholder') || 'Email'} value={signupData.email} onChange={handleSignupChange} required />
        <input type="text" name="phno" placeholder={t('phonePlaceholder') || 'Phone Number'} value={signupData.phno} onChange={handleSignupChange} required />
        <input type="password" name="password" placeholder={t('passwordPlaceholder') || 'Password'} value={signupData.password} onChange={handleSignupChange} required />
        
        <div className="mb-3 w-100">
          <label className="form-label fw-semibold text-start d-block mb-1 text-muted" style={{ fontSize: '0.85rem' }}>{t('selectRole') || 'Select Role'}</label>
          <select 
            name="role" 
            value={signupData.role} 
            onChange={handleSignupChange} 
            className="form-select p-2 w-100" 
            style={{ borderRadius: '8px', border: '1px solid #ccc', background: 'var(--bg-input)', color: 'var(--text-color)' }}
            required
          >
            <option value="Farmer">{t('roleFarmer') || 'Farmer'}</option>
            <option value="Customer">{t('roleCustomer') || 'Customer'}</option>
          </select>
        </div>

        <button type="submit" disabled={otpLoading}>{otpLoading ? t('sendingOtp') || 'Sending OTP...' : t('requestOtp') || 'Request OTP'}</button>
        <a href={`${process.env.REACT_APP_API_URL || ''}/auth/google?role=${signupData.role}`} className="google-login-btn">
        <img src="https://i.postimg.cc/3NGKBY4V/google-icon.png" alt="Google" />
        {t('signupWithGoogle') || 'Sign up with Google'}
        </a>
        <p>{t('alreadyAccount') || 'Already have an account?'} <a href="/login">{t('loginHeader') || 'Login'}</a></p>
      </form>
    </div>
  );
}

export default Signup;
