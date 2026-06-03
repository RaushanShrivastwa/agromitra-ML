import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './Navbar';
import Footer from './footer';
import { useLanguage } from '../context/LanguageContext';
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaSyncAlt, FaChevronDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const PAGE_SIZE = 500;

// Convert "dd/MM/yyyy" to "yyyy-MM-dd" for <input type="date">
function apiDateToInput(apiDate) {
  if (!apiDate) return '';
  const parts = apiDate.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return '';
}

// Convert "yyyy-MM-dd" to "dd/MM/yyyy" for the API
function inputDateToApi(inputDate) {
  if (!inputDate) return '';
  const parts = inputDate.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`.replace(/-/g, '/');
  return '';
}

// Format "dd/MM/yyyy" for display
function formatDateDisplay(apiDate) {
  if (!apiDate) return '';
  const parts = apiDate.split('/');
  if (parts.length !== 3) return apiDate;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(parts[0])} ${months[parseInt(parts[1]) - 1] || parts[1]} ${parts[2]}`;
}

export default function Mandi() {
  const { t } = useLanguage();

  // Filters
  const [stateFilter, setStateFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // yyyy-MM-dd for input

  // Data
  const [prices, setPrices] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [dataDate, setDataDate] = useState(''); // dd/MM/yyyy from API

  // UI
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const debounceTimer = useRef(null);

  // ──── Fetch states (once) ────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/crops/mandi-states', {
          headers: { Authorization: localStorage.getItem('token') || '' }
        });
        const data = await res.json();
        if (res.ok && data.states) setAvailableStates(data.states);
      } catch (err) { console.error('Failed to load states:', err); }
    })();
  }, []);

  // ──── Build query string ────
  const buildQuery = useCallback((extraOffset = 0, dateOverride = '') => {
    const params = new URLSearchParams();
    if (stateFilter) params.set('state', stateFilter);
    if (searchQuery) params.set('commodity', searchQuery);
    const apiDate = dateOverride || (selectedDate ? inputDateToApi(selectedDate) : '');
    if (apiDate) params.set('date', apiDate);
    params.set('offset', extraOffset);
    params.set('limit', PAGE_SIZE);
    return params.toString();
  }, [stateFilter, searchQuery, selectedDate]);

  // ──── Fetch prices ────
  const fetchPrices = useCallback(async (mode = 'replace', customOffset = 0, forceRefresh = false) => {
    if (mode === 'replace') { setLoading(true); setOffset(0); }
    else setLoadingMore(true);
    setError('');

    try {
      const dateToUse = mode === 'append' ? dataDate : '';
      let qs = buildQuery(mode === 'replace' ? 0 : customOffset, dateToUse);
      if (forceRefresh) {
        qs += '&refresh=true';
      }
      const res = await fetch(`/api/crops/mandi-prices?${qs}`, {
        headers: { Authorization: localStorage.getItem('token') || '' }
      });
      const data = await res.json();

      if (res.ok) {
        if (mode === 'replace') setPrices(data.prices || []);
        else setPrices(prev => [...prev, ...(data.prices || [])]);

        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
        setOffset((data.offset || 0) + (data.prices?.length || 0));
        if (data.date) {
          setDataDate(data.date);
          // Sync date picker if we didn't set one explicitly
          if (!selectedDate) setSelectedDate(apiDateToInput(data.date));
        }
        if (data.message && data.rateLimited) {
          setError(data.message); // Show rate limit warning if returned
        }
      } else {
        setError(data.message || 'Failed to fetch mandi prices');
      }
    } catch (err) {
      console.error('Error fetching Mandi prices:', err);
      setError('Network error — unable to fetch mandi prices.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildQuery, dataDate, selectedDate]);

  // ──── Re-fetch on filter or date change ────
  useEffect(() => {
    fetchPrices('replace');
  }, [stateFilter, searchQuery, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──── Debounce search ────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearchQuery(val.trim()), 500);
  };

  // ──── Date navigation helpers ────
  const shiftDate = (days) => {
    const current = selectedDate ? new Date(selectedDate) : new Date();
    current.setDate(current.getDate() + days);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const goToToday = () => {
    setSelectedDate(''); // Clear → auto-detects latest
  };

  // ──── Client-side district filter ────
  const displayed = districtSearch
    ? prices.filter(p =>
        p.district.toLowerCase().includes(districtSearch.toLowerCase()) ||
        p.market.toLowerCase().includes(districtSearch.toLowerCase()))
    : prices;

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-body)' }}>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '90px' }}>
        {/* Header */}
        <div className="card shadow border-0 p-4 mb-4" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', borderRadius: '15px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h2 className="mb-1" style={{ fontWeight: 700 }}>
                🏪 {t('mandiTitle') || 'Real-time Mandi Crop Prices'}
              </h2>
              <small className="text-muted">
                {t('mandiSubtitle') || 'Real-time agricultural commodity prices from government databases'}
                {dataDate && <> • Showing: <strong>{formatDateDisplay(dataDate)}</strong></>}
                {total > 0 && <> • <strong>{total.toLocaleString()}</strong> records</>}
                {stateFilter && <> in <strong>{stateFilter}</strong></>}
                {searchQuery && <> for "<strong>{searchQuery}</strong>"</>}
              </small>
            </div>
            <button className="btn btn-outline-success btn-sm d-flex align-items-center gap-2"
              onClick={() => fetchPrices('replace', 0, true)} disabled={loading}>
              <FaSyncAlt className={loading ? 'spin-animation' : ''} /> {t('refreshBtn') || 'Refresh Live Data'}
            </button>
          </div>

          {/* Date Navigation */}
          <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
            <span className="text-muted small fw-bold">📅 {t('mandiTableDate') || 'Date'}:</span>
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center"
              onClick={() => shiftDate(-1)} title="Previous day">
              <FaChevronLeft />
            </button>
            <input
              type="date"
              className="form-control form-control-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              min="2023-01-01"
              style={{ width: '170px', background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center"
              onClick={() => shiftDate(1)} title="Next day"
              disabled={selectedDate >= new Date().toISOString().split('T')[0]}>
              <FaChevronRight />
            </button>
            <button className="btn btn-sm btn-success" onClick={goToToday}>
              Today
            </button>
          </div>

          {/* Filters */}
          <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label small text-muted mb-1">{t('searchCommodity') || 'Crop / Commodity'}</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <FaSearch className="text-muted" />
                </span>
                <input type="text" className="form-control border-start-0"
                  placeholder="e.g. Wheat, Onion, Paddy..."
                  value={searchInput} onChange={handleSearchChange}
                  style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted mb-1">{t('searchState') || 'State'}</label>
              <select className="form-select" value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid rgba(255,255,255,0.1)', height: '48px' }}>
                <option value="">All States ({availableStates.length})</option>
                {availableStates.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted mb-1">{t('filterDistrict') || 'District / Market'}</label>
              <input type="text" className="form-control"
                placeholder="Filter by district or market..."
                value={districtSearch} onChange={(e) => setDistrictSearch(e.target.value)}
                style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid rgba(255,255,255,0.1)', height: '48px' }}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-warning d-flex align-items-center" role="alert">
            <span className="me-2">⚠️</span><span>{error}</span>
            <button className="btn btn-sm btn-outline-warning ms-auto" onClick={() => fetchPrices('replace')}>Retry</button>
          </div>
        )}

        {/* Results count */}
        {!loading && !error && (
          <p className="text-muted mb-3 small">
            Showing <strong>{displayed.length}</strong> of {total.toLocaleString()} total records
            {hasMore && <span className="ms-1">(more available — click "Load More" below)</span>}
          </p>
        )}

        {/* Table */}
        <div className="card shadow border-0 p-4" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', borderRadius: '15px' }}>
          <div className="table-responsive">
            <table className="table align-middle mb-0" style={{ color: 'var(--text-body)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th>{t('mandiTableCrop') || 'Crop'}</th>
                  <th>{t('mandiTableVariety') || 'Variety'}</th>
                  <th>{t('searchState') || 'State'}</th>
                  <th>{t('mandiTableMarket') || 'District / Market'}</th>
                  <th className="text-center">{t('mandiTableMin') || 'Min Price'} (₹/q)</th>
                  <th className="text-center">{t('mandiTableMax') || 'Max Price'} (₹/q)</th>
                  <th className="text-center">{t('mandiTableModal') || 'Modal Price'} (₹/q)</th>
                  <th className="text-center">{t('mandiTableDate') || 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="text-muted mt-2 mb-0">Fetching prices from AGMARKNET (2 APIs)...</p>
                    </td>
                  </tr>
                ) : displayed.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      No crop prices found for this date/filter combination. Try a different date or clear filters.
                    </td>
                  </tr>
                ) : (
                  displayed.map((price, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td className="fw-bold">{price.crop}</td>
                      <td><small className="text-muted">{price.variety || '—'}</small></td>
                      <td>
                        <span className="badge bg-success bg-opacity-10 text-success px-3 py-2"
                          style={{ borderRadius: '6px', cursor: stateFilter ? 'default' : 'pointer' }}
                          onClick={() => { if (!stateFilter) setStateFilter(price.state); }}
                          title={stateFilter ? '' : `Click to filter by ${price.state}`}>
                          {price.state}
                        </span>
                      </td>
                      <td>
                        <span className="d-block">{price.market}</span>
                        <small className="text-muted"><FaMapMarkerAlt size={12} className="me-1" />{price.district}</small>
                      </td>
                      <td className="text-center font-monospace">₹{price.min.toLocaleString()}</td>
                      <td className="text-center font-monospace">₹{price.max.toLocaleString()}</td>
                      <td className="text-center fw-bold font-monospace text-success">₹{price.avg.toLocaleString()}</td>
                      <td className="text-center">
                        <small className="text-muted">
                          <FaCalendarAlt size={12} className="me-1" />
                          {price.arrivalDate || '—'}
                        </small>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          {hasMore && !loading && (
            <div className="text-center mt-4">
              <button className="btn btn-success px-4 py-2 d-inline-flex align-items-center gap-2"
                onClick={() => fetchPrices('append', offset)}
                disabled={loadingMore} style={{ borderRadius: '10px' }}>
                {loadingMore ? (
                  <><span className="spinner-border spinner-border-sm" role="status" /> Loading more...</>
                ) : (
                  <><FaChevronDown /> Load More ({Math.max(0, total - offset).toLocaleString()} remaining)</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-animation { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
