import React from 'react';
import { Lock, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LockedFeatureProps {
  featureName: string;
  description?: string;
  isLocked: boolean;
  children: React.ReactNode;
  onUpgradeClick?: () => void;
  showUpgradeButton?: boolean;
  variant?: 'overlay' | 'banner' | 'inline';
}

const LockedFeature: React.FC<LockedFeatureProps> = ({
  featureName,
  description,
  isLocked,
  children,
  onUpgradeClick,
  showUpgradeButton = true,
  variant = 'overlay'
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      navigate('/settings?tab=billing');
    }
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  if (variant === 'banner') {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              {featureName} is Locked
            </h3>
            {description && (
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                {description}
              </p>
            )}
            {showUpgradeButton && (
              <button
                onClick={handleUpgrade}
                className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <Star className="w-4 h-4" />
                Upgrade Plan
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300">
        <Lock className="w-4 h-4" />
        <span>{featureName} (Locked)</span>
      </div>
    );
  }

  // Default overlay variant
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-black/5 dark:bg-black/20 rounded-lg backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center max-w-sm mx-auto">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {featureName} is Locked
          </h3>
          
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {description}
            </p>
          )}
          
          {showUpgradeButton && (
            <button
              onClick={handleUpgrade}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all"
            >
              <Star className="w-4 h-4" />
              Upgrade Your Plan
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LockedFeature;
