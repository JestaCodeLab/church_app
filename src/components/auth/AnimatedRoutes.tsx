import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layouts
import AdminLayout from '../../layout/AdminLayout';
import MerchantLayout from '../../layout/MerchantLayout';
import ProtectedRoute from '../../layout/ProtectedRoute';
import PublicRoute from '../../layout/PublicRoute';

// Pages
import Login from '../../pages/auth/Login';
import Register from '../../pages/auth/Register';
import VerifyEmail from '../../pages/auth/VerifyEmail';
import Dashboard from '../../pages/merchant/Dashboard';
import Members from '../../pages/merchant/Members';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import AdminMerchants from '../../pages/admin/AdminMerchants';
import AdminUsers from '../../pages/admin/AdminUsers';
import Onboarding from '../../pages/auth/Onboarding';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>

        {/* Protected Routes - Church Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MerchantLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/settings" element={<div>Settings Coming Soon</div>} />
          </Route>
        </Route>

        {/* Protected Routes - Super Admin Dashboard */}
        <Route element={<ProtectedRoute requiredRole="super_admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/merchants" element={<AdminMerchants />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
