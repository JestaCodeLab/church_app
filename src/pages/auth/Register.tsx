import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { merchantAPI } from '../../services/api';
import { ArrowRight } from 'lucide-react';
import { showToast } from '../../utils/toasts';
import AuthLayout from '../../components/auth/AuthLayout';
import PageTransition from '../../components/auth/PageTransition';
import { verificationStorage } from '../../utils/verificationStorage';

const Register = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    churchName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      showToast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      showToast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await merchantAPI.register({
        churchName: formData.churchName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

       // Save registration data to localStorage for persistence
      verificationStorage.save(formData.email, formData.churchName);

      showToast.success('Registration successful! Please check your email for verification code.');
      
      // Navigate to verification page with email
      navigate('/verify-email', { 
        state: { 
          email: formData.email,
          churchName: formData.churchName 
        } 
      });
    } catch (error: any) {
      showToast.error(
        error?.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
        <AuthLayout 
                title="Register Your Church" 
                subtitle={`Join ${process.env.REACT_APP_PROJECT_NAME || "The Church HQ"} and manage your church better`}
                maxWidth="2xl"
            >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors">
                <form onSubmit={handleSubmit} className="space-y-6">
                {/* Church Name */}
                <div>
                    <label htmlFor="churchName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Church Name *
                    </label>
                    <input
                    id="churchName"
                    name="churchName"
                    type="text"
                    required
                    value={formData.churchName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    placeholder="Shiloh Restoration Christian Movement"
                    />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Email Address *
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="admin@thechurchhq.com"
                    />
                    </div>

                    <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Phone Number *
                    </label>
                    <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="+233 55 XXX XXXX"
                    />
                    </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Password *
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="••••••••"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">Minimum 8 characters</p>
                    </div>

                    <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Confirm Password *
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="••••••••"
                    />
                    </div>
                </div>

                {/* Terms */}
                <div className="flex items-start">
                    <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 transition-colors"
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 transition-colors">
                    I agree to the{' '}
                    <a href="/" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors">
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors">
                        Privacy Policy
                    </a>
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                    'Creating Account...'
                    ) : (
                    <>
                        Create Account
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                    )}
                </button>
                </form>

                {/* Login Link */}
                <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors">
                    Sign in
                    </Link>
                </p>
                </div>
            </div>
        </AuthLayout>
    </PageTransition>
    
  );
};

export default Register;