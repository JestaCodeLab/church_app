import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Mail, Clock, ArrowRight, Home } from 'lucide-react';
import { clearSecureItems } from '../../utils/encryption';
import PageTransition from '../auth/PageTransition';

const OnboardingSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [merchantData, setMerchantData] = useState<any>(null);

  useEffect(() => {
  const data = localStorage.getItem('onboardingComplete');
  
    if (data) {
      const parsed = JSON.parse(data);
      setMerchantData(parsed);
  } else {
    navigate('/');
  }
}, [navigate]);

  const handleGoHome = () => {  
  // Clear onboarding data
  localStorage.removeItem('onboardingComplete');
  
  // Clear all encrypted auth tokens
  clearSecureItems(['accessToken', 'refreshToken', 'user']);
  
  window.location.href = '/login';
};

  if (!merchantData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-16">
            {/* Success Icon */}
            <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
                <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to The Church HQ!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
                Thank you for completing your registration
            </p>
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Church Info Section */}
            <div className="p-8 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {merchantData.name}
                </h2>
                <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                    Pending Approval
                </span>
                </div>

                {/* Subdomain Display */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Church Dashboard URL:</p>
                <div className="flex items-center space-x-2">
                    <code className="flex-1 text-lg font-mono text-primary-600 dark:text-primary-400">
                    {merchantData.fullDomain || `${merchantData.subdomain}.thechurchhq.com`}
                    </code>
                </div>
                </div>

                {/* Email Confirmation */}
                <div className="flex items-start space-x-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Confirmation Email Sent
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    We've sent a confirmation to <span className="font-medium">{merchantData.email}</span>
                    </p>
                </div>
                </div>
            </div>

            {/* What's Next Section */}
            <div className="p-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary-600" />
                What's Next?
                </h3>

                <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                    </div>
                    <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                        Application Review
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Our team is reviewing your application and setting up your church dashboard.
                    </p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                    </div>
                    <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                        Account Setup
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        We're configuring your custom subdomain, features, and initial settings.
                    </p>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                    </div>
                    <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                        Activation Email
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        You'll receive an email with your login credentials and getting started guide within 24 hours.
                    </p>
                    </div>
                </div>
                </div>
            </div>

            {/* Timeline Section */}
            <div className="px-8 pb-8">
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-6 border border-primary-200 dark:border-primary-800">
                <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    <div>
                    <p className="font-medium text-primary-900 dark:text-primary-100">
                        Expected Activation Time
                    </p>
                    <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                        Usually within 24 hours • You'll be notified via email
                    </p>
                    </div>
                </div>
                </div>
            </div>

            {/* Support Section */}
            <div className="bg-gray-50 dark:bg-gray-900 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Questions or need immediate assistance?
                <br />
                <a 
                    href="mailto:support@thechurchhq.com" 
                    className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                    Contact our support team
                </a>
                </p>
            </div>
            </div>

            {/* Action Button */}
            <div className="text-center mt-8">
            <button
                onClick={handleGoHome}
                className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <Home className="w-5 h-5 mr-2" />
                Return to Homepage
            </button>
            </div>

            {/* Footer Note */}
            <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-500">
                By completing registration, you agree to our{' '}
                <a href="/" className="text-primary-600 dark:text-primary-400 hover:underline">
                Terms of Service
                </a>{' '}
                and{' '}
                <a href="/" className="text-primary-600 dark:text-primary-400 hover:underline">
                Privacy Policy
                </a>
            </p>
            </div>
        </div>
        </div>
    </PageTransition>
  );
};

export default OnboardingSuccess;