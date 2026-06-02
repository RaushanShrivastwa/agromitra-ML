import { Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './components/login';
import Signup from './components/signup';
import Verify from './components/Verify';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';

// Route Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// New Pages
import Weather from './components/Weather';
import Fertilizer from './components/Fertilizer';
import Subsidies from './components/Subsidies';
import Mandi from './components/Mandi';
import Shop from './components/Shop';
import Testing from './components/Testing';
import Donate from './components/Donate';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';
import Faq from './components/Faq';
import MyOrders from './components/MyOrders';
import Services from './components/Services';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/aboutus" element={<AboutUs />} />
      <Route path="/about" element={<AboutUs />} />

      {/* Protected User Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
      <Route path="/fertilizer" element={<ProtectedRoute><Fertilizer /></ProtectedRoute>} />
      <Route path="/subsidies" element={<ProtectedRoute><Subsidies /></ProtectedRoute>} />
      <Route path="/mandi" element={<ProtectedRoute><Mandi /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
      <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
      <Route path="/testing" element={<ProtectedRoute><Testing /></ProtectedRoute>} />
      <Route path="/donate" element={<ProtectedRoute><Donate /></ProtectedRoute>} />
      <Route path="/contact" element={<ProtectedRoute><ContactUs /></ProtectedRoute>} />
      <Route path="/faq" element={<ProtectedRoute><Faq /></ProtectedRoute>} />
      <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />

      {/* Protected Admin Routes */}
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
export default App;
