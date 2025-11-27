import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { merchantAPI } from '../../services/api';
import { Mail, ArrowRight } from 'lucide-react';
import AuthFooter from '../../components/auth/AuthFooter';
import { showToast } from '../../utils/toasts';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || '';
  const churchName = location.state?.churchName || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      showToast.error('Please register first');
      navigate('/register');
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (code.length !== 6) {
      showToast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await merchantAPI.verifyEmail({
        email,
        code: code.toUpperCase(),
      });

      showToast.success('Email verified successfully!');
      
      // Navigate to onboarding with data
      navigate('/onboarding', {
        state: {
          merchantId: response.data.data.merchantId,
          subdomainOptions: response.data.data.subdomainOptions,
          email,
          churchName,
        },
      });
    } catch (error: any) {
      showToast.error(
        error?.response?.data?.message || 'Verification failed. Please check your code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);

    try {
      await merchantAPI.resendCode({ email });
      showToast.success('Verification code sent to your email');
      setCountdown(60); // 60 second cooldown
    } catch (error: any) {
      showToast.error(
        error?.response?.data?.message || 'Failed to resend code'
      );
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setCode(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="text-gray-600 mt-2">
            We sent a 6-digit code to
          </p>
          <p className="text-gray-900 font-medium">{email}</p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enter Verification Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={code}
                onChange={handleCodeChange}
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl font-bold tracking-widest uppercase"
                placeholder="A1B2C3"
                maxLength={6}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Code expires in 10 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                'Verifying...'
              ) : (
                <>
                  Verify Email
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendCode}
              disabled={resending || countdown > 0}
              className="text-primary-600 hover:text-primary-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending
                ? 'Sending...'
                : countdown > 0
                ? `Resend in ${countdown}s`
                : 'Resend Code'}
            </button>
          </div>
        </div>

        <AuthFooter />
      </div>
    </div>
  );
};

export default VerifyEmail;