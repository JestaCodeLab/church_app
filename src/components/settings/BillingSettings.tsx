import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { Check, Crown, Users, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePaystackPayment } from '../../hooks/usePaystackPayment';
import DiscountCodeInput from '../ui/DiscountCodeInput';
import UsageMeter from '../ui/UsageMeter';

const BillingSettings = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { initializePayment, loading: paymentLoading, scriptLoaded } = usePaystackPayment();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSubscription();
      console.log('SUBSCRIPTION =>', response?.data?.data)
      setSubscription(response.data.data.subscription);
      setAvailablePlans(response.data.data.availablePlans);
    } catch (error) {
      showToast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (planSlug: string) => {
    const selectedPlan = availablePlans.find((p: any) => p.slug === planSlug);
    
    if (!selectedPlan) return;

    setSelectedPlan(selectedPlan);

    // Free plan - no payment needed
    if (selectedPlan.price.amount === 0) {
      try {
        setActionLoading(true);
        await settingsAPI.changePlan(planSlug);
        showToast.success('Plan changed successfully!');
        fetchSubscription();
        setAppliedDiscount(null);
      } catch (error: any) {
        showToast.error(error.response?.data?.message || 'Failed to change plan');
      } finally {
        setActionLoading(false);
      }
      return;
    }

    // Paid plan - show upgrade modal with discount option
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;

    const finalAmount = appliedDiscount 
      ? appliedDiscount.finalAmount 
      : selectedPlan.price.amount;

    // Initiate payment
    await initializePayment({
      email: user?.email || '',
      amount: finalAmount * 100, // Convert to kobo/pesewas
      planSlug: selectedPlan.slug,
      discountCode: appliedDiscount?.code || null,
      onSuccess: () => {
        showToast.success('Subscription updated successfully!');
        setShowUpgradeModal(false);
        setSelectedPlan(null);
        setAppliedDiscount(null);
        fetchSubscription();
      },
      onClose: () => {
        setShowUpgradeModal(false);
      }
    });
  };

  const getPlanIcon = (planSlug: string) => {
    switch (planSlug) {
      case 'starter': return <Users className="w-6 h-6 text-gray-500" />;
      case 'growth': return <Zap className="w-6 h-6 text-blue-500" />;
      case 'pro': return <Crown className="w-6 h-6 text-purple-500" />;
      default: return <Users className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPlanSubText = (planSlug: string) => {
    switch (planSlug) {
      case 'starter': return 'Ideal for small churches starting out.';
      case 'growth': return 'Perfect for growing congregations.';
      case 'pro': return 'Best for large churches with advanced needs.';
      default: return '';
    }
  };

  const isNearLimit = (current: number, limit: number | null) => {
    if (!limit) return false;
    return (current / limit) >= 0.8; // 80% or more
  };

  if (loading) {
    return (
      <div className="mt-3 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center py-5">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading billing settings...</p>
        </div>
      </div>
    );
  }

  if (!subscription || !availablePlans) {
    return <div className="text-center p-8">Could not load subscription details.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Current Usage Section */}
      {subscription.usage && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Current Usage
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Monitor your resource usage across different areas of your account
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Members Usage */}
            {subscription.limits?.members && (
              <div>
                <UsageMeter
                  resourceName="Members"
                  current={subscription.usage.members || 0}
                  limit={subscription.limits.members}
                />
                {isNearLimit(subscription.usage.members || 0, subscription.limits.members) && (
                  <div className="mt-2 flex items-center text-sm text-orange-600 dark:text-orange-400">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span>Approaching limit - consider upgrading</span>
                  </div>
                )}
              </div>
            )}

            {/* Branches Usage */}
            {subscription.limits?.branches && (
              <div>
                <UsageMeter
                  resourceName="Branches"
                  current={subscription.usage.branches || 0}
                  limit={subscription.limits.branches}
                />
              </div>
            )}

            {/* Events Usage */}
            {/* {subscription.limits?.events && (
              <div>
                <UsageMeter
                  resourceName="Events"
                  current={subscription.usage.events || 0}
                  limit={subscription.limits.events}
                />
              </div>
            )} */}

            {/* Sermons Usage */}
            {/* {subscription.limits?.sermons && (
              <div>
                <UsageMeter
                  resourceName="Sermons"
                  current={subscription.usage.sermons || 0}
                  limit={subscription.limits.sermons}
                />
              </div>
            )} */}
          </div>
        </div>
      )}

      {/* Plan Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Subscription Planssss
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans?.map((plan: any) => {
            const isCurrent = subscription.plan === plan.slug;

            return (
              <div 
                key={plan.slug} 
                className={`rounded-xl border-2 p-6 transition-all ${
                  isCurrent 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-3 mb-4">
                  {getPlanIcon(plan?.slug)}
                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{plan.name}</h4>
                </div>
                
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {plan.price?.amount > 0 ? `GHS ${plan.price?.amount}` : 'Free'}
                  {plan.price?.amount > 0 && (
                    <span className="text-sm font-normal text-gray-500">/month</span>
                  )}
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 min-h-[2.5rem]">
                  {getPlanSubText(plan?.slug)}
                </p>
                
                <ul className="space-y-2 mt-4 text-sm">
                  {plan.highlights?.map((feature: any, i: number) => (
                    <li key={i} className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handlePlanChange(plan?.slug)}
                  disabled={isCurrent || actionLoading}
                  className={`w-full mt-6 py-2.5 rounded-lg font-semibold transition-colors ${
                    isCurrent 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : (actionLoading ? 'Processing...' : 'Select Plan')}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Modal with Discount Code */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => {
                setShowUpgradeModal(false);
                setAppliedDiscount(null);
              }}
            />

            {/* Modal */}
            <div className="relative inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Upgrade to {selectedPlan.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Review your order and apply a discount code if you have one
                </p>

                {/* Plan Summary */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Plan:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedPlan.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      GHS {selectedPlan.price.amount} / month
                    </span>
                  </div>
                </div>

                {/* Discount Code Input */}
                <DiscountCodeInput
                  planSlug={selectedPlan.slug}
                  merchantId={user?.merchant?.id || ''}
                  onDiscountApplied={(discount) => setAppliedDiscount(discount)}
                  onDiscountRemoved={() => setAppliedDiscount(null)}
                  className="mb-6"
                />

                {/* Total */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-gray-100">Total:</span>
                    <span className="text-primary-600 dark:text-primary-400">
                      GHS {appliedDiscount ? appliedDiscount.finalAmount : selectedPlan.price.amount}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowUpgradeModal(false);
                      setAppliedDiscount(null);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmUpgrade}
                    disabled={paymentLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {paymentLoading ? 'Processing...' : 'Proceed to Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSettings;