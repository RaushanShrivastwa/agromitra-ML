import React from 'react';
import Navbar from './Navbar';
import Footer from './footer';
import ServicesSection from './ServiceSection';
import { useAuth } from '../context/AuthContext';

export default function ServicesPage() {
  const { user } = useAuth();
  const viewMode = user?.role === 'admin' ? 'farmer' : (user?.role === 'customer' ? 'customer' : 'farmer');

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-color)' }}>
      <Navbar />
      <div style={{ paddingTop: '50px' }}>
        <ServicesSection viewMode={viewMode} />
      </div>
      <Footer />
    </div>
  );
}
