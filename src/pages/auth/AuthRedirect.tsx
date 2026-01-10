import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../utils/toasts';
import { setSecureItem } from '../../utils/encryption';
import { useAuth } from '../../context/AuthContext';

/**
 * ✅ AuthRedirect Component
 * Handles cross-subdomain redirect after login
 * Extracts tokens from URL hash and stores them
 * Then redirects to dashboard
 */
const AuthRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated, checkAuth } = useAuth();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // ✅ Extract tokens from URL hash (hash is client-side only)
        const hash = window.location.hash.substring(1); // Remove #
        const params = new URLSearchParams(hash);
        
        const token = params.get('token');
        const refresh = params.get('refresh');
        const subdomain = params.get('subdomain');
        
        if (!token || !refresh) {
          console.error('[AuthRedirect] Missing tokens in URL');
          showToast.error('Authentication tokens missing. Redirecting to login.');
          navigate('/login?error=missing_tokens');
          return;
        }
        
        console.log('[AuthRedirect] ✅ Tokens extracted from URL hash');
        
        // ✅ Store tokens securely using encrypted storage
        await setSecureItem('accessToken', token);
        await setSecureItem('refreshToken', refresh);
        
        console.log('[AuthRedirect] ✅ Tokens securely stored');
        
        // ✅ Clear URL hash to avoid exposing tokens in browser history
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('[AuthRedirect] ✅ Hash cleared, calling checkAuth to verify tokens');
        
        // ✅ CRITICAL: Call checkAuth to verify tokens and update auth state
        // This ensures the user is authenticated before we navigate to dashboard
        await checkAuth();
        
        console.log('[AuthRedirect] ✅ Authentication verified, redirecting to dashboard');
        
        // ✅ Redirect to dashboard
        // Small delay to ensure state is updated
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      } catch (error) {
        console.error('[AuthRedirect] Error:', error);
        showToast.error('Failed to process authentication redirect');
        navigate('/login?error=redirect_failed');
      } finally {
        setProcessing(false);
      }
    };

    handleRedirect();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        {/* Spinner */}
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          {processing ? 'Completing login...' : 'Redirecting to dashboard...'}
        </p>
      </div>
    </div>
  );
};

export default AuthRedirect;
