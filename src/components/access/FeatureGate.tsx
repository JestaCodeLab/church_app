import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Crown } from 'lucide-react';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

/**
 * FeatureGate Component
 * 
 * Conditionally renders content based on whether the user has access to a feature.
 * If the user doesn't have access, it shows an upgrade prompt.
 * 
 * Usage:
 * <FeatureGate feature="branchManagement">
 *   <BranchList />
 * </FeatureGate>
 * 
 * @param feature - The feature key to check (e.g., 'branchManagement')
 * @param children - Content to show if user has access
 * @param fallback - Custom content to show if user doesn't have access
 * @param showUpgrade - Whether to show the upgrade prompt (default: true)
 */
const FeatureGate: React.FC<FeatureGateProps> = ({ 
  feature, 
  children, 
  fallback,
  showUpgrade = true 
}) => {
  const { hasFeature } = useFeatureFlag();
  const navigate = useNavigate();

  // Check if user has access to the feature
  if (hasFeature(feature as any)) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt if enabled
  if (showUpgrade) {
    return (
      <div className="min-h-screen dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full -mt-15 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          
          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Feature Not Available
          </h2>
          
          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This feature is not included in your current plan. Upgrade to unlock access to this and other premium features.
          </p>
          
          {/* Upgrade Button */}
          <button
            onClick={() => navigate('/settings?tab=billing')}
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <Crown className="w-5 h-5 mr-2" />
            View Plans & Upgrade
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>

          {/* Go Back Link */}
          <button
            onClick={() => navigate(-1)}
            className="block w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show nothing if showUpgrade is false
  return null;
};

export default FeatureGate;