import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OnboardingRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  // Must be authenticated to access onboarding
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If onboarding already completed, redirect to dashboard
  if (user?.merchant?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  // Allow access to onboarding
  return <Outlet />;
};

export default OnboardingRoute;
