import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './footer';
import { useLanguage } from '../context/LanguageContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaFlask, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import '../styles/Verify.css'; // Let's create Testing.css later or style inline for premium look

export default function Testing() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/soil/my-requests', {
        headers: { 'Authorization': localStorage.getItem('token') }
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/soil/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({ address, collectionDate })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Soil sample collection request submitted successfully!');
        setAddress('');
        setCollectionDate('');
        fetchMyRequests();
      } else {
        alert(data.message || 'Submission failed');
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'bg-success';
      case 'Analyzing': return 'bg-info text-dark';
      case 'Collected': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  };

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-body)' }}>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '80px' }}>
        <div className="row g-4">
          {/* Request Form */}
          <div className="col-md-5">
            <div className="card shadow border-0 p-4" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', backdropFilter: 'blur(10px)', borderRadius: '15px' }}>
              <h2 className="mb-4 d-flex align-items-center" style={{ fontWeight: 700, color: 'var(--text-color)' }}>
                <FaFlask className="me-2" /> {t('requestSoilTestTitle') || 'Request Soil Test'}
              </h2>
              <p className="text-muted">{t('requestSoilTestDesc') || 'Schedule a physical soil sample collection from your farm. Our experts will test and upload your soil health report.'}</p>
              
              <form onSubmit={handleSubmit} className="mt-3">
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center"><FaMapMarkerAlt className="me-2 text-success" /> {t('farmLocationAddress') || 'Farm Location / Address'}</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder={t('farmAddressPlaceholder') || 'Enter full farm address for sample pickup'}
                    required
                    style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label d-flex align-items-center"><FaCalendarAlt className="me-2 text-success" /> {t('preferredCollectionDate') || 'Preferred Collection Date'}</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={collectionDate} 
                    onChange={e => setCollectionDate(e.target.value)} 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <button type="submit" className="btn btn-success w-100 py-2" disabled={submitting} style={{ fontWeight: 600, borderRadius: '8px' }}>
                  {submitting ? (t('sending') || 'Submitting...') : (t('schedulePickup') || 'Schedule Pickup')}
                </button>
              </form>
            </div>
          </div>

          {/* Requests History & Reports */}
          <div className="col-md-7">
            <div className="card shadow border-0 p-4" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', borderRadius: '15px' }}>
              <h3 className="mb-4" style={{ fontWeight: 700 }}>{t('yourSoilReports') || 'Your Soil Reports & Requests'}</h3>
              
              {loading ? (
                <div className="text-center py-5">
                  <FaSpinner className="spinner-border spinner-border-sm text-success" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p>{t('noSoilRequests') || 'No soil test requests scheduled yet.'}</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {requests.map((req) => (
                    <div key={req._id} className="card p-3 border-0 shadow-sm" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: '5px solid var(--text-color)' }}>
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div>
                          <span className={`badge ${getStatusBadgeClass(req.status)} mb-2`}>
                            {req.status === 'Completed' ? (t('statusCompleted') || 'Completed') :
                             req.status === 'Analyzing' ? (t('statusAnalyzing') || 'Analyzing') :
                             req.status === 'Collected' ? (t('statusCollected') || 'Collected') : req.status}
                          </span>
                          <p className="mb-1"><strong>{t('pickupAddress') || 'Pickup Address'}:</strong> {req.address}</p>
                          <small className="text-muted"><strong>{t('scheduledCollection') || 'Scheduled Collection'}:</strong> {new Date(req.collectionDate).toLocaleDateString()}</small>
                        </div>
                        {req.status === 'Completed' && (
                          <button 
                            className="btn btn-sm btn-outline-success d-flex align-items-center"
                            onClick={() => navigate('/fertilizer', { state: { report: req } })}
                          >
                            <FaCheckCircle className="me-1" /> {t('getAdvisorRec') || 'Get Advisor Rec'}
                          </button>
                        )}
                      </div>

                      {req.status === 'Completed' && (
                        <div className="row g-2 mt-3 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                          <div className="col-3 col-sm-2 text-center">
                            <small className="text-muted d-block">{t('nitrogenLabel') || 'Nitrogen (N)'}</small>
                            <strong className="fs-5">{req.nitrogen}</strong>
                          </div>
                          <div className="col-3 col-sm-2 text-center">
                            <small className="text-muted d-block">{t('phosphorusLabel') || 'Phosphorus (P)'}</small>
                            <strong className="fs-5">{req.phosphorous}</strong>
                          </div>
                          <div className="col-3 col-sm-2 text-center">
                            <small className="text-muted d-block">{t('potassiumLabel') || 'Potassium (K)'}</small>
                            <strong className="fs-5">{req.potassium}</strong>
                          </div>
                          <div className="col-3 col-sm-2 text-center">
                            <small className="text-muted d-block">pH</small>
                            <strong className="fs-5">{req.ph}</strong>
                          </div>
                          <div className="col-6 col-sm-2 text-center">
                            <small className="text-muted d-block">{t('moistureLabel') || 'Moisture'}</small>
                            <strong className="fs-5">{req.moisture}%</strong>
                          </div>
                          <div className="col-6 col-sm-2 text-center">
                            <small className="text-muted d-block">{t('soilTypeLabel') || 'Soil Type'}</small>
                            <strong className="fs-6 d-block text-truncate">{req.soilType}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
