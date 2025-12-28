import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, XCircle } from 'lucide-react';

interface SubscriptionAlertProps {
  status: 'expired' | 'cancelled' | 'expiring_soon';
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

  // Alert configurations
  const alertConfig = {
    expired: {
      bgColor: 'bg-red-600',
      textColor: 'text-white',
      accentColor: 'text-red-100',
      buttonBg: 'bg-white',
      buttonText: 'text-red-600',
      buttonHover: 'hover:bg-red-50',
      title: 'Subscription Expired',
      message: `Your ${planName} subscription expired on ${formatDate(expiryDate)}. Please renew to continue managing your church.`,
      buttonLabel: 'Renew Now'
    },
    cancelled: {
      bgColor: 'bg-orange-600',
      textColor: 'text-white',
      accentColor: 'text-orange-100',
      buttonBg: 'bg-white',
      buttonText: 'text-orange-600',
      buttonHover: 'hover:bg-orange-50',
      title: 'Subscription Cancelled',
      message: `Your subscription is cancelled and will end on ${formatDate(expiryDate)}. Reactivate to continue after this date.`,
      buttonLabel: 'Reactivate'
    },
    expiring_soon: {
      bgColor: 'bg-yellow-500',
      textColor: 'text-white',
      accentColor: 'text-yellow-100',
      buttonBg: 'bg-white',
      buttonText: 'text-yellow-600',
      buttonHover: 'hover:bg-yellow-50',
      title: 'Subscription Renewing Soon',
      message: `Your ${planName} subscription renews in ${daysUntilRenewal} day${daysUntilRenewal !== 1 ? 's' : ''} on ${formatDate(expiryDate)}. Ensure your payment method is up to date.`,
      buttonLabel: 'View Subscription'
    }
  };

  const config = alertConfig[status];

  return (
    <div className={`${config.bgColor} ${config.textColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Alert Content */}
          <div className="flex items-start flex-1 min-w-0">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm sm:text-base">
                {config.title}
              </p>
              <p className={`text-xs sm:text-sm ${config.accentColor} mt-1`}>
                {config.message}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/settings/subscription')}
              className={`${config.buttonBg} ${config.buttonText} px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium ${config.buttonHover} transition-colors whitespace-nowrap`}
            >
              {config.buttonLabel}
            </button>
            <button
              onClick={onDismiss}
              className={`${config.textColor} hover:opacity-75 transition-opacity`}
              aria-label="Dismiss alert"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionAlert;