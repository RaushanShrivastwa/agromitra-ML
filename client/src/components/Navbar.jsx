import React, { useState, useEffect } from 'react';
// Correct import path for react-icons/fa. Ensure 'react-icons' package is installed.
import { FaHome, FaBell, FaUser, FaSearch, FaChevronDown,FaDonate, FaBars, FaTimes } from 'react-icons/fa';
import { RiCustomerService2Fill } from "react-icons/ri";
import { MdOutlineMiscellaneousServices } from "react-icons/md";
// Correct relative import path for Navbar.css. Ensure Navbar.css is in the same directory.
import '../styles/Navbar.css';

const Navbar = () => {
  // State for managing locations and selected location
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('Select Location');

  // State for managing dropdown visibility
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // State for search input
  const [searchQuery, setSearchQuery] = useState('');

  // State for mobile menu and responsive viewports
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isTabletView, setIsTabletView] = useState(false);

  // Effect to handle window resizing and update view states
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Define breakpoints
      setIsMobileView(width <= 768); // Mobile view when width is 768px or less
      setIsTabletView(width > 768 && width <= 1024); // Tablet view when width is between 769px and 1024px
      
      // Close mobile menu if resized to tablet/desktop view
      if (width > 768) {
        setMobileMenuOpen(false);
      }
      // Close dropdowns if resized to desktop/tablet view
      if (width > 1024) {
        setShowLocationDropdown(false);
        setShowServicesDropdown(false);
        setShowProfileDropdown(false);
      }
    };

    // Set initial view state on component mount
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    // Cleanup event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleanup on unmount

  // Mock API call to fetch locations
  useEffect(() => {
    const mockLocations = [
      { id: 1, name: 'New Delhi', recent: true },
      { id: 2, name: 'Mumbai', recent: true },
      { id: 3, name: 'Bangalore', recent: false },
      { id: 4, name: 'Hyderabad', recent: false },
      { id: 5, name: 'Chennai', recent: false },
    ];
    setLocations(mockLocations);
  }, []); // Runs once on mount

  // Handler for selecting a location from the dropdown
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false); // Close dropdown after selection
  };

  // Handler for toggling the mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo - AgriHub as per the image */}
        <div className="navbar-brand">
          <a href="/" className="logo">AgriHub</a>
        </div>

        {/* Desktop & Tablet Search Bar */}
        {!(isMobileView && mobileMenuOpen) && ( // Only show search bar if not in mobile view or mobile menu is closed
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search services..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-btn">
              <FaSearch />
            </button>
          </div>
        )}

        {/* Desktop Navigation (Visible on desktop, and tablet where specified) */}
        {!isMobileView && (
          <div className="desktop-nav">
            {/* Location Selector - Visible on Desktop only, not on Tablet in this layout */}
            {!isTabletView && ( // Only show location selector on full desktop
                <div className="location-selector">
                    <button 
                        className="location-btn"
                        onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    >
                        {selectedLocation} <FaChevronDown className="dropdown-icon" />
                    </button>
                    {showLocationDropdown && (
                        <div className="location-dropdown">
                            <div className="dropdown-header">Recent Locations</div>
                            {locations.filter(loc => loc.recent).map(location => (
                                <div 
                                    key={location.id} 
                                    className="dropdown-item"
                                    onClick={() => handleLocationSelect(location.name)}
                                >
                                    {location.name}
                                </div>
                            ))}
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-header">All Locations</div>
                            {locations.map(location => (
                                <div 
                                    key={location.id} 
                                    className="dropdown-item"
                                    onClick={() => handleLocationSelect(location.name)}
                                >
                                    {location.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Main Navigation Links */}
            <div className="navbar-links">
                {/* Home Link */}
                <a href="/" className="nav-link">
                    <FaHome className="nav-icon" /> 
                    {/* Show text only on desktop, hide on tablet */}
                    {!(isTabletView) && <span className="nav-link-text">Home</span>}
                </a>
                
                {/* Services Dropdown */}
                <div 
                    className="nav-link dropdown-trigger"
                    onMouseEnter={() => setShowServicesDropdown(true)}
                    onMouseLeave={() => setShowServicesDropdown(false)}
                >
                    {/* Show text only on desktop, hide on tablet */}
                    {!(isTabletView) && <span className="nav-link-text"><MdOutlineMiscellaneousServices className="nav-icon" />Services</span>} 
                    <FaChevronDown className="dropdown-icon" />
                    {showServicesDropdown && (
                        <div className="services-dropdown">
                            <a href="/reports" className="dropdown-item">Reports</a>
                            <a href="/pricing" className="dropdown-item">Pricing</a>
                            <a href="/weather" className="dropdown-item">Weather</a>
                            <a href="/testing" className="dropdown-item">Testing</a>
                            <a href="/schemes" className="dropdown-item">Schemes</a>
                        </div>
                    )}
                </div>
                
                {/* Donate Link */}
                <a href="/donate" className="nav-link">
                <FaDonate className="nav-icon" /> 
                    {/* No icon for Donate in image, but can be added if desired */}
                    {!(isTabletView) && <span className="nav-link-text">Donate</span>}
                </a>
                
                {/* Contact Us Link */}
                <a href="/contact" className="nav-link">
                <RiCustomerService2Fill className="nav-icon"/>
                    {!(isTabletView) && <span className="nav-link-text">Contact Us</span>}
                </a>
            </div>

            {/* Notification & Profile Icons */}
            <div className="navbar-icons">
                {/* Notification Icon */}
                <button className="icon-btn notification-btn">
                    <FaBell />
                    <span className="notification-badge">3</span> {/* As per image */}
                </button>
                
                {/* Profile Dropdown */}
                <div 
                    className="profile-dropdown"
                    onMouseEnter={() => setShowProfileDropdown(true)}
                    onMouseLeave={() => setShowProfileDropdown(false)}
                >
                    <button className="icon-btn profile-btn">
                        <FaUser /> 
                        <FaChevronDown className="dropdown-icon" />
                    </button>
                    {showProfileDropdown && (
                        <div className="profile-dropdown-content">
                            <a href="/profile" className="dropdown-item">Manage Profile</a>
                            <a href="/theme" className="dropdown-item">Change Theme</a>
                            <a href="/aboutus" className="dropdown-item">About Us</a>
                            <div className="dropdown-divider"></div>
                            <a href="/login" className="dropdown-item">Logout</a>
                        </div>
                    )}
                </div>
            </div>
          </div>
        )}

        {/* Mobile Elements (Hamburger Menu) */}
        {isMobileView && (
          <div className="mobile-elements">
            {/* The image doesn't show a search icon on mobile, but if desired, it can be added here.
                The search bar will be inside the mobile menu. */}
            <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
              {mobileMenuOpen ? <FaTimes /> : <FaBars />} {/* Toggle icon based on menu state */}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu (Conditionally rendered when open on mobile view) */}
      {isMobileView && mobileMenuOpen && (
        <div className="mobile-menu">
          {/* Mobile Search Bar */}
          <div className="mobile-search-bar">
            <input 
              type="text" 
              placeholder="Search services..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-btn">
              <FaSearch />
            </button>
          </div>

          {/* Mobile Location Selector */}
          <div className="mobile-location-selector">
            <button 
              className="location-btn"
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            >
              {selectedLocation} <FaChevronDown className="dropdown-icon" />
            </button>
            {showLocationDropdown && (
              <div className="location-dropdown">
                <div className="dropdown-header">Recent Locations</div>
                {locations.filter(loc => loc.recent).map(location => (
                  <div 
                    key={location.id} 
                    className="dropdown-item"
                    onClick={() => handleLocationSelect(location.name)}
                  >
                    {location.name}
                  </div>
                ))}
                <div className="dropdown-divider"></div>
                <div className="dropdown-header">All Locations</div>
                {locations.map(location => (
                  <div 
                    key={location.id} 
                    className="dropdown-item"
                    onClick={() => handleLocationSelect(location.name)}
                  >
                    {location.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Navigation Links */}
          <div className="mobile-nav-links">
            <a href="/" className="nav-link" onClick={toggleMobileMenu}>
              <FaHome className="nav-icon" /> Home
            </a>
            
            {/* Services Dropdown for Mobile */}
            <div 
              className="nav-link mobile-dropdown-trigger"
              onClick={() => setShowServicesDropdown(!showServicesDropdown)}
            >
              <MdOutlineMiscellaneousServices className="nav-icon" />Services <FaChevronDown className={`dropdown-icon ${showServicesDropdown ? 'rotate' : ''}`} />
              {showServicesDropdown && (
                <div className="mobile-services-dropdown">
                  <a href="/reports" className="dropdown-item" onClick={toggleMobileMenu}>Reports</a>
                  <a href="/pricing" className="dropdown-item" onClick={toggleMobileMenu}>Pricing</a>
                  <a href="/weather" className="dropdown-item" onClick={toggleMobileMenu}>Weather</a>
                  <a href="/testing" className="dropdown-item" onClick={toggleMobileMenu}>Testing</a>
                  <a href="/schemes" className="dropdown-item" onClick={toggleMobileMenu}>Schemes</a>
                </div>
              )}
            </div>
            
            <a href="/donate" className="nav-link" onClick={toggleMobileMenu}><FaDonate className="nav-icon" />Donate</a>
            <a href="/contact" className="nav-link" onClick={toggleMobileMenu}><RiCustomerService2Fill className="nav-icon" />Contact Us</a>
          </div>

          {/* Mobile Nav Footer (Notifications and Profile Options) */}
          <div className="mobile-nav-footer">
            <div className="mobile-notification">
              <FaBell /> Notifications
              <span className="notification-badge">3</span>
            </div>
            <div 
                    className="profile-dropdown"
                    onMouseEnter={() => setShowProfileDropdown(true)}
                    onMouseLeave={() => setShowProfileDropdown(false)}
                >
                    <button className="icon-btn profile-btn">
                        <FaUser /> 
                        <FaChevronDown className="dropdown-icon" />
                    </button>
                    {showProfileDropdown && (
                        <div className="profile-dropdown-content">
                            <a href="/profile" className="dropdown-item">Manage Profile</a>
                            <a href="/theme" className="dropdown-item">Change Theme</a>
                            <a href="/about" className="dropdown-item">About Us</a>
                            <div className="dropdown-divider"></div>
                            <a href="/logout" className="dropdown-item">Logout</a>
                        </div>
                    )}
                </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
