import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './footer';
import { useLanguage } from '../context/LanguageContext';
import { FaShoppingCart, FaSpinner, FaShoppingBag } from 'react-icons/fa';

export default function Shop() {
  const { t } = useLanguage();
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
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    phone: '',
    address: ''
  });
  const [pastAddresses, setPastAddresses] = useState([]);

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

  const handleAddToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
  };

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

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-color)' }}>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '90px' }}>
        <div className="row g-4">
          
          {/* Catalog Grid */}
          <div className="col-md-8">
            <div className="card shadow border-0 p-4" style={{ background: 'var(--bg-card)', color: 'var(--text-color)', borderRadius: '15px' }}>
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

              <div className="row g-3">
                {filteredProducts.map((prod) => (
                  <div key={prod.id} className="col-sm-6">
                    <div className="card h-100 border-0 shadow-sm" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden' }}>
                      <img src={prod.image} className="card-img-top" alt={prod.name} style={{ height: '180px', objectFit: 'cover' }} />
                      <div className="card-body d-flex flex-column">
                        <span className="badge bg-secondary align-self-start mb-2">{prod.category}</span>
                        <h5 className="card-title fw-bold">{prod.name}</h5>
                        <p className="card-text text-muted small flex-grow-1">{prod.description}</p>
                        
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <div>
                            <span className="fs-5 fw-bold text-success">₹{prod.price}</span>
                            <small className="text-decoration-line-through text-muted ms-2">₹{prod.oldPrice}</small>
                          </div>
                          <button className="btn btn-sm btn-success" onClick={() => handleAddToCart(prod)}>
                            Add to Cart
                          </button>
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
            <div className="card shadow border-0 p-4" style={{ background: 'var(--bg-card)', color: 'var(--text-color)', borderRadius: '15px', position: 'sticky', top: '110px' }}>
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
                        <div style={{ maxWidth: '65%' }}>
                          <span className="fw-bold d-block text-truncate">{item.name}</span>
                          <small className="text-success">₹{item.price} × {item.qty}</small>
                        </div>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveFromCart(item.id)}>
                          Remove
                        </button>
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
                          style={{ background: 'var(--bg-input)', color: 'var(--text-color)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                        style={{ background: 'var(--bg-input)', color: 'var(--text-color)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                        style={{ background: 'var(--bg-input)', color: 'var(--text-color)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                        style={{ background: 'var(--bg-input)', color: 'var(--text-color)', border: '1px solid rgba(255,255,255,0.1)' }}
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
      <Footer />
    </div>
  );
}
