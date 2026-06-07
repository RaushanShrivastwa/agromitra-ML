import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import './App.css';
import './index.css';

// Global fetch interceptor to automatically prepend the backend API URL for relative requests in production
const originalFetch = window.fetch;
window.fetch = function (resource, options) {
  const baseUrl = process.env.REACT_APP_API_URL || '';
  if (baseUrl) {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    if (typeof resource === 'string' && resource.startsWith('/')) {
      resource = `${cleanBaseUrl}${resource}`;
    } else if (resource instanceof Request && typeof resource.url === 'string' && resource.url.startsWith('/')) {
      const newUrl = `${cleanBaseUrl}${resource.url}`;
      resource = new Request(newUrl, resource);
    }
  }
  return originalFetch(resource, options);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
