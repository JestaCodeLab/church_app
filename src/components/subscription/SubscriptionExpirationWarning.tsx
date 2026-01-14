import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface SubscriptionWarningProps {
  daysUntilExpiry: number | null;
  subscriptionStatus: string;
  currentPlan: string;
  onDismiss?: () => void;
}

const SubscriptionExpirationWarning: React.FC<SubscriptionWarningProps> = ({
  daysUntilExpiry,
  subscriptionStatus,
  currentPlan,
  onDismiss
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || !daysUntilExpiry) {
    return null;
  }

  // Determine warning level based on days remaining
  let bgColor = '';
  let borderColor = '';
  let textColor = '';
  let icon = '';
  let message = '';
  let actionText = '';
  let urgency = '';

  if (daysUntilExpiry <= 1) {
    // 🚨 CRITICAL - Expires today
    bgColor = 'bg-red-50 dark:bg-red-900/20';
    borderColor = 'border-l-4 border-[1px] border-red-500';
    textColor = 'text-red-900 dark:text-red-100';
    icon = '🚨';
    message = `Your ${currentPlan.toUpperCase()} subscription expires TODAY! Premium features will be locked after tonight.`;
    actionText = 'Renew Now';
    urgency = 'CRITICAL';
  } else if (daysUntilExpiry <= 3) {
    // ⚠️ WARNING - Expires in 3 days
    bgColor = 'bg-orange-50 dark:bg-orange-900/20';
    borderColor = 'border-l-4 border-orange-500';
    textColor = 'text-orange-900 dark:text-orange-100';
    icon = '⚠️';
    message = `Your ${currentPlan.toUpperCase()} subscription expires in ${daysUntilExpiry} days. Renew to keep your premium features active.`;
    actionText = 'Renew Subscription';
    urgency = 'WARNING';
  } else if (daysUntilExpiry <= 7) {
    // ⏰ CAUTION - Expires in 7 days
    bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
    borderColor = 'border-l-4 border-yellow-500';
    textColor = 'text-yellow-900 dark:text-yellow-100';
    icon = '⏰';
    message = `Your ${currentPlan.toUpperCase()} subscription expires in ${daysUntilExpiry} days. After that, you'll be downgraded to the FREE tier.`;
    actionText = 'Renew Now';
    urgency = 'CAUTION';
  }

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleRenew = () => {
    navigate('/settings?tab=billing');
  };

  return (
    <div
      className={`${bgColor} ${borderColor} rounded-md p-4 mb-4 flex items-start justify-between transition-all duration-300`}
      role="alert"
      aria-label={`Subscription ${urgency}: ${message}`}
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="flex-shrink-0 pt-0.5 text-lg">{icon}</div>
        
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor} mb-1`}>
            Subscription {urgency}
          </h3>
          
          <p className={`${textColor} text-sm mb-3`}>
            {message}
          </p>

          {/* <div className={`${textColor} text-xs opacity-75 flex items-center gap-1 mb-3`}>
            <Clock size={14} />
            <span>
              {daysUntilExpiry === 0
                ? 'Expires in less than 24 hours'
                : `${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''} remaining`}
            </span>
          </div> */}

          <button
            onClick={handleRenew}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              daysUntilExpiry <= 1
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : daysUntilExpiry <= 3
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {actionText}
          </button>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity`}
        aria-label="Dismiss notification"
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default SubscriptionExpirationWarning;
