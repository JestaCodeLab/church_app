import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ requiredRole }: { requiredRole?: string }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user needs to complete onboarding first
  if (user?.merchant && !user.merchant.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // ✅ NEW: If onboarding completed but status is pending_approval
  if (user?.merchant?.onboardingCompleted && user?.merchant?.status === 'pending_approval') {
    return <Navigate to="/onboarding/success" replace />;
  }

  if (requiredRole && user?.role?.slug !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;