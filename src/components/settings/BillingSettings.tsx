import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { Check, Crown, Users, Zap } from 'lucide-react';

const BillingSettings = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSubscription();
      setSubscription(response.data.data.subscription);
      setAvailablePlans(response.data.data.availablePlans);
    } catch (error) {
      showToast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (planSlug: string) => {
    if (planSlug === subscription.plan) return;
    setActionLoading(true);
    try {
      const response = await settingsAPI.changePlan(planSlug);
      if (response.data.data.authorization_url) {
        window.location.href = response.data.data.authorization_url;
      } else {
        showToast.success('Plan changed successfully!');
        fetchSubscription();
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to change plan');
    } finally {
      setActionLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter': return <Users className="w-6 h-6 text-gray-500" />;
      case 'growth': return <Zap className="w-6 h-6 text-blue-500" />;
      case 'pro': return <Crown className="w-6 h-6 text-purple-500" />;
      default: return <Users className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPlanSubText = (planId: string) => {
    switch (planId) {
      case 'starter': return 'Ideal for small churches starting out.';
      case 'growth': return 'Perfect for growing congregations.';
      case 'pro': return 'Best for large churches with advanced needs.';
      default: return '';
    }
  }


  if (loading) {
    return (
       <div className="mt-3 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading billing settings...</p>
        </div>
      </div>
    )
  }

  if (!subscription || !availablePlans) {
    return <div className="text-center p-8">Could not load subscription details.</div>;
  }

console.log('Plans', Object.keys(availablePlans))

  return (
    <div className="space-y-8">
      {/* Plan Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availablePlans?.map((plan: any, i: number) => {
          const isCurrent = subscription.plan === plan.slug;

          return (
            <div key={plan.slug} className={`rounded-xl border-2 p-6 transition-all ${isCurrent ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center space-x-3 mb-4">
                {getPlanIcon(plan?.slug)}
                <h4 className="text-lg font-bold text-blue-600 dark:text-gray-100">{plan.name}</h4>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {plan.price?.amount > 0 ? `GHS ${plan.price?.amount}` : 'Free'}
                {plan.price?.amount > 0 && <span className="text-sm font-normal text-gray-500">/month</span>}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 h-10">
                {getPlanSubText(plan?.slug)}
              </p>
              <ul className="space-y-2 mt-4 text-sm">
                {plan.highlights?.map((feature: any, i: number) => (
                  <li key={i} className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePlanChange(plan?.slug)}
                disabled={isCurrent || actionLoading}
                className={`w-full mt-6 py-2.5 rounded-lg font-semibold transition-colors ${isCurrent ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
              >
                {isCurrent ? 'Current Plan' : (actionLoading ? 'Processing...' : 'Upgrade Plan')}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default BillingSettings;
