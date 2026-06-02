import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, isBanned } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', background: 'var(--bg-main)' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isBanned) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh', background: '#111', color: '#fff' }}>
        <h1 className="text-danger mb-3">Account Suspended</h1>
        <p className="text-muted">Your account has been banned due to a violation of our terms.</p>
        <a href="/login" className="btn btn-outline-danger mt-3" onClick={() => localStorage.removeItem('token')}>
          Back to Login
        </a>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
