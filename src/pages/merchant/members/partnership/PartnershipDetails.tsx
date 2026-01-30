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
  Search,
  Link2,
  Copy,
  ExternalLink,
  Loader2,
  CreditCard,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { partnershipAPI, memberAPI } from '../../../../services/api';
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
    member?: { 
      _id: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
    };
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
  const publicPaymentLink = `${frontendUrl}/partnership/payment/${merchantId}/${id}`;

  const [programme, setProgramme] = useState<PartnershipProgramme | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'transactions'>('overview');

  // Filters
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState('all');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form states
  const [addPartnerData, setAddPartnerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tierId: programme?.tiers[0]?._id || '',
  });

  const [addTransactionData, setAddTransactionData] = useState({
    registrationId: '',
    amount: '',
    currency: merchantCurrency,
    paymentMethod: 'manual',
    notes: '',
  });

  // Member search state for transaction modal
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [showMemberSearchResults, setShowMemberSearchResults] = useState(false);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [transactionTab, setTransactionTab] = useState<'member' | 'guest'>('member');
  const [guestData, setGuestData] = useState({
    fullName: '',
    phone: '',
    email: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Debounce member search
  useEffect(() => {
    if (!showAddTransactionModal || transactionTab !== 'member') {
      return;
    }

    const timer = setTimeout(() => {
      if (memberSearchQuery && memberSearchQuery.trim().length >= 2) {
        searchMembers(memberSearchQuery);
        setShowMemberSearchResults(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [memberSearchQuery, showAddTransactionModal, transactionTab]);

  const handleDeletePartner = async (partnerId: string) => {
    try {
      setIsSubmitting(true);
      await partnershipAPI.deletePartner(id!, partnerId);
      showToast.success('Partner deleted successfully');
      setShowDeleteConfirm(null);
      await loadPartners();
      await loadProgrammeDetails();
    } catch (error: any) {
      showToast.error('Failed to delete partner');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await partnershipAPI.registerPartner(id!, {
        firstName: addPartnerData.firstName,
        lastName: addPartnerData.lastName,
        email: addPartnerData.email,
        phone: addPartnerData.phone,
        tierId: addPartnerData.tierId,
      });
      showToast.success('Partner added successfully');
      setShowAddPartnerModal(false);
      setAddPartnerData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        tierId: programme?.tiers[0]?._id || '',
      });
      await loadPartners();
      await loadProgrammeDetails();
    } catch (error: any) {
      showToast.error('Failed to add partner');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      let registrationId = addTransactionData.registrationId;
      
      // Handle guest transaction (need to register as guest first)
      if (transactionTab === 'guest') {
        if (!guestData.fullName || !guestData.phone) {
          showToast.error('Please fill in fullname and phone for guest');
          return;
        }

        // Split fullName into first and last name
        const nameParts = guestData.fullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'Guest';

        // Register guest as a partner first with default tier
        const defaultTier = programme?.tiers[0];
        if (!defaultTier) {
          showToast.error('No tier available for registration');
          return;
        }

        try {
          const partnerResponse = await partnershipAPI.registerPartner(id!, {
            firstName,
            lastName,
            phone: guestData.phone,
            email: guestData.email,
            tierId: defaultTier._id,
          });
          
          console.log('Guest registration response:', partnerResponse);
          
          // Handle both new registration and existing registration response structures
          if (partnerResponse.data.isExisting) {
            // Existing registration response: data is the registration directly
            registrationId = partnerResponse.data.data._id;
          } else {
            // New registration response: data.registration or data.data._id
            registrationId = partnerResponse.data.data._id || partnerResponse.data.data.registration?._id;
          }
          
          if (!registrationId) {
            showToast.error('Failed to get registration ID for guest');
            console.error('Could not extract registration ID:', partnerResponse.data);
            return;
          }
          
          showToast.success('Guest registered as partner');
        } catch (guestRegError: any) {
          const errorMsg = guestRegError.response?.data?.message || 'Failed to register guest';
          showToast.error(errorMsg);
          console.error('Guest registration error:', guestRegError);
          return;
        }
      } else {
        // Handle member transaction
        if (!registrationId) {
          showToast.error('Please select a member');
          return;
        }

        // Check if member is already a partner
        const existingPartner = partners.find(p => p.member?._id === registrationId);
        
        if (existingPartner) {
          // Member already registered, use existing registration
          registrationId = existingPartner._id;
        } else if (selectedMember) {
          // Member may or may not be registered, try to register/get registration
          const defaultTier = programme?.tiers[0];
          if (!defaultTier) {
            showToast.error('No tier available for registration');
            return;
          }

          try {
            const partnerResponse = await partnershipAPI.registerPartner(id!, {
              firstName: selectedMember.firstName,
              lastName: selectedMember.lastName,
              phone: selectedMember.phone,
              email: selectedMember.email || '',
              tierId: defaultTier._id,
            });
            
            registrationId = partnerResponse.data.data._id;
            
            // Refresh partners list only if it's a new registration
            if (!partnerResponse.data.isExisting) {
              await loadPartners();
              showToast.success('Member registered as partner');
            }
          } catch (regError: any) {
            const errorMsg = regError.response?.data?.message || 'Failed to register member';
            showToast.error(errorMsg);
            return;
          }
        }
      }

      // Now create the transaction
      await partnershipAPI.createManualTransaction(id!, {
        registrationId: registrationId,
        amount: parseFloat(addTransactionData.amount),
        currency: addTransactionData.currency,
        paymentMethod: addTransactionData.paymentMethod,
        notes: addTransactionData.notes,
      });
      
      showToast.success('Transaction created successfully');
      setShowAddTransactionModal(false);
      setAddTransactionData({
        registrationId: '',
        amount: '',
        currency: merchantCurrency,
        paymentMethod: 'manual',
        notes: '',
      });
      setMemberSearchQuery('');
      setSelectedMember(null);
      setGuestData({ fullName: '', phone: '', email: '' });
      setTransactionTab('member');
      await loadTransactions();
      await loadProgrammeDetails();
    } catch (error: any) {
      showToast.error('Failed to create transaction');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      setLoadingPartners(true);
      const response = await partnershipAPI.getPartners(id!);
      setPartners(response.data.data.partners || []);
    } catch (error: any) {
      showToast.error('Failed to load partners');
      console.error(error);
    } finally {
      setLoadingPartners(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const response = await partnershipAPI.getTransactions(id!);
      setTransactions(response.data.data.transactions || []);
    } catch (error: any) {
      showToast.error('Failed to load transactions');
      console.error(error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Search members by phone or name
  const searchMembers = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setMemberSearchResults([]);
      return;
    }

    try {
      setSearchingMembers(true);
      console.log('Searching members with query:', query);
      
      const response = await memberAPI.getMembers({
        search: query,
        limit: 10,
        status: 'active'
      });
      
      console.log('Member search response:', response);
      
      // Handle the response structure from memberAPI
      const members = response.data?.data?.members || response.data?.data || [];
      
      console.log('Members found:', members);
      
      // Don't filter - show all members including those already registered
      // The transaction creation will handle checking if they're already a partner
      const filteredMembers = Array.isArray(members) ? members : [];
      
      console.log('All members available:', filteredMembers);
      
      setMemberSearchResults(filteredMembers);
    } catch (error: any) {
      console.error('Error searching members:', error);
      setMemberSearchResults([]);
    } finally {
      setSearchingMembers(false);
    }
  };

  // Handle member selection from search results
  const handleSelectMember = (member: any) => {
    // Store the selected member
    setSelectedMember(member);
    // Store the selected member ID in registrationId
    setAddTransactionData(prev => ({
      ...prev,
      registrationId: member._id,
    }));
    // Close the dropdown and clear search results
    setShowMemberSearchResults(false);
    setMemberSearchResults([]);
    showToast.success(`${member.firstName} ${member.lastName} selected`);
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
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className='flex'>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{programme.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(programme.status)}`}>
                {programme.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{programme.description}</p>
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

      {/* Public Links Section */}
      {programme.status === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Public Registration Link */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
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

          {/* Public Payment Link */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Public Payment Link
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Share this link for people to make partnership contributions
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5">
                    <input
                      type="text"
                      value={publicPaymentLink}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(publicPaymentLink);
                      showToast.success('Link copied to clipboard!');
                    }}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={() => window.open(publicPaymentLink, '_blank')}
                    className="px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
            {/* Target Amount Card */}
            <div className="relative overflow-hidden rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-purple-200 dark:bg-purple-900/30 opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Target Amount</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(programme.goal?.targetAmount || 0, programme.goal?.currency || merchantCurrency)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-600/10 dark:bg-purple-500/10 rounded-lg">
                    <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Raised Card */}
            <div className="relative overflow-hidden rounded-xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-green-200 dark:bg-green-900/30 opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Amount Raised</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(programme.goal?.raisedAmount || 0, programme.goal?.currency || merchantCurrency)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-600/10 dark:bg-green-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Partners Card */}
            <div className="relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-200 dark:bg-blue-900/30 opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Partners</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{programme.stats.totalPartners}</p>
                  </div>
                  <div className="p-3 bg-blue-600/10 dark:bg-blue-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Card */}
            <div className="relative overflow-hidden rounded-xl border border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/10 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-pink-200 dark:bg-pink-900/30 opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{programme.stats.totalTransactions}</p>
                  </div>
                  <div className="p-3 bg-pink-600/10 dark:bg-pink-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative overflow-hidden rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-all">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-600 to-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Goal Progress</h3>
            <div className="space-y-4">
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{progress.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency((programme.goal?.targetAmount || 0) - (programme.goal?.raisedAmount || 0), programme.goal?.currency || merchantCurrency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tiers */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-all">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Partnership Tiers</h3>
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
            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
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
              <button
                onClick={() => setShowAddPartnerModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Partner</span>
              </button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading partners...</p>
                      </div>
                    </td>
                  </tr>
                ) : loadingPartners ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Updating partners...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPartners.length === 0 ? (
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
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs capitalize font-semibold rounded-full ${
                            partner.partnerType === 'member'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {partner.partnerType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{partner.tier?.name}</span>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setShowDeleteConfirm(partner._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Delete partner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
          <div className="flex justify-between items-center flex-wrap gap-4">
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

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddTransactionModal(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </button>
              <button
                onClick={handleExportTransactions}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export to Excel'}
              </button>
            </div>
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
                {loadingTransactions ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Updating transactions...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
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
                      ? transaction.registration.member
                        ? `${transaction.registration.member.firstName} ${transaction.registration.member.lastName}`
                        : 'N/A'
                      : transaction.registration.guestInfo?.fullName || 'N/A';

                    return (
                      <tr key={transaction._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                              {partnerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{partnerName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {transaction.registration.partnerType === 'member' ? 'Member' : 'Guest'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.tier && (
                            <span className="text-sm text-gray-900 dark:text-gray-100">{transaction.tier.name}</span>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Partner?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will permanently delete the partner and all their associated transactions. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePartner(showDeleteConfirm)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Partner</h3>
              <button
                onClick={() => setShowAddPartnerModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPartner} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={addPartnerData.firstName}
                  onChange={(e) => setAddPartnerData({ ...addPartnerData, firstName: e.target.value })}
                  required
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={addPartnerData.lastName}
                  onChange={(e) => setAddPartnerData({ ...addPartnerData, lastName: e.target.value })}
                  required
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <input
                type="email"
                placeholder="Email"
                value={addPartnerData.email}
                onChange={(e) => setAddPartnerData({ ...addPartnerData, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />

              <input
                type="tel"
                placeholder="Phone"
                value={addPartnerData.phone}
                onChange={(e) => setAddPartnerData({ ...addPartnerData, phone: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />

              <select
                value={addPartnerData.tierId}
                onChange={(e) => setAddPartnerData({ ...addPartnerData, tierId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Tier</option>
                {programme?.tiers.map((tier) => (
                  <option key={tier._id} value={tier._id}>
                    {tier.name} - {formatCurrency(tier.minimumAmount, merchantCurrency)} min
                  </option>
                ))}
              </select>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddPartnerModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Transaction</h3>
              <button
                onClick={() => {
                  setShowAddTransactionModal(false);
                  setMemberSearchQuery('');
                  setSelectedMember(null);
                  setGuestData({ fullName: '', phone: '', email: '' });
                  setTransactionTab('member');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setTransactionTab('member')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  transactionTab === 'member'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                Member
              </button>
              <button
                onClick={() => setTransactionTab('guest')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  transactionTab === 'guest'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                Guest
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              {/* Member Tab */}
              {transactionTab === 'member' && (
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Member
                    </label>
                    
                    {selectedMember ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-200">
                            {selectedMember.firstName} {selectedMember.lastName}
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {selectedMember.phone}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMember(null);
                            setAddTransactionData(prev => ({ ...prev, registrationId: '' }));
                            setMemberSearchQuery('');
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Member Search Input */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by phone or name (min 2 chars)..."
                            value={memberSearchQuery}
                            onChange={(e) => {
                              setMemberSearchQuery(e.target.value);
                              if (!e.target.value.trim()) {
                                setShowMemberSearchResults(false);
                              }
                            }}
                            onFocus={() => memberSearchQuery.length >= 2 && setShowMemberSearchResults(true)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                          />
                          {searchingMembers && (
                            <Loader2 className="absolute right-3 top-2.5 w-5 h-5 animate-spin text-gray-500" />
                          )}
                        </div>

                        {/* Member Search Results Dropdown */}
                        {showMemberSearchResults && memberSearchQuery.length >= 2 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                            {memberSearchResults.length > 0 ? (
                              <ul className="max-h-48 overflow-y-auto">
                                {memberSearchResults.map((member: any) => (
                                  <li key={member._id}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleSelectMember(member);
                                        setShowMemberSearchResults(false);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-sm"
                                    >
                                      <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {member.firstName} {member.lastName}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {member.phone} {member.email && `• ${member.email}`}
                                      </div>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                No members found
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Fallback: Partner Dropdown */}
                  {!addTransactionData.registrationId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Or Select Existing Partner
                      </label>
                      <select
                        value={addTransactionData.registrationId}
                        onChange={(e) => {
                          setAddTransactionData({ ...addTransactionData, registrationId: e.target.value });
                          setMemberSearchQuery('');
                          setShowMemberSearchResults(false);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select a Partner</option>
                        {partners.map((partner) => {
                          const name = partner.partner
                            ? `${partner.partner.firstName} ${partner.partner.lastName}`
                            : 'N/A';
                          return (
                            <option key={partner._id} value={partner._id}>
                              {name} ({partner.tier?.name})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Guest Tab */}
              {transactionTab === 'guest' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={guestData.fullName}
                    onChange={(e) => setGuestData({ ...guestData, fullName: e.target.value })}
                    required={transactionTab === 'guest'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={guestData.phone}
                    onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                    required={transactionTab === 'guest'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={guestData.email}
                    onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Transaction Details */}
              <input
                type="number"
                placeholder="Amount"
                step="0.01"
                min="0"
                value={addTransactionData.amount}
                onChange={(e) => setAddTransactionData({ ...addTransactionData, amount: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />

              <select
                value={addTransactionData.currency}
                onChange={(e) => setAddTransactionData({ ...addTransactionData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="GHS">GHS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="NGN">NGN</option>
                <option value="KES">KES</option>
              </select>

              <select
                value={addTransactionData.paymentMethod}
                onChange={(e) => setAddTransactionData({ ...addTransactionData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="manual">Manual</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="momo">Mobile Money</option>
                <option value="paystack">Paystack</option>
              </select>

              <textarea
                placeholder="Notes (optional)"
                value={addTransactionData.notes}
                onChange={(e) => setAddTransactionData({ ...addTransactionData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent resize-none h-20"
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTransactionModal(false);
                    setMemberSearchQuery('');
                    setSelectedMember(null);
                    setGuestData({ fullName: '', phone: '', email: '' });
                    setTransactionTab('member');
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (transactionTab === 'member' ? !addTransactionData.registrationId : !guestData.fullName || !guestData.phone) || !addTransactionData.amount}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnershipDetails;
