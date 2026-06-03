import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './footer';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { FaPaperPlane } from 'react-icons/fa';

function ContactUs() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.username || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(t('querySuccess') || 'Your message has been submitted successfully! Our team will get back to you shortly.');
        setFormData({
          name: user?.username || '',
          email: user?.email || '',
          subject: '',
          message: ''
        });
      } else {
        alert(data.message || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container my-5 animate-fade-in" style={{ minHeight: '70vh' }}>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-lg border-0 rounded-4 p-4 p-md-5" style={{ background: 'var(--bg-card)', color: 'var(--text-body)' }}>
              <div className="text-center mb-5">
                <h1 className="fw-bold text-success mb-2">{t('contactUsTitle') || 'Contact Us / Support'}</h1>
                <p className="text-muted">{t('contactUsSubtitle') || 'Have questions or feedback? Send us a query and our experts will reply promptly.'}</p>
              </div>

              {successMsg && (
                <div className="alert alert-success border-0 shadow-sm mb-4 rounded-3">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <label className="form-label fw-semibold">{t('nameLabel') || 'Name'}</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control rounded-3 p-2 text-muted"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('contactNamePlaceholder') || 'Enter your name'}
                      style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid #ccc', opacity: 0.8 }}
                      readOnly
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('emailLabel') || 'Email Address'}</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control rounded-3 p-2 text-muted"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('contactEmailPlaceholder') || 'Enter your email'}
                      style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid #ccc', opacity: 0.8 }}
                      readOnly
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('subjectLabel') || 'Subject'}</label>
                  <input
                    type="text"
                    name="subject"
                    className="form-control rounded-3 p-2"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={t('subjectPlaceholder') || 'What is this regarding?'}
                    style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid #ccc' }}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">{t('messageLabel') || 'Your Message / Inquiry'}</label>
                  <textarea
                    name="message"
                    rows="5"
                    className="form-control rounded-3 p-2"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t('messagePlaceholder') || 'Describe your inquiry in detail...'}
                    style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid #ccc' }}
                    required
                  ></textarea>
                </div>

                <div className="d-grid">
                  <button type="submit" className="btn btn-success btn-lg rounded-3 fw-bold shadow-sm" disabled={loading}>
                    {loading ? (t('sending') || 'Submitting...') : (
                      <>
                        <FaPaperPlane className="me-2" /> {t('submitQuery') || 'Submit Inquiry'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ContactUs;
