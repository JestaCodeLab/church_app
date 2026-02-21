import React from 'react';
import { CheckCircle, ArrowRight, Users, Calendar, MessageSquare, Settings } from 'lucide-react';

interface SuccessStepProps {
  churchName: string;
  subdomain: string;
  onContinue: () => void;
}

const SuccessStep: React.FC<SuccessStepProps> = ({
  churchName,
  subdomain,
  onContinue,
}) => {
  const quickActions = [
    {
      icon: Users,
      title: 'Add Members',
      description: 'Start building your church directory',
      color: 'bg-primary-500',
    },
    {
      icon: Calendar,
      title: 'Create Events',
      description: 'Schedule services and activities',
      color: 'bg-green-500',
    },
    {
      icon: MessageSquare,
      title: 'Send Messages',
      description: 'Communicate with your congregation',
      color: 'bg-purple-500',
    },
    {
      icon: Settings,
      title: 'Customize Settings',
      description: 'Personalize your experience',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors text-center">
      {/* Success Icon */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          🎉 Congratulations!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Your church is now active on The Church HQ!
        </p>
      </div>

      {/* Church Info */}
      <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {churchName}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-3">
          Your dashboard is ready at:
        </p>
        <div className="inline-block px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg font-mono text-sm">
          {subdomain}.ourplatform.com
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Get Started With These Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-start space-x-3">
                  <div className={`${action.color} p-2 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={onContinue}
        className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center group"
      >
        Go to Dashboard
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Help Link */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
        Need help getting started?{' '}
        <a href="/" className="text-primary-600 dark:text-primary-400 hover:underline">
          View our getting started guide
        </a>
      </p>
    </div>
  );
};

export default SuccessStep;