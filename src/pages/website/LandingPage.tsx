import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Menu, X, ArrowRight, Check, ChevronDown, Users, Calendar,
  MessageSquare, DollarSign, BarChart3, Shield, Zap, Globe,
  ArrowUpRight, Star, Play, Sparkles, TrendingUp, Heart, User,
  ChevronLeft, ChevronRight, Facebook, Twitter, Linkedin, Instagram, Mail, Send,
  Church
} from 'lucide-react';
import api from '../../services/api';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import MobileAppSection from '../../components/sections/MobileAppSection';
import useSEO from '../../hooks/useSEO';
import PageTransition from '../../components/auth/PageTransition';
import FeatureShowcase from '../../components/sections/FeatureSection';

// Counter Component
const CounterStat: React.FC<{ value: number; suffix: string; format?: string }> = ({ value, suffix, format }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const increment = end / 60;
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  const displayValue = format === 'K' ? (count / 1000).toFixed(0) : format === 'M' ? (count / 1000000).toFixed(1) : count;
  const formatSuffix = format === 'K' ? 'K' : format === 'M' ? 'M' : '';
  return <>{displayValue}{formatSuffix}{suffix}</>;
};


const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [pricing, setPricing] = useState<any[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Comprehensive SEO Configuration for Landing Page
  useSEO({
    title: 'Church HQ - Church Management Software & Member Engagement Platform',
    description: 'Church HQ is the ultimate platform for church management, member engagement, SMS communications, donations, and event planning. Trusted by thousands of churches worldwide.',
    keywords: 'church management software, member management, member app, donation management, SMS church, event planning, church communications, attendance tracking, tithe management, church engagement platform',
    author: 'Church HQ',
    ogTitle: 'Church HQ - Transform Your Church Operations',
    ogDescription: 'Manage members, events, donations, and communications in one powerful platform designed for modern churches.',
    ogImage: 'https://thechurchhq.com/images/og-image.png',
    ogUrl: 'https://thechurchhq.com',
    ogType: 'website',
    twitterTitle: 'Church HQ - Church Management Software',
    twitterDescription: 'The ultimate platform for modern churches. Manage members, events, donations, and communications easily.',
    twitterImage: 'https://thechurchhq.com/images/og-image.png',
    canonicalUrl: 'https://thechurchhq.com',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'Church HQ',
          url: 'https://thechurchhq.com',
          logo: 'https://thechurchhq.com/logo.png',
          description: 'The ultimate platform for modern churches to manage members, events, donations, communications, and engagement',
          sameAs: [
            'https://www.facebook.com/churchhq',
            'https://www.twitter.com/churchhq',
            'https://www.linkedin.com/company/churchhq',
            'https://www.instagram.com/churchhq'
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Support',
            email: 'support@thechurchhq.com',
            availableLanguage: ['en']
          },
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'Global'
          }
        },
        {
          '@type': 'SoftwareApplication',
          name: 'Church HQ',
          description: 'Modern church management and member engagement platform',
          url: 'https://thechurchhq.com',
          applicationCategory: 'BusinessApplication',
          operatingSystem: ['Web', 'iOS', 'Android'],
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'GHS',
            description: 'Free tier available, paid plans starting at GHS450/month'
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150'
          },
          featureList: [
            'Member Management',
            'Event Planning',
            'SMS Communications',
            'Mobile App',
            'SMS Automations',
            'Donation Tracking',
            'Attendance Management',
            'Financial Reports'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://thechurchhq.com'
            }
          ]
        }
      ]
    }
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch pricing data
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await api.get('/public/plans');
        if (response) {
          setPricing(response.data);
        }
      } catch (error) {
        console.error('Error fetching pricing:', error);
        // Use default pricing if fetch fails
        setPricing(defaultPricing);
      } finally {
        setLoadingPricing(false);
      }
    };

    fetchPricing();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      const response = await api.post('/public/contact', {
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message,
      });
      if (response?.data?.success) {
        setContactSuccess(true);
        toast.success('Message sent successfully!');
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => {
          setContactModalOpen(false);
          setContactSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to send message. Please try again.';
      toast.error(errorMessage);
    } finally {
      setContactLoading(false);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'benefits', label: 'Apps' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'faqs', label: 'FAQs' },
  ];

  const features = [
    {
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      title: 'Member Management',
      description: 'Track, organize, and engage your entire congregation with powerful member profiles and insights.',
    },
    {
      icon: Calendar,
      color: 'from-purple-500 to-pink-500',
      title: 'Event Planning',
      description: 'Create, manage, and promote events with automated invitations and RSVP tracking.',
    },
    {
      icon: MessageSquare,
      color: 'from-green-500 to-emerald-500',
      title: 'Communications',
      description: 'Send SMS, email, and push notifications to reach your community instantly.',
    },
    {
      icon: DollarSign,
      color: 'from-orange-500 to-red-500',
      title: 'Donations',
      description: 'Accept online donations, manage tithes, and automate financial processes.',
    },
    {
      icon: BarChart3,
      color: 'from-indigo-500 to-blue-500',
      title: 'Reports',
      description: 'Get deep insights with comprehensive analytics and financial reports.',
    },
    {
      icon: Shield,
      color: 'from-red-500 to-pink-500',
      title: 'Security',
      description: 'Enterprise-grade security with encrypted data and role-based access control.',
    },
  ];


  const defaultPricing = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for small churches just starting out',
      highlights: ['Up to 20 members', 'Basic member management', 'Email support', 'Limited SMS'],
      highlighted: false,
      badge: 'Most Popular'
    },
    {
      name: 'Basic',
      price: 450,
      period: '/month',
      description: 'For growing churches',
      highlights: ['Up to 1,000 members', 'Full member management', 'Event planning', 'Email support', '5000 SMS/month'],
      highlighted: false
    },
    {
      name: 'Growth',
      price: 750,
      period: '/month',
      description: 'For established churches',
      highlights: ['Unlimited members', 'Advanced analytics', 'Email + Phone support', 'Unlimited SMS', 'Payment processing', 'Multiple locations'],
      highlighted: true,
      badge: 'Recommended'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      highlights: ['Custom features', 'Dedicated support', 'API access', 'Training included', 'Custom integrations'],
      highlighted: false,
      badge: 'Contact us'
    }
  ];

  const faqs = [
    {
      q: 'How do I get started with Church HQ?',
      a: 'Simply sign up for a free account, upload your member list, and start managing your church operations. Our onboarding team will guide you through the setup process.'
    },
    {
      q: 'Can I import my existing member data?',
      a: 'Yes! We support importing from CSV, Excel, and other church management systems. Our team can help with data migration.'
    },
    {
      q: 'Is my data secure?',
      a: 'Absolutely. We use enterprise-grade encryption, regular backups, and comply with GDPR and other data protection regulations.'
    },
    {
      q: 'Do you offer SMS integration?',
      a: 'Yes, we integrate with Hubtel and other SMS providers. You can send announcements, reminders, and notifications to your members.'
    },
    {
      q: 'Can I accept donations online?',
      a: 'Yes, we support multiple payment methods including cards, mobile money, and bank transfers through Paystack and other providers.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept credit cards, debit cards, and bank transfers for subscriptions. All payments are processed securely.'
    },
    {
      q: 'Is there a mobile app?',
      a: 'Yes, our mobile app is available for iOS and Android, allowing you to manage members and events on the go.'
    },
    {
      q: 'Do you offer customer support?',
      a: 'We offer email support for all plans, phone support for Pro and Enterprise plans, and dedicated account managers for Enterprise customers.'
    },
  ];

  const testimonials = [
    {
      name: 'Pastor Michael',
      role: 'Calvary Baptist Church',
      text: 'Church HQ has transformed how we manage our congregation. The SMS reminders have increased attendance by 40%!',
    },
    {
      name: 'Sister Grace',
      role: 'Grace Assembly',
      text: 'The donation tracking feature has made our financial management so much easier. Highly recommended!',
    },
    {
      name: 'Bishop Daniel',
      role: 'Zion Ministries',
      text: 'Managing multiple locations is now seamless. This platform is a game-changer for our organization.',
    },
  ];

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }
    if (isRightSwipe) {
      setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    }
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // State for features showcase
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <PageTransition>
    <div className="bg-white dark:bg-gray-950 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl py-2 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition">
                <Church className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">Church HQ</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-base font-normal transition"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <ThemeToggle />
              <button className="px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-base font-semibold transition" onClick={() => navigate('/login')}>
                Sign In
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition text-base font-bold" onClick={() => navigate('/register')}>
                Get Started
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-900 dark:text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2 border-t border-gray-200 dark:border-gray-800">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    scrollToSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-base font-semibold"
                >
                  {item.label}
                </button>
              ))}
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <button className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-base font-bold" onClick={() => navigate('/login')}>
                  Sign In
                </button>
                <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition text-base font-bold" onClick={() => navigate('/register')}>
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundImage: 'url(/images/bg-banner.webp)', backgroundPosition: 'bottom', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundAttachment: 'scroll' }}>
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-pink-100 dark:bg-pink-900/20 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="min-w-7xl mx-auto">
          {/* Centered Content */}
          <div className="text-center mb-12 mt-8">
            <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-full mb-6 group hover:border-blue-300 transition">
              <Sparkles size={16} className="text-blue-600" />
              <span className="text-sm text-blue-600 dark:text-blue-400 font-bold">Organize . Connect . Grow</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
              Ministry Made Simple, <br/>Connection Made Strong
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed font-normal max-w-2xl mx-auto">
              Unite your congregation with a platform that makes ministry effortless. Member engagement, attendance tracking, digital giving, and communications — everything flows seamlessly in one intelligent space.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:shadow-blue-500/30 transition flex items-center justify-center space-x-2 font-bold text-lg transform hover:scale-105" onClick={() => navigate('/register')}>
                <span>Get Started</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
              </button>
              <button className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition font-bold text-lg flex items-center justify-center space-x-2 group">
                <Play size={20} />
                <span>Watch Demo</span>
              </button>
            </div>
          </div>

          {/* Hero Image - Full Width Centered */}
          <div className="relative mb-12 border-8 border-white dark:border-blue-900 rounded-[30px] shadow-2xl mx-auto max-w-5xl">
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-3xl blur-3xl opacity-60"></div>
            <div className="relative rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <img 
                src={theme === 'dark' ? "/images/landing-members-dark.png" : "/images/landing-members-light.png"} 
                alt="Church HQ Dashboard Preview" 
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Stats - Below Image */}
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 mb-12 divide-x divide-gray-300 dark:divide-gray-700">
            {[
              { value: 50, label: 'Churches', suffix: '+', isCounter: true },
              { value: 2000, label: 'Members', suffix: '+', isCounter: true, format: 'K' },
              { value: 99.9, label: 'Uptime', suffix: '%', isCounter: false },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.isCounter ? (
                    <CounterStat value={stat.value} suffix={stat.suffix} />
                  ) : (
                    <>99.9%</>
                  )}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-normal">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 font-normal">
            Trusted by over 1.7 million companies worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {['Medium', 'HubSpot', 'Zillow', 'Jotform', 'Quora', 'Dropbox'].map((company) => (
              <div key={company} className="flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">{company}</span>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Features Slide Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-4 animate-in fade-in slide-in-from-left-8 duration-1000">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
                  Everything Your Church Needs in One Place
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-normal">
                  Streamline your operations, engage your congregation, and grow your ministry with our comprehensive suite of tools designed specifically for modern churches.
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-4">
                {[
                  { icon: Zap, title: 'Automations', desc: 'Set up workflows to automate repetitive tasks and save time' },
                  { icon: Calendar, title: 'Attendance Tracking', desc: 'Track member attendance automatically with real-time insights' },
                  { icon: DollarSign, title: 'Givings & Donations', desc: 'Accept online donations and track giving patterns easily' },
                  { icon: Globe, title: 'Member App', desc: 'Empower members with a dedicated mobile app experience' },
                ].map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setActiveFeature(i)}
                      onClick={() => setActiveFeature(i)}
                      className={`flex items-start space-x-4 p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                        activeFeature === i
                          ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 border border-blue-300 dark:border-blue-600'
                          : 'bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent hover:from-blue-100 dark:hover:from-blue-900/30 border border-transparent'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ${
                        activeFeature === i
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 scale-110'
                          : 'bg-gradient-to-br from-blue-500 to-purple-500'
                      }`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg transition-colors duration-300 ${
                          activeFeature === i
                            ? 'text-blue-900 dark:text-blue-200'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {feature.title}
                        </h3>
                        <p className={`text-sm transition-colors duration-300 ${
                          activeFeature === i
                            ? 'text-blue-800 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side - Visual Element */}
            <FeatureShowcase activeFeature={activeFeature} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-normal">
              Everything you need to run your church efficiently, all in one beautiful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`group relative bg-white dark:bg-gray-800 rounded-2xl p-8 transition-all duration-300 border overflow-hidden ${
                  i === 0
                    ? 'shadow-2xl -translate-y-2 border-blue-300 dark:border-blue-600'
                    : 'hover:shadow-2xl hover:-translate-y-2 border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-500/10 dark:to-purple-500/10 transition-opacity duration-300 ${
                  i === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}></div>
                
                {/* Icon Container */}
                <div className="relative mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                    i === 0 ? 'scale-125' : 'group-hover:scale-125'
                  }`}>
                    <feature.icon className="text-white" size={32} />
                  </div>
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-normal mb-6">
                    {feature.description}
                  </p>
                  <div className={`flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold transition-opacity duration-300 ${
                    i === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <span>Learn more</span>
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <MobileAppSection />

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              No hidden fees. Choose the perfect plan for your church.
            </p>
          </div>

          {loadingPricing ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
              {(pricing.length > 0 ? pricing : defaultPricing).map((plan: any, i: number) => {
                const cardColors = [
                  'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
                  'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
                  'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
                  'from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20'
                ];
                const borderColors = [
                  'border-blue-200 dark:border-blue-800',
                  'border-emerald-200 dark:border-emerald-800',
                  'border-amber-200 dark:border-amber-800',
                  'border-rose-200 dark:border-rose-800'
                ];
                const badgeBgColors = [
                  'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
                  'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
                  'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
                  'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
                ];
                const accentColors = [
                  'text-blue-600 dark:text-blue-400',
                  'text-emerald-600 dark:text-emerald-400',
                  'text-amber-600 dark:text-amber-400',
                  'text-rose-600 dark:text-rose-400'
                ];
                const colorIndex = i % 4;
                const badgeText = plan.badge?.trim().toLowerCase() || '';

                return (
                  <div
                    key={i}
                    className={`rounded-2xl overflow-hidden transition-all duration-300 border h-full flex flex-col ${
                      badgeText === 'popular'
                        ? `${plan.highlighted ? 'md:scale-105 shadow-2xl shadow-blue-500/30 dark:ring-offset-gray-950' : ''} bg-blue-600 border-blue-200 dark:border-blue-800`
                        : badgeText === 'recommended'
                        ? `${plan.highlighted ? 'md:scale-105 shadow-2xl shadow-green-500/30 dark:ring-offset-gray-950' : ''} bg-green-600 border-green-200 dark:border-green-800`
                        : plan.highlighted
                        ? `md:scale-105 bg-gradient-to-br from-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/30 border-blue-500 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-950`
                        : `bg-gradient-to-br ${cardColors[colorIndex]} ${borderColors[colorIndex]} border-2`
                    }`}
                  >
                    <div className="p-8 flex flex-col flex-1">
                      {plan.badge && (
                        <div className={`inline-block w-fit ${plan.highlighted ? 'bg-white/20 text-white' : badgeBgColors[colorIndex]} px-4 py-1 rounded-full text-sm font-bold mb-4`}>
                          {plan.badge}
                        </div>
                      )}
                      <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-sm mb-6 ${plan.highlighted ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
                        {plan.description}
                      </p>

                      <div className="mb-6">
                        <span className={`text-3xl md:text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                          {typeof plan.price === 'number' ? `₵${plan.price}` : plan.price}
                        </span>
                        <span className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
                          {plan.period || ''}
                        </span>
                      </div>

                      <button
                        className={`w-full py-3 rounded-lg font-bold mb-8 transition transform hover:scale-105 ${
                          plan.highlighted
                            ? 'bg-white text-blue-600 hover:bg-gray-100'
                            : `bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700`
                        }`}
                        onClick={() => navigate('/register')}
                      >
                        Get Started
                      </button>

                      <div className="flex-1 flex flex-col">
                        <ul className="space-y-3 flex-1">
                          {(plan.highlights || []).map((highlight: string, j: number) => (
                            <li key={j} className="flex items-start space-x-3">
                              <Check
                                size={18}
                                className={`${plan.highlighted ? 'text-white' : accentColors[colorIndex]} flex-shrink-0 mt-0.5`}
                              />
                              <span className={plan.highlighted ? 'text-white text-sm' : 'text-gray-700 dark:text-gray-300 text-sm'}>
                                {highlight}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
              What Our Users Say
            </h2>
          </div>

          {/* Desktop View - Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-normal">{testimonial.text}</p>
              </div>
            ))}
          </div>

          {/* Mobile View - Swipeable Carousel */}
          <div className="md:hidden">
            <div
              className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 min-h-96 flex flex-col justify-between"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    {testimonials[currentTestimonial].name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-normal mb-8 flex-grow">
                "{testimonials[currentTestimonial].text}"
              </p>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={prevTestimonial}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>

                <div className="flex gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentTestimonial(i)}
                      className={`w-2 h-2 rounded-full transition ${
                        i === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextTestimonial}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
              Frequently Asked
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-normal">
              Find answers to common questions about Church HQ
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <span className="text-lg font-bold text-gray-900 dark:text-white text-left">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-gray-600 dark:text-gray-400 transition-transform ${
                      expandedFAQ === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFAQ === i && (
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-normal">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-3" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
            Ready to Transform Your Church?
          </h2>
          <p className="text-xl text-blue-100 mb-12 font-normal">
            Join hundreds of churches already using Church HQ to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 transition font-bold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg" onClick={() => navigate('/register')}>
              <span>Get Started</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white/10 transition font-bold text-lg transform hover:scale-105">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300 relative overflow-hidden py-16">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start gap-12 mb-12">
            {/* Brand Section */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Church className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Church HQ</span>
              </div>
              <p className="text-gray-400 mb-8 leading-relaxed">
                The ultimate platform to manage your church operations with ease. Connect, engage, and grow your faith community.
              </p>
              <div className="flex space-x-4">
                <a href="#" aria-label="Facebook" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition transform hover:scale-110">
                  <Facebook size={20} />
                </a>
                <a href="#" aria-label="Twitter" className="w-10 h-10 bg-gray-800 hover:bg-sky-500 rounded-lg flex items-center justify-center transition transform hover:scale-110">
                  <Twitter size={20} />
                </a>
                <a href="#" aria-label="LinkedIn" className="w-10 h-10 bg-gray-800 hover:bg-blue-700 rounded-lg flex items-center justify-center transition transform hover:scale-110">
                  <Linkedin size={20} />
                </a>
                <a href="#" aria-label="Instagram" className="w-10 h-10 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition transform hover:scale-110">
                  <Instagram size={20} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex-1">
              <h4 className="text-transparent font-bold mb-6 text-lg">Quick Links</h4>
              <div className="grid grid-cols-2 gap-4">
                {navItems.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="text-gray-400 hover:text-white transition text-base font-normal"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => setContactModalOpen(true)}
                  className="text-gray-400 hover:text-white transition text-base font-normal"
                >
                  Contact
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Church HQ. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0 text-sm text-gray-500">
                <a href="#" className="hover:text-white transition">Privacy Policy</a>
                <a href="#" className="hover:text-white transition">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                  <Mail size={20} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Get in Touch</h2>
              </div>

              {contactSuccess ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <Check size={32} className="text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white text-center">Message Sent!</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-normal text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Message subject"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-gray-700 dark:text-gray-300 mb-1">Message</label>
                    <textarea
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Your message..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setContactForm({ name: '', email: '', subject: '', message: '' });
                        setContactModalOpen(false);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-normal"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={contactLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-normal flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <span>{contactLoading ? 'Sending...' : 'Send'}</span>
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
};

export default LandingPage;
