import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMerchant } from '../context/MerchantContext';

const PublicRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const { isMainDomain, loading: merchantLoading } = useMerchant();
  const location = useLocation();

  // console.log('🔓 PublicRoute - Rendering:', {
  //   isAuthenticated,
  //   loading,
  //   onboardingCompleted: user?.merchant?.onboardingCompleted,
  //   pathname: window.location.pathname,
  //   isMainDomain
  // });

  if (loading || merchantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  // BLOCK REGISTER/VERIFY-EMAIL ON SUBDOMAIN
  if (!isMainDomain && (location.pathname === '/register' || location.pathname === '/verify-email')) {
    // console.log('🔓 PublicRoute: Register/Verify blocked on subdomain → Redirect to /login');
    return <Navigate to="/login" replace />;
  }

  // If NOT authenticated, allow access to public pages
  if (!isAuthenticated) {
    return <Outlet />;
  }

  // User IS authenticated - redirect based on onboarding status
  if (user?.merchant) {
    const onboardingCompleted = user.merchant.onboardingCompleted;

    if (onboardingCompleted === false) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Onboarding done or no merchant (super_admin) → Redirect to appropriate dashboard
  if (user?.role?.slug === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default PublicRoute;