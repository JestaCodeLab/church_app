import React, { useEffect, useState } from 'react';
import { settingsAPI } from '../../services/api';
import { TrendingUp, Users, Church, Calendar, FileVolume } from 'lucide-react';
import UsageMeter from './UsageMeter';

interface UsageData {
  members: { current: number; limit: number | null };
  branches: { current: number; limit: number | null };
  events: { current: number; limit: number | null };
  sermons: { current: number; limit: number | null };
}

/**
 * SubscriptionUsage Component
 * 
 * Displays a comprehensive card showing usage for all subscription resources
 * Can be used in Settings or Dashboard
 */
const SubscriptionUsage: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [planName, setPlanName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSubscription();
      const subscription = response.data.data.subscription;
      const planDetails = subscription.planDetails;

      // Extract usage from subscription
      const usageData: UsageData = {
        members: {
          current: subscription.currentMemberCount || 0,
          limit: planDetails?.limits?.members ?? null
        },
        branches: {
          current: 0, // Will be populated from merchant.usage
          limit: planDetails?.limits?.branches ?? null
        },
        events: {
          current: 0,
          limit: planDetails?.limits?.events ?? null
        },
        sermons: {
          current: 0,
          limit: planDetails?.limits?.sermons ?? null
        }
      };

      setUsage(usageData);
      setPlanName(planDetails?.name || subscription.plan);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Subscription Usage
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current plan: <span className="font-medium text-primary-600">{planName}</span>
            </p>
          </div>
          <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </div>

      {/* Usage Meters */}
      <div className="p-6 space-y-6">
        {/* Members */}
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <UsageMeter
              resourceName="Members"
              current={usage.members.current}
              limit={usage.members.limit}
            />
          </div>
        </div>

        {/* Branches */}
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex-shrink-0">
            <Church className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <UsageMeter
              resourceName="Branches"
              current={usage.branches.current}
              limit={usage.branches.limit}
            />
          </div>
        </div>

        {/* Events */}
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <UsageMeter
              resourceName="Events"
              current={usage.events.current}
              limit={usage.events.limit}
            />
          </div>
        </div>

        {/* Sermons */}
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex-shrink-0">
            <FileVolume className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <UsageMeter
              resourceName="Sermons"
              current={usage.sermons.current}
              limit={usage.sermons.limit}
            />
          </div>
        </div>
      </div>

      {/* Footer with upgrade CTA */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need more resources?
          </p>
          <button
            onClick={() => {
              // Navigate to settings billing tab
              window.location.href = '/settings?tab=billing';
            }}
            className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            Upgrade Plan →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionUsage;