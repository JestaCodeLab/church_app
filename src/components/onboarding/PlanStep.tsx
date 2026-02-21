import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, Users, Check, Zap, Crown, Building, AlertCircle, Loader } from 'lucide-react';
import { settingsAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { useAuth } from '../../context/AuthContext';
import { usePaystackPayment } from '../../hooks/usePaystackPayment';

// Declare PaystackPop type for TypeScript
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: PaystackOptions) => {
        openIframe: () => void;
        close: () => void;
      };
    };
  }
}

interface PaystackOptions {
  key: string;
  email: string;
  amount: number;
  ref: string;
  callback: (response: PaystackResponse) => void;
  onClose: () => void;
}

interface PaystackResponse {
  reference: string;
  status: string;
  transaction: string;
  message: string;
}

interface PlanStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  loading: boolean;
  availablePlans: any[];
}

const PlanStep: React.FC<PlanStepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
  onSkip,
  loading,
  availablePlans,
}) => {
  const { user } = useAuth();
  const { initializePayment, loading: paymentLoading } = usePaystackPayment();
  
  const selectedPlanDetails = availablePlans.find(p => p.slug === formData.plan);


  const handleFinishSetup = async () => {
  if (!selectedPlanDetails) {
    showToast.error('Please select a plan.');
    return;
  }

  // For FREE plans - proceed directly
  if (selectedPlanDetails.price.amount === 0) {
    console.log('✅ Free plan selected, proceeding to complete onboarding');
    onNext();
    return;
  }

  // For PAID plans - handle payment first
  await initializePayment({
    email: user?.email || '',
    amount: selectedPlanDetails.price.amount * 100, // Convert to kobo
    planSlug: formData.plan,
    onSuccess: () => {
      showToast.success('Plan upgraded successfully!');
      onNext(); // Proceed to complete onboarding
    },
    onClose: () => {
      showToast.error('Payment cancelled. You can try again when ready.');
    }
  });
};

  const formatPrice = (amount: number, currency: string) => {
    if (amount === 0) return 'Free';
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors">
      {/* Progress */}
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Step 4 of 4
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: '100%' }} 
          />
        </div>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          Choose Your Plan
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select the plan that fits your church size. Start the journey to digital management!
        </p>
      </div>


      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {availablePlans.filter(p => p.type !== 'enterprise').map((plan: any) => {
          const Icon = () => {
            switch (plan.slug) {
              case 'starter': return <Users className="w-8 h-8 text-white" />;
              case 'growth': return <Zap className="w-8 h-8 text-white" />;
              case 'pro': return <Crown className="w-8 h-8 text-white" />;
              default: return <Building className="w-8 h-8 text-white" />;
            }
          };
          
          const isSelected = formData.plan === plan.slug;
          const isFree = plan.price.amount === 0;

          return (
            <button
              key={plan._id}
              onClick={() => setFormData({ ...formData, plan: plan.slug })}
              disabled={loading || paymentLoading}
              className={`relative p-6 rounded-lg border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900 dark:bg-opacity-20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Icon */}
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-4 ${
                plan.slug === 'starter' ? 'bg-primary-500' :
                plan.slug === 'growth' ? 'bg-green-500' :
                plan.slug === 'pro' ? 'bg-purple-500' : 'bg-gray-500'
              }`}>
                <Icon />
              </div>

              {/* Plan Details */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {plan.name}
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {formatPrice(plan.price.amount, plan.price.currency)}
                {!isFree && <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span>}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {plan.limits.members ? `Up to ${plan.limits.members.toLocaleString()} members` : 'Unlimited members'}
              </p>

              {/* Key Features */}
              <ul className="space-y-2">
                { plan?.highlights?.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Trial Notice */}
      {/* <div className="bg-primary-50 dark:bg-primary-900 dark:bg-opacity-20 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <p className="text-sm text-primary-800 dark:text-primary-200">
          <strong>14-Day Free Trial:</strong> All paid plans include a 14-day trial period. 
          No credit card required for the Free plan. Cancel anytime.
        </p>
      </div> */}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onBack}
          disabled={loading || paymentLoading}
          className="flex gap-1 items-center px-4 py-3 text-gray-600 rounded-lg border border-gray-300 dark:border-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleFinishSetup}
            disabled={loading || paymentLoading }
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {paymentLoading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : loading ? (
              'Finishing Setup...'
            ) : selectedPlanDetails?.price.amount === 0 ? (
              <>
                Finish Setup
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            ) : (
              <>
                Proceed to Pay
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanStep;