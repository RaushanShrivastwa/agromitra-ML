import React from 'react';
import Navbar from './Navbar';
import Footer from './footer';
import { useLanguage } from '../context/LanguageContext';
import { FaGraduationCap, FaSeedling, FaMapMarkerAlt, FaFlask } from 'react-icons/fa';

export default function AboutUs() {
  const { t } = useLanguage();
  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-body)' }}>
      <Navbar />
      <div className="container py-5 text-center" style={{ marginTop: '100px', maxWidth: '800px' }}>
        <div className="card shadow border-0 p-5 mb-4" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', borderRadius: '20px' }}>
          <div className="mb-4 text-success fs-1">
            <FaSeedling />
          </div>
          <h1 style={{ fontWeight: 800 }}>{t('about') || 'About AgroMitra'}</h1>
          <p className="lead text-muted mt-3" style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
            {t('aboutDesc') || 'AgroMitra is a state-of-the-art agricultural advisory platform built to empower local Indian farmers. By leveraging machine learning, we provide real-time recommendations for soil fertilizing, crop price alerts (Mandi), weather prediction advisories, and matched government subsidies.'}
          </p>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="card shadow border-0 p-4 text-start h-100" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', borderRadius: '15px' }}>
              <h4 className="fw-bold text-success d-flex align-items-center mb-3">
                <FaFlask className="me-2" /> {t('aboutMission') || 'Our Mission'}
              </h4>
              <p className="text-muted" style={{ lineHeight: '1.6' }}>
                {t('aboutMissionDesc') || 'To bridge the gap between technology and traditional farming. We help farmers maximize yield and promote sustainability through scientific soil management and real-time alerts.'}
              </p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow border-0 p-4 text-start h-100" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', borderRadius: '15px' }}>
              <h4 className="fw-bold text-success d-flex align-items-center mb-3">
                <FaGraduationCap className="me-2" /> {t('aboutTeam') || 'VIT-AP Development Team'}
              </h4>
              <p className="text-muted mb-1">{t('aboutTeamDesc') || 'Developed as a Capstone Initiative at VIT-AP University.'}</p>
              <address className="text-muted small mb-0">
                <strong>{t('projectLeads') || 'Project Leads'}:</strong> Vrishank Raina & Raushan Shrivastawa<br />
                <strong>{t('emailLabelShort') || 'Email'}:</strong> vrishank.raushan@agromitra.com<br />
                <strong>{t('locationLabelShort') || 'Location'}:</strong> Amaravati, Andhra Pradesh, India
              </address>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
