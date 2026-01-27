import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Calendar, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency, getMerchantCurrency } from '../../utils/currency';
import useSEO from '../../hooks/useSEO';
import TierCard from '../../components/campaign/TierCard';

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  goal: {
    targetAmount: number;
    raisedAmount: number;
    currency: string;
  };
  donor?: {
    totalCount: number;
  };
  status: 'draft' | 'active' | 'paused' | 'completed';
  visibility: 'public' | 'private';
  publicUrl?: string;
  settings?: {
    tiersEnabled: boolean;
  };
  tiers?: Tier[];
  dates?: {
    startDate: string;
    createdAt: string;
    updatedAt: string;
  };
  metadata?: {
    image?: string;
  };
  merchant: {
    _id: string;
    name: string;
    subdomain: string;
  };
}

interface Tier {
  _id: string;
  name: string;
  minimumAmount: number;
  description?: string;
  benefits?: string[];
  badgeColor?: string;
}

interface MerchantData {
  name: string;
}

// Currency symbol mapping
const getCurrencySymbol = (currency: string = 'GHS'): string => {
  const symbols: { [key: string]: string } = {
    'GHS': '₵',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NGN': '₦',
    'ZAR': 'R',
    'KES': 'KSh',
    'UGX': 'USh'
  };
  return symbols[currency] || currency;
};

