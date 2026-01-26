import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Download,
  Edit2,
  Globe,
  MessageCircle,
  Mail,
  Users,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, getMerchantCurrency } from '../../../utils/currency';
import api from '../../../services/api';

interface Tier {
  _id: string;
  name: string;
  minimumAmount: number;
  description?: string;
  benefits?: string[];
  badgeColor?: string;
  displayOrder?: number;
}

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
    uniqueCount: number;
  };
  status: 'draft' | 'active' | 'paused' | 'completed';
  settings?: {
    tiersEnabled: boolean;
  };
  tiers?: Tier[];
  publicUrl?: string;
  metadata?: {
    image?: string;
  };
  dates?: {
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface Donation {
  _id: string;
  campaign?: string;
  merchant?: string;
  tier?: {
    _id: string;
    name: string;
    minimumAmount: number;
  };
  donor: {
    type: string;
    name: string;
    email: string;
    phone?: string;
  };
  payment: {
    amount: number;
    currency: string;
    method: string;
    status: 'completed' | 'pending' | 'failed';
    paystackReference?: string;
    transactionReference?: string;
  };
  metadata?: {
    donationMessage?: string;
    anonymous?: boolean;
  };
  dates?: {
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

const CampaignDetails = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const merchantCurrency = getMerchantCurrency();

  useEffect(() => {
    loadCampaignDetails();
  }, [campaignId]);

  const loadCampaignDetails = async () => {
    try {
      setLoading(true);
      const campaignRes = await api.get(`/donations/campaigns/${campaignId}`);
      const donationsRes = await api.get(`/donations/campaigns/${campaignId}/donations`);
      
      // Get campaign data from response
      const campaignData = campaignRes.data.data?.campaign || campaignRes.data.data;
      
      // Ensure status has a default value
      if (campaignData && !campaignData.status) {
        campaignData.status = 'draft';
      }
      
      setCampaign(campaignData);
      
      // Handle donations - could be array or object with pagination
      const donationsData = donationsRes.data.data;
      const donationsList = Array.isArray(donationsData) 
        ? donationsData 
        : (donationsData?.donations || []);
      
      setDonations(donationsList);
    } catch (error) {
      console.error('Failed to load campaign details:', error);
      toast.error('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (campaign?.publicUrl) {
      navigator.clipboard.writeText(campaign.publicUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast.success('Link copied to clipboard');
    }
  };

  const calculateProgress = (raised: number, target: number) => {
    return Math.min((raised / target) * 100, 100);
  };

  const handleEditCampaign = () => {
    navigate('/finance/donations', { state: { campaignToEdit: campaign } });
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'draft':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return 'Draft';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AlertCircle className="text-red-600 mr-2" size={24} />
        <p className="text-slate-600 dark:text-slate-300">Campaign not found</p>
      </div>
    );
  }

  const avgDonation = donations.length > 0 
    ? donations.reduce((sum, d) => sum + (d.payment?.amount || 0), 0) / donations.length 
    : 0;

  // Calculate tier statistics
  const tierStats = campaign?.tiers?.map(tier => {
    const tierDonations = donations.filter(d => d.tier?._id === tier._id);
    const totalAmount = tierDonations.reduce((sum, d) => sum + (d.payment?.amount || 0), 0);
    return {
      ...tier,
      donationCount: tierDonations.length,
      totalAmount
    };
  }) || [];

  const daysRemaining = (() => {
    if (!campaign?.dates?.endDate) return 0;
    const endDate = new Date(campaign.dates.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const timeDiff = endDate.getTime() - today.getTime();
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return Math.max(days, 0); // Return 0 if campaign has ended
  })();

  return (
    <div className="min-h-screen dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b rounded-lg border-slate-200 dark:border-slate-700">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-4">
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
              <button
                onClick={() => navigate('/finance/donations')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="text-slate-600 dark:text-slate-300" size={24} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 mb-1">
                  <span className="hover:underline cursor-pointer" onClick={() => navigate('/finance/donations')}>
                    Campaigns
                  </span>
                  <span className="hidden sm:inline">/</span>
                  <span className="hidden sm:inline">Details</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">{campaign?.name}</h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    Started {campaign?.dates?.startDate ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(campaign.dates.startDate)) : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={loadCampaignDetails}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm sm:text-base flex-1 sm:flex-none">
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-8xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Image */}
            {campaign.metadata?.image && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
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

            {/* Current Funding Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-8 shadow-sm">
              <div className="space-y-6">
                <div>
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Current Funding
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(campaign.goal?.raisedAmount || 0, campaign.goal?.currency || merchantCurrency)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${calculateProgress(campaign.goal?.raisedAmount || 0, campaign.goal?.targetAmount || 1)}%` }}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2 font-semibold">
                      <div className="w-3 h-3 rounded-full bg-blue-600" />
                      <span>
                        {Math.round(calculateProgress(campaign.goal?.raisedAmount || 0, campaign.goal?.targetAmount || 1))}% of target reached
                      </span>
                    </div>
                    <p>
                      {donations.length} Total Donors
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Goal
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(campaign.goal?.targetAmount || 0, campaign.goal?.currency || merchantCurrency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Raised
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(campaign.goal?.raisedAmount || 0, campaign.goal?.currency || merchantCurrency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier Statistics */}
            {campaign?.settings?.tiersEnabled && tierStats.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-8 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">Tier Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {tierStats.map((tier) => (
                    <div key={tier._id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        {tier.name}
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {formatCurrency(tier.totalAmount, campaign.goal?.currency || merchantCurrency)}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {tier.donationCount} {tier.donationCount === 1 ? 'donation' : 'donations'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Avg. Donation
                </p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(avgDonation, merchantCurrency)}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Days Remaining
                </p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{daysRemaining}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Status
                </p>
                <span className={`inline-flex px-3 py-1 rounded-lg text-xs sm:text-sm font-bold ${getStatusColor(campaign.status)}`}>
                  {getStatusLabel(campaign.status)}
                </span>
              </div>
            </div>

            {/* Recent Donations */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Donations</h2>
              </div>
              {Array.isArray(donations) && donations.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Donor
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Amount
                          </th>
                          {campaign?.settings?.tiersEnabled && (
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                              Tier
                            </th>
                          )}
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Date & Time
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {donations.map(donation => (
                          <tr key={donation._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                    {donation.donor?.name?.split(' ').map((n: string) => n[0]).join('') || 'A'}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white">{donation.donor?.name || 'Anonymous'}</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">REF: {donation.payment?.paystackReference || 'N/A'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                              {formatCurrency(donation.payment?.amount || 0, donation.payment?.currency || merchantCurrency)}
                            </td>
                            {campaign?.settings?.tiersEnabled && (
                              <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {donation.tier?.name || '—'}
                              </td>
                            )}
                            <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {formatDate(donation.createdAt)}
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                                donation.payment?.status === 'completed'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : donation.payment?.status === 'pending'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {donation.payment?.status ? donation.payment.status.charAt(0).toUpperCase() + donation.payment.status.slice(1) : 'Unknown'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile Card View */}
                  <div className="sm:hidden divide-y divide-slate-200 dark:divide-slate-700">
                    {donations.map(donation => (
                      <div key={donation._id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                {donation.donor?.name?.split(' ').map((n: string) => n[0]).join('') || 'A'}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{donation.donor?.name || 'Anonymous'}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">REF: {donation.payment?.paystackReference || 'N/A'}</p>
                            </div>
                          </div>
                          <span className={`ml-2 inline-flex px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                            donation.payment?.status === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : donation.payment?.status === 'pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {donation.payment?.status ? donation.payment.status.charAt(0).toUpperCase() + donation.payment.status.slice(1) : 'Unknown'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Amount</p>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {formatCurrency(donation.payment?.amount || 0, donation.payment?.currency || merchantCurrency)}
                            </p>
                          </div>
                          {campaign?.settings?.tiersEnabled && (
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Tier</p>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {donation.tier?.name || '—'}
                              </p>
                            </div>
                          )}
                          <div className={!campaign?.settings?.tiersEnabled ? 'col-span-2' : ''}>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Date & Time</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {formatDate(donation.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-4 sm:px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="text-slate-400 dark:text-slate-500 mb-2" size={32} />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No donations yet</p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm">Donations will appear here once they are received</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Public Link Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="text-blue-600 flex-shrink-0" size={20} />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Public Link</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4">
                Share this with your congregation
              </p>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 mb-4 break-all">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono line-clamp-2">
                  {campaign.publicUrl || 'https://donate.church.org/campaign/...'}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all text-sm"
              >
                {copiedUrl ? <Check size={18} /> : <Copy size={18} />}
                {copiedUrl ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Quick Share */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Share</h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button className="flex items-center justify-center px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Users size={20} />
                </button>
                <button className="flex items-center justify-center px-3 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  <MessageCircle size={20} />
                </button>
                <button className="flex items-center justify-center px-3 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                  <Mail size={20} />
                </button>
              </div>
            </div>

            {/* Merchant Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">Merchant Settings</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Processor
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Paystack</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Currency
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{merchantCurrency} ({merchantCurrency})</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Visibility
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {campaign.status === 'active' ? 'Public' : 'Private'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleEditCampaign}
                className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-bold text-sm">
                <Edit2 size={16} />
                <span className="hidden sm:inline">Edit Campaign Details</span>
                <span className="sm:hidden">Edit</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CampaignDetails;
