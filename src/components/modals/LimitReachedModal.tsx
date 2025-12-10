import React from 'react';
import { X, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: 'members' | 'branches' | 'events' | 'sermons' | 'storage';
  current: number;
  limit: number;
  planName: string;
}

/**
 * LimitReachedModal Component
 * 
 * Modal displayed when a user tries to create a resource but has reached their limit
 * Provides clear information and upgrade path
 */
const LimitReachedModal: React.FC<LimitReachedModalProps> = ({
  isOpen,
  onClose,
  resourceType,
  current,
  limit,
  planName
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const resourceDisplayNames: Record<string, string> = {
    members: 'Members',
    branches: 'Branches',
    events: 'Events',
    sermons: 'Sermons',
    storage: 'Storage'
  };

  const handleUpgrade = () => {
    onClose();
    navigate('/settings?tab=billing');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {resourceDisplayNames[resourceType]} Limit Reached
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {planName} Plan
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Usage Stats */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Usage
                </span>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                  {current} / {limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all"
                  style={{ width: '100%' }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                You've reached your maximum of {limit} {resourceDisplayNames[resourceType].toLowerCase()}
              </p>
            </div>

            {/* Message */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              To add more {resourceDisplayNames[resourceType].toLowerCase()}, please upgrade your subscription plan. 
              Our higher-tier plans offer increased limits and additional features to help your church grow.
            </p>

            {/* Benefits of Upgrading */}
            <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-1">
                    Benefits of Upgrading
                  </p>
                  <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-1">
                    <li>• Higher {resourceDisplayNames[resourceType].toLowerCase()} limits</li>
                    <li>• Access to additional features</li>
                    <li>• Priority support</li>
                    <li>• Advanced reporting & analytics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpgrade}
              className="inline-flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              <span>Upgrade Plan</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LimitReachedModal;