const PublicCampaignDonation: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const [donationId, setDonationId] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Update SEO when campaign and merchant data is available
  useSEO({
    title: campaign && merchant ? `${campaign.name} - Support this campaign` : 'Support a Campaign',
    description: campaign && merchant ? campaign.description || `Support ${campaign.name} campaign organized by ${merchant.name}. Help us reach our goal of ${formatCurrency(campaign.goal?.targetAmount, campaign.goal?.currency || 'GHS')}.` : 'Support charitable campaigns with secure payments',
    keywords: campaign && merchant ? `donation, fundraiser, campaign, ${campaign.name}, ${merchant.name}` : 'donation, fundraiser, campaign',
    ogTitle: campaign && merchant ? `${campaign.name} - Support this campaign` : 'Support a Campaign',
    ogDescription: campaign && merchant ? campaign.description || `Support ${campaign.name} campaign organized by ${merchant.name}. Help us reach our goal of ${formatCurrency(campaign.goal?.targetAmount, campaign.goal?.currency || 'GHS')}.` : 'Support charitable campaigns with secure payments',
    ogImage: campaign?.metadata?.image || `${window.location.origin}/logo.png`,
    ogUrl: window.location.href,
    ogType: 'website',
    twitterTitle: campaign && merchant ? `${campaign.name} - Support this campaign` : 'Support a Campaign',
    twitterDescription: campaign && merchant ? campaign.description || `Support ${campaign.name} campaign organized by ${merchant.name}. Help us reach our goal of ${formatCurrency(campaign.goal?.targetAmount, campaign.goal?.currency || 'GHS')}.` : 'Support charitable campaigns with secure payments',
    twitterImage: campaign?.metadata?.image || `${window.location.origin}/logo.png`,
    twitterCard: 'summary_large_image',
    canonicalUrl: window.location.href
  });

  // Load Paystack script on mount
  useEffect(() => {
    if ((window as any).PaystackPop) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    
    script.onload = () => {
      setScriptLoaded(true);
    };
    
    script.onerror = () => {
      toast.error('Failed to load payment system');
    };

    document.body.appendChild(script);
  }, []);

  // Form state
  const [amount, setAmount] = useState<string>('');
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donor, setDonor] = useState({
    name: '',
    email: 'thechurchhq@gmail.com',
    phone: ''
  });

  // Preset amounts
  const presetAmounts = [10, 25, 50, 100, 200, 500];

  useEffect(() => {
    loadCampaignData();
    // Check for payment verification redirect from Paystack
    const reference = searchParams.get('reference');
    if (reference) {
      verifyPaymentFromRedirect(reference);
    }
  }, [campaignId, searchParams]);

  const verifyPaymentFromRedirect = async (reference: string) => {
    try {
      setVerifying(true);
      toast.loading('Verifying payment...');
      const res = await api.post(`/public/verify-donation`, { reference });
      toast.dismiss();
      
      if (res.data.success) {
        toast.success('Payment verified successfully!');
        navigate(`/campaign-status/${campaignId}`, { 
          state: { donation: res.data.data } 
        });
      } else {
        toast.error('Payment verification failed');
        setVerifying(false);
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      toast.dismiss();
      toast.error('Failed to verify payment');
      setVerifying(false);
    }
  };

  const loadCampaignData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/public/campaigns/${campaignId}`);
      setCampaign(res.data.data);
      if (res.data.data.merchant) {
        setMerchant(res.data.data.merchant);
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
      toast.error('Campaign not found or no longer available');
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setLoading(false);
    }
  }, [campaignId, navigate]);

  const calculateProgress = (raised: number, target: number) => {
    return Math.min((raised / target) * 100, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if tiers are enabled and validate tier selection
    if (campaign?.settings?.tiersEnabled && campaign?.tiers && campaign.tiers.length > 0) {
      if (!selectedTierId) {
        toast.error('Please select a donation tier');
        return;
      }

      // Get selected tier and validate amount
      const selectedTier = campaign.tiers.find(t => t._id === selectedTierId);
      if (selectedTier && parseFloat(amount) < selectedTier.minimumAmount) {
        toast.error(`Minimum donation for ${selectedTier.name} tier is ${getCurrencySymbol(campaign.goal?.currency)} ${selectedTier.minimumAmount}`);
        return;
      }
    }

    // Validation
    if (!amount || parseFloat(amount) < 1) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    if (!isAnonymous && (!donor.name || !donor.email || !donor.phone)) {
      toast.error('Please provide your name, email, and phone number');
      return;
    }

    if (isAnonymous && (!donor.email || !donor.phone)) {
      toast.error('Email and phone number are required even for anonymous donations');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        amount: parseFloat(amount),
        tierId: selectedTierId,
        donorName: isAnonymous ? 'Anonymous' : donor.name,
        donorEmail: donor.email,
        donorPhone: donor.phone || '',
        donationMessage: '',
        anonymous: isAnonymous
      };

      const res = await api.post(`/public/campaigns/${campaignId}/donate`, payload);

      if (!res.data.data?.reference || !res.data.data?.donationId) {
        toast.error('Failed to initialize payment');
        return;
      }

      if (!scriptLoaded) {
        toast.error('Payment system is still loading. Please try again.');
        return;
      }

      setDonationId(res.data.data.donationId);
      setPaymentInitialized(true);
      
      // Initialize Paystack popup
      const PaystackPop = (window as any).PaystackPop;
      if (!PaystackPop) {
        toast.error('Payment system is not available');
        return;
      }

      PaystackPop.setup({
        key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
        email: "thechurchhq@gmail.com",  //donor.email,
        amount: parseFloat(amount) * 100, // Convert to kobo
        currency: getMerchantCurrency(),
        ref: res.data.data.reference,
        phone: donor.phone,
        metadata: {
          donor_phone: donor.phone,
          custom_fields: [
            {
              display_name: 'Mobile Money Number',
              variable_name: 'mobile_money_number',
              value: donor.phone
            }
          ]
        },
        onClose: () => {
          setPaymentInitialized(false);
          toast.error('Payment cancelled');
        },
        callback: (response: any) => {
          // Called when payment is completed
          console.log('Payment callback response:', response);
          setPaymentInitialized(false);
          
          // Verify payment with backend
          if (response.status === 'success' || response.status === 'approved') {
            verifyPaymentFromRedirect(response.reference);
          } else {
            toast.error('Payment was not successful');
          }
        }
      }).openIframe();
    } catch (error) {
      console.error('Failed to initiate donation:', error);
      console.error('Error details:', {
        message: (error as any)?.message,
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status
      });
      toast.error((error as any)?.response?.data?.message || 'Failed to process donation request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Campaign not found</p>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(campaign.goal?.raisedAmount || 0, campaign.goal?.targetAmount || 1);
  const donorCount = campaign.donor?.totalCount || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      
      
      <div className="max-w-xl mx-auto">
        {/* Merchant Name */}
        {merchant && (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Organized by</p>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {merchant.name}
            </h2>
          </div>
        )}

        {/* Campaign Image */}
        {campaign.metadata?.image && (
          <div className="mb-6 rounded-lg overflow-hidden shadow-sm">
            <img
              src={campaign.metadata.image}
              alt={campaign.name}
              className="w-full h-64 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Heart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Support This Campaign</p>
            </div>
          </div>

          {/* Campaign Details */}
          {campaign.description && (
            <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              {campaign.description}
            </p>
          )}

          {/* Event Start Date */}
          {campaign.dates?.startDate && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Started {new Date(campaign.dates.startDate).toLocaleDateString()}</span>
            </div>
          )}

          {/* Progress */}
          {campaign.goal && (
            <div className="mt-6 p-4 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(campaign.goal.raisedAmount || 0, campaign.goal.currency)} raised
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  of {formatCurrency(campaign.goal.targetAmount, campaign.goal.currency)} goal
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4 inline mr-1" />
                {donorCount} {donorCount === 1 ? 'donor' : 'donors'}
              </p>
            </div>
          )}


        </div>

        {/* Donation Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 relative">
          {verifying && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center z-50">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                <p className="text-white font-medium">Verifying your payment...</p>
              </div>
            </div>
          )}
          
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Make a Contribution
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6" style={{ opacity: verifying ? 0.5 : 1, pointerEvents: verifying ? 'none' : 'auto' }}>
            {/* Tier Selection (if enabled) */}
            {campaign?.settings?.tiersEnabled && campaign?.tiers && campaign.tiers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select a Contribution Tier
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {campaign.tiers
                    .sort((a, b) => a.minimumAmount - b.minimumAmount)
                    .map((tier) => (
                      <TierCard
                        key={tier._id}
                        _id={tier._id}
                        name={tier.name}
                        minimumAmount={tier.minimumAmount}
                        description={tier.description}
                        benefits={tier.benefits || []}
                        badgeColor={tier.badgeColor || 'gray'}
                        isSelected={selectedTierId === tier._id}
                        currency={campaign.goal?.currency || 'GHS'}
                        onSelect={(id) => {
                          setSelectedTierId(id);
                          // Auto-fill amount with tier minimum
                          setAmount(tier.minimumAmount.toString());
                        }}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contribution Amount ({campaign.goal?.currency || 'GHS'})
              </label>

              {/* Preset Amounts (only show if no tiers) */}
              {!(campaign?.settings?.tiersEnabled && campaign?.tiers && campaign.tiers.length > 0) && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                        amount === preset.toString()
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-600'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Amount Input */}
              {!(campaign?.settings?.tiersEnabled && campaign?.tiers && campaign.tiers.length > 0) && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      {getCurrencySymbol(campaign.goal?.currency)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    placeholder="Enter custom amount"
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Amount Input for Tiered Campaigns */}
              {campaign?.settings?.tiersEnabled && campaign?.tiers && campaign.tiers.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      {getCurrencySymbol(campaign.goal?.currency)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={selectedTierId ? campaign.tiers.find(t => t._id === selectedTierId)?.minimumAmount || 1 : 1}
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={selectedTierId ? `Minimum ${getCurrencySymbol(campaign.goal?.currency)} ${campaign.tiers.find(t => t._id === selectedTierId)?.minimumAmount}` : 'Enter amount'}
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700 dark:text-gray-300">
                Make this an anonymous contribution
              </label>
            </div>

            {/* Donor Information */}
            {!isAnonymous && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={donor.name}
                    onChange={(e) => setDonor({ ...donor, name: e.target.value })}
                    required={!isAnonymous}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={donor.phone}
                    onChange={(e) => setDonor({ ...donor, phone: e.target.value })}
                    required={!isAnonymous}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={donor.email}
                    required
                    onChange={(e) => setDonor({ ...donor, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div> */}
                
              </div>
            )}

            {isAnonymous && (
              <div className="space-y-4">
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email (for receipt) *
                  </label>
                  <input
                    type="email"
                    value={donor.email}
                    onChange={(e) => setDonor({ ...donor, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div> */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone (for receipt) *
                  </label>
                  <input
                    type="tel"
                    value={donor.phone}
                    onChange={(e) => setDonor({ ...donor, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5" />
                  <span>Partner With Us {amount ? `${campaign.goal?.currency || 'GHS'} ${amount}` : ''}</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
            Secure payment powered by Paystack
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicCampaignDonation;
