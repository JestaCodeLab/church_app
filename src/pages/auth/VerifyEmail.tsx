import React, { useState, useEffect, useRef, FormEvent, KeyboardEvent, ClipboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { merchantAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { verificationStorage } from '../../utils/verificationStorage';
import { useAuth } from '../../context/AuthContext';
import { setSecureItem } from '../../utils/encryption';
import { Mail, ArrowRight } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import PageTransition from '../../components/auth/PageTransition';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth, logout } = useAuth();
  
  const storedData = verificationStorage.get();
  const email = location.state?.email || storedData?.email || '';
  const churchName = location.state?.churchName || storedData?.churchName || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      showToast.error('Please complete registration first');
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (sanitized.length > 1) {
      handlePaste(sanitized);
      return;
    }

    const newCode = [...code];
    newCode[index] = sanitized;
    setCode(newCode);

    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (pastedData: string) => {
    const sanitized = pastedData.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const newCode = sanitized.split('');
    
    while (newCode.length < 6) {
      newCode.push('');
    }
    
    setCode(newCode);
    
    const nextEmptyIndex = newCode.findIndex(c => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handlePasteEvent = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    handlePaste(pastedData);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      showToast.error('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await merchantAPI.verifyEmail({
        email,
        code: fullCode,
      });

      const { accessToken, refreshToken, user, merchantId, subdomainOptions } = response.data.data;

      // Save encrypted tokens and user to localStorage (auto-login)
      await setSecureItem('accessToken', accessToken);
      await setSecureItem('refreshToken', refreshToken);
      await setSecureItem('user', user);

      // Update auth context
      await checkAuth();

      // Clear verification storage
      verificationStorage.clear();

      showToast.success('Email verified successfully! Welcome aboard! 🎉');
      
      // Navigate to onboarding
      navigate('/onboarding', {
        state: {
          merchantId,
          subdomainOptions,
          email,
          churchName,
        },
        replace: true,
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
      setCountdown(60*5); // 5 minutes
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      showToast.error(
        error?.response?.data?.message || 'Failed to resend code'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <PageTransition direction="right">
      <div data-theme="green">
        <AuthLayout 
          title="Verify Your Email" 
          subtitle=""
          icon={<Mail className="w-8 h-8 text-white" />}
        >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors">
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Verification code sent to:
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100 text-center mt-1">
              {email}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Please find the <strong>6-digit code</strong> in the email and enter it below to complete your registration.
              </p>
            </div>

            <div className="flex justify-center gap-2 sm:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePasteEvent}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  autoComplete="off"
                />
              ))}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              This code will expire in <strong>10 minutes</strong>
            </p>

            <button
              type="submit"
              disabled={loading || code.join('').length !== 6}
              className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                'Verifying...'
              ) : (
                <>
                  Verify & Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-2 text-center pt-2 flex gap-1 items-center justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-0">
              Didn't receive the email?
            </p>
            <button
              onClick={handleResendCode}
              disabled={resending || countdown > 0}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {resending
                ? 'Sending...'
                : countdown > 0
                ? `Resend in ${countdown}s`
                : 'Resend Code'}
            </button>
          </div>
          <div className="mt-4 text-center border-t border-gray-200 dark:border-gray-700 pt-4 flex gap-1 items-center justify-center">
            <button
              onClick={logout}
              disabled={resending || countdown > 0}
              className="text-red-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </AuthLayout>
      </div>
    </PageTransition>
  );
};

export default VerifyEmail;
