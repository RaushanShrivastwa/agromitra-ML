import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { FaUserShield, FaUsers, FaClipboardList, FaFileContract, FaBan, FaCheck, FaTimes, FaSpinner, FaBell, FaShoppingCart, FaBox, FaPlus, FaEdit, FaTrash, FaSun, FaMoon } from 'react-icons/fa';

export default function Admin() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [queries, setQueries] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [approveSearch, setApproveSearch] = useState({});
  const [optimizingQueryId, setOptimizingQueryId] = useState(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', keywords: '' });
  const [retraining, setRetraining] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState({ message: '', targetRole: 'All' });
  const [broadcasting, setBroadcasting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Seeds', price: '', oldPrice: '', rating: '', image: '', description: '', inStock: true });
  const [editingProduct, setEditingProduct] = useState(null);
  const [crops, setCrops] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', imageUrl: '' });
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);

  // Soil Request Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [testResults, setTestResults] = useState({
    nitrogen: '',
    phosphorous: '',
    potassium: '',
    ph: '',
    moisture: '',
    soilType: 'Sandy',
    cropType: 'Wheat',
    temperature: '',
    humidity: '',
    remarks: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      if (activeTab === 'users') {
        const res = await fetch('/api/admin/users', { headers: { 'Authorization': token } });
        const data = await res.json();
        setUsers(data.users || []);
      } else if (activeTab === 'requests') {
        const res = await fetch('/api/admin/soil-requests', { headers: { 'Authorization': token } });
        const data = await res.json();
        setRequests(data.requests || []);
      } else if (activeTab === 'logs') {
        const res = await fetch('/api/admin/logs', { headers: { 'Authorization': token } });
        const data = await res.json();
        setLogs(data.logs || []);
        setSessions(data.sessions || []);
      } else if (activeTab === 'queries') {
        const res = await fetch('/api/queries', { headers: { 'Authorization': token } });
        const data = await res.json();
        setQueries(data.queries || []);
      } else if (activeTab === 'faqs') {
        const res = await fetch('/api/faqs', { headers: { 'Authorization': token } });
        const data = await res.json();
        setFaqs(data.faqs || []);
      } else if (activeTab === 'notifications') {
        const res = await fetch('/api/notifications', { headers: { 'Authorization': token } });
        const data = await res.json();
        setNotifications(data.notifications || []);
      } else if (activeTab === 'orders') {
        const res = await fetch('/api/admin/orders', { headers: { 'Authorization': token } });
        const data = await res.json();
        setOrders(data.orders || []);
      } else if (activeTab === 'products') {
        const res = await fetch('/api/admin/products', { headers: { 'Authorization': token } });
        const data = await res.json();
        setProducts(data.products || []);
      } else if (activeTab === 'crops') {
        const res = await fetch('/api/admin/crops', { headers: { 'Authorization': token } });
        const data = await res.json();
        setCrops(data.crops || []);
      } else if (activeTab === 'categories') {
        const res = await fetch('/api/crops/categories', { headers: { 'Authorization': token } });
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadingImage(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/products/upload', {
        method: 'POST',
        headers: {
          'Authorization': token
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        if (editingProduct) {
          setEditingProduct({ ...editingProduct, image: data.imageUrl });
        } else {
          setNewProduct({ ...newProduct, image: data.imageUrl });
        }
        alert('Image uploaded successfully to Cloudinary!');
      } else {
        alert(data.message || 'Image upload failed.');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Error uploading image to server.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCategoryImageUpload = async (e, categoryName) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadingCategoryImage(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/products/upload', {
        method: 'POST',
        headers: {
          'Authorization': token
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        if (categoryName === 'new') {
          setNewCategory(prev => ({ ...prev, imageUrl: data.imageUrl }));
          alert('Category image uploaded successfully!');
        } else {
          // Immediately update category image in database
          const updateRes = await fetch('/api/admin/categories', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token
            },
            body: JSON.stringify({ name: categoryName, imageUrl: data.imageUrl })
          });
          const updateData = await updateRes.json();
          if (updateRes.ok) {
            alert(`Category "${categoryName}" thumbnail updated successfully!`);
            fetchData();
          } else {
            alert(updateData.message || 'Failed to save category thumbnail.');
          }
        }
      } else {
        alert(data.message || 'Image upload failed.');
      }
    } catch (err) {
      console.error('Error uploading category image:', err);
      alert('Error uploading image to server.');
    } finally {
      setUploadingCategoryImage(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim() || !newCategory.imageUrl) {
      alert('Name and Image are required.');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ name: newCategory.name.trim(), imageUrl: newCategory.imageUrl })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Category created/updated successfully!');
        setNewCategory({ name: '', imageUrl: '' });
        fetchData();
      } else {
        alert(data.message || 'Failed to save category.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving category.');
    }
  };

  const handleCropApproval = async (cropId, status) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/crops/${cropId}/approval`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Crop listing status updated to ${status}`);
        fetchData();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating crop approval status');
    }
  };

  const handleDeleteCrop = async (cropId) => {
    if (!window.confirm('Are you sure you want to delete this crop listing?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/crops/${cropId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Crop listing deleted successfully');
        fetchData();
      } else {
        alert(data.message || 'Failed to delete crop listing');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting crop listing');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(newProduct)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Product created successfully');
        setNewProduct({ name: '', category: 'Seeds', price: '', oldPrice: '', rating: '', image: '', description: '', inStock: true });
        fetchData();
      } else {
        alert(data.message || 'Failed to create product');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating product');
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(editingProduct)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Product updated successfully');
        setEditingProduct(null);
        fetchData();
      } else {
        alert(data.message || 'Failed to update product');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Product deleted successfully');
        fetchData();
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting product');
    }
  };

  const handleToggleBan = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: { 'Authorization': localStorage.getItem('token') }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      alert('Error changing user status');
    }
  };

  const handleOpenReportModal = (req) => {
    setSelectedReq(req);
    setTestResults({
      nitrogen: req.nitrogen !== null && req.nitrogen !== undefined ? req.nitrogen.toString() : '',
      phosphorous: req.phosphorous !== null && req.phosphorous !== undefined ? req.phosphorous.toString() : '',
      potassium: req.potassium !== null && req.potassium !== undefined ? req.potassium.toString() : '',
      ph: req.ph !== null && req.ph !== undefined ? req.ph.toString() : '',
      moisture: req.moisture !== null && req.moisture !== undefined ? req.moisture.toString() : '',
      soilType: req.soilType || 'Sandy',
      cropType: req.cropType || 'Wheat',
      temperature: req.temperature !== null && req.temperature !== undefined ? req.temperature.toString() : '',
      humidity: req.humidity !== null && req.humidity !== undefined ? req.humidity.toString() : '',
      remarks: req.remarks || ''
    });
    setShowModal(true);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/soil-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert(`Status updated to ${status}`);
        fetchData();
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert(`Order status successfully updated to ${status}`);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Error updating order status');
      }
    } catch (err) {
      alert('Error updating order status');
    }
  };

  const handleSubmitResults = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/soil-requests/${selectedReq._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({
          status: 'Completed',
          ...testResults
        })
      });
      if (res.ok) {
        alert('Soil Report submitted successfully!');
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      alert('Error submitting soil report');
    }
  };

  const handleAnswerQuery = async (id) => {
    try {
      const res = await fetch(`/api/queries/${id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({
          answer: replyText[id] || '',
          approvedForSearch: approveSearch[id] || false
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Query answered successfully!');
        fetchData();
      } else {
        alert(data.message || 'Failed to answer query');
      }
    } catch (err) {
      alert('Error answering query');
    }
  };

  const handleDeleteQuery = async (id) => {
    if (!window.confirm('Are you sure you want to delete this query?')) return;
    try {
      const res = await fetch(`/api/queries/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': localStorage.getItem('token') }
      });
      if (res.ok) {
        alert('Query deleted successfully!');
        fetchData();
      }
    } catch (err) {
      alert('Error deleting query');
    }
  };

  const handleOptimizeWithAI = async (id, message) => {
    setOptimizingQueryId(id);
    try {
      const res = await fetch('/api/queries/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      if (res.ok) {
        setReplyText({ ...replyText, [id]: data.optimizedAnswer });
        alert(`AI Optimization complete! Question was optimized and reply drafted.`);
      } else {
        alert(data.message || 'AI optimization failed');
      }
    } catch (err) {
      alert('AI optimization error');
    } finally {
      setOptimizingQueryId(null);
    }
  };

  const handleCreateFaq = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify(newFaq)
      });
      if (res.ok) {
        alert('Formal FAQ created successfully!');
        setNewFaq({ question: '', answer: '', keywords: '' });
        fetchData();
      }
    } catch (err) {
      alert('Error creating FAQ');
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      const res = await fetch(`/api/faqs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': localStorage.getItem('token') }
      });
      if (res.ok) {
        alert('FAQ deleted successfully!');
        fetchData();
      }
    } catch (err) {
      alert('Error deleting FAQ');
    }
  };

  const handleRetrainModel = async () => {
    setRetraining(true);
    try {
      const res = await fetch('/api/ml/retrain', {
        method: 'POST',
        headers: { 'Authorization': localStorage.getItem('token') }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'ML Model retrained successfully on the fly!');
      } else {
        alert(data.message || 'Retraining failed');
      }
    } catch (err) {
      alert('Error connecting to ML service retraining endpoint');
    } finally {
      setRetraining(false);
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    if (!newNotification.message.trim()) return;
    setBroadcasting(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({
          message: newNotification.message.trim(),
          targetRole: newNotification.targetRole
        })
      });
      if (res.ok) {
        alert('Notification broadcasted successfully!');
        setNewNotification({ message: '', targetRole: 'All' });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Broadcast failed');
      }
    } catch (err) {
      alert('Error broadcasting notification');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': localStorage.getItem('token') }
      });
      if (res.ok) {
        alert('Notification deleted successfully!');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete notification');
      }
    } catch (err) {
      alert('Error deleting notification');
    }
  };

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-body)' }}>
      <style>{`
        .admin-sidebar-btn {
          color: #198754 !important;
          background: transparent !important;
          border: none !important;
          padding: 12px 15px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          text-align: left !important;
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.2s ease !important;
        }
        .admin-sidebar-btn:hover {
          background-color: rgba(25, 135, 84, 0.1) !important;
          color: #198754 !important;
        }
        .admin-sidebar-btn.active {
          background-color: #198754 !important;
          color: #ffffff !important;
        }
        .admin-sidebar-btn:focus, .admin-sidebar-btn:active {
          outline: none !important;
          box-shadow: none !important;
        }
        .admin-back-link {
          color: var(--text-muted) !important;
          text-decoration: none;
          padding: 8px 15px;
          display: block;
          font-size: 0.9rem;
          transition: color 0.2s;
          border-radius: 6px;
        }
        .admin-back-link:hover {
          color: var(--text-color) !important;
          background-color: rgba(25, 135, 84, 0.05);
        }
      `}</style>
      <div className="container-fluid p-0">
        {/* Admin Header */}
        <header className="navbar navbar-dark sticky-top bg-success flex-md-nowrap p-3 shadow">
          <span className="navbar-brand col-md-3 col-lg-2 me-0 px-3 fs-4 fw-bold">
            <FaUserShield className="me-2" /> AgroMitra Admin Console
          </span>
          <div className="navbar-nav">
            <div className="nav-item text-nowrap d-flex align-items-center gap-3">
              {/* Theme Toggle */}
              <button 
                className="btn btn-link text-white p-0 fs-5 d-flex align-items-center me-2" 
                onClick={toggleTheme} 
                title="Toggle Theme"
                style={{ border: 'none', background: 'transparent' }}
              >
                {isDark ? <FaSun /> : <FaMoon />}
              </button>
              <span className="text-white">Admin: {user?.email}</span>
              <button className="btn btn-outline-light btn-sm me-3" onClick={logout}>Sign out</button>
            </div>
          </div>
        </header>

        <div className="row g-0">
          {/* Sidebar Nav */}
          <nav className="col-md-3 col-lg-2 d-md-block sidebar collapse" style={{ background: 'var(--bg-card)', minHeight: 'calc(100vh - 70px)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="position-sticky pt-3">
              <ul className="nav flex-column gap-1 px-2">
                <li className="nav-item">
                  <button 
                    className={`admin-sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                  >
                    <FaUsers className="me-2" /> User Management
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`admin-sidebar-btn ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                  >
                    <FaClipboardList className="me-2" /> Request Management
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`admin-sidebar-btn ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                  >
                    <FaFileContract className="me-2" /> Security & Activity Logs
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`admin-sidebar-btn ${activeTab === 'queries' ? 'active' : ''}`}
                    onClick={() => setActiveTab('queries')}
                  >
                    <FaClipboardList className="me-2" /> Customer Inquiries
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`admin-sidebar-btn ${activeTab === 'faqs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('faqs')}
                  >
                    <FaUserShield className="me-2" /> FAQ Management
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`admin-sidebar-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    <FaBell className="me-2" /> Notification Broadcast
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`admin-sidebar-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                  >
                    <FaShoppingCart className="me-2" /> Order Management
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`admin-sidebar-btn ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                  >
                    <FaBox className="me-2" /> Product Catalog
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`admin-sidebar-btn ${activeTab === 'crops' ? 'active' : ''}`}
                    onClick={() => setActiveTab('crops')}
                  >
                    <FaClipboardList className="me-2" /> Crop Approvals
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`admin-sidebar-btn ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                  >
                    <FaClipboardList className="me-2" /> Manage Categories
                  </button>
                </li>
                <li className="nav-item mt-4 border-top pt-3">
                  <a href="/dashboard" className="admin-back-link mb-1">
                    ← Back to Farmer Dashboard
                  </a>
                  <a 
                    href="/dashboard" 
                    className="admin-back-link"
                    onClick={() => localStorage.setItem('admin_dashboard_view', 'customer')}
                  >
                    ← Back to Customer Dashboard
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          {/* Main Dashboard Section */}
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            <h2 className="fw-bold mb-4">
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'requests' && 'Soil Testing Requests'}
              {activeTab === 'logs' && 'System Activity Logs'}
              {activeTab === 'queries' && 'Customer Support Inquiries'}
              {activeTab === 'faqs' && 'FAQ & ML Retraining Console'}
              {activeTab === 'notifications' && 'Notification Broadcast Console'}
              {activeTab === 'orders' && 'Order Fulfillment & Management'}
              {activeTab === 'products' && 'Product Catalog Management'}
              {activeTab === 'crops' && 'Farmer Crop Listing Approvals'}
              {activeTab === 'categories' && 'Crop Categories Management'}
            </h2>

            {loading ? (
              <div className="text-center py-5">
                <FaSpinner className="spinner-border text-success" />
              </div>
            ) : (
              <div className="card shadow-sm border-0 p-4" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', borderRadius: '15px' }}>
                
                {/* Tab 1: Users */}
                {activeTab === 'users' && (
                  <div className="table-responsive">
                    <table className="table align-middle" style={{ color: 'var(--text-body)' }}>
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td>{u.username}</td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>{u.role}</span>
                            </td>
                            <td>
                              {u.banned ? (
                                <span className="badge bg-danger">Banned</span>
                              ) : (
                                <span className="badge bg-success">Active</span>
                              )}
                            </td>
                            <td className="text-end">
                              <button 
                                className={`btn btn-sm ${u.banned ? 'btn-outline-success' : 'btn-outline-danger'}`}
                                onClick={() => handleToggleBan(u._id)}
                              >
                                <FaBan className="me-1" /> {u.banned ? 'Unban' : 'Ban'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 2: Requests */}
                {activeTab === 'requests' && (
                  <div className="table-responsive">
                    <table className="table align-middle" style={{ color: 'var(--text-body)' }}>
                      <thead>
                        <tr>
                          <th>Farmer</th>
                          <th>Pickup Address</th>
                          <th>Collection Date</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map(req => (
                          <tr key={req._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td>
                              <strong>{req.userId?.username}</strong>
                              <small className="text-muted d-block">{req.userId?.email}</small>
                            </td>
                            <td>{req.address}</td>
                            <td>{new Date(req.collectionDate).toLocaleDateString()}</td>
                            <td>
                              <span className="badge bg-secondary">{req.status}</span>
                            </td>
                            <td className="text-end d-flex gap-2 justify-content-end">
                              {req.status === 'Pending' && (
                                <button className="btn btn-sm btn-outline-warning" onClick={() => handleUpdateStatus(req._id, 'Collected')}>
                                  Mark Collected
                                </button>
                              )}
                              {req.status === 'Collected' && (
                                <button className="btn btn-sm btn-outline-info" onClick={() => handleUpdateStatus(req._id, 'Analyzing')}>
                                  Start Analysis
                                </button>
                              )}
                              {req.status === 'Analyzing' && (
                                <button className="btn btn-sm btn-success" onClick={() => handleOpenReportModal(req)}>
                                  Upload Report
                                </button>
                              )}
                              {req.status === 'Completed' && (
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleOpenReportModal(req)}>
                                  Edit Report
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 3: Logs */}
                {activeTab === 'logs' && (
                  <div className="row g-4">
                    <div className="col-md-6 border-end security-audits-section" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <h4 className="fw-bold mb-3 text-success">Security Audits</h4>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <ul className="list-group list-group-flush">
                          {logs.map((log, idx) => (
                            <li key={idx} className="list-group-item bg-transparent border-0 text-body px-0 py-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <small className="text-success fw-bold">{new Date(log.timestamp).toLocaleString()}</small>
                                <span className={`badge ${log.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '9px' }}>
                                  {log.status || 'Completed'}
                                </span>
                              </div>
                              <span className="text-body"><strong>{log.userId?.username || 'User'}</strong>: {log.action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="col-md-6 session-analytics-section">
                      <h4 className="fw-bold mb-3 text-success">Session Analytics</h4>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <ul className="list-group list-group-flush">
                          {sessions.map((sess, idx) => (
                            <li key={idx} className="list-group-item bg-transparent border-0 text-body px-0 py-2">
                              <small className="text-info fw-bold d-block">Login: {new Date(sess.loginTime).toLocaleString()}</small>
                              <span><strong>{sess.userId?.username || 'User'}</strong> ({sess.userId?.email}) initiated active session.</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Contact Queries */}
                {activeTab === 'queries' && (
                  <div className="queries-section">
                    <h4 className="fw-bold mb-4 text-success">User Contact Queries</h4>
                    {queries.length === 0 ? (
                      <div className="text-muted p-3 text-center">No queries submitted yet.</div>
                    ) : (
                      <div className="d-flex flex-column gap-4" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {queries.map((q) => (
                          <div key={q._id} className="card bg-transparent border p-3 rounded-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h5 className="fw-bold text-success mb-1">{q.subject || 'Support Query'}</h5>
                                <small className="text-muted">From: <strong>{q.name}</strong> ({q.email})</small>
                              </div>
                              <span className={`badge ${q.status === 'Answered' ? 'bg-success' : 'bg-warning'}`}>
                                {q.status}
                              </span>
                            </div>
                            <p className="mb-3 text-body p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>{q.message}</p>
                            
                            {q.status === 'Answered' ? (
                              <div className="p-3 rounded" style={{ background: 'rgba(25, 135, 84, 0.05)' }}>
                                <strong>Answered:</strong> <p className="mb-0 mt-1 text-body">{q.answer}</p>
                                {q.approvedForSearch && <small className="badge bg-success mt-2">Approved for FAQ ML Search</small>}
                              </div>
                            ) : (
                              <div className="mt-2">
                                <div className="d-flex gap-2 align-items-center mb-3">
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => handleOptimizeWithAI(q._id, q.message)}
                                    disabled={optimizingQueryId === q._id}
                                  >
                                    {optimizingQueryId === q._id ? 'Optimizing...' : 'Optimize with Gemini AI'}
                                  </button>
                                  <div className="form-check form-switch ms-3">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      id={`search-check-${q._id}`}
                                      checked={approveSearch[q._id] || false}
                                      onChange={(e) => setApproveSearch({ ...approveSearch, [q._id]: e.target.checked })}
                                    />
                                    <label className="form-check-label text-body small" htmlFor={`search-check-${q._id}`}>
                                      Approve for Search Index
                                    </label>
                                  </div>
                                </div>
                                <textarea
                                  className="form-control mb-2"
                                  placeholder="Write a response..."
                                  value={replyText[q._id] || ''}
                                  onChange={(e) => setReplyText({ ...replyText, [q._id]: e.target.value })}
                                  style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                                  rows="3"
                                ></textarea>
                                <div className="d-flex gap-2">
                                  <button className="btn btn-sm btn-success fw-bold" onClick={() => handleAnswerQuery(q._id)}>
                                    Send Response
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteQuery(q._id)}>
                                    Delete Inquiry
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 5: FAQ & Retraining Console */}
                {activeTab === 'faqs' && (
                  <div className="faqs-section">
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <h4 className="fw-bold mb-0 text-success">Manage Formal FAQs</h4>
                      <button 
                        className="btn btn-success fw-bold d-flex align-items-center gap-2"
                        onClick={handleRetrainModel}
                        disabled={retraining}
                      >
                        {retraining ? 'Retraining Model...' : 'Retrain FAQ Model'}
                      </button>
                    </div>

                    <div className="row g-4">
                      {/* Create FAQ Form */}
                      <div className="col-md-5">
                        <div className="p-3 border rounded-3" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)' }}>
                          <h5 className="fw-bold text-success mb-3">Add Custom FAQ</h5>
                          <form onSubmit={handleCreateFaq}>
                            <div className="mb-3">
                              <label className="form-label small fw-semibold">Question</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter question..."
                                value={newFaq.question}
                                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                                required
                                style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label small fw-semibold">Answer</label>
                              <textarea
                                className="form-control"
                                placeholder="Enter answer..."
                                rows="4"
                                value={newFaq.answer}
                                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                                required
                                style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                              ></textarea>
                            </div>
                            <div className="mb-3">
                              <label className="form-label small fw-semibold">Keywords (comma-separated)</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. build, who, team, weather"
                                value={newFaq.keywords}
                                onChange={(e) => setNewFaq({ ...newFaq, keywords: e.target.value })}
                                style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                              />
                            </div>
                            <button type="submit" className="btn btn-success w-100 fw-bold">
                              Save FAQ Entry
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* FAQs list for delete */}
                      <div className="col-md-7 admin-faq-list">
                        <h5 className="fw-bold text-success mb-3">Existing Formal FAQs</h5>
                        {faqs.length === 0 ? (
                          <div className="text-muted small">No formal FAQs listed. Add one using the form on the left.</div>
                        ) : (
                          <div style={{ maxHeight: '450px', overflowY: 'auto' }} className="pe-2">
                            <ul className="list-group list-group-flush">
                              {faqs.map((faq) => (
                                <li key={faq._id} className="list-group-item bg-transparent px-0 py-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="pe-3">
                                      <strong className="text-body d-block mb-1">{faq.question}</strong>
                                      <p className="text-body small mb-1">{faq.answer}</p>
                                      {faq.keywords && faq.keywords.length > 0 && (
                                        <small className="text-success fw-semibold">Keywords: {faq.keywords.join(', ')}</small>
                                      )}
                                    </div>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteFaq(faq._id)}>
                                      Delete
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 6: Notifications */}
                {activeTab === 'notifications' && (
                  <div className="notifications-management-section">
                    <h4 className="fw-bold mb-4 text-success">Broadcast Notifications to Users</h4>
                    <div className="row g-4">
                      {/* Broadcast Form */}
                      <div className="col-md-5">
                        <div className="p-3 border rounded-3" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)' }}>
                          <h5 className="fw-bold text-success mb-3">New Broadcast</h5>
                          <form onSubmit={handleCreateNotification}>
                            <div className="mb-3">
                              <label className="form-label small fw-semibold">Target Audience</label>
                              <select 
                                className="form-select" 
                                value={newNotification.targetRole}
                                onChange={(e) => setNewNotification({ ...newNotification, targetRole: e.target.value })}
                                style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                              >
                                <option value="All">All Users</option>
                                <option value="Farmer">Farmers Only</option>
                                <option value="Customer">Customers Only</option>
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="form-label small fw-semibold">Broadcast Message</label>
                              <textarea
                                className="form-control"
                                placeholder="Enter notification message..."
                                rows="4"
                                value={newNotification.message}
                                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                                required
                                style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                              ></textarea>
                            </div>
                            <button type="submit" className="btn btn-success w-100 fw-bold" disabled={broadcasting}>
                              {broadcasting ? 'Broadcasting...' : 'Send Broadcast'}
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Active broadcasts list */}
                      <div className="col-md-7">
                        <h5 className="fw-bold text-success mb-3">Active Broadcasts</h5>
                        {notifications.length === 0 ? (
                          <div className="text-muted small">No active notifications broadcasted.</div>
                        ) : (
                          <div style={{ maxHeight: '450px', overflowY: 'auto' }} className="pe-2">
                            <ul className="list-group list-group-flush">
                              {notifications.map((notif) => (
                                <li key={notif._id} className="list-group-item bg-transparent px-0 py-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="pe-3">
                                      <div className="d-flex gap-2 align-items-center mb-1">
                                        <span className={`badge ${notif.targetRole === 'All' ? 'bg-primary' : notif.targetRole === 'Farmer' ? 'bg-success' : 'bg-info text-dark'}`}>
                                          To: {notif.targetRole}
                                        </span>
                                        <small className="text-muted">{new Date(notif.createdAt).toLocaleString()}</small>
                                      </div>
                                      <p className="text-body small mb-0">{notif.message}</p>
                                    </div>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteNotification(notif._id)}>
                                      Delete
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 7: Orders */}
                {activeTab === 'orders' && (
                  <div className="table-responsive animate__animated animate__fadeIn">
                    <table className="table align-middle" style={{ color: 'var(--text-body)' }}>
                      <thead>
                        <tr>
                          <th>Order Date</th>
                          <th>Customer Details</th>
                          <th>Items Ordered</th>
                          <th>Total Price</th>
                          <th>Shipping Details</th>
                          <th>Status</th>
                          <th className="text-end">Razorpay ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-4 text-muted">No orders found on the system.</td>
                          </tr>
                        ) : (
                          orders.map(order => (
                            <tr key={order._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td className="order-customer-details">
                                <strong className="text-body">{order.userId?.username || 'Guest'}</strong>
                                <small className="text-muted d-block">{order.userId?.email || 'N/A'}</small>
                              </td>
                              <td>
                                <div className="d-flex flex-column gap-1">
                                  {order.items.map((it, idx) => (
                                    <div key={idx} className="small">
                                      {it.name} <span className="text-success fw-bold">x{it.qty}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="fw-bold text-success">₹{order.totalAmount.toLocaleString()}</td>
                              <td className="order-shipping-details">
                                {order.shippingDetails ? (
                                  <div style={{ fontSize: '0.8rem', maxWidth: '200px' }}>
                                    <strong className="text-body">{order.shippingDetails.fullName}</strong> ({order.shippingDetails.phone})
                                    <div className="text-body text-truncate" title={order.shippingDetails.address}>{order.shippingDetails.address}</div>
                                  </div>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>
                                <select 
                                  className="form-select form-select-sm fw-semibold" 
                                  value={order.status}
                                  onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                  style={{
                                    background: order.status === 'Delivered' ? '#198754' : order.status === 'Cancelled' ? '#dc3545' : order.status === 'Shipped' ? '#0dcaf0' : '#ffc107',
                                    color: order.status === 'Delivered' || order.status === 'Cancelled' ? '#fff' : '#000',
                                    border: 'none',
                                    borderRadius: '6px',
                                    width: '130px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="text-end">
                                <span className="text-body small text-monospace">{order.razorpayOrderId}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 8: Products */}
                {activeTab === 'products' && (
                  <div className="animate__animated animate__fadeIn">
                    {/* Add/Edit Product Form */}
                    <div className="card mb-4 p-4 shadow-sm" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}>
                      <h4 className="fw-bold text-success mb-3">
                        {editingProduct ? '✏️ Edit Product details' : '➕ Add New Shop Product'}
                      </h4>
                      <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}>
                        <div className="row g-3">
                          <div className="col-md-6 col-lg-3">
                            <label className="form-label small">Product Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editingProduct ? editingProduct.name : newProduct.name}
                              onChange={e => editingProduct ? setEditingProduct({...editingProduct, name: e.target.value}) : setNewProduct({...newProduct, name: e.target.value})}
                              required
                              style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                            />
                          </div>
                          <div className="col-md-6 col-lg-2">
                            <label className="form-label small">Category</label>
                            <select
                              className="form-select"
                              value={editingProduct ? editingProduct.category : newProduct.category}
                              onChange={e => editingProduct ? setEditingProduct({...editingProduct, category: e.target.value}) : setNewProduct({...newProduct, category: e.target.value})}
                              style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                            >
                              <option value="Seeds">Seeds</option>
                              <option value="Fertilizers">Fertilizers</option>
                              <option value="Equipment">Equipment</option>
                            </select>
                          </div>
                          <div className="col-md-6 col-lg-2">
                            <label className="form-label small">Price (₹)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={editingProduct ? editingProduct.price : newProduct.price}
                              onChange={e => editingProduct ? setEditingProduct({...editingProduct, price: Number(e.target.value)}) : setNewProduct({...newProduct, price: Number(e.target.value)})}
                              required
                              style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                            />
                          </div>
                          <div className="col-md-6 col-lg-2">
                            <label className="form-label small">Old Price (₹)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={editingProduct ? editingProduct.oldPrice : newProduct.oldPrice}
                              onChange={e => editingProduct ? setEditingProduct({...editingProduct, oldPrice: Number(e.target.value)}) : setNewProduct({...newProduct, oldPrice: Number(e.target.value)})}
                              style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                            />
                          </div>
                          <div className="col-md-6 col-lg-2">
                            <label className="form-label small">Rating</label>
                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              max="5"
                              className="form-control"
                              value={editingProduct ? (editingProduct.rating !== undefined ? editingProduct.rating : '') : newProduct.rating}
                              onChange={e => editingProduct ? setEditingProduct({...editingProduct, rating: Number(e.target.value)}) : setNewProduct({...newProduct, rating: Number(e.target.value)})}
                              style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                            />
                          </div>
                          <div className="col-md-6 col-lg-3">
                            <label className="form-label small">Product Image (Cloudinary)</label>
                            {uploadingImage ? (
                              <div className="d-flex align-items-center gap-2 py-1">
                                <FaSpinner className="spin-animation text-success" />
                                <span className="small text-muted">Uploading to Cloudinary...</span>
                              </div>
                            ) : (
                              <input
                                type="file"
                                accept="image/*"
                                className="form-control"
                                onChange={handleImageUpload}
                                style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                              />
                            )}
                            {(editingProduct ? editingProduct.image : newProduct.image) && (
                              <div className="mt-1 d-flex align-items-center gap-2">
                                <img
                                  src={editingProduct ? editingProduct.image : newProduct.image}
                                  alt="Preview"
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                />
                                <span className="small text-success">✓ Image ready</span>
                              </div>
                            )}
                          </div>
                          <div className="col-12 col-md-8">
                            <label className="form-label small">Description</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Brief description of product features..."
                              value={editingProduct ? editingProduct.description : newProduct.description}
                              onChange={e => editingProduct ? setEditingProduct({...editingProduct, description: e.target.value}) : setNewProduct({...newProduct, description: e.target.value})}
                              style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                            />
                          </div>
                          <div className="col-6 col-md-2 d-flex align-items-end">
                            <div className="form-check mb-2">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="inStockCheck"
                                checked={editingProduct ? editingProduct.inStock : newProduct.inStock}
                                onChange={e => editingProduct ? setEditingProduct({...editingProduct, inStock: e.target.checked}) : setNewProduct({...newProduct, inStock: e.target.checked})}
                              />
                              <label className="form-check-label small" htmlFor="inStockCheck">In Stock</label>
                            </div>
                          </div>
                          <div className="col-6 col-md-2 d-flex align-items-end justify-content-end gap-2">
                            {editingProduct && (
                              <button
                                type="button"
                                className="btn btn-outline-light btn-sm"
                                onClick={() => setEditingProduct(null)}
                              >
                                Cancel
                              </button>
                            )}
                            <button type="submit" className="btn btn-success btn-sm px-3 fw-bold">
                              {editingProduct ? 'Update Product' : 'Add Product'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>

                    {/* Products List Table */}
                    <div className="table-responsive">
                      <table className="table align-middle" style={{ color: 'var(--text-body)' }}>
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock Status</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-4 text-muted">No products found. Add one above!</td>
                            </tr>
                          ) : (
                            products.map(p => (
                              <tr key={p._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td>
                                  {p.image ? (
                                    <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                                  ) : (
                                    <div className="bg-secondary rounded" style={{ width: '40px', height: '40px' }} />
                                  )}
                                </td>
                                <td className="product-details-cell">
                                  <strong className="text-body">{p.name}</strong>
                                  {p.description && <small className="text-body d-block text-truncate" style={{ maxWidth: '300px' }}>{p.description}</small>}
                                </td>
                                <td>
                                  <span className="badge bg-secondary">{p.category}</span>
                                </td>
                                <td>
                                  <span className="text-success fw-bold">₹{p.price}</span>
                                  {p.oldPrice > 0 && <span className="text-muted text-decoration-line-through ms-2 small">₹{p.oldPrice}</span>}
                                </td>
                                <td>
                                  <span className={`badge ${p.inStock ? 'bg-success' : 'bg-danger'}`}>
                                    {p.inStock ? 'In Stock' : 'Out of Stock'}
                                  </span>
                                </td>
                                <td className="text-end">
                                  <div className="d-inline-flex gap-2">
                                    <button className="btn btn-sm btn-outline-success" onClick={() => setEditingProduct(p)} title="Edit Product">
                                      <FaEdit />
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProduct(p._id)} title="Delete Product">
                                      <FaTrash />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 9: Crop Approvals */}
                {activeTab === 'crops' && (
                  <div className="table-responsive">
                    <table className="table align-middle" style={{ color: 'var(--text-body)' }}>
                      <thead>
                        <tr>
                          <th>Crop Name</th>
                          <th>Category</th>
                          <th>Farmer Details</th>
                          <th className="text-center">Quantity (q)</th>
                          <th className="text-center">Price (₹/q)</th>
                          <th className="text-center">Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crops.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-4 text-muted">No crop listings submitted yet.</td>
                          </tr>
                        ) : (
                          crops.map(c => (
                            <tr key={c._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td>
                                <strong className="text-success">{c.cropName.charAt(0).toUpperCase() + c.cropName.slice(1)}</strong>
                              </td>
                              <td>
                                <span className="badge bg-secondary">{c.category}</span>
                              </td>
                              <td>
                                <strong>{c.farmerName}</strong>
                                <small className="text-body d-block">{c.farmerPhone}</small>
                              </td>
                              <td className="text-center font-monospace">{c.quantity}</td>
                              <td className="text-center font-monospace text-success fw-bold">₹{c.price}</td>
                              <td className="text-center">
                                <span className={`badge ${
                                  c.approvalStatus === 'Approved' ? 'bg-success' : 
                                  c.approvalStatus === 'Rejected' ? 'bg-danger' : 
                                  'bg-warning text-dark'
                                }`}>
                                  {c.approvalStatus || 'Pending'}
                                </span>
                              </td>
                              <td className="text-end">
                                {(!c.approvalStatus || c.approvalStatus === 'Pending') ? (
                                  <div className="d-inline-flex gap-2">
                                    <button className="btn btn-sm btn-success fw-bold d-inline-flex align-items-center gap-1" onClick={() => handleCropApproval(c._id, 'Approved')}>
                                      <FaCheck size={12} /> Approve
                                    </button>
                                    <button className="btn btn-sm btn-danger fw-bold d-inline-flex align-items-center gap-1" onClick={() => handleCropApproval(c._id, 'Rejected')}>
                                      <FaTimes size={12} /> Reject
                                    </button>
                                  </div>
                                ) : (
                                  <div className="d-inline-flex gap-2 align-items-center justify-content-end">
                                    <span className="text-muted small">Processed</span>
                                    {c.approvalStatus === 'Approved' && (
                                      <button className="btn btn-sm btn-outline-danger fw-bold d-inline-flex align-items-center gap-1" onClick={() => handleDeleteCrop(c._id)}>
                                        <FaTrash size={12} /> Delete
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 10: Manage Categories */}
                {activeTab === 'categories' && (
                  <div className="animate__animated animate__fadeIn">
                    <div className="row g-4">
                      {/* Add New Category Form */}
                      <div className="col-md-4">
                        <div className="p-3 border rounded-3" style={{ borderColor: 'var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
                          <h5 className="fw-bold text-success mb-3">➕ Add New Category</h5>
                          <form onSubmit={handleCreateCategory}>
                            <div className="mb-3">
                              <label className="form-label small fw-semibold">Category Name</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Fruits"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                required
                                style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label small fw-semibold">Category Image (Cloudinary)</label>
                              <input
                                type="file"
                                accept="image/*"
                                className="form-control form-control-sm"
                                onChange={(e) => handleCategoryImageUpload(e, 'new')}
                                disabled={uploadingCategoryImage}
                                style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                              />
                              {uploadingCategoryImage && (
                                <div className="d-flex align-items-center gap-2 mt-1">
                                  <FaSpinner className="spin-animation text-success" />
                                  <span className="small text-muted">Uploading...</span>
                                </div>
                              )}
                              {newCategory.imageUrl && (
                                <div className="mt-2 d-flex align-items-center gap-2">
                                  <img src={newCategory.imageUrl} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                  <span className="small text-success">✓ Uploaded</span>
                                </div>
                              )}
                            </div>
                            <button type="submit" className="btn btn-success w-100 fw-bold">
                              Save Category
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Categories List */}
                      <div className="col-md-8">
                        <h5 className="fw-bold text-success mb-3">Existing Categories & Thumbnails</h5>
                        <div className="table-responsive">
                          <table className="table align-middle" style={{ color: 'var(--text-body)' }}>
                            <thead>
                              <tr>
                                <th>Category Name</th>
                                <th>Thumbnail Preview</th>
                                <th className="text-end">Upload New Image</th>
                              </tr>
                            </thead>
                            <tbody>
                              {categories.map((cat) => (
                                <tr key={cat._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td><strong>{cat.name}</strong></td>
                                  <td>
                                    <img src={cat.imageUrl} alt={cat.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                                  </td>
                                  <td className="text-end d-flex justify-content-end">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="form-control form-control-sm"
                                      onChange={(e) => handleCategoryImageUpload(e, cat.name)}
                                      disabled={uploadingCategoryImage}
                                      style={{ maxWidth: '220px', background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </main>
        </div>
      </div>

      {/* Upload/Edit Report Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ background: 'var(--bg-card)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}>
              <div className="modal-header border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <h5 className="modal-title fw-bold text-success">Soil Test Health Report</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} style={{ filter: 'var(--is-dark) ? "invert(1)" : "none"' }}></button>
              </div>
              <form onSubmit={handleSubmitResults}>
                <div className="modal-body">
                  <p className="text-muted small mb-4">Enter findings for farmer {selectedReq?.userId?.username}'s soil sample.</p>
                  
                  <div className="row g-2 mb-3">
                    <div className="col-4">
                      <label className="form-label small">Nitrogen (N)</label>
                      <input type="number" className="form-control" value={testResults.nitrogen} onChange={e => setTestResults({...testResults, nitrogen: e.target.value})} required style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }} />
                    </div>
                    <div className="col-4">
                      <label className="form-label small">Phosphorus (P)</label>
                      <input type="number" className="form-control" value={testResults.phosphorous} onChange={e => setTestResults({...testResults, phosphorous: e.target.value})} required style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }} />
                    </div>
                    <div className="col-4">
                      <label className="form-label small">Potassium (K)</label>
                      <input type="number" className="form-control" value={testResults.potassium} onChange={e => setTestResults({...testResults, potassium: e.target.value})} required style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }} />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small">Soil pH</label>
                      <input type="number" step="0.1" className="form-control" value={testResults.ph} onChange={e => setTestResults({...testResults, ph: e.target.value})} required style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">Moisture (%)</label>
                      <input type="number" step="0.1" className="form-control" value={testResults.moisture} onChange={e => setTestResults({...testResults, moisture: e.target.value})} required style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }} />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small">Temperature (°C)</label>
                      <input type="number" step="0.1" className="form-control" value={testResults.temperature} onChange={e => setTestResults({...testResults, temperature: e.target.value})} style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">Humidity (%)</label>
                      <input type="number" step="0.1" className="form-control" value={testResults.humidity} onChange={e => setTestResults({...testResults, humidity: e.target.value})} style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }} />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small">Soil Classification</label>
                      <select className="form-select" value={testResults.soilType} onChange={e => setTestResults({...testResults, soilType: e.target.value})} style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}>
                        {['Sandy', 'Loamy', 'Black', 'Red', 'Clayey'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small">Target Crop</label>
                      <select className="form-select" value={testResults.cropType} onChange={e => setTestResults({...testResults, cropType: e.target.value})} style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}>
                        {['Sugarcane', 'Paddy', 'Wheat', 'Maize', 'Cotton'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small">Summary / Remark</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      placeholder="e.g. Soil health is moderate. Nitrogen replenishment recommended..." 
                      value={testResults.remarks} 
                      onChange={e => setTestResults({...testResults, remarks: e.target.value})} 
                      style={{ background: 'var(--bg-input)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
                    />
                  </div>

                </div>
                <div className="modal-footer border-top" style={{ borderColor: 'var(--border-color)' }}>
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success">Save Report Findings</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
