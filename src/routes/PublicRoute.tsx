import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('🔓 PublicRoute - Rendering:', {
  isAuthenticated,
  loading,
  onboardingCompleted: user?.merchant?.onboardingCompleted,
  pathname: window.location.pathname
});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  // If NOT authenticated, allow access to public pages
  if (!isAuthenticated) {
    return <Outlet />;
  }

  // User IS authenticated - redirect based on onboarding status
  // Check if user has merchant and onboarding status
  if (user?.merchant) {
    const onboardingCompleted = user.merchant.onboardingCompleted;

    if (onboardingCompleted === false) {
      // Onboarding not done → Redirect to onboarding
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Onboarding done or no merchant (super_admin) → Redirect to appropriate dashboard
  if (user?.role === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default PublicRoute;
