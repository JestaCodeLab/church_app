import React, { useMemo } from 'react';
import { AlertCircle, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SocialLimitsDisplay: React.FC = () => {
  const { user } = useAuth();

  const limits = useMemo(() => {
    if (!user?.merchant?.subscription) {
      return null;
    }

    const subscription = user.merchant.subscription;
    const planLimits = subscription.limits || {};

    return {
      accountLimit: planLimits.socialMediaAccounts || 0,
      currentAccountCount: 0, // TODO: Fetch from API or websocket
      accountsRemaining: (planLimits.socialMediaAccounts || 0),
      postLimit: planLimits.socialMediaPostsPerMonth,
      currentPostCount: 0, // TODO: Fetch from API or websocket
      postsRemaining: planLimits.socialMediaPostsPerMonth
    };
  }, [user?.merchant?.subscription]);

  if (!limits) {
    return null;
  }

  // Check if user is on a limited plan
  const upgradePrompt = limits.accountLimit === 0 || limits.postLimit === 0;

  // Calculate usage percentages
  const accountUsagePercent = limits.accountLimit > 0
    ? (limits.currentAccountCount / limits.accountLimit) * 100
    : 0;

  const postUsagePercent = limits.postLimit
    ? (limits.currentPostCount / limits.postLimit) * 100
    : 0;

  // Determine warning levels
  const accountsWarning = accountUsagePercent >= 80;
  const postsWarning = postUsagePercent >= 80;

  return (
    <div className="space-y-6">
      {/* Accounts Limit Card */}
      <div className={`rounded-lg border-2 p-6 ${
        accountsWarning ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Social Media Accounts</h3>
            <p className="text-sm text-gray-600 mt-1">
              Connected accounts: {limits.currentAccountCount} / {limits.accountLimit}
            </p>
          </div>
          {accountsWarning && (
            <AlertCircle className="w-5 h-5 text-orange-500" />
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              accountsWarning ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(accountUsagePercent, 100)}%` }}
          />
        </div>

        {accountsWarning && (
          <p className="text-sm text-orange-700 mt-3">
            You're approaching your account limit. Consider upgrading to connect more accounts.
          </p>
        )}
      </div>

      {/* Posts Limit Card */}
      {limits.postLimit !== null && (
        <div className={`rounded-lg border-2 p-6 ${
          postsWarning ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Monthly Posts</h3>
              <p className="text-sm text-gray-600 mt-1">
                Posts this month: {limits.currentPostCount} / {limits.postLimit}
              </p>
            </div>
            {postsWarning && (
              <AlertCircle className="w-5 h-5 text-orange-500" />
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                postsWarning ? 'bg-orange-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(postUsagePercent, 100)}%` }}
            />
          </div>

          {postsWarning && (
            <p className="text-sm text-orange-700 mt-3">
              You're approaching your monthly post limit. Upgrade to schedule more posts.
            </p>
          )}
        </div>
      )}

      {/* Upgrade Prompt */}
      {upgradePrompt && (
        <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-6">
          <div className="flex items-start gap-4">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Unlock More Social Media Features</h3>
              <p className="text-sm text-blue-700 mt-1">
                Your current plan has limited social media capabilities. Upgrade to:
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4">
                <li>• Connect more social media accounts</li>
                <li>• Schedule unlimited monthly posts</li>
                <li>• Access advanced analytics</li>
                <li>• Use AI-powered content suggestions</li>
              </ul>
              <button
                onClick={() => window.location.href = '/settings/plans'}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                View Plans
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialLimitsDisplay;
