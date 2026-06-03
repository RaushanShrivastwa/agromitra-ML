import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RecommendedFeatures.css';
import { useLanguage } from '../context/LanguageContext';

const ALLOWED_CROPS = [
  { value: 'rice', label: 'Rice' },
  { value: 'maize', label: 'Maize' },
  { value: 'chickpea', label: 'Chickpea' },
  { value: 'kidneybeans', label: 'Kidney Beans' },
  { value: 'pigeonpeas', label: 'Pigeon Peas' },
  { value: 'mothbeans', label: 'Moth Beans' },
  { value: 'mungbean', label: 'Mung Bean' },
  { value: 'blackgram', label: 'Black Gram' },
  { value: 'lentil', label: 'Lentil' },
  { value: 'pomegranate', label: 'Pomegranate' },
  { value: 'banana', label: 'Banana' },
  { value: 'mango', label: 'Mango' },
  { value: 'grapes', label: 'Grapes' },
  { value: 'watermelon', label: 'Watermelon' },
  { value: 'muskmelon', label: 'Muskmelon' },
  { value: 'apple', label: 'Apple' },
  { value: 'orange', label: 'Orange' },
  { value: 'papaya', label: 'Papaya' },
  { value: 'coconut', label: 'Coconut' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'jute', label: 'Jute' },
  { value: 'coffee', label: 'Coffee' }
];

