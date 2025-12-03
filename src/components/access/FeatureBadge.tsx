import React from 'react';
import { Crown, Lock } from 'lucide-react';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

interface FeatureBadgeProps {
  feature: string;
  showIcon?: boolean;
  className?: string;
}

/**
 * FeatureBadge Component
 * 
 * Displays a badge indicating whether a feature is available in the user's plan.
 * Useful for settings pages or feature lists.
 * 
 * Usage:
 * <FeatureBadge feature="advancedReports" />
 * 
 * @param feature - The feature key to check (e.g., 'advancedReports')
 * @param showIcon - Whether to show an icon (default: true)
 * @param className - Additional CSS classes
 */
const FeatureBadge: React.FC<FeatureBadgeProps> = ({ 
  feature, 
  showIcon = true,
  className = '' 
}) => {
  const { hasFeature } = useFeatureFlag();
  const hasAccess = hasFeature(feature as any);

  if (hasAccess) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 ${className}`}>
        {showIcon && <Crown className="w-3 h-3 mr-1" />}
        Available
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 ${className}`}>
      {showIcon && <Lock className="w-3 h-3 mr-1" />}
      Upgrade Required
    </span>
  );
};

export default FeatureBadge;