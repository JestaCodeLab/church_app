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
  useEffect(() => {
    if (programme) {
      const title = `${programme.name} - Make a Partnership Contribution | ${programme.merchant.name}`;
      const description = `Support ${programme.merchant.name} by contributing to ${programme.name}. Make your payment securely online.`;
      const ogImage = programme.coverImage?.url || programme.merchant.logo || '/default-og-image.png';
      const pageUrl = window.location.href;

      useSEO({
        title,
        description,
        ogTitle: title,
        ogDescription: description,
        ogImage,
        ogUrl: pageUrl,
        image: ogImage,
        canonicalUrl: pageUrl,
        keywords: `partnership donation, ${programme.name}, ${programme.merchant.name}, contribute`,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': ['Event', 'DonationCampaign'],
          name: programme.name,
          description: programme.description || description,
          image: ogImage,
          organizer: {
            '@type': 'Organization',
            name: programme.merchant.name,
            logo: programme.merchant.logo || ''
          },
          url: pageUrl,
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
      });
    }
  }, [programme, merchantId, programmeId]);

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
          amount
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
            {/* Full Name */}
            <div>
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
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

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
