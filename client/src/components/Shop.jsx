import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Footer from './footer';
import { useLanguage } from '../context/LanguageContext';
import { FaShoppingCart, FaSpinner, FaShoppingBag, FaSearch, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function Shop() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Search bar states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    try {
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (err) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewingReviewsProduct, setViewingReviewsProduct] = useState(null);
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    phone: '',
    address: ''
  });
  const [pastAddresses, setPastAddresses] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const fetchPastAddresses = async () => {
      try {
        const res = await fetch('/api/payment/my-orders', {
          headers: { 'Authorization': localStorage.getItem('token') || '' }
        });
        const data = await res.json();
        if (res.ok && data.orders) {
          setOrders(data.orders);
          const unique = [];
          const keys = new Set();
          data.orders.forEach(o => {
            if (o.shippingDetails && o.shippingDetails.fullName && o.shippingDetails.address) {
              const k = `${o.shippingDetails.fullName}_${o.shippingDetails.phone}_${o.shippingDetails.address}`;
              if (!keys.has(k)) {
                keys.add(k);
                unique.push(o.shippingDetails);
              }
            }
          });
          setPastAddresses(unique);
          if (unique.length > 0) {
            setShippingDetails(unique[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching past addresses:', err);
      }
    };
    fetchPastAddresses();
  }, []);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products', {
          headers: { 'Authorization': localStorage.getItem('token') || '' }
        });
        const data = await res.json();
        if (res.ok && data.products) {
          const mapped = data.products.map(p => ({ ...p, id: p._id }));
          setProducts(mapped);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Handle click outside to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter search suggestions from products list
  const searchSuggestions = searchQuery.trim() === ''
    ? []
    : products
        .filter(p => {
          const q = searchQuery.toLowerCase().trim();
          return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
        })
        .slice(0, 6); // Max 6 suggestions

  const handleKeyDown = (e) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % searchSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + searchSuggestions.length) % searchSuggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < searchSuggestions.length) {
        selectSuggestion(searchSuggestions[highlightedIndex]);
      } else {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (product) => {
    setSearchQuery(product.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleAddToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleDecrementQuantity = (productId) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === productId);
      if (exists) {
        if (exists.qty <= 1) {
          return prev.filter(item => item.id !== productId);
        }
        return prev.map(item => item.id === productId ? { ...item, qty: item.qty - 1 } : item);
      }
      return prev;
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  const handleRateProduct = (productId, starRating) => {
    alert(t('rateInstructionAlert') || "To rate and review this product, please go to your 'My Orders' page after the product has been delivered.");
  };

  const renderStars = (prod) => {
    const rating = prod.rating || 4.5;
    const roundedRating = Math.round(rating);
    const reviewCount = prod.reviews ? prod.reviews.length : 0;
    return (
      <div className="d-flex align-items-center gap-1 mb-2" title={`Rating: ${rating} / 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            onClick={() => handleRateProduct(prod.id, star)}
            style={{ 
              color: star <= roundedRating ? '#ffc107' : 'rgba(255,255,255,0.2)', 
              cursor: 'pointer',
              fontSize: '1.15rem',
              transition: 'transform 0.1s ease',
              display: 'inline-block'
            }}
            className="star-icon"
          >
            ★
          </span>
        ))}
        <span className="small text-muted ms-1" style={{ fontSize: '0.8rem' }}>({rating})</span>
        <button 
          onClick={(e) => { e.stopPropagation(); setViewingReviewsProduct(prod); }}
          className="btn btn-link btn-sm p-0 ms-2 text-decoration-none small text-success"
          style={{ fontSize: '0.78rem', fontWeight: 600 }}
        >
          {reviewCount > 0 ? `View Reviews (${reviewCount})` : 'No reviews'}
        </button>
      </div>
    );
  };

  // Hot Deals: products with higher amount gap, sorted by gap descending
  const hotDeals = products
    .filter(p => p.oldPrice > p.price && p.inStock !== false)
    .map(p => {
      const gap = p.oldPrice - p.price;
      const discount = Math.round((gap / p.oldPrice) * 100);
      return { ...p, gap, discount };
    })
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 4);

  // Most Ordered: products sorted by popularity score descending
  const mostOrdered = (() => {
    const getPopularityScore = (product) => {
      let hash = 0;
      const str = product.name || '';
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const basePopularity = Math.abs(hash % 50) + 10;

      let orderedQty = 0;
      orders.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            if (item.id === product.id || item._id === product.id || item.name === product.name) {
              orderedQty += (item.qty || item.quantity || 0);
            }
          });
        }
      });
      return basePopularity + orderedQty * 10;
    };

    return [...products]
      .filter(p => p.inStock !== false)
      .map(p => ({ ...p, score: getPopularityScore(p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  })();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    const total = getCartTotal();
    if (total <= 0) return;

    if (!shippingDetails.fullName.trim() || !shippingDetails.phone.trim() || !shippingDetails.address.trim()) {
      alert('Please fill out all shipping details before proceeding.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payment/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({ amount: total, purpose: 'Purchase of Agricultural supplies' })
      });
      const orderData = await res.json();
      if (!res.ok) {
        alert(orderData.message || 'Checkout failed');
        setLoading(false);
        return;
      }

      if (orderData.mock) {
        // Mock checkout
        const confirmMock = window.confirm(
          `[DEVELOPER MOCK PAY]\n\nCheckout items for ₹${total}?\n(No money will be charged)`
        );
        if (confirmMock) {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({
              razorpay_order_id: orderData.id,
              mock: true,
              items: cart,
              amount: total,
              shippingDetails
            })
          });
          if (verifyRes.ok) {
            alert('Order placed successfully! (Transaction Mocked)');
            setCart([]);
            setShippingDetails({ fullName: '', phone: '', address: '' });
          } else {
            alert('Verification of payment failed.');
          }
        }
        setLoading(false);
        return;
      }

      // Real Checkout
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay script failed to load.');
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'AgroMitra Shop',
        description: 'Purchase agricultural seeds and equipment',
        order_id: orderData.id,
        handler: async function (response) {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: cart,
              amount: total,
              shippingDetails
            })
          });
          if (verifyRes.ok) {
            alert('Order placed successfully! Check email for receipt.');
            setCart([]);
            setShippingDetails({ fullName: '', phone: '', address: '' });
          } else {
            alert('Payment verification failed.');
          }
        },
        theme: {
          color: '#2e7d32'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      alert('Checkout error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products
    .filter(p => activeCategory === 'All' || p.category === activeCategory)
    .filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    });

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-body)' }}>
      <style>{`
        .deal-scroll-container {
          display: flex;
          overflow-x: auto;
          gap: 1.2rem;
          padding: 8px 4px 15px 4px;
          scrollbar-width: thin;
        }
        .deal-scroll-container::-webkit-scrollbar {
          height: 6px;
        }
        .deal-scroll-container::-webkit-scrollbar-thumb {
          background-color: rgba(25, 135, 84, 0.3);
          border-radius: 10px;
        }
        .deal-card {
          flex: 0 0 250px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .deal-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.2);
          border-color: rgba(25, 135, 84, 0.3);
          background: rgba(255, 255, 255, 0.05);
        }
        .star-icon {
          transition: transform 0.1s ease;
        }
        .star-icon:hover {
          transform: scale(1.25);
        }
        body.dark .deal-card {
          background: rgba(255, 255, 255, 0.03);
        }
        body.dark .deal-card:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        
        /* Search autocomplete styles */
        .search-bar-wrapper {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(25, 135, 84, 0.2);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .search-bar-wrapper:focus-within {
          border-color: #258754;
          box-shadow: 0 0 10px rgba(37, 135, 84, 0.25);
        }
        .search-icon-btn {
          background: var(--bg-card);
          border: none;
          color: #258754;
          padding-left: 15px;
          padding-right: 10px;
          display: flex;
          align-items: center;
        }
        .search-input-field {
          background: var(--bg-card);
          color: var(--text-body);
          border: none;
          padding: 12px 10px;
          font-size: 0.95rem;
          box-shadow: none !important;
        }
        .search-input-field::placeholder {
          color: #888;
        }
        body.dark .search-input-field {
          background: #1e1e1e;
          color: #ffffff;
        }
        body.dark .search-icon-btn, body.dark .search-clear-btn {
          background: #1e1e1e;
        }
        .search-clear-btn {
          background: var(--bg-card);
          border: none;
          color: var(--text-body);
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .search-clear-btn:hover {
          opacity: 1;
          color: #dc3545;
        }
        .search-suggestions-dropdown {
          position: absolute;
          top: 105%;
          left: 0;
          right: 0;
          background: var(--bg-card);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          z-index: 999;
          max-height: 380px;
          overflow-y: auto;
        }
        body.dark .search-suggestions-dropdown {
          background: #181818;
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }
        .search-suggestion-item {
          padding: 10px 15px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        .search-suggestion-item:last-child {
          border-bottom: none;
        }
        .search-suggestion-item:hover, .search-suggestion-item.highlighted {
          background-color: rgba(25, 135, 84, 0.08);
        }
        body.dark .search-suggestion-item:hover, body.dark .search-suggestion-item.highlighted {
          background-color: rgba(25, 135, 84, 0.15);
        }
        .search-suggestion-img {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 6px;
        }
        .suggestion-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-body);
        }
        body.dark .suggestion-name {
          color: #ffffff;
        }
        .suggestion-desc {
          font-size: 0.75rem;
          max-width: 400px;
        }
        .suggestion-badge {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
        }
      `}</style>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '90px' }}>
        <div className="row g-4">
          
          {/* Catalog Grid */}
          <div className="col-md-8">
            {/* Customer-Only Dynamic Deals & Most Ordered sections */}
            {(user?.role === 'customer' || user?.role === 'farmer' || user?.role === 'user' || user?.role === 'admin') && (
              <div className="mb-4 d-flex flex-column gap-4 animate__animated animate__fadeIn">
                {/* Hot Deals */}
                {hotDeals.length > 0 && (
                  <div className="card shadow-sm border-0 p-4" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', borderRadius: '15px' }}>
                    <h3 className="fw-bold text-warning mb-3 d-flex align-items-center gap-2">
                      <span>🔥</span> Best Hot Deals
                    </h3>
                    <div className="deal-scroll-container">
                      {hotDeals.map((prod) => (
                        <div key={`deal-${prod.id}`} className="deal-card d-flex flex-column">
                          <div className="position-relative">
                            <img src={prod.image} alt={prod.name} style={{ height: '130px', width: '100%', objectFit: 'cover' }} />
                            <span className="badge bg-danger position-absolute top-0 start-0 m-2 fw-bold" style={{ zIndex: 2 }}>
                              {prod.discount}% OFF
                            </span>
                            <span className="badge bg-secondary position-absolute top-0 end-0 m-2" style={{ zIndex: 2 }}>
                              {prod.category}
                            </span>
                          </div>
                          <div className="card-body p-3 d-flex flex-column flex-grow-1">
                            <h6 className="card-title fw-bold text-truncate mb-1" title={prod.name}>{prod.name}</h6>
                            {renderStars(prod)}
                            <p className="card-text text-muted small text-truncate mb-2" style={{ fontSize: '0.78rem' }}>{prod.description}</p>
                            
                            <div className="d-flex justify-content-between align-items-center mt-auto pt-2">
                              <div>
                                <span className="fw-bold text-success">₹{prod.price}</span>
                                <small className="text-decoration-line-through text-muted ms-2" style={{ fontSize: '0.72rem' }}>₹{prod.oldPrice}</small>
                              </div>
                              {(() => {
                                const cartItem = cart.find(item => item.id === prod.id);
                                return cartItem ? (
                                  <div className="d-flex align-items-center gap-1">
                                    <button 
                                      className="btn btn-sm btn-outline-success px-2 py-0" 
                                      onClick={() => handleDecrementQuantity(prod.id)}
                                      style={{ fontWeight: 700, borderRadius: '6px', height: '26px' }}
                                    >
                                      -
                                    </button>
                                    <span className="fw-bold px-1" style={{ color: 'var(--text-body)', fontSize: '0.85rem', minWidth: '15px', textAlign: 'center' }}>
                                      {cartItem.qty}
                                    </span>
                                    <button 
                                      className="btn btn-sm btn-success px-2 py-0" 
                                      onClick={() => handleAddToCart(prod)}
                                      style={{ fontWeight: 700, borderRadius: '6px', height: '26px' }}
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button className="btn btn-sm btn-success py-1 px-2" style={{ fontSize: '0.78rem', borderRadius: '6px' }} onClick={() => handleAddToCart(prod)}>
                                    Add
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Most Ordered */}
                {mostOrdered.length > 0 && (
                  <div className="card shadow-sm border-0 p-4" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', borderRadius: '15px' }}>
                    <h3 className="fw-bold text-success mb-3 d-flex align-items-center gap-2">
                      <span>⭐</span> Most Ordered
                    </h3>
                    <div className="deal-scroll-container">
                      {mostOrdered.map((prod) => (
                        <div key={`ordered-${prod.id}`} className="deal-card d-flex flex-column">
                          <div className="position-relative">
                            <img src={prod.image} alt={prod.name} style={{ height: '130px', width: '100%', objectFit: 'cover' }} />
                            <span className="badge bg-success position-absolute top-0 start-0 m-2 fw-bold" style={{ zIndex: 2 }}>
                              Popular
                            </span>
                            <span className="badge bg-secondary position-absolute top-0 end-0 m-2" style={{ zIndex: 2 }}>
                              {prod.category}
                            </span>
                          </div>
                          <div className="card-body p-3 d-flex flex-column flex-grow-1">
                            <h6 className="card-title fw-bold text-truncate mb-1" title={prod.name}>{prod.name}</h6>
                            {renderStars(prod)}
                            <p className="card-text text-muted small text-truncate mb-2" style={{ fontSize: '0.78rem' }}>{prod.description}</p>
                            
                            <div className="d-flex justify-content-between align-items-center mt-auto pt-2">
                              <div>
                                <span className="fw-bold text-success">₹{prod.price}</span>
                                {prod.oldPrice > prod.price && (
                                  <small className="text-decoration-line-through text-muted ms-2" style={{ fontSize: '0.72rem' }}>₹{prod.oldPrice}</small>
                                )}
                              </div>
                              {(() => {
                                const cartItem = cart.find(item => item.id === prod.id);
                                return cartItem ? (
                                  <div className="d-flex align-items-center gap-1">
                                    <button 
                                      className="btn btn-sm btn-outline-success px-2 py-0" 
                                      onClick={() => handleDecrementQuantity(prod.id)}
                                      style={{ fontWeight: 700, borderRadius: '6px', height: '26px' }}
                                    >
                                      -
                                    </button>
                                    <span className="fw-bold px-1" style={{ color: 'var(--text-body)', fontSize: '0.85rem', minWidth: '15px', textAlign: 'center' }}>
                                      {cartItem.qty}
                                    </span>
                                    <button 
                                      className="btn btn-sm btn-success px-2 py-0" 
                                      onClick={() => handleAddToCart(prod)}
                                      style={{ fontWeight: 700, borderRadius: '6px', height: '26px' }}
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button className="btn btn-sm btn-success py-1 px-2" style={{ fontSize: '0.78rem', borderRadius: '6px' }} onClick={() => handleAddToCart(prod)}>
                                    Add
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="card shadow border-0 p-4" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', borderRadius: '15px' }}>
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h2 style={{ fontWeight: 700 }}>{t('shopTitle') || 'AgroMitra Shop'}</h2>
                <div className="d-flex align-items-center gap-3">
                  <a href="/my-orders" className="btn btn-outline-success btn-sm d-flex align-items-center gap-1" style={{ borderRadius: '8px', fontWeight: 600 }}>
                    <FaShoppingBag /> Past Orders
                  </a>
                  <div className="btn-group">
                    {['All', 'Seeds', 'Fertilizers', 'Equipment'].map(cat => (
                      <button
                        key={cat}
                        className={`btn btn-sm ${activeCategory === cat ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => setActiveCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Container */}
              <div ref={searchContainerRef} className="position-relative mb-4">
                <div className="input-group shadow-sm search-bar-wrapper">
                  <span className="input-group-text search-icon-btn">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control search-input-field"
                    placeholder="Search premium seeds, fertilizers, or tools..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                      setHighlightedIndex(-1);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                  />
                  {searchQuery && (
                    <button 
                      className="btn search-clear-btn" 
                      type="button" 
                      onClick={() => {
                        setSearchQuery('');
                        setShowSuggestions(false);
                        setHighlightedIndex(-1);
                      }}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>

                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="search-suggestions-dropdown animate__animated animate__fadeIn">
                    {searchSuggestions.map((prod, idx) => (
                      <div
                        key={`suggest-${prod.id}`}
                        className={`search-suggestion-item d-flex align-items-center gap-3 ${idx === highlightedIndex ? 'highlighted' : ''}`}
                        onClick={() => selectSuggestion(prod)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                      >
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="search-suggestion-img"
                        />
                        <div className="flex-grow-1 text-truncate">
                          <div className="suggestion-name text-truncate">{prod.name}</div>
                          <small className="suggestion-desc text-muted text-truncate d-block">{prod.description}</small>
                        </div>
                        <span className="badge bg-light text-dark suggestion-badge">
                          {prod.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="row g-3">
                {filteredProducts.map((prod) => (
                  <div key={prod.id} className="col-sm-6">
                    <div className="card h-100 border-0 shadow-sm" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden' }}>
                      <img src={prod.image} className="card-img-top" alt={prod.name} style={{ height: '180px', objectFit: 'cover' }} />
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          <span className="badge bg-secondary">{prod.category}</span>
                          {hotDeals.some(h => h.id === prod.id) && (
                            <span className="badge bg-danger">🔥 Hot Deal</span>
                          )}
                          {mostOrdered.some(m => m.id === prod.id) && (
                            <span className="badge bg-success">⭐ Most Ordered</span>
                          )}
                        </div>
                        <h5 className="card-title fw-bold">{prod.name}</h5>
                        {renderStars(prod)}
                        <p className="card-text text-muted small flex-grow-1">{prod.description}</p>
                        
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <div>
                            <span className="fs-5 fw-bold text-success">₹{prod.price}</span>
                            <small className="text-decoration-line-through text-muted ms-2">₹{prod.oldPrice}</small>
                          </div>
                          {(() => {
                            const cartItem = cart.find(item => item.id === prod.id);
                            return cartItem ? (
                              <div className="d-flex align-items-center gap-2">
                                <button 
                                  className="btn btn-sm btn-outline-success px-2 py-1" 
                                  onClick={() => handleDecrementQuantity(prod.id)}
                                  style={{ fontWeight: 700, minWidth: '32px', borderRadius: '8px' }}
                                >
                                  -
                                </button>
                                <span className="fw-bold px-2" style={{ color: 'var(--text-body)', minWidth: '20px', textAlign: 'center' }}>
                                  {cartItem.qty}
                                </span>
                                <button 
                                  className="btn btn-sm btn-success px-2 py-1" 
                                  onClick={() => handleAddToCart(prod)}
                                  style={{ fontWeight: 700, minWidth: '32px', borderRadius: '8px' }}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button className="btn btn-sm btn-success" onClick={() => handleAddToCart(prod)}>
                                Add to Cart
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="col-md-4">
            <div className="card shadow border-0 p-4" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', borderRadius: '15px', position: 'sticky', top: '110px' }}>
              <h3 className="mb-4 d-flex align-items-center" style={{ fontWeight: 700 }}>
                <FaShoppingCart className="me-2 text-success" /> {t('shoppingCart') || 'Cart'}
              </h3>

              {cart.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p>{t('emptyCart') || 'Cart is currently empty.'}</p>
                </div>
              ) : (
                <div>
                  <div className="d-flex flex-column gap-3 mb-4 overflow-auto" style={{ maxHeight: '300px' }}>
                    {cart.map((item) => (
                      <div key={item.id} className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ maxWidth: '55%' }}>
                          <span className="fw-bold d-block text-truncate" style={{ fontSize: '0.95rem' }}>{item.name}</span>
                          <small className="text-success fw-semibold">₹{(item.price * item.qty).toLocaleString()}</small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="d-flex align-items-center gap-1 p-1 rounded" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                            <button 
                              className="btn btn-sm btn-outline-secondary border-0 p-0 d-flex align-items-center justify-content-center" 
                              onClick={() => handleDecrementQuantity(item.id)}
                              style={{ width: '22px', height: '22px', fontSize: '0.85rem', lineHeight: 1, borderRadius: '4px' }}
                            >
                              -
                            </button>
                            <span className="fw-bold px-1" style={{ fontSize: '0.85rem', color: 'var(--text-body)', minWidth: '15px', textAlign: 'center' }}>
                              {item.qty}
                            </span>
                            <button 
                              className="btn btn-sm btn-outline-secondary border-0 p-0 d-flex align-items-center justify-content-center" 
                              onClick={() => handleAddToCart(item)}
                              style={{ width: '22px', height: '22px', fontSize: '0.85rem', lineHeight: 1, borderRadius: '4px' }}
                            >
                              +
                            </button>
                          </div>
                          <button className="btn btn-sm btn-outline-danger py-1 px-2" onClick={() => handleRemoveFromCart(item.id)} style={{ fontSize: '0.8rem', borderRadius: '6px' }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4 border-top pt-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <h5 className="mb-3 text-success fw-bold" style={{ fontSize: '1rem' }}>{t('shippingDetails') || 'Shipping Information'}</h5>
                    {pastAddresses.length > 0 && (
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-muted mb-1">Use Saved Shipping Details</label>
                        <select 
                          className="form-select form-select-sm" 
                          onChange={(e) => {
                            const idx = Number(e.target.value);
                            if (idx >= 0 && pastAddresses[idx]) {
                              setShippingDetails(pastAddresses[idx]);
                            }
                          }}
                          style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid rgba(255,255,255,0.1)' }}
                          value={pastAddresses.findIndex(a => a.fullName === shippingDetails.fullName && a.phone === shippingDetails.phone && a.address === shippingDetails.address)}
                        >
                          <option value="-1">-- Select a saved address --</option>
                          {pastAddresses.map((addr, idx) => (
                            <option key={idx} value={idx}>
                              {addr.fullName} ({addr.phone}) - {addr.address.substring(0, 30)}...
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-muted mb-1">{t('shippingName') || 'Full Name'}</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="e.g. John Doe"
                        value={shippingDetails.fullName}
                        onChange={(e) => setShippingDetails({ ...shippingDetails, fullName: e.target.value })}
                        style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-muted mb-1">{t('shippingPhone') || 'Phone Number'}</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="e.g. +91 9876543210"
                        value={shippingDetails.phone}
                        onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                        style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted mb-1">{t('shippingAddress') || 'Delivery Address'}</label>
                      <textarea 
                        className="form-control form-control-sm" 
                        rows="2"
                        placeholder="Complete street address & pincode"
                        value={shippingDetails.address}
                        onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                        style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid rgba(255,255,255,0.1)' }}
                      ></textarea>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <span className="fs-5">{t('totalAmount') || 'Total'}:</span>
                    <strong className="fs-4 text-success">₹{getCartTotal().toLocaleString()}</strong>
                  </div>

                  <button
                    className="btn btn-success btn-lg w-100 d-flex align-items-center justify-content-center"
                    disabled={loading}
                    onClick={handleCheckout}
                    style={{ fontWeight: 700 }}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="spinner-border spinner-border-sm me-2" /> {t('searching') || 'Processing...'}
                      </>
                    ) : (
                      t('placeOrder') || 'Proceed to Checkout'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {viewingReviewsProduct && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', border: '1px solid var(--border-color)', borderRadius: '15px' }}>
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-success">Reviews for {viewingReviewsProduct.name}</h5>
                <button type="button" className="btn-close" onClick={() => setViewingReviewsProduct(null)} style={{ filter: 'var(--is-dark) ? "invert(1)" : "none"' }}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {!viewingReviewsProduct.reviews || viewingReviewsProduct.reviews.length === 0 ? (
                  <p className="text-muted text-center py-4">No reviews yet for this product.</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {viewingReviewsProduct.reviews.map((rev, idx) => (
                      <div key={idx} className="p-3 rounded border" style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-success">{rev.userName}</span>
                          <span className="text-warning">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i} style={{ color: i < rev.rating ? '#ffc107' : 'rgba(255,255,255,0.2)' }}>★</span>
                            ))}
                          </span>
                        </div>
                        <p className="mb-0 text-muted small" style={{ fontStyle: rev.comment ? 'normal' : 'italic' }}>
                          {rev.comment || "Rated without comments."}
                        </p>
                        <small className="text-muted d-block mt-2" style={{ fontSize: '0.7rem' }}>
                          {new Date(rev.createdAt || Date.now()).toLocaleDateString()}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setViewingReviewsProduct(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
