import React, { useState } from 'react';
import { Mail, Loader, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import AuthLayout from '../../components/auth/AuthLayout';
import PageTransition from '../../components/auth/PageTransition';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.forgotPassword(email.toLowerCase());

      showToast.success(response.data.message);
      setSubmitted(true);
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || 'Failed to send reset email'
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <PageTransition>
        <AuthLayout showHeader={false} icon={"/images/logo-only.png"}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Check Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                We've sent a password reset link to:
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 break-all">
                {email}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-primary-900 dark:text-primary-100">
                Next steps:
              </h3>
              <ol className="text-sm text-primary-700 dark:text-blue-300 list-decimal list-inside space-y-1">
                <li>Check your email inbox</li>
                <li>Click the reset password link</li>
                <li>Enter your new password</li>
                <li>Log in with your new password</li>
              </ol>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                💡 <strong>Tip:</strong> The reset link expires in 30 minutes
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Send Reset Link to Another Email
              </button>

              <Link
                to="/login"
                className="block w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-center transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </AuthLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div data-theme="green">
      <AuthLayout 
        title="Forgot Your Password?" 
        subtitle={'Enter your email below to receive a password reset link.'}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors space-y-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <p className="text-sm text-primary-700 dark:text-blue-300">
              <strong>For security,</strong> we'll only send a reset link if an account exists with this email
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{' '}
            <Link
              to="/login"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
            >
              Log in instead
            </Link>
          </p>
        </div>
      </AuthLayout>
      </div>
    </PageTransition>
  );
};

export default ForgotPassword;
