import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toasts';
import PageTransition from '../../components/auth/PageTransition';
import { useMerchant } from '../../context/MerchantContext';
import { validateEmail } from '../../utils/validators';
import useSEO from '../../hooks/useSEO';
import ThemeToggle from '../../components/ui/ThemeToggle';
import AppLogo from '../../components/ui/AppLogo';

const SLIDE_1 = '/images/slider04.jpg';
// const SLIDE_2 = '/images/slider03.jpg';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { merchant, isMainDomain } = useMerchant();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Build slides array
  const slides = merchant?.branding?.loginSlides?.length
    ? merchant.branding.loginSlides.map((s) => s.url)
    : [SLIDE_1];

  // Auto-rotate slides
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(nextSlide, 10000);
    return () => clearInterval(timer);
  }, [slides.length, nextSlide]);

  // SEO Configuration
  useSEO({
    title: 'Sign In - Church HQ | Church Management Software',
    description: 'Sign in to your Church HQ account to manage your church members, events, donations, and communications.',
    keywords: 'church login, church management login, sign in, church admin portal',
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

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(formData.email).valid) {
      showToast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');

      console.log('Hostname:', hostname, 'Parts:', parts);
      
      // Extract subdomain, but treat 'app' as main domain (not a church subdomain)
      let currentSubdomain = null;
      if (parts.length > 2) {
        // Production: app.thechurchhq.com or zionhill.thechurchhq.com
        const subdomain = parts[0];
        currentSubdomain = (subdomain === 'app' || subdomain === 'www') ? null : subdomain;
      } else if (parts.length === 2 && parts[1] === 'localhost') {
        // Development: app.localhost or zionhill.localhost
        const subdomain = parts[0];
        currentSubdomain = (subdomain === 'app') ? null : subdomain;
      }

      const loginData = { ...formData, subdomain: currentSubdomain };
      console.log('Login Data:', loginData);
      const result = await login(loginData);

      // Handle 202 redirect response
      if ((result as any).statusCode === 202 && (result as any).redirectUrl) {
        showToast.success('Redirecting to your church subdomain...');
        window.location.href = (result as any).redirectUrl;
        return;
      }

      if (result.success && result.user) {
        showToast.success('Login successful!');

        if (result.requiresOnboarding) {
          navigate('/onboarding');
          return;
        }

        if (result.user.role?.slug === 'super_admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        if ((result as any).statusCode === 403 && (result as any).correctSubdomain) {
          const correctSubdomain = (result as any).correctSubdomain;
          const protocol = window.location.protocol;
          const domain = process.env.REACT_APP_PROJECT_DOMAIN || 'thechurchhq.com';
          const redirectUrl = `${protocol}//${correctSubdomain}.${domain}/login`;
          showToast.error(`Please login at ${correctSubdomain}.${domain}...`);
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1000);
          return;
        }

        if ((result as any).pendingApproval) {
          setError(result.message || 'Your account is pending approval');
          showToast.error(result.message || 'Your account is pending approval');
          return;
        }

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

  const churchName = merchant?.name;
  const tagline = merchant?.branding?.tagline;
  const logo = merchant?.branding?.logo;
  const primaryColor = merchant?.branding?.primaryColor || '#82d76e';

  return (
    <PageTransition>
      <div className="flex min-h-screen" data-theme="green">
        {/* Left Panel — Image Slideshow (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden p-6">
          {/* Slide images */}
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {
            // check if the main domain is app.localhost:3000 or localhost:3000, if so, show the default logo and name instead of merchant branding
            isMainDomain && (
              <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
               <AppLogo 
                size="sm" 
                className='rounded-[12px] cursor-pointer' 
                onClick={() => window.location.assign(process.env.REACT_APP_PROJECT_URL || 'https://thechurchhq.com')}
              />
              </div>
            )
          }
          <div className="flex items-center gap-3 mb-3">
            {logo && (
              <img src={logo} alt={churchName} className="w-12 h-12 rounded-full object-cover" />
            )}
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/0" />

          

          {/* Bottom text overlay */}
            <div className="absolute bottom-16 left-8 right-8 z-10 p-8 rounded-[30px] backdrop-blur-md bg-black/30 w-3/5">
             {
              isMainDomain ? (
              <div>
                <h4 className="text-white font-semibold text-3xl drop-shadow-lg mb-1">Everything Your Church Needs, All in <span className="text-primary-600">One Place</span></h4>
                <p className="text-white/70 text-sm">Streamline your operations, engage your congregation, and grow your ministry with our comprehensive suite of tools designed specifically for modern churches.</p>
              </div>
              ): (
               <div>
                <div className="flex items-center gap-3 mb-3">
                {logo && (
                  <img src={logo} alt={churchName} width={'12%'} />
                )}
                </div>
                <h4 className="text-white font-semibold text-3xl drop-shadow-lg mb-1">{churchName}</h4>
              <p className="text-white/70 text-lg">{tagline}</p>
               </div> 
              )
             }
            </div>

          {/* Dot indicators */}
          {slides.length > 1 && (
            <div className="absolute bottom-6 left-14 p-4 -translate-x-1/2 z-10 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentSlide
                      ? 'bg-white w-6'
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Panel — Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-gray-900 transition-colors relative">
          {/* Theme toggle - desktop only */}
          <div className="hidden lg:block absolute top-6 right-6 z-10">
            <ThemeToggle />
          </div>
          {/* Mobile header with logo */}
          <div className="lg:hidden flex items-center justify-between py-4 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {logo ? (
                <img src={logo} alt={churchName} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <>
                  { isMainDomain ? (
                      <AppLogo 
                        size="sm" 
                        className='rounded-[12px] cursor-pointer' 
                        onClick={() => window.location.assign(process.env.REACT_APP_PROJECT_URL || 'https://thechurchhq.com')}
                      />
                    )
                    : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base"
                      style={{ backgroundColor: primaryColor }}
                    >
                    {churchName?.charAt(0)}
                    </div>
                  )
                }
                </>
              )}
              <span className="font-semibold text-gray-900 dark:text-white">{churchName}</span>
            </div>
            <ThemeToggle />
          </div>

          {/* Centered form container */}
          <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
            <div className="w-full max-w-md">
              {/* Heading */}
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold dark:text-white">Welcome Back!</h1>
                <p className="mt-0 text-gray-600 dark:text-gray-400">
                  Sign in to your account
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    placeholder="example@gmail.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
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
                  <div className="mt-2 text-right">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.email.trim() || !formData.password.trim()}
                  className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              {isMainDomain && (
                <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
                  >
                    Register your church
                  </Link>
                </p>
              )}
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

export default Login;
