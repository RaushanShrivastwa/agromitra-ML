import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './footer';
import { useLanguage } from '../context/LanguageContext';
import { FaHeart, FaHandHoldingHeart, FaSpinner } from 'react-icons/fa';

export default function Donate() {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('500');
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleDonate = async () => {
    const donateAmount = amount === 'custom' ? customAmount : amount;
    if (!donateAmount || isNaN(donateAmount) || Number(donateAmount) <= 0) {
      alert(t('invalidAmount') || 'Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create order on Express backend
      const res = await fetch('/api/payment/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({ amount: Number(donateAmount), purpose: 'Donation to AgroMitra' })
      });
      const orderData = await res.json();
      if (!res.ok) {
        alert(orderData.message || t('failedCreateOrder') || 'Failed to create order');
        setLoading(false);
        return;
      }

      // 2. Load script and execute checkout
      if (orderData.mock) {
        // Mock mode for local testing
        const confirmMock = window.confirm(
          `[DEVELOPER MOCK MODE]\n\nCreate mock transaction of ₹${donateAmount}?\n(No real money will be charged)`
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
              mock: true
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            alert(t('mockSuccess') || 'Success! Thank you for supporting AgroMitra! (Transaction Mocked)');
          } else {
            alert(verifyData.message || t('verifyFailed') || 'Payment mock verification failed');
          }
        }
        setLoading(false);
        return;
      }

      // Real Razorpay Mode
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert(t('offlineError') || 'Razorpay SDK failed to load. Are you offline?');
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'AgroMitra Support',
        description: 'Support sustainable farming for local farmers',
        image: 'https://i.postimg.cc/3NGKBY4V/google-icon.png',
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
              razorpay_signature: response.razorpay_signature
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            alert(t('successContribute') || 'Thank you for your generous contribution! Your payment was successful.');
          } else {
            alert(verifyData.message || t('sigFailed') || 'Signature verification failed');
          }
        },
        prefill: {
          name: '',
          email: ''
        },
        theme: {
          color: '#2e7d32'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error(err);
      alert(t('errCheckout') || 'Error initiating checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-color)' }}>
      <Navbar />
      <div className="container py-5 text-center" style={{ marginTop: '100px', maxWidth: '600px' }}>
        <div className="card shadow border-0 p-5" style={{ background: 'var(--bg-card)', color: 'var(--text-color)', borderRadius: '20px' }}>
          <div className="mb-4 text-success fs-1">
            <FaHandHoldingHeart />
          </div>
          <h2 style={{ fontWeight: 800 }}>{t('supportTitleDonate') || 'Support AgroMitra'}</h2>
          <p className="text-muted mt-2">{t('supportDescDonate') || 'Your contributions help us maintain soil testing centers, update agricultural ML models, and distribute smart kits to small farmers.'}</p>

          <div className="d-flex flex-wrap gap-2 justify-content-center my-4">
            {['100', '500', '1000', '2500'].map((amt) => (
              <button
                key={amt}
                className={`btn btn-lg ${amount === amt ? 'btn-success' : 'btn-outline-success'}`}
                style={{ minWidth: '90px', borderRadius: '10px', fontWeight: 600 }}
                onClick={() => { setAmount(amt); setCustomAmount(''); }}
              >
                ₹{amt}
              </button>
            ))}
            <button
              className={`btn btn-lg ${amount === 'custom' ? 'btn-success' : 'btn-outline-success'}`}
              style={{ minWidth: '90px', borderRadius: '10px', fontWeight: 600 }}
              onClick={() => setAmount('custom')}
            >
              {t('customAmount') || 'Custom'}
            </button>
          </div>

          {amount === 'custom' && (
            <div className="mb-4">
              <input
                type="number"
                className="form-control text-center form-control-lg"
                placeholder={t('enterAmountPlaceholder') || 'Enter amount (₹)'}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                style={{ background: 'var(--bg-input)', color: 'var(--text-color)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          )}

          <button
            className="btn btn-success btn-lg w-100 py-3 d-flex align-items-center justify-content-center"
            disabled={loading}
            onClick={handleDonate}
            style={{ borderRadius: '12px', fontWeight: 700 }}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner-border spinner-border-sm me-2" /> {t('processing') || 'Processing...'}
              </>
            ) : (
              <>
                <FaHeart className="me-2 text-danger" /> {t('contributeNow') || 'Contribute Now'}
              </>
            )}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
