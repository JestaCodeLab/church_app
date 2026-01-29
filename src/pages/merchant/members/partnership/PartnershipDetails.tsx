import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  RefreshCw,
  Download,
  Users,
  TrendingUp,
  Target,
  Calendar,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Link2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { partnershipAPI } from '../../../../services/api';
import { showToast } from '../../../../utils/toasts';
import { formatCurrency, getMerchantCurrency } from '../../../../utils/currency';
import PermissionGuard from '../../../../components/guards/PermissionGuard';
import { useAuth } from '../../../../context/AuthContext';

interface Tier {
  _id?: string;
  name: string;
  minimumAmount: number;
  description?: string;
  benefits?: string[];
  badgeColor?: string;
}

interface PartnershipProgramme {
  _id: string;
  name: string;
  description?: string;
  tiers: Tier[];
  goal: {
    targetAmount: number;
    raisedAmount: number;
    currency: string;
  };
  stats: {
    totalPartners: number;
    activePartners: number;
    totalTransactions: number;
    memberPartners: number;
    guestPartners: number;
  };
  status: 'draft' | 'active' | 'paused' | 'completed';
  dates?: {
    startDate?: string;
    endDate?: string;
    createdAt: string;
  };
}

interface Partner {
  _id: string;
  partnerType: 'member' | 'guest';
  member?: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  partner: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
  };
  guestInfo?: {
    fullName: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  tier: Tier;
  paymentStats?: {
    totalAmount: number;
    totalCount: number;
    lastPaymentDate?: string;
  };
  registeredAt: string;
}

interface Transaction {
  _id: string;
  registration: {
    _id: string;
    partnerType: 'member' | 'guest';
    member?: { fullName: string };
    guestInfo?: { fullName: string };
  };
  tier?: Tier;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed';
  transactionReference?: string;
  createdAt: string;
}

const PartnershipDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const merchantCurrency = getMerchantCurrency();
  const { user } = useAuth();
  const merchantId = user?.merchant?.id;

  const frontendUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
  const publicRegistrationLink = `${frontendUrl}/partnership/register/${merchantId}/${id}`;

  const [programme, setProgramme] = useState<PartnershipProgramme | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'transactions'>('overview');

  // Filters
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState('all');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadProgrammeDetails();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'partners') {
      loadPartners();
    } else if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab]);

  const loadProgrammeDetails = async () => {
    try {
      setLoading(true);
      const response = await partnershipAPI.getOne(id!);
      setProgramme(response.data.data.programme);
    } catch (error: any) {
      showToast.error('Failed to load partnership programme');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPartners = async () => {
    try {
      const response = await partnershipAPI.getPartners(id!);
      setPartners(response.data.data.partners || []);
    } catch (error: any) {
      showToast.error('Failed to load partners');
      console.error(error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await partnershipAPI.getTransactions(id!);
      setTransactions(response.data.data.transactions || []);
    } catch (error: any) {
      showToast.error('Failed to load transactions');
      console.error(error);
    }
  };

  const handleRefreshStats = async () => {
    try {
      setIsRefreshing(true);
      await partnershipAPI.refreshStats(id!);
      showToast.success('Statistics refreshed successfully');
      await loadProgrammeDetails();
      if (activeTab === 'partners') await loadPartners();
      if (activeTab === 'transactions') await loadTransactions();
    } catch (error: any) {
      showToast.error('Failed to refresh statistics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportTransactions = async () => {
    try {
      setIsExporting(true);
      const response = await partnershipAPI.exportTransactions(id!);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `partnership_transactions_${id}_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToast.success('Transactions exported successfully');
    } catch (error: any) {
      showToast.error('Failed to export transactions');
    } finally {
      setIsExporting(false);
    }
  };

  const calculateProgress = (raised: number, target: number) => {
    return Math.min((raised / target) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredPartners = partners.filter(partner => {
    const name = partner.partner 
      ? `${partner.partner.firstName} ${partner.partner.lastName}`
      : '';
    
    const matchesSearch = partnerSearch === '' || name.toLowerCase().includes(partnerSearch.toLowerCase());
    const matchesType = partnerTypeFilter === 'all' || partner.partnerType === partnerTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const filteredTransactions = transactions.filter(transaction => {
    return transactionStatusFilter === 'all' || transaction.status === transactionStatusFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading programme details...</p>
        </div>
      </div>
    );
  }

  if (!programme) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Programme not found</p>
      </div>
    );
  }

  const progress = calculateProgress(
    programme.goal?.raisedAmount || 0, 
    programme.goal?.targetAmount || 0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/members/partnership')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Programmes
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{programme.name}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{programme.description}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(programme.status)}`}>
                {programme.status}
              </span>
            </div>
          </div>

          <div className="mt-4 sm:mt-0 flex gap-2">
            <button
              onClick={handleRefreshStats}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <PermissionGuard permission="members.editPartnership">
              <button
                onClick={() => navigate(`/members/partnership/${id}/edit`)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Public Registration Link */}
      {programme.status === 'active' && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Link2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Public Registration Link
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Share this link for people to register as partners in this programme
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5">
                  <input
                    type="text"
                    value={publicRegistrationLink}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publicRegistrationLink);
                    showToast.success('Link copied to clipboard!');
                  }}
                  className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => window.open(publicRegistrationLink, '_blank')}
                  className="px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            className={`${
              activeTab === 'partners'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Partners ({programme.stats.totalPartners})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`${
              activeTab === 'transactions'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Transactions ({programme.stats.totalTransactions})
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Target Amount</dt>
                      <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(programme.goal?.targetAmount || 0, programme.goal?.currency || merchantCurrency)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Amount Raised</dt>
                      <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(programme.goal?.raisedAmount || 0, programme.goal?.currency || merchantCurrency)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Partners</dt>
                      <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">{programme.stats.totalPartners}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Transactions</dt>
                      <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">{programme.stats.totalTransactions}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Goal Progress</h3>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-purple-600 dark:bg-purple-500 h-4 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{progress.toFixed(1)}% of goal reached</span>
              <span>{formatCurrency((programme.goal?.targetAmount || 0) - (programme.goal?.raisedAmount || 0), programme.goal?.currency || merchantCurrency)} remaining</span>
            </div>
          </div>

          {/* Tiers */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Partnership Tiers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programme.tiers.map((tier, index) => (
                <div 
                  key={index} 
                  className="border-2 rounded-lg p-4 transition-all hover:shadow-md relative overflow-hidden"
                  style={{ 
                    borderColor: tier.badgeColor || '#9333EA',
                    backgroundColor: `${tier.badgeColor || '#9333EA'}08`
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-5 h-5 rounded-full shadow-sm"
                      style={{ backgroundColor: tier.badgeColor || '#9333EA' }}
                    />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{tier.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Minimum: {formatCurrency(tier.minimumAmount, merchantCurrency)}
                  </p>
                  {tier.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{tier.description}</p>
                  )}
                  {tier.benefits && tier.benefits.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Benefits:</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {tier.benefits.map((benefit, bIndex) => (
                          <li key={bIndex}>• {benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Partner Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Partner Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Partners</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{programme.stats.activePartners}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Member Partners</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{programme.stats.memberPartners}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Guest Partners</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{programme.stats.guestPartners}</span>
                </div>
              </div>
            </div>

            {programme.dates && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Timeline</h3>
                <div className="space-y-3">
                  {programme.dates.startDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Start Date</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {new Date(programme.dates.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {programme.dates.endDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">End Date</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {new Date(programme.dates.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {new Date(programme.dates.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search partners..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={partnerTypeFilter}
                onChange={(e) => setPartnerTypeFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="member">Members</option>
                <option value="guest">Guests</option>
              </select>
            </div>
          </div>

          {/* Partners Table */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Contributed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No Partners Yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {partnerSearch || partnerTypeFilter !== 'all' ? 'No partners match your filters' : 'Partners will appear here once they register'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((partner) => {
                    const name = partner.partner
                      ? `${partner.partner.firstName} ${partner.partner.lastName}`
                      : 'N/A';
                    const phone = partner.partner?.phone || 'N/A';

                    return (
                      <tr key={partner._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            partner.partnerType === 'member'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {partner.partnerType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: partner.tier?.badgeColor || '#000000' }}
                            />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{partner.tier?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatCurrency(partner.paymentStats?.totalAmount || 0, merchantCurrency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {partner.paymentStats?.totalCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(partner.registeredAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex justify-between items-center">
            <select
              value={transactionStatusFilter}
              onChange={(e) => setTransactionStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <button
              onClick={handleExportTransactions}
              disabled={isExporting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                          <TrendingUp className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No Transactions Yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {transactionStatusFilter !== 'all' ? 'No transactions match this status filter' : 'Partnership transactions will appear here'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const partnerName = transaction.registration.partnerType === 'member'
                      ? transaction.registration.member?.fullName || 'N/A'
                      : transaction.registration.guestInfo?.fullName || 'N/A';

                    return (
                      <tr key={transaction._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{partnerName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.registration.partnerType === 'member' ? 'Member' : 'Guest'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.tier && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: transaction.tier.badgeColor || '#000000' }}
                              />
                              <span className="text-sm text-gray-900 dark:text-gray-100">{transaction.tier.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {transaction.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnershipDetails;
