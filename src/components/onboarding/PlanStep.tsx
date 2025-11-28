import React from 'react';
import { ArrowRight, ArrowLeft, Users, Check, Zap, Crown, Building, Lock } from 'lucide-react';

interface PlanStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  loading: boolean;
}

const PlanStep: React.FC<PlanStepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
  onSkip,
  loading,
}) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 'GHS 0',
      icon: Users,
      memberLimit: 20,
      features: [
        'Up to 20 members',
        'Basic member management',
        'SMS & Email communications',
        'Community support',
      ],
      color: 'gray',
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 'GHS 99',
      icon: Zap,
      memberLimit: 100,
      features: [
        'Up to 100 members',
        'Advanced member management',
        'SMS & Email communications',
        'Event management',
        'Basic reports',
        'Email support',
      ],
      color: 'blue',
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'GHS 299',
      icon: Crown,
      memberLimit: 500,
      features: [
        'Up to 500 members',
        'All Basic features',
        'Financial management',
        'Advanced reports & analytics',
        'Priority support',
        'Custom branding',
      ],
      color: 'purple',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      icon: Building,
      memberLimit: 'Unlimited',
      features: [
        'Unlimited members',
        'All Premium features',
        'Multi-location support',
        'API access',
        'Dedicated account manager',
        'Custom integrations',
      ],
      color: 'indigo',
    },
  ];

  const selectedPlan = plans.find(p => p.id === formData.plan);
  const requiresPayment = formData.plan !== 'free' && formData.plan !== 'enterprise';

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
        {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
          <Crown className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div> */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          Choose Your Plan
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select the plan that fits your church size. Start with a 14-day free trial.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isSelected = formData.plan === plan.id;

          return (
            <button
              key={plan.id}
              onClick={() => setFormData({ ...formData, plan: plan.id })}
              className={`relative p-6 rounded-lg border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-700'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 dark:bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    POPULAR
                  </span>
                </div>
              )}

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
                <div className={`p-2 ${isSelected ? 'bg-blue-600 dark:bg-blue-900' : 'bg-gray-100'} dark:bg-gray-800 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-blue-600'} dark:text-${plan.color}-400`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {typeof plan.memberLimit === 'number'
                      ? `Up to ${plan.memberLimit} members`
                      : plan.memberLimit}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {plan.price}
                </span>
                {plan.price !== 'Custom' && plan.price !== 'GHS 0' && (
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start text-sm text-gray-700 dark:text-gray-300"
                  >
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Payment Section - Only show if not Free plan */}
      {requiresPayment && (
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Payment Information
            </h2>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Lock className="w-4 h-4 mr-2" />
              Secure Payment
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            You won't be charged until your 14-day free trial ends. Cancel anytime.
          </p>

          {/* Payment Method Toggle */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                formData.paymentMethod === 'card'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              Card Payment
            </button>
            <button
              onClick={() => setFormData({ ...formData, paymentMethod: 'mobile_money' })}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                formData.paymentMethod === 'mobile_money'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              Mobile Money
            </button>
          </div>

          {/* Card Payment Form */}
          {formData.paymentMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={formData.cardholderName}
                  onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Expiration Date
                  </label>
                  <input
                    type="text"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                    placeholder="MM / YY"
                    maxLength={7}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    value={formData.cvc}
                    onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mobile Money */}
          {formData.paymentMethod === 'mobile_money' && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Mobile Money integration coming soon! You can skip this step and use the free plan.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trial Notice */}
      <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>14-Day Free Trial:</strong> Try {selectedPlan?.name || 'your selected'} plan risk-free. No credit card required for the Free plan. Cancel anytime.
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
            onClick={onNext}
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