import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RsvpPage from './pages/RsvpPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import ScanLoginPage from './pages/ScanLoginPage.jsx';
import ScanDashboardPage from './pages/ScanDashboardPage.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RsvpPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/scan/login" element={<ScanLoginPage />} />
        <Route path="/scan/dashboard" element={<ScanDashboardPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
