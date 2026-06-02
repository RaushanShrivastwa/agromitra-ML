import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import NewsSlider from './NewsSlider';
import RecommendedFeatures from './RecommendedFeatures';
import Services from './ServiceSection';
import Footer from './footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('farmer');
  const { t } = useLanguage();

  useEffect(() => {
    if (user) {
      const savedView = localStorage.getItem('admin_dashboard_view');
      if (user.role === 'admin' && savedView) {
        setViewMode(savedView);
        localStorage.removeItem('admin_dashboard_view');
      } else if (user.role === 'customer') {
        setViewMode('customer');
      } else {
        setViewMode('farmer');
      }
    }
  }, [user]);

  return (
    <>
      {user?.role === 'admin' && (
        <div className="bg-success text-white p-3 d-flex flex-wrap justify-content-between align-items-center px-4 shadow-sm border-bottom border-light">
          <span className="fw-bold fs-5">{t('adminConsoleSim') || '🛠️ Admin Console Simulator'}</span>
          <div className="d-flex align-items-center gap-2">
            <span className="me-2 small fw-semibold">{t('viewMode') || 'View Mode:'}</span>
            <button className={`btn btn-sm ${viewMode === 'farmer' ? 'btn-light text-success fw-bold' : 'btn-outline-light'}`} onClick={() => setViewMode('farmer')}>{t('farmerDashboard') || 'Farmer Dashboard'}</button>
            <button className={`btn btn-sm ${viewMode === 'customer' ? 'btn-light text-success fw-bold' : 'btn-outline-light'}`} onClick={() => setViewMode('customer')}>{t('customerDashboard') || 'Customer Dashboard'}</button>
            <a href="/admin" className="btn btn-sm btn-dark fw-bold ms-3 px-3">{t('backToAdmin') || '← Back to Admin Console'}</a>
          </div>
        </div>
      )}
      <Navbar />
      <NewsSlider />
      <Services viewMode={viewMode} />
      <RecommendedFeatures viewMode={viewMode} />
      <Footer />
    </>
  );
};

export default Dashboard;
