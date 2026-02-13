import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, User, Phone, Mail, Loader2, Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { partnershipAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { formatCurrency } from '../../utils/currency';
import useSEO from '../../hooks/useSEO';

interface Tier {
  _id: string;
  name: string;
  minimumAmount: number;
  description?: string;
  benefits?: string[];
  color?: string;
}

interface Programme {
  _id: string;
  name: string;
  description?: string;
  coverImage?: {
    url: string;
  };
  tiers: Tier[];
  goal: {
    targetAmount: number;
    raisedAmount: number;
    currency: string;
  };
  merchant: {
    name: string;
    logo?: string;
    email?: string;
  };
  status: string;
}

const PublicPartnershipPayment = () => {
  const { merchantId, programmeId } = useParams();
  const navigate = useNavigate();

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'GHS': '₵',
      'NGN': '₦',
      'KES': 'KSh',
      'ZAR': 'R',
      'INR': '₹',
      'JPY': '¥',
      'CNY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'CHF': 'CHF',
      'SEK': 'kr',
      'NZD': 'NZ$',
    };
    return symbols[currency] || currency;
  };

  const [programme, setProgramme] = useState<Programme | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Member search states
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberSearch, setShowMemberSearch] = useState(false);

  useEffect(() => {
    loadProgramme();

    // Check if returning from Paystack
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');

    if (reference && merchantId && programmeId) {
      // Redirect to status page
      navigate(`/partnership/payment/${merchantId}/${programmeId}/status?reference=${reference}`);
    }
  }, [merchantId, programmeId, navigate]);

  // SEO Configuration - Updates when programme data changes
  const seoConfig = programme ? {
    title: `${programme.name} - Make a Partnership Contribution | ${programme.merchant.name}`,
    description: `Support ${programme.merchant.name} by contributing to ${programme.name}. Make your payment securely online.`,
    ogTitle: `${programme.name} - Make a Partnership Contribution | ${programme.merchant.name}`,
    ogDescription: `Support ${programme.merchant.name} by contributing to ${programme.name}. Make your payment securely online.`,
    ogImage: programme.coverImage?.url || programme.merchant.logo || '/default-og-image.png',
    ogUrl: typeof window !== 'undefined' ? window.location.href : '',
    image: programme.coverImage?.url || programme.merchant.logo || '/default-og-image.png',
    canonicalUrl: typeof window !== 'undefined' ? window.location.href : '',
    keywords: `partnership donation, ${programme.name}, ${programme.merchant.name}, contribute`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': ['Event', 'DonationCampaign'],
      name: programme.name,
      description: programme.description || `Support ${programme.merchant.name} by contributing to ${programme.name}. Make your payment securely online.`,
      image: programme.coverImage?.url || programme.merchant.logo || '/default-og-image.png',
      organizer: {
        '@type': 'Organization',
        name: programme.merchant.name,
        logo: programme.merchant.logo || ''
      },
      url: typeof window !== 'undefined' ? window.location.href : '',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      fundingGoal: {
        '@type': 'PriceSpecification',
        priceCurrency: programme.goal.currency,
        price: programme.goal.targetAmount.toString()
      },
      amountRaised: {
        '@type': 'PriceSpecification',
        priceCurrency: programme.goal.currency,
        price: programme.goal.raisedAmount.toString()
      }
    }
  } : {
    title: 'Partnership Payment | The Church HQ',
    description: 'Make a secure payment for your partnership programme.',
    ogTitle: 'Partnership Payment | The Church HQ',
    ogDescription: 'Make a secure payment for your partnership programme.',
    ogImage: '/default-og-image.png',
    ogUrl: typeof window !== 'undefined' ? window.location.href : '',
    image: '/default-og-image.png',
    canonicalUrl: typeof window !== 'undefined' ? window.location.href : '',
    keywords: 'partnership donation, church payment, contribute'
  };

  // Call useSEO hook at top level - it will update when seoConfig changes
  useSEO(seoConfig);

  const loadProgramme = async () => {
    try {
      setLoading(true);
      const response = await partnershipAPI.getPublicProgramme(merchantId!, programmeId!);
      const programmeData = response.data.data.programme;
      setProgramme(programmeData);
      // Pre-fill email with merchant email
      setEmail(programmeData.merchant.email || '');
    } catch (error: any) {
      showToast.error('Failed to load partnership programme');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const searchMembers = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setMemberSearchResults([]);
      return;
    }

    try {
      setSearchingMembers(true);
      const response = await partnershipAPI.searchPublicMembers(merchantId!, query);
      setMemberSearchResults(response.data.data.members || []);
    } catch (error: any) {
      console.error('Error searching members:', error);
      setMemberSearchResults([]);
    } finally {
      setSearchingMembers(false);
    }
  };

  const handleSelectMember = (member: any) => {
    setSelectedMember(member);
    setFullName(`${member.firstName} ${member.lastName}`);
    setPhone(member.phone);
    setEmail(member.email || email);
    setMemberSearchQuery('');
    setMemberSearchResults([]);
    setShowMemberSearch(false);
    showToast.success(`Welcome back, ${member.firstName}!`);
  };

  const handleClearMember = () => {
    setSelectedMember(null);
    setFullName('');
    setPhone('');
    setEmail(programme?.merchant.email || '');
  };

  // Debounce member search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (memberSearchQuery && memberSearchQuery.trim().length >= 2 && !selectedMember) {
        searchMembers(memberSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [memberSearchQuery, selectedMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTier) {
      showToast.error('Please select a tier');
      return;
    }

    if (!fullName || !phone) {
      showToast.error('Please fill in all required fields');
      return;
    }

    const tier = programme?.tiers.find(t => t._id === selectedTier);
    if (!tier) {
      showToast.error('Invalid tier selected');
      return;
    }

    const amount = customAmount ? parseFloat(customAmount) : tier.minimumAmount;
    if (amount < tier.minimumAmount) {
      showToast.error(`Amount must be at least ${tier.minimumAmount}`);
      return;
    }

    try {
      setSubmitting(true);

      // Initiate payment
      const initiateResponse = await partnershipAPI.initiatePublicPayment(
        merchantId!,
        programmeId!,
        {
          tierId: selectedTier,
          firstName: fullName.split(' ')[0],
          lastName: fullName.split(' ').slice(1).join(' ') || '',
          phone,
          email,
          amount,
          memberId: selectedMember?._id || null // Include memberId if member selected
        }
      );

      if (initiateResponse.data.data.authorizationUrl) {
        // Redirect to Paystack
        window.location.href = initiateResponse.data.data.authorizationUrl;
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to initiate payment');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading partnership programme...</p>
        </div>
      </div>
    );
  }

  if (!programme) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Programme Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The partnership programme you're looking for doesn't exist or is not available.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const selectedTierData = programme.tiers.find(t => t._id === selectedTier);
  const paymentAmount = customAmount ? parseFloat(customAmount) : selectedTierData?.minimumAmount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          {programme.merchant.logo && (
            <img
              src={programme.merchant.logo}
              alt={programme.merchant.name}
              className="h-16 w-auto mx-auto mb-4"
            />
          )}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
            {programme.merchant.name}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center">Partnership Programme Payment</p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Make a Partnership Contribution</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Member Search Section - Always Visible */}
            {!selectedMember && !showMemberSearch && (
              <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                <div className="flex items-center mb-3">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Are you already a member? Search for your profile <span className="text-red-500">*</span>
                  </p>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or phone number..."
                    value={memberSearchQuery}
                    onChange={(e) => {
                      setMemberSearchQuery(e.target.value);
                      if (!e.target.value.trim()) {
                        setMemberSearchResults([]);
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  />
                  {searchingMembers && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-purple-600" />
                  )}
                </div>
                
                {/* Search Results */}
                {memberSearchResults.length > 0 && (
                  <div className="mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {memberSearchResults.map((member) => (
                      <button
                        key={member._id}
                        type="button"
                        onClick={() => handleSelectMember(member)}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {member.phone} {member.email && `• ${member.email}`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {!searchingMembers && memberSearchQuery.length >= 2 && memberSearchResults.length === 0 && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    No members found. Continue as a guest below.
                  </p>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowMemberSearch(true)}
                  className="mt-3 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Continue as Guest
                </button>
              </div>
            )}

            {/* Member Selected Confirmation */}
            {selectedMember && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Welcome back, {selectedMember.firstName}!
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {selectedMember.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearMember}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* Hidden fields for member - populated in background */}
            {selectedMember && (
              <>
                <input type="hidden" value={fullName} readOnly />
                <input type="hidden" value={phone} readOnly />
              </>
            )}

            {/* Guest Mode Section */}
            {showMemberSearch && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Guest Information
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMemberSearch(false);
                      setFullName('');
                      setPhone('');
                    }}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
                  >
                    I'm a member
                  </button>
                </div>
                
                {/* Full Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email - Hidden field, pre-filled with merchant email */}
            <input
              type="email"
              hidden
              value={email}
              readOnly
            />

            {/* Tiers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Partnership Tier <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {programme.tiers.map((tier) => (
                  <button
                    key={tier._id}
                    type="button"
                    onClick={() => {
                      setSelectedTier(tier._id);
                      setCustomAmount('');
                    }}
                    className={`w-full text-left flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTier === tier._id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 mr-4 transition-all ${
                      selectedTier === tier._id
                        ? 'border-purple-600 bg-purple-600 dark:border-purple-400 dark:bg-purple-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedTier === tier._id && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{tier.name}</h4>
                      {tier.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tier.description}</p>
                      )}
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-2">
                        Min: {formatCurrency(tier.minimumAmount, programme.goal?.currency)}
                      </p>
                      {tier.benefits && tier.benefits.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {tier.benefits.map((benefit, idx) => (
                            <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                              <Check className="w-3 h-3 mr-2 text-green-600" /> {benefit}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            {selectedTierData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contribution Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">
                    {getCurrencySymbol(programme.goal?.currency || 'USD')}
                  </span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={selectedTierData.minimumAmount.toString()}
                    min={selectedTierData.minimumAmount}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Minimum: {formatCurrency(selectedTierData.minimumAmount, programme.goal?.currency)}
                </p>
              </div>
            )}

            {/* Summary */}
            {selectedTierData && paymentAmount > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 dark:text-gray-300">Tier:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedTierData.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Amount to Pay:</span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(paymentAmount, programme.goal?.currency)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedTier}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Proceed to Payment
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-600 dark:text-gray-400 text-center">
            You will be redirected to Paystack to complete your payment securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicPartnershipPayment;
