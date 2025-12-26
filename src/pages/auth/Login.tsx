import React, { useState, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toasts';
import AuthLayout from '../../components/auth/AuthLayout';
import PageTransition from '../../components/auth/PageTransition';
import { useMerchant } from '../../context/MerchantContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const { isMainDomain } = useMerchant();
  
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
  setLoading(true);
  setError('');

  try {
    const result = await login(formData);

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
      setError(result.message || 'Login failed');
      showToast.error(result.message || 'Login failed');
    }
  } catch (error: any) {
    console.error('Login error:', error);
    
    const errorData = error.response?.data;
    
    // ✅ Handle pending approval specifically
    if (errorData?.pendingApproval) {
      setError(errorData.message);
      showToast.error(errorData.message);
    } else if (errorData?.requiresOnboarding) {
      showToast.error(errorData.message);
      navigate('/onboarding');
    } else {
      const message = errorData?.message || 'Login failed. Please try again.';
      setError(message);
      showToast.error(message);
    }
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
                placeholder="youremail@yourapplication.org"
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