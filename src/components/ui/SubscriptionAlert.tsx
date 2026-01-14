import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, XCircle } from 'lucide-react';

interface SubscriptionAlertProps {
  status: 'expired' | 'cancelled' | 'expiring-soon' | 'expiring_soon' | 'active' | 'free-tier';
  planName?: string;
  expiryDate?: string;
  daysUntilRenewal?: number;
  onDismiss: () => void;
}

/**
 * Reusable Subscription Alert Component
 * 
 * Shows different alerts based on subscription status:
 * - Expired: Red alert with "Renew Now" button
 * - Cancelled: Orange alert with "Reactivate" button
 * - Expiring Soon: Yellow alert with countdown
 */
const SubscriptionAlert: React.FC<SubscriptionAlertProps> = ({
  status,
  planName = 'your',
  expiryDate,
  daysUntilRenewal = 0,
  onDismiss
}) => {
  const navigate = useNavigate();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Alert configurations based on subscription status and days remaining
  const getAlertConfig = () => {
    if (status === 'expired') {
      return {
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-l-4 border-[1px] border-red-500',
        textColor: 'text-red-900 dark:text-red-100',
        icon: '🚨',
        title: 'Subscription Expired',
        message: `Your ${planName.toUpperCase()} subscription expired on ${formatDate(expiryDate)}. Please renew to continue managing your church.`,
        buttonLabel: 'Renew Now',
        urgency: 'EXPIRED'
      };
    }
    
    if (status === 'cancelled') {
      return {
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-l-4 border-[1px] border-orange-500',
        textColor: 'text-orange-900 dark:text-orange-100',
        icon: '⚠️',
        title: 'Subscription Cancelled',
        message: `Your subscription is cancelled and will end on ${formatDate(expiryDate)}. Reactivate to continue after this date.`,
        buttonLabel: 'Reactivate',
        urgency: 'CANCELLED'
      };
    }

    // For expiring-soon, determine urgency level based on days remaining
    if (status === 'expiring-soon' || status === 'expiring_soon') {
      if (daysUntilRenewal <= 1) {
        // 🚨 CRITICAL - Expires today
        return {
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-l-4 border-[1px] border-red-500',
          textColor: 'text-red-900 dark:text-red-100',
          icon: '🚨',
          title: 'Subscription Expiring Today',
          message: `Your ${planName.toUpperCase()} subscription expires TODAY! Premium features will be locked after tonight.`,
          buttonLabel: 'Renew Now',
          urgency: 'CRITICAL'
        };
      } else if (daysUntilRenewal <= 3) {
        // ⚠️ WARNING - Expires in 3 days
        return {
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-l-4 border-[1px] border-orange-500',
          textColor: 'text-orange-900 dark:text-orange-100',
          icon: '⚠️',
          title: 'Subscription Expiring Soon',
          message: `Your ${planName.toUpperCase()} subscription expires in ${daysUntilRenewal} day${daysUntilRenewal !== 1 ? 's' : ''}. Renew to keep your premium features active.`,
          buttonLabel: 'Renew Subscription',
          urgency: 'WARNING'
        };
      } else {
        // ⏰ CAUTION - Expires in 7 days
        return {
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-l-4 border-[1px] border-yellow-500',
          textColor: 'text-yellow-900 dark:text-yellow-100',
          icon: '⏰',
          title: 'Subscription Expiring Soon',
          message: `Your ${planName.toUpperCase()} subscription expires in ${daysUntilRenewal} days. After that, you'll be downgraded to the FREE tier.`,
          buttonLabel: 'Renew Now',
          urgency: 'CAUTION'
        };
      }
    }

    return null;
  };

  const config = getAlertConfig();

  // Guard: if status doesn't match any config, return null
  if (!config) {
    console.warn(`Unknown subscription alert status: ${status}`);
    return null;
  }

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} rounded-md p-4 mb-4 flex items-start justify-between gap-4 transition-all duration-300`}
      role="alert"
      aria-label={`Subscription ${config.urgency}: ${config.message}`}
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="flex-shrink-0 pt-0.5 text-lg">{config.icon}</div>
        
        <div className="flex-1">
          <h3 className={`font-semibold ${config.textColor} mb-1`}>
            Subscription {config.urgency}
          </h3>
          
          <p className={`${config.textColor} text-sm`}>
            {config.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate('/settings?tab=billing')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
            config.urgency === 'CRITICAL'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : config.urgency === 'WARNING'
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-yellow-600 hover:bg-yellow-700 text-white'
          }`}
        >
          {config.buttonLabel}
        </button>
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 ${config.textColor} hover:opacity-70 transition-opacity`}
          aria-label="Dismiss alert"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionAlert;