import React, { useState, FormEvent, ChangeEvent, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { merchantAPI } from '../../services/api';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { showToast } from '../../utils/toasts';
import PageTransition from '../../components/auth/PageTransition';
import { verificationStorage } from '../../utils/verificationStorage';
import { validateEmail, validatePhone } from '../../utils/validators';
import useSEO from '../../hooks/useSEO';
import ThemeToggle from '../../components/ui/ThemeToggle';
import AppLogo from '../../components/ui/AppLogo';

const SLIDE_1 = '/images/churchhq-register.jpg';

const Register = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  
const appMobileLogo = 'images/churchhq-preloader-icon.png';
const appLogo = 'images/logo-white.png';

  const testimonials = [
    {
      message: "Church HQ transformed how we manage our congregation. The QR code attendance tracking increased our accuracy by 100%, and the SMS reminders with our church name boosted midweek service attendance by 40%. The dashboard gives me instant insights into every aspect of our ministry.",
      name: "Pastor B.B Gilord",
      church: "The Saviors Embassy"
    },
    {
      message: "Church HQ unified everything—our entire leadership team can now see real-time attendance, giving trends, and member engagement across all branches from one dashboard. The financial tracking and automated member communications have saved our admin team 15+ hours per week.",
      name: "Emmanuel Appiah",
      church: "Harvest Chapel Network"
    },
    {
      message: "The social media management feature has been a game-changer for our outreach. We now schedule our entire month of content in just 2 hours and the custom SMS sender ID means our members actually read our messages—attendance at midweek services increased by 35% in just 3 months!",
      name: "Rev Jerry Martey",
      church: "FaithLove Chapel"
    }
  ];

  // Auto-rotate testimonials
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(nextSlide, 15000);
    return () => clearInterval(timer);
  }, [testimonials.length, nextSlide]);
  
  // SEO Configuration for Register Page
  useSEO({
    title: 'Register Your Church - Church HQ | Free Church Management Software',
    description: 'Register your church with Church HQ and start managing members, events, donations, and communications today. Free account creation for churches of all sizes.',
    keywords: 'register church, church registration, church management sign up, church account creation, free church software registration, member management signup',
    ogTitle: 'Register Your Church - Church HQ',
    ogDescription: 'Join thousands of churches using Church HQ to streamline their operations. Register your church today.',
    ogUrl: 'https://thechurchhq.com/register',
    ogType: 'website',
    canonicalUrl: 'https://thechurchhq.com/register',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: 'Church HQ Registration',
          url: 'https://thechurchhq.com/register',
          description: 'Registration page for new Church HQ accounts',
          publisher: {
            '@type': 'Organization',
            name: 'Church HQ',
            url: 'https://thechurchhq.com'
          }
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'How do I register my church with Church HQ?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Fill out the registration form with your church name, email, phone number, and create a secure password. You will receive an email verification code to activate your account.'
              }
            },
            {
              '@type': 'Question',
              name: 'Is Church HQ registration free?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes! Church HQ offers a free starter plan. You can upgrade to paid plans for additional features and functionality.'
              }
            }
          ]
        }
      ]
    }
  });
  
  const [formData, setFormData] = useState({
    churchName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation Email & Phone
    if (!validateEmail(formData.email).valid) {
      showToast.error('Please enter a valid email address');
      return;
    }

    if (formData.phone && !validatePhone(formData.phone).valid) {
      showToast.error('Please enter a valid phone number');
      return;
    }

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
      <div className="flex min-h-screen" data-theme="green">
        {/* Left Panel — Background with Testimonials (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src={SLIDE_1}
              alt="Church HQ"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

          {/* Logo at top */}
          <div className="absolute top-8 left-8 z-10">
            <AppLogo 
              size="sm" 
              className='rounded-[12px] cursor-pointer' 
              onClick={() => window.location.assign(process.env.REACT_APP_PROJECT_URL || 'https://thechurchhq.com')}
            />
          </div>

          {/* Testimonial slides at bottom */}
          <div className="absolute bottom-6 left-0 right-0 z-10 p-8 w-4/5">
            <div className="relative h-48">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20">
                    <p className="text-white text-sm mb-4 leading-relaxed">
                      "{testimonial.message}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{testimonial.name}</p>
                        <p className="text-white/70 text-xs">{testimonial.church}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dot indicators */}
            <div className="flex justify-start gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? 'bg-white w-8'
                      : 'bg-white/40 w-2 hover:bg-white/60'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel — Registration Form */}
        <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-gray-900 transition-colors relative">
          {/* Theme toggle - desktop only */}
          <div className="hidden lg:block absolute top-6 right-6 z-10">
            <ThemeToggle />
          </div>

          {/* Mobile header with logo */}
          <div className="lg:hidden flex items-center justify-between py-4 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <img src={appMobileLogo} alt="Church HQ" className="h-10 w-auto" />
            </div>
            <ThemeToggle />
          </div>

          {/* Centered form container */}
          <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16 overflow-y-auto">
            <div className="w-full max-w-xl">
              {/* Heading */}
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold dark:text-white">Register Your Church</h1>
                <p className="mt-0 text-gray-600 dark:text-gray-400">
                  Join {process.env.REACT_APP_PROJECT_NAME || "The Church HQ"} and manage your church better
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Church Name */}
                <div>
                  <label htmlFor="churchName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Church Name *
                  </label>
                  <input
                    id="churchName"
                    name="churchName"
                    type="text"
                    required
                    value={formData.churchName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    placeholder="Shiloh Restoration Christian Movement"
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="admin@thechurchhq.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="+233 55 XXX XXXX"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors pr-11"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 8 characters</p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors pr-11"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 transition-colors"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 transition-colors">
                    I agree to the{' '}
                    <a href="/" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !formData.churchName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password.trim() || !formData.confirmPassword.trim()}
                  className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:cursor-not-allowed flex items-center justify-center"
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
              <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Church HQ. All rights reserved.
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;
