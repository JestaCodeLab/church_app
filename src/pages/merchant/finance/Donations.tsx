import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Share2,
  Edit2,
  Trash2,
  Download,
  Filter,
  Eye,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Link as LinkIcon,
  Copy,
  Check,
  X,
  ChevronDown,
  Loader,
  AlertCircle,
  Coins
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, getMerchantCurrency } from '../../../utils/currency';
import api from '../../../services/api';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import ImageUploader from '../../../components/modals/ImageUploader';
import TierForm from '../../../components/campaign/TierForm';

// Types
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
  visibility: 'public' | 'private';
  publicUrl?: string;
  settings?: {
    tiersEnabled: boolean;
  };
  tiers?: Tier[];
  dates?: {
    startDate: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface Tier {
  _id?: string;
  name: string;
  minimumAmount: number;
  description: string;
  benefits: string[];
  badgeColor: string;
  displayOrder: number;
}

interface Donation {
  _id: string;
  campaign?: {
    name: string;
  };
  donor?: {
    name: string;
    email: string;
  };
  payment?: {
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  };
  createdAt?: string;
}

interface Stats {
  totalCollected: number;
  activeCampaigns: number;
  totalDonors: number;
  growthRate?: number;
}

const CAMPAIGN_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'paused', label: 'Paused', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
];

