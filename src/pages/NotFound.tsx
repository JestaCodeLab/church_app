import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Mail, Globe } from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const hostname = window.location.hostname;
  const isSubdomain = hostname.split('.').length > 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
        </div>
      <div className="max-w-2xl w-full text-center">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <Globe className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          404
        </h1>
        
        {isSubdomain ? (
          <>
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Church Not Found
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              The church subdomain <span className="font-semibold text-primary-600 dark:text-primary-400">{hostname}</span> has not been configured yet or does not exist.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </>
        )}

        {/* Helpful Info Box */}
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6 mb-8 max-w-md mx-auto">
          <p className="text-sm text-primary-800 dark:text-blue-300 mb-3">
            <strong>Are you a church administrator?</strong>
          </p>
          <p className="text-sm text-primary-700 dark:text-primary-400 mb-4">
            If you've recently registered, your subdomain may still be pending approval. Check your email for updates.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </button>
          
          <a
            href="mailto:support@thechurchhq.com"
            className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
          >
            <Mail className="w-5 h-5 mr-2" />
            Contact Support
          </a>
        </div>

        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Need help getting started?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a
              href={`${process.env.REACT_APP_PROJECT_URL}`}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Visit Main Site
            </a>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
            <a
              href={`${process.env.REACT_APP_PROJECT_URL}/register`}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Register Your Church
            </a>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
            <a
              href={`#`}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;