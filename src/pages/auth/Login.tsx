import React, { useState, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toasts';
import AuthLayout from '../../components/auth/AuthLayout';
import PageTransition from '../../components/auth/PageTransition';
import { useMerchant } from '../../context/MerchantContext';
import { validateEmail } from '../../utils/validators';
import useSEO from '../../hooks/useSEO';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const { isMainDomain } = useMerchant();
  
  // SEO Configuration for Login Page
  useSEO({
    title: 'Sign In - Church HQ | Church Management Software',
    description: 'Sign in to your Church HQ account to manage your church members, events, donations, and communications. Secure login for church administrators and staff.',
    keywords: 'church login, church management login, sign in, church admin portal, secure church login',
    ogTitle: 'Sign In - Church HQ',
    ogDescription: 'Access your church management dashboard on Church HQ',
    ogUrl: 'https://thechurchhq.com/login',
    ogType: 'website',
    canonicalUrl: 'https://thechurchhq.com/login',
    noindex: false,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Church HQ Login',
      url: 'https://thechurchhq.com/login',
      description: 'Secure login page for Church HQ users',
      publisher: {
        '@type': 'Organization',
        name: 'Church HQ',
        url: 'https://thechurchhq.com'
      }
    }
  });
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation
  if (!validateEmail(formData.email).valid) {
    showToast.error('Please enter a valid email address');
    return;
  }
  setLoading(true);
  setError('');

  try {
    // ✅ Extract current subdomain from hostname
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const currentSubdomain = parts.length > 2 ? parts[0] : null;
    
    // ✅ Include subdomain in login payload
    const loginData = {
      ...formData,
      subdomain: currentSubdomain
    };
    
    const result = await login(loginData);

    // ✅ Handle 202 redirect response
    if ((result as any).statusCode === 202 && (result as any).redirectUrl) {
      showToast.success('Redirecting to your church subdomain...');
      console.log('🔄 Redirecting to:', (result as any).redirectUrl);
      window.location.href = (result as any).redirectUrl;
      return;
    }

    if (result.success && result.user) {
      showToast.success('Login successful!');

      // Check if requires onboarding
      if (result.requiresOnboarding) {
        navigate('/onboarding');
        return;
      }

      // Redirect based on role
      if (result.user.role?.slug === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      // ✅ Check result for specific error scenarios
      if ((result as any).statusCode === 403 && (result as any).correctSubdomain) {
        const correctSubdomain = (result as any).correctSubdomain;
        const protocol = window.location.protocol;
        const redirectUrl = `${protocol}//${correctSubdomain}.thechurchhq.com/login`;
        showToast.error(`Please login at ${correctSubdomain}.thechurchhq.com...`);
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
        return;
      }
      
      // ✅ Handle pending approval
      if ((result as any).pendingApproval) {
        setError(result.message || 'Your account is pending approval');
        showToast.error(result.message || 'Your account is pending approval');
        return;
      }
      
      // ✅ Handle requires onboarding
      if (result.requiresOnboarding) {
        showToast.error(result.message || 'Please complete onboarding');
        navigate('/onboarding');
        return;
      }
      
      setError(result.message || 'Login failed');
      showToast.error(result.message || 'Login failed');
    }
  } catch (error: any) {
    console.error('Login error:', error);
    const message = 'Login failed. Please try again.';
    setError(message);
    showToast.error(message);
  } finally {
    setLoading(false);
  }
};

  return (
    <PageTransition>
    <AuthLayout>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
            </label>
            <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                placeholder="example@gmail.com"
            />
            </div>

            <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
            </label>
            <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                placeholder="••••••••"
            />
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium mt-2 inline-block"
            >
              Forgot Password?
            </Link>
            </div>

            <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {loading ? 'Signing in...' : 'Sign In'}
            </button>
        </form>

        <div className="mt-6 text-center">
          {isMainDomain && ( 
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold">
                Register your church
              </Link>
            </p>
          )}
        </div>
        </div>
    </AuthLayout>
    </PageTransition>
  );
};

export default Login;