const TRANSACTION_STATUSES = [
  { value: 'success', label: 'Success', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
];

const getStatusColor = (status: string, type: 'campaign' | 'transaction' = 'campaign') => {
  const statuses = type === 'campaign' ? CAMPAIGN_STATUSES : TRANSACTION_STATUSES;
  return statuses.find(s => s.value === status)?.color || '';
};

const getStatusLabel = (status: string) => {
  const allStatuses = [...CAMPAIGN_STATUSES, ...TRANSACTION_STATUSES];
  return allStatuses.find(s => s.value === status)?.label || status;
};

const Donations = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'events'>('campaigns');
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCollected: 2500000,
    activeCampaigns: 12,
    totalDonors: 842,
    growthRate: 15
  });

  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [sortBy, setSortBy] = useState('recent');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchCampaigns, setSearchCampaigns] = useState('');
  const [searchEvents, setSearchEvents] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    status: 'draft',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  const [campaignImageFile, setCampaignImageFile] = useState<File | null>(null);
  const [campaignImagePreview, setCampaignImagePreview] = useState('');
  const [tiersEnabled, setTiersEnabled] = useState(false);
  const [tiers, setTiers] = useState<Tier[]>([]);

  const merchantCurrency = getMerchantCurrency();
  const location = useLocation();

  useEffect(() => {
    loadDonationsData();
  }, []);

  // Handle edit campaign from route state
  useEffect(() => {
    if (location.state?.campaignToEdit) {
      const campaign = location.state.campaignToEdit;
      setSelectedCampaign(campaign);
      setFormData({
        name: campaign.name,
        description: campaign.description || '',
        targetAmount: campaign.goal?.targetAmount?.toString() || '',
        status: campaign.status,
        startDate: campaign.dates?.startDate ? new Date(campaign.dates.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: campaign.dates?.endDate ? new Date(campaign.dates.endDate).toISOString().split('T')[0] : ''
      });
      setTiersEnabled(campaign.settings?.tiersEnabled || false);
      setTiers(campaign.tiers || []);
      if (campaign.image) {
        setCampaignImagePreview(campaign.image);
      }
      setShowCampaignModal(true);
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const loadDonationsData = async () => {
    try {
      setLoading(true);
      const [campaignsRes, donationsRes] = await Promise.all([
        api.get('/donations/campaigns'),
        api.get('/donations')
      ]);
      
      // Handle various response structures
      let campaignsData = [];
      let donationsData = [];

      // Extract campaigns from response
      if (campaignsRes?.data?.data) {
        if (Array.isArray(campaignsRes.data.data)) {
          campaignsData = campaignsRes.data.data;
        } else if (Array.isArray(campaignsRes.data.data.campaigns)) {
          campaignsData = campaignsRes.data.data.campaigns;
        }
      }

      // Extract donations from response
      if (donationsRes?.data?.data) {
        if (Array.isArray(donationsRes.data.data)) {
          donationsData = donationsRes.data.data;
        } else if (Array.isArray(donationsRes.data.data.donations)) {
          donationsData = donationsRes.data.data.donations;
        }
      }

      // Extract events from response (optional - don't break if it fails)
      let eventsData = [];
      try {
        const eventsRes = await api.get('/events');
        if (eventsRes?.data?.data) {
          if (Array.isArray(eventsRes.data.data)) {
            eventsData = eventsRes.data.data.filter((e: any) => e.donations?.enabled === true);
          } else if (Array.isArray(eventsRes.data.data.events)) {
            eventsData = eventsRes.data.data.events.filter((e: any) => e.donations?.enabled === true);
          }
        }
        console.log('Events data ===>', eventsData)
      } catch (eventsError) {
        console.warn('Failed to load events:', eventsError);
        // Continue without events
      }

      console.log('Loaded campaigns:', campaignsData);
      console.log('Loaded donations:', donationsData);
      console.log('Loaded events with donations enabled:', eventsData);

      setCampaigns(campaignsData);
      setDonations(donationsData);
      setEvents(eventsData);

      // Calculate stats from campaigns
      const totalCollected = campaignsData.reduce((sum, c) => sum + getCampaignRaisedAmount(c), 0);
      const activeCampaigns = campaignsData.filter(c => c.status === 'active').length;
      const totalDonors = donationsData.length;

      setStats({
        totalCollected,
        activeCampaigns,
        totalDonors
      });
    } catch (error) {
      console.error('Failed to load donations data:', error);
      toast.error('Failed to load donations data');
      setCampaigns([]);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!formData.name || !formData.targetAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setModalLoading(true);
      
      // Use FormData to send file if present
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('targetAmount', formData.targetAmount);
      payload.append('status', formData.status);
      payload.append('startDate', formData.startDate);
      payload.append('endDate', formData.endDate || '');
      payload.append('tiersEnabled', tiersEnabled.toString());
      
      // Add tiers as JSON
      if (tiersEnabled && tiers.length > 0) {
        payload.append('tiers', JSON.stringify(tiers));
      }
      
      if (campaignImageFile) {
        payload.append('image', campaignImageFile);
      }

      if (selectedCampaign) {
        // Update existing campaign
        await api.put(`/donations/campaigns/${selectedCampaign._id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Campaign updated successfully');
      } else {
        // Create new campaign
        await api.post('/donations/campaigns', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Campaign created successfully');
      }

      setShowCampaignModal(false);
      setCampaignImageFile(null);
      setCampaignImagePreview('');
      setTiersEnabled(false);
      setTiers([]);
      setFormData({ name: '', description: '', targetAmount: '', status: 'draft', startDate: new Date().toISOString().split('T')[0], endDate: '' });
      await loadDonationsData();
    } catch (error) {
      console.error('Failed to save campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to save campaign');
    } finally {
      setModalLoading(false);
    }
  };

  const handleImageSelect = (file: File) => {
    setCampaignImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCampaignImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setCampaignImageFile(null);
    setCampaignImagePreview('');
  };

  const handleShareCampaign = () => {
    const urlToCopy = selectedCampaign?.publicUrl || `https://donate.churchpay.ng/campaign/${selectedCampaign?._id}`;
    if (urlToCopy) {
      navigator.clipboard.writeText(urlToCopy).then(() => {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
        toast.success('Link copied to clipboard');
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    } else {
      toast.error('No link available');
    }
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaignToDelete(campaignId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/donations/campaigns/${campaignToDelete}`);
      toast.success('Campaign deleted successfully');
      setShowDeleteConfirm(false);
      setCampaignToDelete(null);
      await loadDonationsData();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      toast.error('Failed to delete campaign');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-NG').format(new Date(date));
  };

  const calculateProgress = (raised: number, target: number) => {
    return Math.min((raised / target) * 100, 100);
  };

  const getCampaignTargetAmount = (campaign: Campaign) => {
    return campaign.goal?.targetAmount || 0;
  };

  const getCampaignRaisedAmount = (campaign: Campaign) => {
    return campaign.goal?.raisedAmount || 0;
  };

  const getCampaignDonorCount = (campaign: Campaign) => {
    return campaign.donor?.totalCount || 0;
  };

  const getCampaignCreatedDate = (campaign: Campaign) => {
    return campaign.dates?.createdAt || campaign.createdAt || '';
  };

  const getDonationCampaignName = (donation: Donation) => {
    return donation.campaign?.name || 'Unknown Campaign';
  };

  const getDonationDonorName = (donation: Donation) => {
    return donation.donor?.name || 'Anonymous';
  };

  const getDonationDonorEmail = (donation: Donation) => {
    return donation.donor?.email || '';
  };

  const getDonationAmount = (donation: Donation) => {
    return donation.payment?.amount || 0;
  };

  const getDonationStatus = (donation: Donation) => {
    const status = donation.payment?.status || 'pending';
    // Map backend status to frontend status
    if (status === 'completed') return 'success';
    if (status === 'failed') return 'failed';
    return 'pending';
  };

  const getDonationCreatedDate = (donation: Donation) => {
    return donation.createdAt || '';
  };

  const filteredCampaigns = Array.isArray(campaigns) 
    ? campaigns.filter(c => {
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        const matchesSearch = c.name.toLowerCase().includes(searchCampaigns.toLowerCase()) || 
                            (c.description?.toLowerCase().includes(searchCampaigns.toLowerCase()) || false);
        return matchesStatus && matchesSearch;
      })
    : [];

  const filteredEvents = Array.isArray(events)
    ? events.filter(e => {
        return e.title.toLowerCase().includes(searchEvents.toLowerCase()) || 
               (e.description?.toLowerCase().includes(searchEvents.toLowerCase()) || false);
      })
    : [];

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case 'progress':
        return calculateProgress(getCampaignRaisedAmount(b), getCampaignTargetAmount(b)) - calculateProgress(getCampaignRaisedAmount(a), getCampaignTargetAmount(a));
      case 'target':
        return getCampaignTargetAmount(b) - getCampaignTargetAmount(a);
      case 'recent':
      default:
        return new Date(getCampaignCreatedDate(b)).getTime() - new Date(getCampaignCreatedDate(a)).getTime();
    }
  });

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

  return (
    <div className="min-h-screen dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-8xl mx-auto px-0 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Donations Overview</h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
                Manage and track all church donation campaigns and transactions.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCampaign(null);
                setFormData({ name: '', description: '', targetAmount: '', status: 'draft', startDate: new Date().toISOString().split('T')[0], endDate: '' });
                setShowCampaignModal(true);
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all whitespace-nowrap flex-shrink-0 text-sm sm:text-base"
            >
              <Plus size={18} className="hidden sm:block" />
              <Plus size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Create Campaign</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-8xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats */}
        {activeTab === 'campaigns' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">Total Donations</p>
                <div className="p-2 sm:p-3 rounded-lg bg-green-100 dark:bg-green-900/40">
                  <Coins className="hidden sm:block text-green-600 dark:text-green-400" size={20} />
                  <Coins className="sm:hidden text-green-600 dark:text-green-400" size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
                {formatCurrency(stats.totalCollected, merchantCurrency)}
              </p>
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs sm:text-sm">
                <TrendingUp size={14} className="hidden sm:block" />
                <TrendingUp size={12} className="sm:hidden" />
                <span className="font-bold">+{stats.growthRate}%</span>
                <span className="text-green-700 dark:text-green-300 hidden sm:inline">vs last month</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">Active Campaigns</p>
                <div className="p-2 sm:p-3 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <Target className="hidden sm:block text-blue-600 dark:text-blue-400" size={20} />
                  <Target className="sm:hidden text-blue-600 dark:text-blue-400" size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">{stats.activeCampaigns}</p>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                <Plus size={14} className="hidden sm:block" />
                <Plus size={12} className="sm:hidden" />
                <span className="font-bold">2</span>
                <span className="text-blue-700 dark:text-blue-300 hidden sm:inline">new this week</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg sm:rounded-xl border border-purple-200 dark:border-purple-800 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 font-medium">Total Donors</p>
                <div className="p-2 sm:p-3 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                  <Users className="hidden sm:block text-purple-600 dark:text-purple-400" size={20} />
                  <Users className="sm:hidden text-purple-600 dark:text-purple-400" size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">{stats.totalDonors}</p>
              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs sm:text-sm">
                <TrendingUp size={14} className="hidden sm:block" />
                <TrendingUp size={12} className="sm:hidden" />
                <span className="font-bold">+5.2%</span>
                <span className="text-purple-700 dark:text-purple-300 hidden sm:inline">growth rate</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">Events with Donations</p>
                <div className="p-2 sm:p-3 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <Calendar className="hidden sm:block text-blue-600 dark:text-blue-400" size={20} />
                  <Calendar className="sm:hidden text-blue-600 dark:text-blue-400" size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">{events.length}</p>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                <Plus size={14} className="hidden sm:block" />
                <Plus size={12} className="sm:hidden" />
                <span className="font-bold">{Math.max(0, events.length - 2)}</span>
                <span className="text-blue-700 dark:text-blue-300 hidden sm:inline">active</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">Total Event Donations</p>
                <div className="p-2 sm:p-3 rounded-lg bg-green-100 dark:bg-green-900/40">
                  <Coins className="hidden sm:block text-green-600 dark:text-green-400" size={20} />
                  <Coins className="sm:hidden text-green-600 dark:text-green-400" size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
                {formatCurrency(events.reduce((sum, e) => sum + (e.donations?.totalRaised || 0), 0), merchantCurrency)}
              </p>
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs sm:text-sm">
                <TrendingUp size={14} className="hidden sm:block" />
                <TrendingUp size={12} className="sm:hidden" />
                <span className="font-bold">+12%</span>
                <span className="text-green-700 dark:text-green-300 hidden sm:inline">this month</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg sm:rounded-xl border border-purple-200 dark:border-purple-800 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 font-medium">Total Donations Count</p>
                <div className="p-2 sm:p-3 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                  <Users className="hidden sm:block text-purple-600 dark:text-purple-400" size={20} />
                  <Users className="sm:hidden text-purple-600 dark:text-purple-400" size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">{events.reduce((sum, e) => sum + (e.donations?.donationCount || 0), 0)}</p>
              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs sm:text-sm">
                <TrendingUp size={14} className="hidden sm:block" />
                <TrendingUp size={12} className="sm:hidden" />
                <span className="font-bold">+3.5%</span>
                <span className="text-purple-700 dark:text-purple-300 hidden sm:inline">increase</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 sm:mb-8 border-b-2 border-slate-200 dark:border-slate-700 overflow-x-auto">
          <div className="flex gap-6 sm:gap-8">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center gap-1 sm:gap-2 pb-3 sm:pb-4 px-1 border-b-[2px] font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                activeTab === 'campaigns'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Target className="hidden sm:block" size={18} />
              <Target className="sm:hidden" size={16} />
              <span>Campaigns</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-1 sm:gap-2 pb-3 sm:pb-4 px-1 border-b-[2px] font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                activeTab === 'events'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Calendar className="hidden sm:block" size={18} />
              <Calendar className="sm:hidden" size={16} />
              <span>Events</span>
            </button>
          </div>
        </div>

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div>
            {/* Filters and Sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Current Campaigns</h2>
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchCampaigns}
                  onChange={(e) => setSearchCampaigns(e.target.value)}
                  className="px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="recent">Most Recent</option>
                  <option value="progress">Progress %</option>
                  <option value="target">Highest Target</option>
                </select>
              </div>
            </div>

            {/* Campaign Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {sortedCampaigns.map(campaign => (
                <div
                  key={campaign._id}
                  className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all group flex flex-col"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-2">{campaign.name}</h3>
                      {campaign.description && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-1 mt-1">
                          {campaign.description}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${getStatusColor(campaign.status)}`}>
                      {getStatusLabel(campaign.status)}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2 mb-4 sm:mb-6 flex-1">
                    <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                      <span className="text-slate-600 dark:text-slate-400 truncate">
                        {formatCurrency(getCampaignRaisedAmount(campaign), campaign.goal?.currency || merchantCurrency)} of {formatCurrency(getCampaignTargetAmount(campaign), campaign.goal?.currency || merchantCurrency)}
                      </span>
                      <span className="font-bold text-blue-600 flex-shrink-0">
                        {Math.round(calculateProgress(getCampaignRaisedAmount(campaign), getCampaignTargetAmount(campaign)))}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 sm:h-3 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-500"
                        style={{ width: `${calculateProgress(getCampaignRaisedAmount(campaign), getCampaignTargetAmount(campaign))}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowShareModal(true);
                      }}
                      className="flex items-center justify-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors whitespace-nowrap"
                    >
                    <Share2 className="hidden sm:block" size={14} />
                    <Share2 className="sm:hidden" size={12} />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                    <button
                      onClick={() => navigate(`/finance/donations/${campaign._id}`)}
                      className="flex items-center justify-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors whitespace-nowrap"
                    >
                      <Eye className="hidden sm:block" size={14} />
                      <Eye className="sm:hidden" size={12} />
                      <span className="hidden sm:inline">Manage</span>
                      <span className="sm:hidden">View</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setFormData({
                          name: campaign.name,
                          description: campaign.description || '',
                          targetAmount: getCampaignTargetAmount(campaign).toString(),
                          status: campaign.status,
                          startDate: campaign.dates?.startDate ? new Date(campaign.dates.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                          endDate: campaign.dates?.endDate ? new Date(campaign.dates.endDate).toISOString().split('T')[0] : ''
                        });
                        setShowCampaignModal(true);
                      }}
                      className="flex items-center justify-center px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="hidden sm:block text-slate-600 dark:text-slate-300" size={14} />
                      <Edit2 className="sm:hidden text-slate-600 dark:text-slate-300" size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign._id)}
                      className="flex items-center justify-center px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="hidden sm:block text-red-600 dark:text-red-400" size={14} />
                      <Trash2 className="sm:hidden text-red-600 dark:text-red-400" size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add New Campaign Card */}
              <button
                onClick={() => {
                  setSelectedCampaign(null);
                  setCampaignImageFile(null);
                  setCampaignImagePreview('');
                  setFormData({ name: '', description: '', targetAmount: '', status: 'draft', startDate: new Date().toISOString().split('T')[0], endDate: '' });
                  setShowCampaignModal(true);
                }}
                className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg sm:rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all group"
              >
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary dark:text-white shadow-sm group-hover:shadow-md transition-shadow">
                  <Plus className="hidden sm:block" size={20} />
                  <Plus className="sm:hidden" size={16} />
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Start a new project</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Create a targeted fund for your next church initiative.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Events with Donations</h2>
              <input
                type="text"
                placeholder="Search events..."
                value={searchEvents}
                onChange={(e) => setSearchEvents(e.target.value)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {filteredEvents.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                <Calendar className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 text-sm">No events with donations enabled yet.</p>
                <button
                  onClick={() => navigate('/events/new')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  <span>Create Event</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredEvents.map(event => (
                  <div
                    key={event._id}
                    className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all flex flex-col"
                  >
                    {/* Cover Image */}
                    {event.coverImage?.url && (
                      <div className="h-40 sm:h-48 bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                        <img
                          src={event.coverImage.url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-4 sm:p-6 flex flex-col flex-1">
                      {/* Title and Description */}
                      <div className="mb-3">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-2 mb-1">
                          {event.title || 'Untitled Event'}
                        </h3>
                        {event.description && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {event.donations?.enabled && (
                        <div className="space-y-2 mb-4 sm:mb-6 flex-1">
                          <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                            <span className="text-slate-600 dark:text-slate-400 truncate">
                              {formatCurrency(event.donations.totalRaised || 0, event.donations.goal?.currency || merchantCurrency)} of {formatCurrency(event.donations.goal?.amount || 0, event.donations.goal?.currency || merchantCurrency)}
                            </span>
                            <span className="font-bold text-blue-600 flex-shrink-0">
                              {Math.round(((event.donations.totalRaised || 0) / (event.donations.goal?.amount || 1)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 sm:h-3 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(((event.donations.totalRaised || 0) / (event.donations.goal?.amount || 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap mt-auto">
                        <button
                          onClick={() => navigate(`/events/${event._id}/donations`)}
                          className="flex items-center justify-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Eye className="hidden sm:block" size={14} />
                          <Eye className="sm:hidden" size={12} />
                          <span className="hidden sm:inline">Manage</span>
                          <span className="sm:hidden">View</span>
                        </button>
                        <button
                          onClick={() => navigate(`/events/${event._id}/edit`)}
                          className="flex items-center justify-center px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="hidden sm:block text-slate-600 dark:text-slate-300" size={14} />
                          <Edit2 className="sm:hidden text-slate-600 dark:text-slate-300" size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create/Edit Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6\">
          <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl\">
            <div className="flex items-center justify-between mb-4 sm:mb-6 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0\">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                {selectedCampaign ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
              <button
                onClick={() => setShowCampaignModal(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex-shrink-0\"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Campaign Image
                </label>
                <ImageUploader
                  label=""
                  preview={campaignImagePreview}
                  onImageSelect={handleImageSelect}
                  onImageRemove={handleImageRemove}
                  maxSize={5}
                  helperText="Upload a campaign image (max 5MB)"
                />
              </div>

              {/* Tiered Donations Toggle */}
              <div>
                <div className="flex items-start gap-3">
                  <input
                    id="tiersToggle"
                    type="checkbox"
                    checked={tiersEnabled}
                    onChange={(e) => {
                      setTiersEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setTiers([]);
                      }
                    }}
                    className="w-5 h-5 rounded border-slate-300 text-primary-600 mt-1 focus:ring-primary"
                  />
                  <div>
                    <label htmlFor="tiersToggle" className="flex-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-white cursor-pointer">
                      Enable Tiered Donations?
                    </label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Allow donors to choose from different contribution levels with specific benefits
                    </p>

                  </div>
                </div>
              </div>

              {/* Tier Management */}
              {tiersEnabled && (
                <div>
                  <TierForm
                    tiers={tiers}
                    onTiersChange={setTiers}
                    currency={merchantCurrency}
                    disabled={modalLoading}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., New Sanctuary Building Fund"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Describe your campaign goals..."
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Target Amount ({merchantCurrency}) *
                </label>
                <input
                  type="number"
                  min="0"
                  onWheel={e => (e.target as HTMLInputElement).blur()}
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter target amount"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Campaign Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 sm:gap-3  flex-shrink-0">
              <button
                onClick={() => setShowCampaignModal(false)}
                disabled={modalLoading}
                className="px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={modalLoading}
                className="px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                  {modalLoading ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      <span className="hidden sm:inline">Creating...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    selectedCampaign ? 'Update Campaign' : 'Create Campaign'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setCampaignToDelete(null);
        }}
        onConfirm={confirmDeleteCampaign}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteLoading}
      />

      {/* Share Campaign Modal */}
      {showShareModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Share Campaign</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{selectedCampaign.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Share this link to let people donate to your campaign
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 flex items-center gap-2">
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    {selectedCampaign.publicUrl || 'https://donate.churchpay.ng/campaign/...'}
                  </p>
                </div>
                <button
                  onClick={handleShareCampaign}
                  className="flex items-center justify-center px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  {copiedUrl ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (selectedCampaign.publicUrl) {
                      window.open(selectedCampaign.publicUrl, '_blank');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <LinkIcon size={16} />
                  Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donations;