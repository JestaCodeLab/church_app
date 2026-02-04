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
  Settings,
  QrCode,
  DollarSign,
} from 'lucide-react';
import { partnershipAPI, memberAPI } from '../../../../services/api';
import api from '../../../../services/api';
import { showToast } from '../../../../utils/toasts';
import { formatCurrency, getMerchantCurrency } from '../../../../utils/currency';
import { format } from 'date-fns';
import PermissionGuard from '../../../../components/guards/PermissionGuard';
import { useAuth } from '../../../../context/AuthContext';
import EditPartnerModal from './EditPartnerModal';
import QRCodeModal from '../../../../components/modals/QRCodeModal';

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
  smsMessages?: {
    welcomeMessage?: string;
    thankYouMessage?: string;
  };
  registrationForm?: any;
  period?: any;
  isPublic?: boolean;
  publicSettings?: any;
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
  commitment: {
    amount: number;
    frequency: string;
  };
  status: string;
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
    partner?: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
    };
  };
  tier?: Tier;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed';
  transactionReference?: string;
  transactionCode?: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'transactions' | 'messages'>('overview');

  // QR Code state
  const [qrModal, setQrModal] = useState<{
    isOpen: boolean;
    type: 'registration' | 'payment' | null;
    data: any;
    loading: boolean;
  }>({
    isOpen: false,
    type: null,
    data: null,
    loading: false,
  });

  // Messages state
  const [smsMessages, setSmsMessages] = useState({
    welcomeMessage: '',
    thankYouMessage: '',
  });
  const [messageSaving, setMessageSaving] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  // Filters
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState('all');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPartners, setIsExportingPartners] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pagination
  const [partnersCurrentPage, setPartnersCurrentPage] = useState(1);
  const partnersPerPage = 10;

  // Modals
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEditPartnerModal, setShowEditPartnerModal] = useState(false);
  const [selectedPartnerForEdit, setSelectedPartnerForEdit] = useState<Partner | null>(null);

  // Form states
  const [partnerTab, setPartnerTab] = useState<'member' | 'guest'>('member');
  const [addPartnerData, setAddPartnerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tierId: programme?.tiers[0]?._id || '',
  });

  // Member search state for partner modal
  const [partnerMemberSearchQuery, setPartnerMemberSearchQuery] = useState('');
  const [partnerMemberSearchResults, setPartnerMemberSearchResults] = useState<any[]>([]);
  const [showPartnerMemberSearchResults, setShowPartnerMemberSearchResults] = useState(false);
  const [searchingPartnerMembers, setSearchingPartnerMembers] = useState(false);
  const [selectedPartnerMember, setSelectedPartnerMember] = useState<any>(null);
  const [partnerGuestData, setPartnerGuestData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
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
  const [selectedPartnerForTransaction, setSelectedPartnerForTransaction] = useState<any>(null);
  const [transactionTab, setTransactionTab] = useState<'member' | 'guest'>('member');
  const [guestData, setGuestData] = useState({
    fullName: '',
    phone: '',
    email: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tierBreakdown, setTierBreakdown] = useState<any[]>([]);
  const [loadingTierBreakdown, setLoadingTierBreakdown] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      // First, refresh stats to recalculate raised amount from transactions
      try {
        await partnershipAPI.refreshStats(id!);
      } catch (error) {
        console.error('Failed to refresh stats on load:', error);
      }
      // Then load the updated programme details
      await loadProgrammeDetails();
      await loadTierBreakdown();
    };

    initializeData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'partners') {
      loadPartners();
    } else if (activeTab === 'transactions') {
      loadTransactions();
    } else if (activeTab === 'messages') {
      loadMessages();
    }
  }, [activeTab]);

  // Reload transactions when search or status filter changes
  useEffect(() => {
    if (activeTab === 'transactions') {
      const timer = setTimeout(() => {
        loadTransactions();
      }, 300); // Debounce search by 300ms

      return () => clearTimeout(timer);
    }
  }, [transactionSearch, transactionStatusFilter]);

  // Debounce partner member search
  useEffect(() => {
    if (!showAddPartnerModal || partnerTab !== 'member') {
      return;
    }

    const timer = setTimeout(() => {
      if (partnerMemberSearchQuery && partnerMemberSearchQuery.trim().length >= 2) {
        searchPartnerMembers(partnerMemberSearchQuery);
        setShowPartnerMemberSearchResults(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [partnerMemberSearchQuery, showAddPartnerModal, partnerTab]);

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

  const handleEditPartner = (partner: Partner) => {
    setSelectedPartnerForEdit(partner);
    setShowEditPartnerModal(true);
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      if (partnerTab === 'member') {
        if (!selectedPartnerMember || !selectedPartnerMember._id) {
          showToast.error('Please select a member');
          return;
        }
        if (!addPartnerData.tierId) {
          showToast.error('Please select a tier');
          return;
        }

        await partnershipAPI.registerPartner(id!, {
          memberId: selectedPartnerMember._id,
          tierId: addPartnerData.tierId,
        });
      } else {
        // Guest registration
        if (!partnerGuestData.firstName || !partnerGuestData.lastName || !partnerGuestData.phone) {
          showToast.error('Please fill in first name, last name, and phone');
          return;
        }
        if (!addPartnerData.tierId) {
          showToast.error('Please select a tier');
          return;
        }

        await partnershipAPI.registerPartner(id!, {
          firstName: partnerGuestData.firstName,
          lastName: partnerGuestData.lastName,
          email: partnerGuestData.email,
          phone: partnerGuestData.phone,
          tierId: addPartnerData.tierId,
        });
      }

      showToast.success('Partner added successfully');
      setShowAddPartnerModal(false);
      setPartnerTab('member');
      setSelectedPartnerMember(null);
      setPartnerMemberSearchQuery('');
      setPartnerGuestData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
      });
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
      showToast.error(error.response?.data?.message || 'Failed to add partner');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const defaultTier = programme?.tiers[0];
      if (!defaultTier) {
        showToast.error('No tier available');
        return;
      }

      // Prepare transaction data
      const transactionData: any = {
        amount: parseFloat(addTransactionData.amount),
        currency: addTransactionData.currency,
        paymentMethod: addTransactionData.paymentMethod,
        notes: addTransactionData.notes,
      };

      if (transactionTab === 'guest') {
        // Guest transaction - send guest details for auto-registration
        if (!guestData.fullName || !guestData.phone) {
          showToast.error('Please fill in fullname and phone for guest');
          return;
        }

        const nameParts = guestData.fullName.trim().split(' ');
        const firstName = nameParts[0] || guestData.fullName;
        const lastName = nameParts.slice(1).join(' ') || '';

        transactionData.phone = guestData.phone;
        transactionData.firstName = firstName;
        transactionData.lastName = lastName;
        transactionData.email = guestData.email;
        transactionData.tierId = defaultTier._id;
      } else {
        // Member transaction
        if (!selectedMember) {
          showToast.error('Please select a member');
          return;
        }

        // Send member details for auto-registration if not registered
        transactionData.memberId = selectedMember._id;
        transactionData.phone = selectedMember.phone;
        transactionData.firstName = selectedMember.firstName;
        transactionData.lastName = selectedMember.lastName;
        transactionData.email = selectedMember.email;
        transactionData.tierId = defaultTier._id;

        // If we already have a registrationId, include it (backend will use it)
        const existingPartner = partners.find(p => p.member?._id === selectedMember._id);
        if (existingPartner) {
          transactionData.registrationId = existingPartner._id;
        }
      }

      // Create transaction - backend will auto-register if needed
      const response = await partnershipAPI.createManualTransaction(id!, transactionData);

      const successMessage = response.data.message || 'Transaction created successfully';
      showToast.success(successMessage);

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
      
      // Refresh partners if new registration was created
      if (response.data.data?.registration) {
        await loadPartners();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to create transaction';
      showToast.error(errorMsg);
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
      const params: any = {
        limit: 100,
      };

      // Add search filter if present
      if (transactionSearch.trim()) {
        params.search = transactionSearch.trim();
      }

      // Add status filter if not 'all'
      if (transactionStatusFilter !== 'all') {
        params.status = transactionStatusFilter;
      }

      const response = await partnershipAPI.getTransactions(id!, params);
      setTransactions(response.data.data.transactions || []);
    } catch (error: any) {
      showToast.error('Failed to load transactions');
      console.error(error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadTierBreakdown = async () => {
    try {
      setLoadingTierBreakdown(true);
      const response = await partnershipAPI.getTierBreakdown(id!);
      setTierBreakdown(response.data.data?.tierBreakdown || []);
    } catch (error: any) {
      console.error('Failed to load tier breakdown:', error);
      // Fail silently, will fall back to local calculation
    } finally {
      setLoadingTierBreakdown(false);
    }
  }; const loadMessages = async () => {
    try {
      if (programme?.smsMessages) {
        setSmsMessages({
          welcomeMessage: programme.smsMessages.welcomeMessage || '',
          thankYouMessage: programme.smsMessages.thankYouMessage || '',
        });
      }
      setMessagesLoaded(true);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSaveMessages = async () => {
    try {
      setMessageSaving(true);

      // Create FormData and append smsMessages as JSON string
      const formData = new FormData();
      formData.append('smsMessages', JSON.stringify(smsMessages));

      const response = await partnershipAPI.update(id!, formData);

      if (response.data.data) {
        setProgramme(response.data.data.programme || response.data.data);
      }

      showToast.success('Messages updated successfully');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to update messages';
      showToast.error(errorMsg);
      console.error('Error saving messages:', error);
    } finally {
      setMessageSaving(false);
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
      console.log('Searching members and partners with query:', query);

      const response = await memberAPI.getMembers({
        search: query,
        limit: 10,
        status: 'active'
      });

      console.log('Member search response:', response);

      // Handle the response structure from memberAPI
      const members = response.data?.data?.members || response.data?.data || [];

      console.log('Members found:', members);

      // Search existing partners in this programme
      const matchingPartners = partners.filter(p => {
        const partnerName = `${p.partner.firstName} ${p.partner.lastName}`;
        return partnerName.toLowerCase().includes(query.toLowerCase()) ||
          p.partner.phone.includes(query);
      });

      console.log('Partners found:', matchingPartners);

      // Combine members (with type: 'member') and partners (with type: 'partner')
      const combined = [
        ...(Array.isArray(members) ? members.map(m => ({ ...m, type: 'member' })) : []),
        ...matchingPartners.map(p => ({ ...p, type: 'partner' }))
      ];

      console.log('Combined search results:', combined);

      setMemberSearchResults(combined);
    } catch (error: any) {
      console.error('Error searching members and partners:', error);
      setMemberSearchResults([]);
    } finally {
      setSearchingMembers(false);
    }
  };

  const searchPartnerMembers = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setPartnerMemberSearchResults([]);
      return;
    }

    try {
      setSearchingPartnerMembers(true);

      const response = await memberAPI.getMembers({
        search: query,
        limit: 10,
        status: 'active'
      });

      const members = response.data?.data?.members || response.data?.data || [];
      const filteredMembers = Array.isArray(members) ? members : [];

      setPartnerMemberSearchResults(filteredMembers);
    } catch (error: any) {
      console.error('Error searching partner members:', error);
      setPartnerMemberSearchResults([]);
    } finally {
      setSearchingPartnerMembers(false);
    }
  };

  // Handle member selection from search results
  const handleSelectMember = (item: any) => {
    // Check if it's a partner or a member
    if (item.type === 'partner') {
      // It's an existing partner from PartnershipRegistration
      setSelectedPartnerForTransaction(item);
      setSelectedMember(null);
      // Use the partner registration ID
      setAddTransactionData(prev => ({
        ...prev,
        registrationId: item._id,
      }));
      showToast.success(`Partner ${item.partner.firstName} ${item.partner.lastName} selected`);
    } else {
      // It's a member (not yet a partner)
      setSelectedMember(item);
      setSelectedPartnerForTransaction(null);
      // Don't set registrationId - backend will auto-register using memberId/phone
      setAddTransactionData(prev => ({
        ...prev,
        registrationId: '', // Clear registrationId so backend uses memberId/phone
      }));
      showToast.success(`${item.firstName} ${item.lastName} selected`);
    }
    // Close the dropdown and clear search results
    setShowMemberSearchResults(false);
    setMemberSearchResults([]);
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

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      setIsSubmitting(true);
      await partnershipAPI.deleteTransaction(id!, transactionId);
      showToast.success('Transaction deleted successfully');
      setShowDeleteConfirm(null);
      await loadTransactions();
      await loadProgrammeDetails();
    } catch (error: any) {
      showToast.error('Failed to delete transaction');
      console.error(error);
    } finally {
      setIsSubmitting(false);
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

  const handleExportPartners = async () => {
    try {
      setIsExportingPartners(true);
      const response = await partnershipAPI.exportPartners(id!);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `partnership_partners_${id}_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast.success('Partners exported successfully');
    } catch (error: any) {
      showToast.error('Failed to export partners');
    } finally {
      setIsExportingPartners(false);
    }
  };

  const handleGenerateQR = async (type: 'registration' | 'payment') => {
    try {
      setQrModal({
        isOpen: true,
        type,
        data: null,
        loading: true,
      });

      const link = type === 'registration' ? publicRegistrationLink : publicPaymentLink;
      const title = type === 'registration' ? 'Public Registration Link' : 'Public Payment Link';

      // Call backend to generate QR code
      const response = await partnershipAPI.generateQRCode(id!, type, {
        registrationLink: publicRegistrationLink,
        paymentLink: publicPaymentLink,
      });

      if (response.data.success) {
        setQrModal({
          isOpen: true,
          type,
          data: {
            title,
            qrImage: response.data.data.qrCodeDataUrl, // Base64 image
            link,
          },
          loading: false,
        });
        showToast.success('QR code generated successfully!');
      } else {
        showToast.error('Failed to generate QR code');
        setQrModal({ isOpen: false, type: null, data: null, loading: false });
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to generate QR code');
      setQrModal({ isOpen: false, type: null, data: null, loading: false });
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

  // Pagination for partners
  const paginatedPartners = filteredPartners.slice(
    (partnersCurrentPage - 1) * partnersPerPage,
    partnersCurrentPage * partnersPerPage
  );
  const partnersTotalPages = Math.ceil(filteredPartners.length / partnersPerPage);

  // Transactions are already filtered on backend, no need for client-side filtering

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
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
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
            <div className='flex gap-2 items-center'>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{programme.name}</h1>
              <span className={`capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(programme.status)}`}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Public Registration Link */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:space-x-3">
              <div className="flex-shrink-0 mt-0 sm:mt-1">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Link2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Public Registration Link
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Share this link for people to register as partners in this programme
                </p>
                <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 mt-4">
                  <div className="flex-1 flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 min-w-0">
                    <input
                      type="text"
                      value={publicRegistrationLink}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none truncate"
                    />
                  </div>
                  <div className="flex gap-2 w-full lg:w-auto lg:flex-shrink-0">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(publicRegistrationLink);
                        showToast.success('Link copied to clipboard!');
                      }}
                      className="flex-1 lg:flex-none px-3 lg:px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="hidden lg:inline">Copy</span>
                    </button>
                    <button
                      onClick={() => handleGenerateQR('registration')}
                      disabled={qrModal.loading}
                      className="flex-1 lg:flex-none px-3 lg:px-4 py-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {qrModal.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4" />
                      )}
                      <span className="hidden lg:inline">{qrModal.loading ? 'Generating...' : 'Generate QR'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Public Payment Link */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:space-x-3">
              <div className="flex-shrink-0 mt-0 sm:mt-1">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Public Payment Link
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Share this link for people to make partnership contributions
                </p>
                <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 mt-4">
                  <div className="flex-1 flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 min-w-0">
                    <input
                      type="text"
                      value={publicPaymentLink}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none truncate"
                    />
                  </div>
                  <div className="flex gap-2 w-full lg:w-auto lg:flex-shrink-0">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(publicPaymentLink);
                        showToast.success('Link copied to clipboard!');
                      }}
                      className="flex-1 lg:flex-none px-3 lg:px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="hidden lg:inline">Copy</span>
                    </button>
                    <button
                      onClick={() => handleGenerateQR('payment')}
                      disabled={qrModal.loading}
                      className="flex-1 lg:flex-none px-3 lg:px-4 py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {qrModal.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4" />
                      )}
                      <span className="hidden lg:inline">{qrModal.loading ? 'Generating...' : 'Generate QR'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-min">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${activeTab === 'overview'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            className={`${activeTab === 'partners'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Partners ({programme.stats.totalPartners})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`${activeTab === 'transactions'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Transactions ({programme.stats.totalTransactions})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`${activeTab === 'messages'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Messages
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

          {/* Tier Totals Breakdown */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-all">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tier Totals Breakdown</h3>
            <div className="overflow-x-auto">
              <div className="flex gap-4 min-w-min">
                {loadingTierBreakdown ? (
                  <div className="flex items-center justify-center w-full py-8">
                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                  </div>
                ) : tierBreakdown.length > 0 ? (
                  tierBreakdown.map((tier) => (
                    <div
                      key={tier._id}
                      className="flex-1 border rounded-lg p-4 transition-all hover:shadow-md"
                      style={{
                        borderColor: tier.badgeColor || '#9333EA',
                        backgroundColor: `${tier.badgeColor || '#9333EA'}08`
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: tier.badgeColor || '#9333EA' }}
                          />
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{tier.name}</h4>
                        </div>
                      </div>
                      <div className="gap-4">
                        <div className="flex flex-row justify-between min-w-max">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Total Raised</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(tier.totalRaised, tier.currency)}
                          </p>
                        </div>
                        <div className="flex flex-row justify-between min-w-max">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Partners</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tier.partnerCount}</p>
                        </div>
                        <div className="flex flex-row justify-between min-w-max">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Transactions</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tier.transactionCount}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No tier data available</p>
                )}
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
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search partners..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <select
                  value={partnerTypeFilter}
                  onChange={(e) => setPartnerTypeFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="member">Members</option>
                  <option value="guest">Guests</option>
                </select>
                <button
                  onClick={handleExportPartners}
                  disabled={isExportingPartners || partners.length === 0}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExportingPartners ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowAddPartnerModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Partner</span>
                </button>
              </div>
            </div>
          </div>

          {/* Partners Table */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
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
                  paginatedPartners.map((partner) => {
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
                          <span className={`inline-flex px-2 py-1 text-xs capitalize font-semibold rounded-full ${partner.partnerType === 'member'
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditPartner(partner)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                              title="Edit partner"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(partner._id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              title="Delete partner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredPartners.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg px-6 py-4 flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((partnersCurrentPage - 1) * partnersPerPage) + 1} to{' '}
                {Math.min(partnersCurrentPage * partnersPerPage, filteredPartners.length)} of{' '}
                {filteredPartners.length} partners
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPartnersCurrentPage(p => Math.max(1, p - 1))}
                  disabled={partnersCurrentPage === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPartnersCurrentPage(p => Math.min(partnersTotalPages, p + 1))}
                  disabled={partnersCurrentPage === partnersTotalPages}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, email, or reference..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <select
                  value={transactionStatusFilter}
                  onChange={(e) => setTransactionStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center flex-wrap gap-3">

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto ml-auto">
              <button
                onClick={() => setShowAddTransactionModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </button>
              <button
                onClick={handleExportTransactions}
                disabled={isExporting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export to Excel'}
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 ">
                <tr className='dark:text-white'>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ref / Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loadingTransactions ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Updating transactions...</p>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16">
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
                  transactions.map((transaction: any) => {
                    // Extract partner details from nested structure
                    const isGuest = transaction.registration?.partnerType === 'guest';
                    const partnerData = isGuest 
                      ? transaction.registration?.partner 
                      : transaction.registration?.member;
                    
                    const payerName = partnerData 
                      ? `${partnerData.firstName} ${partnerData.lastName}` 
                      : (transaction.payerName || 'Unknown');
                    const payerEmail = partnerData?.email || transaction.payerEmail;
                    const payerPhone = partnerData?.phone || transaction.payerPhone;
                    
                    return (
                      <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-medium dark:text-white px-2 py-1 rounded">
                            {transaction.paymentReference || transaction.transactionCode || transaction._id?.substring(0, 8)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {transaction.paymentMethod?.toUpperCase()}
                          </div>
                          {transaction.registration?.partnerType && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {transaction.registration.partnerType === 'member' ? 'Member' : 'Guest'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{payerName}</div>
                          {transaction.memberId && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">ID: {transaction.memberId}</div>
                          )}
                          {(transaction.registration?.tier || transaction.tier) && (
                            <div className="text-xs text-purple-600 dark:text-purple-400">
                              {typeof (transaction.registration?.tier || transaction.tier) === 'object' 
                                ? (transaction.registration?.tier?.name || transaction.tier?.name)
                                : (transaction.registration?.tier || transaction.tier)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {payerEmail && <div>{payerEmail}</div>}
                            {payerPhone && <div>{payerPhone}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </td>
                        <td className="capitalize px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {transaction.paymentMethod?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                            {transaction.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(transaction.transactionDate), 'HH:mm')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setShowDeleteConfirm(transaction._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Delete transaction"
                            disabled={isSubmitting}
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

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">SMS Messages Configuration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure custom SMS messages for welcome and thank you notifications. If not configured, default messages will be used.
            </p>
          </div>

          {/* Available Variables Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">Available Variables</h4>
              <p className="text-xs text-blue-800 dark:text-blue-300 mb-4">
                Use these placeholders in your messages and they will be automatically replaced with actual values:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="bg-white dark:bg-gray-800 rounded px-3 py-2 border border-blue-100 dark:border-blue-900">
                  <code className="text-xs font-mono text-blue-700 dark:text-blue-300">[name]</code>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Partner/recipient name</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded px-3 py-2 border border-blue-100 dark:border-blue-900">
                  <code className="text-xs font-mono text-blue-700 dark:text-blue-300">[amount]</code>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Transaction amount (thank you only)</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded px-3 py-2 border border-blue-100 dark:border-blue-900">
                  <code className="text-xs font-mono text-blue-700 dark:text-blue-300">[currency]</code>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Currency code (GHS, USD, etc)</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-white dark:bg-gray-800 rounded px-3 py-2 border border-blue-100 dark:border-blue-900">
                  <code className="text-xs font-mono text-blue-700 dark:text-blue-300">[programme]</code>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Programme/partnership name</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded px-3 py-2 border border-blue-100 dark:border-blue-900">
                  <code className="text-xs font-mono text-blue-700 dark:text-blue-300">[church]</code>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Church/merchant name</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded px-3 py-2 border border-blue-100 dark:border-blue-900">
                  <code className="text-xs font-mono text-blue-700 dark:text-blue-300">[tier]</code>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Tier name (public payments only)</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
              <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">Default Messages</h5>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">Welcome (when partner registers):</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 rounded px-3 py-2 italic">
                    "Welcome to [programme] partnership programme at [church]! Thank you for joining us. We're excited to have you as a partner."
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">Thank You (after payment):</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 rounded px-3 py-2 italic">
                    "Thank you for your partnership contribution of [currency] [amount]. Your support to [church]'s [programme] is greatly appreciated."
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Welcome Message */}
            <div>
              <label htmlFor="welcomeMessage" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Welcome Message
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Sent when a partner registers for the programme
              </p>
              <textarea
                id="welcomeMessage"
                value={smsMessages.welcomeMessage}
                onChange={(e) => setSmsMessages(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                placeholder="Leave empty to use default message. Example: Hello [name], welcome to [programme] at [church]!"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {smsMessages.welcomeMessage.length} characters (SMS limit: 160-1000)
              </p>
            </div>

            {/* Thank You Message */}
            <div>
              <label htmlFor="thankYouMessage" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Thank You Message
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Sent after a partner makes a payment or contribution
              </p>
              <textarea
                id="thankYouMessage"
                value={smsMessages.thankYouMessage}
                onChange={(e) => setSmsMessages(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                placeholder="Leave empty to use default message. Example: Thank you [name] for contributing [currency][amount] to [programme]!"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {smsMessages.thankYouMessage.length} characters (SMS limit: 160-1000)
              </p>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSaveMessages}
                disabled={messageSaving}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {messageSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    Save Messages
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Partner Modal */}
      <EditPartnerModal
        isOpen={showEditPartnerModal}
        partner={selectedPartnerForEdit}
        programmeId={id || ''}
        tiers={programme?.tiers || []}
        onClose={() => {
          setShowEditPartnerModal(false);
          setSelectedPartnerForEdit(null);
        }}
        onSuccess={() => {
          loadPartners();
          loadProgrammeDetails();
        }}
      />

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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Partner</h3>
              <button
                onClick={() => {
                  setShowAddPartnerModal(false);
                  setPartnerTab('member');
                  setSelectedPartnerMember(null);
                  setPartnerMemberSearchQuery('');
                  setPartnerGuestData({
                    firstName: '',
                    lastName: '',
                    phone: '',
                    email: '',
                  });
                  setAddPartnerData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    tierId: programme?.tiers[0]?._id || '',
                  });
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setPartnerTab('member')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${partnerTab === 'member'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
              >
                Member
              </button>
              <button
                onClick={() => setPartnerTab('guest')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${partnerTab === 'guest'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
              >
                Guest
              </button>
            </div>

            <form onSubmit={handleAddPartner} className="space-y-4">
              {/* Member Tab */}
              {partnerTab === 'member' && (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search member or partner by name or phone..."
                      value={partnerMemberSearchQuery}
                      onChange={(e) => setPartnerMemberSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                    />
                    {searchingPartnerMembers && (
                      <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-gray-400" />
                    )}
                  </div>

                  {showPartnerMemberSearchResults && partnerMemberSearchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                      {partnerMemberSearchResults.map((member) => (
                        <button
                          key={member._id}
                          type="button"
                          onClick={() => {
                            setSelectedPartnerMember(member);
                            setShowPartnerMemberSearchResults(false);
                            setPartnerMemberSearchQuery('');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-200 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors"
                        >
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedPartnerMember && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Selected: {selectedPartnerMember.firstName} {selectedPartnerMember.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPartnerMember.phone}</p>
                    </div>
                  )}

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
                </>
              )}

              {/* Guest Tab */}
              {partnerTab === 'guest' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={partnerGuestData.firstName}
                      onChange={(e) => setPartnerGuestData({ ...partnerGuestData, firstName: e.target.value })}
                      required
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={partnerGuestData.lastName}
                      onChange={(e) => setPartnerGuestData({ ...partnerGuestData, lastName: e.target.value })}
                      required
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <input
                    type="tel"
                    placeholder="Phone"
                    value={partnerGuestData.phone}
                    onChange={(e) => setPartnerGuestData({ ...partnerGuestData, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={partnerGuestData.email}
                    onChange={(e) => setPartnerGuestData({ ...partnerGuestData, email: e.target.value })}
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
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPartnerModal(false);
                    setPartnerTab('member');
                    setSelectedPartnerMember(null);
                    setPartnerMemberSearchQuery('');
                    setPartnerGuestData({
                      firstName: '',
                      lastName: '',
                      phone: '',
                      email: '',
                    });
                    setAddPartnerData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      tierId: programme?.tiers[0]?._id || '',
                    });
                  }}
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
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${transactionTab === 'member'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
              >
                Member/Partner
              </button>
              <button
                onClick={() => setTransactionTab('guest')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${transactionTab === 'guest'
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
                      Search Member or Partner
                    </label>

                    {selectedMember || selectedPartnerForTransaction ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          {selectedMember ? (
                            <>
                              <p className="font-medium text-blue-900 dark:text-blue-200">
                                {selectedMember.firstName} {selectedMember.lastName}
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {selectedMember.phone}
                              </p>
                            </>
                          ) : selectedPartnerForTransaction ? (
                            <>
                              <p className="font-medium text-blue-900 dark:text-blue-200">
                                {selectedPartnerForTransaction.partner.firstName} {selectedPartnerForTransaction.partner.lastName}
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {selectedPartnerForTransaction.partner.phone}
                              </p>
                              {selectedPartnerForTransaction.tier?.name && (
                                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                  {selectedPartnerForTransaction.tier.name}
                                </p>
                              )}
                            </>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMember(null);
                            setSelectedPartnerForTransaction(null);
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

                        {/* Member/Partner Search Results Dropdown */}
                        {showMemberSearchResults && memberSearchQuery.length >= 2 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                            {memberSearchResults.length > 0 ? (
                              <ul className="max-h-48 overflow-y-auto">
                                {memberSearchResults.map((item: any) => (
                                  <li key={item._id}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleSelectMember(item);
                                        setShowMemberSearchResults(false);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-sm"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {item.type === 'partner'
                                              ? `${item.partner.firstName} ${item.partner.lastName}`
                                              : `${item.firstName} ${item.lastName}`
                                            }
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {item.type === 'partner'
                                              ? item.partner.phone
                                              : item.phone
                                            }
                                            {item.type === 'partner' && item.tier?.name && ` • Tier: ${item.tier.name}`}
                                          </div>
                                        </div>
                                        <span className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded">
                                          {item.type === 'partner' ? 'Partner' : 'Member'}
                                        </span>
                                      </div>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                No members or partners found
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
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
                  disabled={isSubmitting || (transactionTab === 'member' ? !selectedMember && !selectedPartnerForTransaction : !guestData.fullName || !guestData.phone) || !addTransactionData.amount}
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

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ isOpen: false, type: null, data: null, loading: false })}
        qrCodeData={qrModal.data}
        isLoading={qrModal.loading}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center mb-2">
                Delete Item?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                This action cannot be undone. This will permanently delete the item and all associated data.
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
                  onClick={() => {
                    // Check if it's a transaction or partner delete
                    const isTransaction = transactions.some(t => t._id === showDeleteConfirm);
                    const isPartner = partners.some(p => p._id === showDeleteConfirm);

                    if (isTransaction) {
                      handleDeleteTransaction(showDeleteConfirm);
                    } else if (isPartner) {
                      handleDeletePartner(showDeleteConfirm);
                    }
                  }}
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
        </div>
      )}
    </div>
  );
};

export default PartnershipDetails;
