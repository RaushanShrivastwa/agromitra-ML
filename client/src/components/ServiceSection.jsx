import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ServiceSection.css';
import { FaPhoneAlt, FaEnvelope, FaHistory, FaArrowRight, FaTimes } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const ServicesSection = ({ viewMode }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [recentServices, setRecentServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentLogs = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/dashboard', {
          headers: {
            'Authorization': token || ''
          }
        });
        const data = await res.json();
        if (res.ok && data.logs) {
          const mapped = data.logs.map((log, idx) => {
            let title = t('recentServices') || "AgroMitra Service";
            let route = "/dashboard";
            let status = log.status || "Completed";
            let actionText = status === "In Progress" ? (t('continueBtn') || "Continue") : (t('openBtn') || "Open");

            const action = log.action || '';
            if (action.includes("Weather")) {
              title = t('weatherPrediction') || "Weather Prediction";
              route = "/weather";
              if (status !== "In Progress") actionText = t('forecastBtn') || "Forecast";
            } else if (action.includes("Fertilizer")) {
              title = t('fertilizerRecommendation') || "Fertilizer Recommendation";
              route = "/fertilizer";
              if (status !== "In Progress") actionText = t('advisoryBtn') || "Advisory";
            } else if (action.includes("Subsidies") || action.includes("Subsidy")) {
              title = t('subsidiesMatcher') || "Subsidies Matcher";
              route = "/subsidies";
              if (status !== "In Progress") actionText = t('matcherBtn') || "Matcher";
            } else if (action.includes("Soil")) {
              title = t('soilTestingRequest') || "Soil Testing Request";
              route = "/testing";
              if (status !== "In Progress") actionText = t('trackBtn') || "Track";
            } else if (action.includes("Listed crop")) {
              title = t('marketplaceListing') || "Marketplace Listing";
              route = "/mandi";
              if (status !== "In Progress") actionText = t('viewBtn') || "View";
            } else if (action.includes("payment") || action.includes("Order")) {
              title = t('productPurchase') || "Product Purchase";
              route = "/shop";
              if (status !== "In Progress") actionText = t('backToShop') || "Shop";
            }

            const dateStr = new Date(log.timestamp).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return {
              id: log._id || idx,
              title,
              date: dateStr,
              status,
              action: actionText,
              route
            };
          });

          const filtered = mapped.filter(item => {
            if (viewMode === 'customer') {
              return item.route !== '/testing' && item.route !== '/fertilizer';
            }
            return true;
          });

          setAllServices(filtered);
          // Limit to 3 items for inline view
          setRecentServices(filtered.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentLogs();
  }, [viewMode, t]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    if (showModal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showModal]);

  return (
    <div className="services-container">
      <div className="dual-card-section">
        {/* Recently Used Services Card */}
        <div className="service-card recent-services">
          <div className="card-header">
            <h2><FaHistory className="card-icon" /> {t('recentServices') || 'Recently Used Services'}</h2>
          </div>
          
          <div className="services-list">
            {loading ? (
              <div className="text-center p-3 text-muted">{t('loadingActivities') || 'Loading activities...'}</div>
            ) : recentServices.length === 0 ? (
              <div className="text-center p-3 text-muted">
                {viewMode === 'customer'
                  ? (t('noRecentActivityCustomer') || "No recent activity. Try checking our weather predictions or deals shop!")
                  : (t('noRecentActivityFarmer') || "No recent activity. Try checking our weather predictions or fertilizer advisories below!")}
              </div>
            ) : (
              recentServices.map(service => (
                <div key={service.id} className="service-item">
                  <div className="service-info">
                    <h3>{service.title}</h3>
                    <div className="service-meta">
                      <span className="service-date">{service.date}</span>
                      <span className={`service-status ${service.status.toLowerCase().replace(' ', '-')}`}>
                        {service.status === 'Completed' ? (t('statusCompleted') || 'Completed') :
                         service.status === 'Analyzing' ? (t('statusAnalyzing') || 'Analyzing') :
                         service.status === 'Collected' ? (t('statusCollected') || 'Collected') :
                         service.status === 'Processing' ? (t('statusProcessing') || 'Processing') :
                         service.status === 'Shipped' ? (t('statusShipped') || 'Shipped') :
                         service.status === 'Delivered' ? (t('statusDelivered') || 'Delivered') :
                         service.status === 'Cancelled' ? (t('statusCancelled') || 'Cancelled') : service.status}
                      </span>
                    </div>
                  </div>
                  <button className="service-action" onClick={() => navigate(service.route)}>
                    {service.action} <FaArrowRight className="action-icon" />
                  </button>
                </div>
              ))
            )}
          </div>
          
          <button className="view-all-btn" onClick={() => setShowModal(true)}>
            {t('viewAllServices') || 'View All Services'} <FaArrowRight className="action-icon" />
          </button>
        </div>

        {/* Support Assistance Card */}
        <div className="service-card support-assistance">
          <div className="card-header">
            <h2>{t('supportTitle') || 'Need Assistance?'}</h2>
            <p className="support-description">
              {t('supportDesc') || 'Our agricultural experts are available 24/7 to help you with any questions or issues you may have regarding our services.'}
            </p>
          </div>
          
          <div className="support-options">
            <a href="tel:+919821656724" className="support-btn call-btn text-decoration-none d-inline-flex align-items-center justify-content-center">
              <FaPhoneAlt className="btn-icon me-2" /> {t('callNow') || 'Call Now'}
            </a>
            <a href="mailto:vrishank.raushan@agromitra.com" className="support-btn email-btn text-decoration-none d-inline-flex align-items-center justify-content-center">
              <FaEnvelope className="btn-icon me-2" /> {t('emailNow') || 'Email Now'}
            </a>
          </div>
          
          <div className="support-details">
            <div className="support-info">
              <h4>{t('customerCare') || 'Customer Care'}</h4>
              <p>+91 9821656724</p>
            </div>
            <div className="support-info">
              <h4>{t('emailSupport') || 'Email Support'}</h4>
              <p>support@agromitra.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal Overlay */}
      {showModal && (
        <div className="history-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h2>
                <FaHistory className="card-icon" /> {t('serviceHistoryLogs') || 'Service History Logs'}
              </h2>
              <button className="close-modal-btn" onClick={() => setShowModal(false)} aria-label={t('closeModal') || 'Close modal'}>
                <FaTimes />
              </button>
            </div>
            <div className="history-modal-body">
              {allServices.length === 0 ? (
                <div className="text-center p-4 text-muted">{t('noActivitiesFound') || 'No activities found.'}</div>
              ) : (
                <div className="history-modal-list">
                  {allServices.map((service) => (
                    <div key={service.id} className="history-modal-item">
                      <div className="service-info">
                        <h3>{service.title}</h3>
                        <div className="service-meta">
                          <span className="service-date">{service.date}</span>
                          <span className={`service-status ${service.status.toLowerCase().replace(' ', '-')}`}>
                            {service.status === 'Completed' ? (t('statusCompleted') || 'Completed') :
                             service.status === 'Analyzing' ? (t('statusAnalyzing') || 'Analyzing') :
                             service.status === 'Collected' ? (t('statusCollected') || 'Collected') :
                             service.status === 'Processing' ? (t('statusProcessing') || 'Processing') :
                             service.status === 'Shipped' ? (t('statusShipped') || 'Shipped') :
                             service.status === 'Delivered' ? (t('statusDelivered') || 'Delivered') :
                             service.status === 'Cancelled' ? (t('statusCancelled') || 'Cancelled') : service.status}
                          </span>
                        </div>
                      </div>
                      <button
                        className="service-action"
                        onClick={() => {
                          setShowModal(false);
                          navigate(service.route);
                        }}
                      >
                        {service.action} <FaArrowRight className="action-icon" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesSection;