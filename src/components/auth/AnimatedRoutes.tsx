import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layouts
import AdminLayout from '../../layout/AdminLayout';
import MerchantLayout from '../../layout/MerchantLayout';
import ProtectedRoute from '../../routes/ProtectedRoute';
import PublicRoute from '../../routes/PublicRoute';

// Pages
import Login from '../../pages/auth/Login';
import Register from '../../pages/auth/Register';
import VerifyEmail from '../../pages/auth/VerifyEmail';
import Dashboard from '../../pages/merchant/Dashboard';
import AllMembers from '../../pages/merchant/members/AllMembers';
import NewMember from '../../pages/merchant/members/NewMember';
import EditMember from '../../pages/merchant/members/EditMember';
import Settings from '../../pages/merchant/Settings';
import MemberDetails from '../../pages/merchant/members/MemberDetails';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import AdminMerchants from '../../pages/admin/AdminMerchants';
import AdminUsers from '../../pages/admin/AdminUsers';
import Onboarding from '../../pages/auth/Onboarding';
import OnboardingRoute from '../../routes/OnboardingRoute';
import Branches from '../../pages/merchant/branches/AllBranches';
import NewBranch from '../../pages/merchant/branches/NewBranch';
import BranchDetails from '../../pages/merchant/branches/BranchDetails';
import { Edit } from 'lucide-react';
import EditBranch from '../../pages/merchant/branches/EditBranch';

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
        </Route>

        {/* Onboarding Route - Requires auth but not completed onboarding */}
        <Route element={<OnboardingRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>

        {/* Protected Routes - Church Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MerchantLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/branches/new" element={<NewBranch />} />
            <Route path="/branches/:id" element={<BranchDetails />} />
            <Route path="/branches/:id/edit" element={<EditBranch />} />
            <Route path="/members" element={<AllMembers />} />
            <Route path="/members/new" element={<NewMember />} />
            <Route path="/members/:id" element={<MemberDetails />} />
            <Route path="/members/:id/edit" element={<EditMember />} />
            <Route path="/settings" element={<Settings />} />
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