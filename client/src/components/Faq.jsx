import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './footer';
import { useLanguage } from '../context/LanguageContext';
import { FaSearch, FaQuestionCircle, FaAngleDown, FaAngleUp, FaPaperPlane } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function Faq() {
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [openFaqId, setOpenFaqId] = useState(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await fetch('/api/faqs');
      const data = await res.json();
      if (res.ok) {
        setFaqs(data.faqs || []);
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResult(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/ml/query/website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      if (res.ok) {
        setSearchResult(data);
      } else {
        setSearchResult({ answer: "I couldn't search right now. Please try again later." });
      }
    } catch (err) {
      console.error(err);
      setSearchResult({ answer: "Network error occurred. Please make sure the services are running." });
    } finally {
      setSearching(false);
    }
  };

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <>
      <Navbar />
      <div className="container my-5 animate-fade-in" style={{ minHeight: '80vh' }}>
        <div className="text-center mb-5">
          <h1 className="fw-bold text-success mb-2">{t('faqTitle') || 'AgroMitra Help Center'}</h1>
          <p className="text-muted">{t('faqSubtitle') || 'Find answers to common questions or ask our AI assistant anything about our services.'}</p>
        </div>

        {/* AI FAQ Search Bar */}
        <div className="row justify-content-center mb-5">
          <div className="col-md-8">
            <div className="card shadow border-0 rounded-4 p-4" style={{ background: 'var(--bg-card)', color: 'var(--text-color)' }}>
              <h4 className="fw-bold text-success mb-3 d-flex align-items-center">
                <FaSearch className="me-2" /> {t('aiSearchTitle') || 'Ask AgroMitra AI Assistant'}
              </h4>
              <form onSubmit={handleSearch} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control rounded-3 p-3"
                  placeholder={t('aiSearchPlaceholder') || "Type your question here (e.g. 'Who built this?' or 'How does soil testing work?')..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'var(--bg-input)', color: 'var(--text-color)', border: '1px solid #ccc' }}
                  required
                />
                <button type="submit" className="btn btn-success px-4 rounded-3 fw-bold" disabled={searching}>
                  {searching ? t('searching') || 'Searching...' : t('search') || 'Ask'}
                </button>
              </form>

              {searchResult && (
                <div className="mt-4 p-4 rounded-3 border-start border-4 border-success" style={{ background: 'rgba(25, 135, 84, 0.05)' }}>
                  <h5 className="fw-bold text-success mb-2">
                    {searchResult.question ? `${t('matchedQuestion') || 'Matched Question'}: ${searchResult.question}` : (t('aiResponse') || 'AI Response')}
                  </h5>
                  <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-line' }}>{searchResult.answer}</p>
                  {searchResult.score !== undefined && (
                    <small className="d-block text-end text-muted mt-2 fw-semibold">
                      Match Confidence: {(searchResult.score * 100).toFixed(1)}%
                    </small>
                  )}
                  {searchResult.score !== undefined && searchResult.score <= 0.15 && (
                    <div className="mt-3 p-3 bg-light rounded-3 d-flex justify-content-between align-items-center border">
                      <span className="text-muted small">Not what you were looking for? Submit a query directly to our support team.</span>
                      <Link to="/contact" className="btn btn-sm btn-outline-success rounded-3 fw-bold">
                        <FaPaperPlane className="me-1" /> Contact Support
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* General/Formal FAQ list */}
        <div className="row justify-content-center">
          <div className="col-md-8">
            <h3 className="fw-bold text-success mb-4 text-center">{t('generalFaqTitle') || 'Frequently Asked Questions'}</h3>
            {faqs.length === 0 ? (
              <div className="text-center p-4 bg-light rounded-3 text-muted">
                No formal FAQs found. Check back later or ask our AI assistant above!
              </div>
            ) : (
              <div className="accordion" id="faqAccordion">
                {faqs.map((faq) => (
                  <div key={faq._id} className="card mb-3 border shadow-sm rounded-3 overflow-hidden" style={{ background: 'var(--bg-card)', color: 'var(--text-color)' }}>
                    <div
                      className="card-header p-3 d-flex justify-content-between align-items-center cursor-pointer"
                      onClick={() => toggleFaq(faq._id)}
                      style={{ background: 'rgba(0,0,0,0.02)', borderBottom: openFaqId === faq._id ? '1px solid rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
                    >
                      <h5 className="mb-0 fw-semibold d-flex align-items-center">
                        <FaQuestionCircle className="text-success me-2" /> {faq.question}
                      </h5>
                      {openFaqId === faq._id ? <FaAngleUp className="text-muted" /> : <FaAngleDown className="text-muted" />}
                    </div>
                    {openFaqId === faq._id && (
                      <div className="card-body p-3 bg-white" style={{ background: 'var(--bg-card)', color: 'var(--text-color)' }}>
                        <p className="mb-0 text-muted">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Faq;
