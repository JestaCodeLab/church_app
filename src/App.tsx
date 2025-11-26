import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicRoute from './layout/PublicRoute';
import ProtectedRoute from './layout/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import MerchantLayout from './layout/MerchantLayout';
import Dashboard from './pages/merchant/Dashboard';
import Members from './pages/merchant/Members';
import AdminLayout from './layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMerchants from './pages/admin/AdminMerchants';

const App = () => {
  return (
    <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes - Merchant Dashboard */}
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
    </AuthProvider>

         
  );
}

export default App;
