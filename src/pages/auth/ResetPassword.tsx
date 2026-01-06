import React, { useState } from 'react';
import { Lock, Mail, Loader, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import AuthLayout from '../../components/auth/AuthLayout';
import PageTransition from '../../components/auth/PageTransition';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestingNewCode, setRequestingNewCode] = useState(false);
  const [newCodeSent, setNewCodeSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRequestNewCode = async () => {
    if (!email.trim()) {
      showToast.error('Please enter your email address');
      return;
    }

    try {
      setRequestingNewCode(true);
      const response = await authAPI.forgotPassword(email.toLowerCase());
      showToast.success('New reset code sent to your email!');
      setNewCodeSent(true);
      setToken('');
      setErrors({});
      
      // Reset the message after 5 seconds
      setTimeout(() => {
        setNewCodeSent(false);
      }, 5000);
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || 'Failed to send reset code'
      );
    } finally {
      setRequestingNewCode(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!token.trim()) {
      newErrors.token = 'Reset code is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.resetPassword(token, email.toLowerCase(), password, confirmPassword);

      showToast.success(response.data.message);
      setSubmitted(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      showToast.error(errorMessage);

      // Handle specific errors
      if (errorMessage.includes('expired')) {
        setErrors({ token: 'Reset link has expired. Please request a new one.' });
      } else if (errorMessage.includes('Invalid')) {
        setErrors({ token: 'Invalid reset code. Please check and try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <PageTransition>
        <AuthLayout>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Password Reset Successful
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your password has been updated. Redirecting to login...
              </p>
            </div>

            {/* Loading Indicator */}
            <div className="flex justify-center">
              <Loader className="w-6 h-6 text-primary-600 dark:text-primary-400 animate-spin" />
            </div>
          </div>
        </AuthLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <AuthLayout
        title="Reset Your Password"
        subtitle={`Reset your password for ${process.env.REACT_APP_PROJECT_NAME || "The Church HQ"}`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors space-y-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reset Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reset Code
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (errors.token) {
                    setErrors({ ...errors, token: '' });
                  }
                }}
                placeholder="Paste your reset code here"
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.token
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={loading}
              />
              {errors.token && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                  {errors.token}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: '' });
                    }
                  }}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.email
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors({ ...errors, password: '' });
                    }
                  }}
                  placeholder="Minimum 8 characters"
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.password
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: '' });
                    }
                  }}
                  placeholder="Re-enter your password"
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.confirmPassword
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Reset Password</span>
                </>
              )}
            </button>
          </form>

          {/* Need Help */}
          <div className="text-center space-y-3">
            {newCodeSent && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  New reset code sent to {email}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Reset code expired?{' '}
              <button
                type="button"
                onClick={handleRequestNewCode}
                disabled={requestingNewCode}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingNewCode ? 'Sending...' : 'Request a new one'}
              </button>
            </p>
          </div>
        </div>
      </AuthLayout>
    </PageTransition>
  );
};

export default ResetPassword;