const RecommendedFeatures = ({ viewMode }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Reports Data
  const reportCards = [
    { id: 1, title: t('weatherReportTitle') || "Weather Report", icon: "🌦️", description: t('weatherReportDesc') || "Get weather predictions and crop advisory tips.", route: "/weather" },
    { id: 2, title: t('soilReportTitle') || "Soil Report", icon: "🌱", description: t('soilReportDesc') || "Request physical soil tests and check report history.", route: "/testing" },
    { id: 3, title: t('priceReportTitle') || "Price Report", icon: "💰", description: t('priceReportDesc') || "Current market prices for agricultural produce.", route: "/mandi" },
    { id: 4, title: t('fertilizerReportTitle') || "Fertilizer Report", icon: "🧪", description: t('fertilizerReportDesc') || "Optimal fertilizer recommendations based on soil NPK.", route: "/fertilizer" }
  ];

  const filteredReportCards = viewMode === 'customer'
    ? reportCards.filter(card => card.id === 1)
    : reportCards;

  // Schemes Data
  const schemeCategories = [
    { id: 1, name: t('agriculture') || "Agriculture", schemes: 12, description: t('schemeAgricultureDesc') || "Government schemes for farmers and crop support." },
    { id: 2, name: t('finance') || "Finance", schemes: 15, description: t('schemeFinanceDesc') || "Financial support, loans, and loan waivers." },
    { id: 3, name: t('technology') || "Technology", schemes: 7, description: t('schemeTechnologyDesc') || "Subsidies for farm tractors and solar pumps." }
  ];

  // Helper to get fallback images or unsplash random image for custom categories
  const getCategoryImage = (categoryName) => {
    const defaults = {
      'Vegetables': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300',
      'Cereals': 'https://images.unsplash.com/photo-1601593768799-76d6d8cde7dc?w=300',
      'Pulses': 'https://images.unsplash.com/photo-1603048719537-7a7387dfb1e1?w=300',
      'Spices': 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=300'
    };
    if (defaults[categoryName]) return defaults[categoryName];
    return 'https://images.unsplash.com/photo-1500937386664-56d159062255?w=300';
  };

  const [activeListings, setActiveListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewCategory, setViewCategory] = useState('');
  
  const [newCrop, setNewCrop] = useState({
    crop: 'rice',
    category: 'Vegetables',
    qty: '',
    price: '',
    farmer: '',
    ph: '',
    imageUrl: '',
    categoryImageUrl: '',
    customCrop: '',
    customCategory: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);

  // Dynamically compute active crop categories
  const dynamicCategories = (() => {
    const defaultCategories = ['Vegetables', 'Cereals', 'Pulses', 'Spices'];
    
    // Combine fetched categories and any listing categories that might not be saved in Category model yet
    const combined = [...categories];
    activeListings.forEach(l => {
      if (l.category && !combined.some(c => c.name.toLowerCase() === l.category.toLowerCase())) {
        combined.push({
          name: l.category,
          imageUrl: l.categoryImageUrl || 'https://images.unsplash.com/photo-1500937386664-56d159062255?w=300'
        });
      }
    });

    // Filter to show only default categories OR categories that have at least one approved listing
    const filtered = combined.filter(cat => 
      defaultCategories.some(dc => dc.toLowerCase() === cat.name.toLowerCase()) ||
      activeListings.some(l => l.category.toLowerCase() === cat.name.toLowerCase())
    );

    return filtered.map((c, idx) => ({
      id: idx + 1,
      name: c.name,
      label: t(c.name.toLowerCase()) || c.name,
      image: c.imageUrl
    }));
  })();

  // Unique crops from default + active listings for select dropdown
  const dynamicCrops = (() => {
    const list = [...ALLOWED_CROPS];
    activeListings.forEach(l => {
      const normalizedListingCrop = l.crop.toLowerCase().replace(/\s+/g, '');
      const matchedAllowed = ALLOWED_CROPS.find(c => c.value === normalizedListingCrop || c.label.toLowerCase().replace(/\s+/g, '') === normalizedListingCrop);
      
      if (matchedAllowed) {
        return;
      }
      
      const displayVal = l.crop;
      const alreadyExists = list.some(c => c.value.toLowerCase() === displayVal.toLowerCase());
      if (!alreadyExists) {
        list.push({
          value: displayVal,
          label: displayVal
        });
      }
    });
    return list;
  })();

  // Unique categories list for select dropdown
  const dynamicCategoriesList = (() => {
    const defaultList = ['Vegetables', 'Cereals', 'Pulses', 'Spices'];
    const list = [...defaultList];
    
    categories.forEach(c => {
      if (c.name && !list.some(item => item.toLowerCase() === c.name.toLowerCase())) {
        list.push(c.name);
      }
    });

    activeListings.forEach(l => {
      if (l.category && !list.some(c => c.toLowerCase() === l.category.toLowerCase())) {
        list.push(l.category);
      }
    });
    return list;
  })();

  const handleCropImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingImage(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/crops/upload', {
        method: 'POST',
        headers: {
          'Authorization': token || ''
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setNewCrop(prev => ({ ...prev, imageUrl: data.imageUrl }));
        alert('Crop image uploaded successfully!');
      } else {
        alert(data.message || 'Image upload failed.');
      }
    } catch (err) {
      console.error('Error uploading crop image:', err);
      alert('Error uploading image to server.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCategoryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingCategoryImage(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/crops/upload', {
        method: 'POST',
        headers: {
          'Authorization': token || ''
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setNewCrop(prev => ({ ...prev, categoryImageUrl: data.imageUrl }));
        alert('Category thumbnail image uploaded successfully!');
      } else {
        alert(data.message || 'Image upload failed.');
      }
    } catch (err) {
      console.error('Error uploading category image:', err);
      alert('Error uploading category image to server.');
    } finally {
      setUploadingCategoryImage(false);
    }
  };

  const fetchListings = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/crops', {
        headers: {
          'Authorization': token || ''
        }
      });
      const data = await res.json();
      if (res.ok && data.listings) {
        const mapped = data.listings.map(l => ({
          id: l._id,
          crop: t(l.cropName.toLowerCase()) || l.cropName.charAt(0).toUpperCase() + l.cropName.slice(1),
          category: l.category,
          qty: `${l.quantity} ${t('listingsCount') || 'listings'}`,
          price: `${l.price}/q`,
          farmer: l.farmerName,
          ph: l.farmerPhone,
          imageUrl: l.imageUrl || '',
          categoryImageUrl: l.categoryImageUrl || ''
        }));
        setActiveListings(mapped);
      }
    } catch (err) {
      console.error('Error fetching crop listings:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    if (viewMode !== 'customer') return;
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products', {
        headers: { 'Authorization': localStorage.getItem('token') || '' }
      });
      const data = await res.json();
      if (res.ok && data.products) {
        setFeaturedProducts(data.products.slice(0, 3));
      }
    } catch (err) {
      console.error('Error fetching featured products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/crops/categories', {
        headers: { 'Authorization': token || '' }
      });
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleAddToCart = (product) => {
    const savedCart = localStorage.getItem('cart');
    let cart = [];
    try {
      cart = savedCart ? JSON.parse(savedCart) : [];
    } catch (err) {
      cart = [];
    }

    const exists = cart.find(item => item.id === product._id || item.id === product.id);
    if (exists) {
      cart = cart.map(item => (item.id === product._id || item.id === product.id) ? { ...item, qty: item.qty + 1 } : item);
    } else {
      cart.push({
        id: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        oldPrice: product.oldPrice,
        image: product.image,
        description: product.description,
        qty: 1
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${product.name} added to cart successfully! Go to the Deals Shop to checkout.`);
  };

  useEffect(() => {
    fetchListings();
    fetchFeaturedProducts();
    fetchCategories();
  }, [t, viewMode]);

  const handleAddCropSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const finalCrop = newCrop.crop === 'custom' ? newCrop.customCrop : newCrop.crop;
    const finalCategory = newCrop.category === 'custom' ? newCrop.customCategory : newCrop.category;

    if (!finalCrop || !finalCategory) {
      alert('Please fill out all required crop details.');
      return;
    }

    try {
      const res = await fetch('/api/crops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({
          cropName: finalCrop,
          category: finalCategory,
          quantity: Number(newCrop.qty),
          price: Number(newCrop.price),
          farmerName: newCrop.farmer,
          farmerPhone: newCrop.ph,
          imageUrl: newCrop.imageUrl || '',
          categoryImageUrl: newCrop.categoryImageUrl || ''
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Crop listing submitted successfully! It will appear in the marketplace once approved by the administrator.');
        setShowAddModal(false);
        setNewCrop({
          crop: 'rice',
          category: 'Vegetables',
          qty: '',
          price: '',
          farmer: '',
          ph: '',
          imageUrl: '',
          categoryImageUrl: '',
          customCrop: '',
          customCategory: ''
        });
        fetchListings();
        fetchCategories();
      } else {
        alert(data.message || 'Failed to post crop listing.');
      }
    } catch (err) {
      console.error('Error posting crop listing:', err);
      alert('Network error occurred.');
    }
  };

  return (
    <div className="recommended-features">
      <h2 className="section-title">{t('recommendedFeaturesTitle') || 'Recommended Features'}</h2>
      
      {/* Reports Card */}
      <div className="feature-card">
        <div className="card-header">
          <h3>{t('reports') || 'Reports'}</h3>
        </div>
        <p className="header-description">{t('reportsDesc') || 'Access various agricultural diagnostics and recommendations'}</p>
        <div className="report-cards">
          {filteredReportCards.map(report => (
            <div key={report.id} className="report-card" onClick={() => navigate(report.route)} style={{ cursor: 'pointer' }}>
              <div className="report-icon">{report.icon}</div>
              <div className="report-content">
                <h4>{report.title}</h4>
                <p>{report.description}</p>
                <div className="category-actions">
                  <button className="view-reports">{t('accessTool') || 'Access Tool'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Crop Listings Card */}
      <div className="feature-card">
        <div className="card-header">
          <h3>{t('cropListingsTitle') || 'Crop Listings'}</h3>
          {viewMode !== 'customer' && (
            <button className="btn btn-sm btn-outline-success" onClick={() => setShowAddModal(true)}>{t('postMyCrop') || '+ Post My Crop'}</button>
          )}
        </div>
        <p className="header-description">{t('cropListingsDesc') || 'Sell seeds or crops directly to other farmers and merchants'}</p>
        {loadingListings ? (
          <div className="text-center p-4 text-muted">{t('loadingCropListings') || 'Loading crop listings...'}</div>
        ) : (
          <div className="crop-categories">
            {dynamicCategories.map(category => (
              <div key={category.id} className="category-card">
                <div 
                  className="category-image"
                  style={{ backgroundImage: `url(${category.image})` }}
                >
                  <div className="items-count">{activeListings.filter(l => l.category === category.name).length} {t('listingsCount') || 'listings'}</div>
                </div>
                <h4>{category.label}</h4>
                <div className="category-actions">
                  <button className="view-items w-100" onClick={() => { setViewCategory(category.name); setShowViewModal(true); }}>{t('viewPostings') || 'View Postings'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Schemes Card */}
      {viewMode !== 'customer' && (
        <div className="feature-card">
          <div className="card-header">
            <h3>{t('schemes') || 'Schemes & Subsidies'}</h3>
            <a href="/subsidies" className="view-more">{t('viewMore') || 'View More →'}</a>
          </div>
          <div className="scheme-categories">
            {schemeCategories.map(scheme => (
              <div key={scheme.id} className="scheme-card" onClick={() => navigate('/subsidies?category=' + encodeURIComponent(scheme.name))} style={{ cursor: 'pointer' }}>
                <div className="scheme-info">
                  <h4>{scheme.name}</h4>
                  <p className="schemes-count">{scheme.schemes} {t('schemesAvailable') || 'schemes available'}</p>
                  <p className="scheme-description">{scheme.description}</p>
                </div>
                <button className="view-details">{t('checkMatching') || 'Check Matching'}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Shop Products Card (Only for Customers) */}
      {viewMode === 'customer' && (
        <div className="feature-card animate-fade-in">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="fw-bold text-success">🛍️ {t('featuredDeals') || 'Featured Deals Shop'}</h3>
            <button className="btn btn-sm btn-success px-3 fw-bold" onClick={() => navigate('/shop')} style={{ borderRadius: '8px' }}>
              {t('visitShop') || 'Explore All Deals in Shop →'}
            </button>
          </div>
          <p className="header-description">{t('shopSubtitle') || 'Purchase agricultural seeds, bio-fertilizers, and tools at discounted prices'}</p>
          
          {loadingProducts ? (
            <div className="text-center p-4 text-muted">{t('loadingProducts') || 'Loading featured products...'}</div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center p-4 text-muted">{t('noProductsFound') || 'No products available currently.'}</div>
          ) : (
            <div className="row g-3 mt-1">
              {featuredProducts.map((prod) => (
                <div key={prod._id || prod.id} className="col-md-4 col-sm-6">
                  <div className="card h-100 border-0 shadow-sm" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden' }}>
                    <img src={prod.image} className="card-img-top" alt={prod.name} style={{ height: '150px', objectFit: 'cover' }} />
                    <div className="card-body d-flex flex-column" style={{ padding: '15px' }}>
                      <span className="badge bg-success align-self-start mb-2" style={{ fontSize: '10px' }}>{prod.category}</span>
                      <h5 className="card-title fw-bold" style={{ fontSize: '1rem', color: 'var(--text-color)' }}>{prod.name}</h5>
                      <p className="card-text text-muted small flex-grow-1" style={{ fontSize: '0.8rem' }}>{prod.description}</p>
                      
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          <span className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>₹{prod.price}</span>
                          <small className="text-decoration-line-through text-muted ms-2" style={{ fontSize: '0.8rem' }}>₹{prod.oldPrice}</small>
                        </div>
                        <button className="btn btn-sm btn-success px-3" onClick={() => handleAddToCart(prod)} style={{ borderRadius: '6px', fontSize: '0.85rem' }}>
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Add Crop Listing */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}>
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-success">{t('postCropModalTitle') || 'Post Crop / Seed for Sale'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} style={{ filter: 'var(--is-dark) ? "invert(1)" : "none"' }}></button>
              </div>
              <form onSubmit={handleAddCropSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small">{t('selectCrop') || 'Crop Name'}</label>
                    <select className="form-select mb-2" value={newCrop.crop} onChange={e => setNewCrop({...newCrop, crop: e.target.value})} style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}>
                      {dynamicCrops.map(c => (
                        <option key={c.value} value={c.value} style={{ background: 'var(--bg-card)', color: 'var(--text-body)' }}>{t(c.value) || c.label}</option>
                      ))}
                      <option value="custom" style={{ background: 'var(--bg-card)', color: 'var(--text-color)', fontWeight: 'bold' }}>+ Other (Add Custom Crop)</option>
                    </select>
                    {newCrop.crop === 'custom' && (
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter dynamic crop name (e.g. Wheat)" 
                        value={newCrop.customCrop} 
                        onChange={e => setNewCrop({...newCrop, customCrop: e.target.value})}
                        required
                        style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                      />
                    )}
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small">{t('cropCategory') || 'Category'}</label>
                      <select className="form-select mb-2" value={newCrop.category} onChange={e => setNewCrop({...newCrop, category: e.target.value})} style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}>
                        {dynamicCategoriesList.map(cat => (
                          <option key={cat} value={cat}>{t(cat.toLowerCase()) || cat}</option>
                        ))}
                        <option value="custom" style={{ color: 'var(--text-color)', fontWeight: 'bold' }}>+ Other (Add Custom Category)</option>
                      </select>
                      {newCrop.category === 'custom' && (
                        <div className="mt-2">
                          <input 
                            type="text" 
                            className="form-control mb-2" 
                            placeholder="Enter new category name" 
                            value={newCrop.customCategory} 
                            onChange={e => setNewCrop({...newCrop, customCategory: e.target.value})}
                            required
                            style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                          />
                          <label className="form-label small mb-1 text-success fw-bold">Category Thumbnail Image</label>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="form-control form-control-sm" 
                            onChange={handleCategoryImageUpload}
                            disabled={uploadingCategoryImage}
                            required={!newCrop.categoryImageUrl}
                            style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}
                          />
                          {uploadingCategoryImage && (
                            <div className="d-flex align-items-center gap-2 py-1 mt-1">
                              <span className="spinner-border spinner-border-sm text-success" role="status"></span>
                              <span className="small text-muted" style={{ fontSize: '0.78rem' }}>Uploading...</span>
                            </div>
                          )}
                          {newCrop.categoryImageUrl && (
                            <div className="mt-1 d-flex align-items-center gap-2">
                              <img src={newCrop.categoryImageUrl} alt="Category Preview" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />
                              <span className="small text-success" style={{ fontSize: '0.78rem' }}>✓ Uploaded</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-6">
                      <label className="form-label small">{t('farmerLabel') || 'Farmer Name'}</label>
                      <input type="text" className="form-control" placeholder={t('namePlaceholder') || 'Your name'} value={newCrop.farmer} onChange={e => setNewCrop({...newCrop, farmer: e.target.value})} required style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }} />
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small">{t('quantityQuintals') || 'Quantity (Quintals)'}</label>
                      <input type="number" className="form-control" placeholder="e.g. 50" value={newCrop.qty} onChange={e => setNewCrop({...newCrop, qty: e.target.value})} required style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">{t('pricePerQuintal') || 'Expected Price (₹/q)'}</label>
                      <input type="number" className="form-control" placeholder="e.g. 2100" value={newCrop.price} onChange={e => setNewCrop({...newCrop, price: e.target.value})} required style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">{t('phoneLabel') || 'Contact Mobile Number'}</label>
                    <input type="text" className="form-control" placeholder="e.g. +91 9876543210" value={newCrop.ph} onChange={e => setNewCrop({...newCrop, ph: e.target.value})} required style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Product Image (Cloudinary)</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="form-control" 
                      onChange={handleCropImageUpload}
                      disabled={uploadingImage}
                      style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                    />
                    {uploadingImage && (
                      <div className="d-flex align-items-center gap-2 py-1 mt-1">
                        <span className="spinner-border spinner-border-sm text-success" role="status"></span>
                        <span className="small text-muted">Uploading image to Cloudinary...</span>
                      </div>
                    )}
                    {newCrop.imageUrl && (
                      <div className="mt-2 d-flex align-items-center gap-2">
                        <img src={newCrop.imageUrl} alt="Crop Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                        <span className="small text-success">✓ Image uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowAddModal(false)}>{t('close') || 'Cancel'}</button>
                  <button type="submit" className="btn btn-success">{t('postListing') || 'Publish Listing'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: View Crop Postings */}
      {showViewModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}>
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-success">{t('cropPostingsFor') || 'Crop Postings for'} {t(viewCategory.toLowerCase()) || viewCategory}</h5>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)} style={{ filter: 'var(--is-dark) ? "invert(1)" : "none"' }}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <div className="table-responsive">
                  <table className="table align-middle" style={{ color: 'var(--text-body)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th>{t('mandiTableCrop') || 'Crop'}</th>
                        <th>{t('farmerLabel') || 'Seller / Farmer'}</th>
                        <th>{t('qtyLabel') || 'Stock Available'}</th>
                        <th>{t('priceLabel') || 'Price (₹/q)'}</th>
                        <th>{t('contact') || 'Contact'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeListings.filter(l => l.category === viewCategory).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">{t('noPostingsInCategory') || 'No postings in this category yet. Be the first to publish one!'}</td>
                        </tr>
                      ) : (
                        activeListings.filter(l => l.category === viewCategory).map(l => (
                          <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td className="fw-bold d-flex align-items-center gap-2">
                              {l.imageUrl ? (
                                <img src={l.imageUrl} alt={l.crop} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px' }} />
                              ) : (
                                <span style={{ fontSize: '1.4rem' }}>🌱</span>
                              )}
                              <span>{l.crop}</span>
                            </td>
                            <td>{l.farmer}</td>
                            <td>{l.qty}</td>
                            <td className="text-success fw-bold">₹{l.price}</td>
                            <td>
                              <a href={`tel:${l.ph}`} className="btn btn-sm btn-success">{l.ph}</a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowViewModal(false)}>{t('close') || 'Close'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecommendedFeatures;