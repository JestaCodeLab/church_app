import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface UsageMeterProps {
  resourceName: string;
  current: number;
  limit: number | null;
  unit?: string;
  showPercentage?: boolean;
  className?: string;
}

const UsageMeter: React.FC<UsageMeterProps> = ({
  resourceName,
  current,
  limit,
  unit = '',
  showPercentage = true,
  className = ''
}) => {
  // Calculate percentage and remaining
  const isUnlimited = limit === null || limit === undefined;
  const percentage = isUnlimited ? 0 : Math.round((current / limit) * 100);
  const remaining = isUnlimited ? null : Math.max(0, limit - current);

  // Determine status color based on usage
  const getStatusColor = () => {
    if (isUnlimited) return 'green';
    if (percentage >= 100) return 'red';
    if (percentage >= 90) return 'orange';
    if (percentage >= 75) return 'yellow';
    return 'green';
  };

  const statusColor = getStatusColor();

  // Color mapping for different states
  const colorClasses = {
    red: {
      bg: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      icon: 'text-red-500',
      border: 'border-red-200 dark:border-red-800'
    },
    orange: {
      bg: 'bg-orange-500',
      text: 'text-orange-600 dark:text-orange-400',
      icon: 'text-orange-500',
      border: 'border-orange-200 dark:border-orange-800'
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-400',
      icon: 'text-yellow-500',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    green: {
      bg: 'bg-green-500',
      text: 'text-green-600 dark:text-green-400',
      icon: 'text-green-500',
      border: 'border-green-200 dark:border-green-800'
    }
  };

  const colors = colorClasses[statusColor];

  // Get status icon
  const StatusIcon = percentage >= 90 && !isUnlimited ? AlertCircle : CheckCircle;

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {resourceName}
          </span>
          <StatusIcon className={`w-4 h-4 ${colors.icon}`} />
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-semibold ${colors.text}`}>
            {current}{unit}
            {!isUnlimited && (
              <>
                {' / '}
                {limit}{unit}
              </>
            )}
            {isUnlimited && (
              <span className="text-xs ml-1 text-gray-500">∞ Unlimited</span>
            )}
          </span>
          {showPercentage && !isUnlimited && (
            <span className={`text-xs font-medium ${colors.text}`}>
              ({percentage}%)
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {!isUnlimited && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${colors.bg} transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}

      {/* Unlimited indicator */}
      {isUnlimited && (
        <div className="w-full bg-gradient-to-r from-green-200 to-blue-200 dark:from-green-900 dark:to-blue-900 rounded-full h-2 opacity-50" />
      )}

      {/* Status Message */}
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {isUnlimited ? (
          <span>Unlimited {resourceName.toLowerCase()}</span>
        ) : percentage >= 100 ? (
          <span className={colors.text}>Limit reached</span>
        ) : percentage >= 90 ? (
          <span className={colors.text}>
            {remaining} {resourceName.toLowerCase()} remaining - consider upgrading
          </span>
        ) : (
          <span>
            {remaining} {resourceName.toLowerCase()} available
          </span>
        )}
      </div>
    </div>
  );
};

export default UsageMeter;