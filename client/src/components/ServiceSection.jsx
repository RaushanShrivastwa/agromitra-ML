import React from 'react';
import '../styles/ServiceSection.css';
import { FaPhoneAlt, FaEnvelope, FaHistory, FaArrowRight } from 'react-icons/fa';

const ServicesSection = () => {
  // Sample recently used services data
  const recentServices = [
    {
      id: 1,
      title: "Soil Testing Report",
      date: "Today, 10:30 AM",
      status: "Completed",
      action: "View Details"
    },
    {
      id: 2,
      title: "Weather Forecast",
      date: "Yesterday, 3:45 PM",
      status: "In Progress",
      action: "Continue"
    },
    {
      id: 3,
      title: "Crop Advisory",
      date: "2 days ago",
      status: "Pending Review",
      action: "View Details"
    }
  ];

  return (
    <div className="services-container">
      <div className="dual-card-section">
        {/* Recently Used Services Card */}
        <div className="service-card recent-services">
          <div className="card-header">
            <h2><FaHistory className="card-icon" /> Recently Used Services</h2>
          </div>
          
          <div className="services-list">
            {recentServices.map(service => (
              <div key={service.id} className="service-item">
                <div className="service-info">
                  <h3>{service.title}</h3>
                  <div className="service-meta">
                    <span className="service-date">{service.date}</span>
                    <span className={`service-status ${service.status.toLowerCase().replace(' ', '-')}`}>
                      {service.status}
                    </span>
                  </div>
                </div>
                <button className="service-action">
                  {service.action} <FaArrowRight className="action-icon" />
                </button>
              </div>
            ))}
          </div>
          
          <button className="view-all-btn">
            View All Services <FaArrowRight className="action-icon" />
          </button>
        </div>

        {/* Support Assistance Card */}
        <div className="service-card support-assistance">
          <div className="card-header">
            <h2>Need Assistance?</h2>
            <p className="support-description">
              Our agricultural experts are available 24/7 to help you with any questions or issues you may have regarding our services.
            </p>
          </div>
          
          <div className="support-options">
            <button className="support-btn call-btn">
              <FaPhoneAlt className="btn-icon" /> Call Now
            </button>
            <button className="support-btn email-btn">
              <FaEnvelope className="btn-icon" /> Email Now
            </button>
          </div>
          
          <div className="support-details">
            <div className="support-info">
              <h4>Customer Care</h4>
              <p>+1 (800) 123-4567</p>
            </div>
            <div className="support-info">
              <h4>Email Support</h4>
              <p>support@agrihub.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesSection;