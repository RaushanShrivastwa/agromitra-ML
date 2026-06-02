import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './footer';
import { useLanguage } from '../context/LanguageContext';
import { FaBoxOpen, FaSpinner, FaShoppingBag, FaShippingFast, FaCheckCircle, FaTimesCircle, FaArrowLeft } from 'react-icons/fa';

export default function MyOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/payment/my-orders', {
          headers: {
            'Authorization': localStorage.getItem('token') || ''
          }
        });
        const data = await res.json();
        if (res.ok) {
          setOrders(data.orders || []);
        } else {
          console.error('Failed to fetch orders:', data.message);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Processing':
        return <span className="badge bg-warning text-dark"><FaSpinner className="spinner-border spinner-border-sm border-0 me-1" style={{ animation: 'spin 1.5s linear infinite' }} /> {t('statusProcessing') || 'Processing'}</span>;
      case 'Shipped':
        return <span className="badge bg-info text-dark"><FaShippingFast className="me-1" /> {t('statusShipped') || 'Shipped'}</span>;
      case 'Delivered':
        return <span className="badge bg-success"><FaCheckCircle className="me-1" /> {t('statusDelivered') || 'Delivered'}</span>;
      case 'Cancelled':
        return <span className="badge bg-danger"><FaTimesCircle className="me-1" /> {t('statusCancelled') || 'Cancelled'}</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-color)' }}>
      <Navbar />
      <div className="container py-5" style={{ marginTop: '90px', maxWidth: '800px' }}>
        
        <div className="d-flex align-items-center gap-3 mb-4">
          <a href="/shop" className="btn btn-outline-success btn-sm d-flex align-items-center gap-1" style={{ borderRadius: '8px' }}>
            <FaArrowLeft /> {t('backToShop') || 'Back to Shop'}
          </a>
          <h2 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <FaShoppingBag className="text-success" /> {t('myOrdersTitle') || 'My Orders'}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <FaSpinner className="spinner-border text-success" />
            <p className="text-muted mt-2">{t('loadingOrders') || 'Loading your orders...'}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="card shadow border-0 p-5 text-center" style={{ background: 'var(--bg-card)', borderRadius: '15px' }}>
            <FaBoxOpen className="text-muted mb-3" style={{ fontSize: '4.5rem' }} />
            <h4 className="fw-bold">{t('noOrdersPlaced') || 'No Orders Placed Yet'}</h4>
            <p className="text-muted">{t('exploreShopDesc') || 'Explore the deals shop to purchase high-yield seeds, fertilizers, and high-quality farming equipment.'}</p>
            <a href="/shop" className="btn btn-success btn-lg mx-auto mt-2" style={{ borderRadius: '10px', fontWeight: 600 }}>
              {t('shopNow') || 'Shop Now'}
            </a>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {orders.map((order) => (
              <div key={order._id} className="card shadow border-0 overflow-hidden" style={{ background: 'var(--bg-card)', borderRadius: '15px' }}>
                
                {/* Header info */}
                <div className="card-header border-0 d-flex justify-content-between align-items-center flex-wrap gap-2 p-3" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <span className="small text-muted d-block">{t('orderPlaced') || 'ORDER PLACED'}</span>
                    <span className="fw-semibold small">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="small text-muted d-block text-end">{t('total') || 'TOTAL'}</span>
                    <span className="fw-bold text-success">₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="small text-muted d-block text-end">{t('orderId') || 'ORDER ID'}</span>
                    <span className="text-muted small text-monospace">{order.razorpayOrderId}</span>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Items and shipping body */}
                <div className="card-body p-4">
                  <div className="row g-4">
                    
                    {/* Items column */}
                    <div className="col-md-7">
                      <h6 className="fw-bold text-success mb-3">{t('itemsOrdered') || 'Items Ordered'}</h6>
                      <div className="d-flex flex-column gap-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="d-flex gap-3 align-items-center">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }} 
                              />
                            )}
                            <div className="flex-grow-1">
                              <span className="fw-semibold d-block text-truncate" style={{ maxWidth: '280px' }}>{item.name}</span>
                              <small className="text-muted">{item.category} | {t('qtyLabel') || 'Qty'}: {item.qty}</small>
                            </div>
                            <div className="text-end">
                              <span className="fw-bold">₹{(item.price * item.qty).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Details column */}
                    <div className="col-md-5 border-start" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <h6 className="fw-bold text-success mb-3">{t('shippingDetails') || 'Shipping Details'}</h6>
                      {order.shippingDetails ? (
                        <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <span className="fw-semibold d-block mb-1">{order.shippingDetails.fullName}</span>
                          <span className="small text-muted d-block mb-2"><span className="fw-semibold text-success">{t('recipientPhone') || 'Phone'}:</span> {order.shippingDetails.phone}</span>
                          <span className="small text-muted d-block" style={{ lineHeight: '1.4' }}><span className="fw-semibold text-success">{t('recipientAddress') || 'Address'}:</span> {order.shippingDetails.address}</span>
                        </div>
                      ) : (
                        <span className="text-muted small">{t('noShippingDetails') || 'No shipping details provided.'}</span>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
      <Footer />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
