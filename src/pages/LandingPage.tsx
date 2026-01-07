import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, X, ArrowRight, Check, ChevronDown, Users, Calendar,
  MessageSquare, DollarSign, BarChart3, Shield, Zap, Globe,
  ArrowUpRight, Star, Play, Sparkles, TrendingUp, Heart
} from 'lucide-react';
import api from '../services/api';
import ThemeToggle from '../components/ui/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

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

  const displayValue = format === 'M' ? (count / 1000000).toFixed(1) : count;
  return <>{displayValue}{suffix}</>;
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [pricing, setPricing] = useState<any[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);

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

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'benefits', label: 'Benefits' },
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

  const benefits = [
    'Centralized member database with unlimited contacts',
    'Automated communication workflows and reminders',
    'Real-time financial tracking and reporting',
    'Mobile app for on-the-go access',
    'Multi-location support for growing churches',
    'Integration with popular payment processors',
  ];

  const defaultPricing = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for small churches just starting out',
      highlights: ['Up to 100 members', 'Basic member management', 'Email support', 'Limited SMS'],
      highlighted: false,
      badge: 'Most Popular'
    },
    {
      name: 'Basic',
      price: 99,
      period: '/month',
      description: 'For growing churches',
      highlights: ['Up to 1,000 members', 'Full member management', 'Event planning', 'Email support', '500 SMS/month'],
      highlighted: false
    },
    {
      name: 'Pro',
      price: 249,
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
      avatar: '👨‍💼'
    },
    {
      name: 'Sister Grace',
      role: 'Grace Assembly',
      text: 'The donation tracking feature has made our financial management so much easier. Highly recommended!',
      avatar: '👩‍🦱'
    },
    {
      name: 'Bishop Daniel',
      role: 'Zion Ministries',
      text: 'Managing multiple locations is now seamless. This platform is a game-changer for our organization.',
      avatar: '👨‍💼'
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-950 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl py-2 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition">
                <span className="text-white font-bold text-lg">HQ</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">Church HQ</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-base font-medium transition"
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
          <div className="md:hidden pb-4 space-y-2 border-t border-gray-200 dark:border-gray-800">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
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

        <div className="max-w-5xl mx-auto">
          {/* Centered Content */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-full mb-6 group cursor-pointer hover:border-blue-300 transition">
              <Sparkles size={16} className="text-blue-600" />
              <span className="text-sm text-blue-600 dark:text-blue-400 font-bold">Modern Church Management</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
              Ministry Made Simple, <br/>Connection Made Strong
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed font-medium max-w-2xl mx-auto">
              Unite your congregation with a platform that makes ministry easier. From member engagement to digital giving, everything your church needs flows seamlessly in one intelligent space.
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
          <div className="relative mb-12 border-8 border-white dark:border-gray-900 rounded-3xl shadow-2xl mx-auto max-w-4xl">
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
          <div className="grid grid-cols-3 gap-6 mb-12 divide-x divide-gray-300 dark:divide-gray-700">
            {[
              { value: 50, label: 'Churches', suffix: '+', isCounter: true },
              { value: 20, label: 'Members', suffix: '+', isCounter: true, format: 'K' },
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
                <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 font-medium">
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

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
              Everything you need to run your church efficiently, all in one beautiful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Icon Container */}
                <div className="relative mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-125 transition-all duration-300 shadow-lg`}>
                    <feature.icon className="text-white" size={32} />
                  </div>
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium mb-6">
                    {feature.description}
                  </p>
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Learn more</span>
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            {/* Left Content */}
            <div>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8 leading-tight" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
                Why Choose Church HQ?
              </h2>
              <ul className="space-y-6">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start space-x-4 group">
                    <div className="mt-1 flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 transition">
                      <Check className="text-green-600 dark:text-green-400" size={24} />
                    </div>
                    <span className="text-lg text-gray-700 dark:text-gray-300 font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl blur-2xl opacity-60"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900/50 dark:to-purple-900/50 rounded-2xl flex items-center justify-center text-6xl hover:scale-110 transition">
                  📊
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {['Real-time Data', 'Live Updates', 'Analytics'].map((label, i) => (
                    <div key={i} className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '⚡', label: 'Lightning Fast', text: 'Optimized for speed' },
              { icon: '🔐', label: 'Secure', text: 'Enterprise security' },
              { icon: '🌍', label: 'Global', text: 'Used worldwide' },
            ].map((stat, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-blue-300 transition text-center">
                <div className="text-5xl mb-4">{stat.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stat.label}</h3>
                <p className="text-gray-600 dark:text-gray-400 font-medium">{stat.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
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

                return (
                  <div
                    key={i}
                    className={`rounded-2xl overflow-hidden transition-all duration-300 border h-full flex flex-col ${
                      plan.highlighted
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
                        <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
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
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
              What Our Users Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
              Frequently Asked
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
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
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{faq.a}</p>
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
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
            Ready to Transform Your Church?
          </h2>
          <p className="text-xl text-blue-100 mb-12 font-medium">
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
      <footer className="bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CH</span>
                </div>
                <span className="text-white font-bold">Church HQ</span>
              </div>
              <p className="text-sm leading-relaxed">
                The ultimate platform to manage your church operations with ease.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                {['Features', 'Pricing', 'Security', 'Updates'].map((item) => (
                  <li key={item}><a href="#" className="hover:text-white transition">{item}</a></li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                {['Documentation', 'API', 'Support', 'Blog'].map((item) => (
                  <li key={item}><a href="#" className="hover:text-white transition">{item}</a></li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                {['About', 'Contact', 'Press', 'Jobs', 'Blog'].map((item) => (
                  <li key={item}><a href="#" className="hover:text-white transition">{item}</a></li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                {['Privacy', 'Terms', 'Security', 'Compliance', 'GDPR'].map((item) => (
                  <li key={item}><a href="#" className="hover:text-white transition">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm">&copy; 2026 Church HQ. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                {['Twitter', 'Facebook', 'LinkedIn', 'Instagram'].map((social) => (
                  <a key={social} href="#" className="text-sm hover:text-white transition">{social}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
