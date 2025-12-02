import React, { useEffect } from 'react';
import { ArrowRight, ArrowLeft, Users, Check, Zap, Crown, Building } from 'lucide-react';
import { settingsAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { useAuth } from '../../context/AuthContext';

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
  // Add other properties you might receive
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
  const selectedPlanDetails = availablePlans.find(p => p.slug === formData.plan);
  
  useEffect(() => {
    // Load Paystack script dynamically
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleFinishSetup = async () => {
    if (!selectedPlanDetails) {
      showToast.error('Please select a plan.');
      return;
    }

    if (selectedPlanDetails.price.amount === 0) {
      // Free plan, proceed directly
      onNext();
    } else {
      // Paid plan, initiate payment via Paystack
      try {
        const response = await settingsAPI.changePlan(formData.plan);
        const { authorization_url, reference } = response.data.data;

        if (authorization_url && window.PaystackPop) {
          // Open Paystack popup
          window.PaystackPop.setup({
            key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || '',
            email: user?.email || '',
            amount: selectedPlanDetails.price.amount * 100, // Amount in kobo/cents
            ref: reference,
            callback: async (paystackResponse: PaystackResponse) => {
              if (paystackResponse.status === 'success') {
                try {
                  // Verify payment on backend
                  await settingsAPI.verifyPayment(paystackResponse.reference);
                  showToast.success('Payment successful! Plan upgraded.');
                  onNext(); // Proceed to success step
                } catch (error: any) {
                  showToast.error(error.response?.data?.message || 'Payment verification failed.');
                }
              } else {
                showToast.error('Payment cancelled or failed.');
              }
            },
            onClose: () => {
              showToast.success('Payment window closed.');
            },
          }).openIframe();
        } else {
          showToast.error('Failed to initiate payment. Please try again.');
        }
      } catch (error: any) {
        showToast.error(error.response?.data?.message || 'Failed to initiate plan change.');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors">
      {/* Progress */}
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Step 4 of 4
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: '100%' }} />
        </div>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          Choose Your Plan
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select the plan that fits your church size. Start with a 14-day free trial.
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
              className={`relative p-6 rounded-lg border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-700'
              }`}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 rounded-full shadow-lg dark:shadow-primary-500/20`}>
                  <Icon />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {isFree ? 'Free' : `GHS ${plan.price.amount}`}
                </span>
                {!isFree && (
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                )}
              </div>

              {/* Highlights */}
              <ul className="space-y-2">
                {plan.highlights.map((highlight: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start text-sm text-gray-700 dark:text-gray-300"
                  >
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Trial Notice */}
      <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>14-Day Free Trial:</strong> Try {selectedPlanDetails?.name || 'your selected'} plan risk-free. No credit card required for the Free plan. Cancel anytime.
        </p>
      </div>

      {/* Navigation - Single Line */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex gap-1 items-center px-4 py-3 text-gray-600 rounded-lg border border-gray-300 dark:border-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={onSkip}
            disabled={loading}
            className="px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
          <button
            onClick={handleFinishSetup}
            disabled={loading}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              'Finishing Setup...'
            ) : (
              <>
                Finish Setup
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