import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  FaHome, FaBell, FaUser, FaSearch, FaChevronDown, 
  FaDonate, FaBars, FaTimes, FaGlobe, FaSun, FaMoon,
  FaUserShield
} from 'react-icons/fa';
import { RiCustomerService2Fill } from "react-icons/ri";
import { MdOutlineMiscellaneousServices } from "react-icons/md";
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, selectLanguage, t } = useLanguage();

  const [locations] = useState([
    { id: 1, name: 'New Delhi' },
    { id: 2, name: 'Mumbai' },
    { id: 3, name: 'Bangalore' },
    { id: 4, name: 'Hyderabad' },
    { id: 5, name: 'Chennai' },
  ]);
  const [selectedLocation, setSelectedLocation] = useState(() => {
    return localStorage.getItem('selected_location') || 'Select Location';
  });

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [realNotifications, setRealNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': localStorage.getItem('token') || '' }
        });
        const data = await res.json();
        if (res.ok && data.notifications) {
          setRealNotifications(data.notifications);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    localStorage.setItem('selected_location', location);
    setShowLocationDropdown(false);
    // Reload if on Mandi page to filter results
    if (window.location.pathname === '/mandi') {
      window.location.reload();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-brand">
          <a href="/dashboard" className="logo" style={{ textDecoration: 'none', fontWeight: 800 }}>AgroMitra</a>
        </div>

        {/* Desktop Navbar items */}
        {!isMobileView && (
          <div className="desktop-nav d-flex align-items-center">
            
            {/* Location Selector */}
            <div className="location-selector me-3" style={{ position: 'relative' }}>
              <button 
                className="location-btn btn btn-sm btn-outline-success text-truncate"
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                style={{ maxWidth: '160px', borderRadius: '8px' }}
              >
                {selectedLocation} <FaChevronDown className="ms-1" size={10} />
              </button>
              {showLocationDropdown && (
                <div className="dropdown-menu show p-2 border-0 shadow" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, background: 'var(--bg-card)', minWidth: '150px' }}>
                  {locations.map(loc => (
                    <button 
                      key={loc.id} 
                      className="dropdown-item rounded py-2 text-start"
                      onClick={() => handleLocationSelect(loc.name)}
                      style={{ color: 'var(--text-color)' }}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Links */}
            <div className="navbar-links d-flex align-items-center gap-3">
              <a href="/dashboard" className="nav-link text-success d-flex align-items-center gap-1" style={{ textDecoration: 'none', fontWeight: 600 }}>
                <FaHome /> <span>{t('home')}</span>
              </a>

              {/* Services Dropdown */}
              <div 
                className="nav-link text-success dropdown-trigger d-flex align-items-center gap-1"
                onMouseEnter={() => setShowServicesDropdown(true)}
                onMouseLeave={() => setShowServicesDropdown(false)}
                style={{ cursor: 'pointer', fontWeight: 600 }}
              >
                <MdOutlineMiscellaneousServices /> <span>{t('services')}</span> <FaChevronDown size={10} />
                {showServicesDropdown && (
                  <div className="dropdown-menu show p-2 border-0 shadow" style={{ position: 'absolute', top: '100%', background: 'var(--bg-card)', minWidth: '160px' }}>
                    {user?.role !== 'customer' && (
                      <a href="/testing" className="dropdown-item py-2" style={{ color: 'var(--text-color)' }}>{t('testing')}</a>
                    )}
                    <a href="/mandi" className="dropdown-item py-2" style={{ color: 'var(--text-color)' }}>{t('pricing')}</a>
                    <a href="/weather" className="dropdown-item py-2" style={{ color: 'var(--text-color)' }}>{t('weather')}</a>
                    {user?.role !== 'customer' && (
                      <a href="/fertilizer" className="dropdown-item py-2" style={{ color: 'var(--text-color)' }}>Fertilizer Advisor</a>
                    )}
                    <a href="/subsidies" className="dropdown-item py-2" style={{ color: 'var(--text-color)' }}>{t('schemes')}</a>
                    <a href="/shop" className="dropdown-item py-2" style={{ color: 'var(--text-color)' }}>Deals Shop</a>
                    <a href="/faq" className="dropdown-item py-2" style={{ color: 'var(--text-color)' }}>Help Center & FAQ</a>
                  </div>
                )}
              </div>

              <a href="/donate" className="nav-link text-success d-flex align-items-center gap-1" style={{ textDecoration: 'none', fontWeight: 600 }}>
                <FaDonate /> <span>{t('donate')}</span>
              </a>

              <a href="/contact" className="nav-link text-success d-flex align-items-center gap-1" style={{ textDecoration: 'none', fontWeight: 600 }}>
                <RiCustomerService2Fill /> <span>{t('contact')}</span>
              </a>

              {isAdmin && (
                <a href="/admin" className="nav-link text-danger d-flex align-items-center gap-1 fw-bold" style={{ textDecoration: 'none' }}>
                  <FaUserShield /> <span>Admin Console</span>
                </a>
              )}
            </div>

            {/* Utilities (Theme, Lang, Profile) */}
            <div className="navbar-icons d-flex align-items-center gap-3 ms-4">
              
              {/* Theme Toggle */}
              <button className="btn btn-link text-success p-0 fs-5" onClick={toggleTheme} title="Toggle Theme">
                {isDark ? <FaSun /> : <FaMoon />}
              </button>

              {/* Language Switcher */}
              <div className="lang-dropdown" style={{ position: 'relative' }}>
                <button 
                  className="btn btn-link text-success p-0 fs-5 d-flex align-items-center"
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                >
                  <FaGlobe />
                </button>
                {showLangDropdown && (
                  <div className="dropdown-menu show p-1 border-0 shadow" style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-card)', minWidth: '90px' }}>
                    <button className="dropdown-item py-2 text-center" onClick={() => { selectLanguage('en'); setShowLangDropdown(false); }} style={{ color: 'var(--text-color)' }}>English</button>
                    <button className="dropdown-item py-2 text-center" onClick={() => { selectLanguage('hi'); setShowLangDropdown(false); }} style={{ color: 'var(--text-color)' }}>हिंदी</button>
                    <button className="dropdown-item py-2 text-center" onClick={() => { selectLanguage('te'); setShowLangDropdown(false); }} style={{ color: 'var(--text-color)' }}>తెలుగు</button>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="notification-panel" style={{ position: 'relative' }}>
                <button 
                  className="btn btn-link text-success p-0 position-relative fs-5"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <FaBell />
                  {realNotifications.length > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                      {realNotifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="dropdown-menu show p-3 border-0 shadow-lg" style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-card)', width: '280px', borderRadius: '12px' }}>
                    <h6 className="fw-bold mb-2 text-success">Alert Notification Panel</h6>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {realNotifications.length > 0 ? (
                        realNotifications.map(n => (
                          <div key={n._id} className="p-2 rounded text-start" style={{ background: 'rgba(0,0,0,0.03)', fontSize: '0.85rem', color: 'var(--text-color)', borderLeft: '3px solid #198754' }}>
                            <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              <span className="badge bg-secondary" style={{ fontSize: '8px' }}>{n.targetRole}</span>
                              <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>{n.message}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-center text-muted small">No new notifications.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="profile-dropdown" style={{ position: 'relative' }}>
                <button 
                  className="btn btn-link text-success p-0 fs-5 d-flex align-items-center"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <FaUser />
                </button>
                {showProfileDropdown && (
                  <div className="dropdown-menu show p-2 border-0 shadow" style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-card)', minWidth: '150px' }}>
                    {isAdmin && (
                      <a href="/admin" className="dropdown-item py-2" style={{ color: 'var(--text-color)', fontWeight: 600 }}>{t('adminPanel')}</a>
                    )}
                    <a href="/aboutus" className="dropdown-item py-2" style={{ color: 'var(--text-color)' }}>{t('about')}</a>
                    <a href="/my-orders" className="dropdown-item py-2" style={{ color: 'var(--text-color)' }}>My Orders</a>
                    <button className="dropdown-item py-2 text-danger border-0 bg-transparent text-start" onClick={handleLogout}>{t('logout')}</button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Mobile Menu Icon */}
        {isMobileView && (
          <button className="mobile-menu-btn btn btn-link text-success fs-4" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileView && mobileMenuOpen && (
        <div className="mobile-menu p-3" style={{ background: 'var(--bg-card)' }}>
          <div className="d-flex flex-column gap-3">
            <a href="/dashboard" className="nav-link text-success" onClick={() => setMobileMenuOpen(false)}>{t('home')}</a>
            {user?.role !== 'customer' && (
              <a href="/testing" className="nav-link text-success" onClick={() => setMobileMenuOpen(false)}>{t('testing')}</a>
            )}
            <a href="/mandi" className="nav-link text-success" onClick={() => setMobileMenuOpen(false)}>{t('pricing')}</a>
            <a href="/weather" className="nav-link text-success" onClick={() => setMobileMenuOpen(false)}>{t('weather')}</a>
            {user?.role !== 'customer' && (
              <a href="/fertilizer" className="nav-link text-success" onClick={() => setMobileMenuOpen(false)}>Fertilizer Advisor</a>
            )}
            <a href="/subsidies" className="nav-link text-success" onClick={() => setMobileMenuOpen(false)}>{t('schemes')}</a>
            <a href="/shop" className="nav-link text-success" onClick={() => setMobileMenuOpen(false)}>Shop catalog</a>
            <a href="/my-orders" className="nav-link text-success" onClick={() => setMobileMenuOpen(false)}>My Orders</a>
            <a href="/donate" className="nav-link text-success" onClick={() => setMobileMenuOpen(false)}>{t('donate')}</a>
            <a href="/aboutus" className="nav-link text-success" onClick={() => setMobileMenuOpen(false)}>{t('about')}</a>
            {isAdmin && (
              <a href="/admin" className="nav-link text-danger fw-bold" onClick={() => setMobileMenuOpen(false)}>{t('adminPanel')}</a>
            )}
            <button className="btn btn-outline-danger btn-sm text-start" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
