import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, Download, Upload, Users, Link2, Copy, ExternalLink, Share2, MessageCircle, Mail, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { memberAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import DeleteMemberModal from '../../../components/member/DeleteMemberModal';
import FeatureGate from '../../../components/access/FeatureGate';
import ImportMembersModal from '../../../components/modals/ImportMembersModal';
import { useResourceLimit } from '../../../hooks/useResourceLimit';
import LimitReachedModal from '../../../components/modals/LimitReachedModal';
import RegistrationSettingsPanel from '../../../components/modals/RegistrationSettingsPanel';
import { useAuth } from '../../../context/AuthContext';

const AllMembers = () => {
  const { user } = useAuth();
  const plan = user?.merchant?.subscription?.plan;
  const merchantId = user?.merchant?.id;
  const merchantName = user?.merchant?.name || 'Church'; // ⭐ NEW: Get church name
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    visitors: 0,
    male: 0,
    female: 0,
    leaders: { pastors: 0, elders: 0, deacons: 0, leaders: 0, total: 0},
    members: 0,
    firstTimers: 0, 
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    gender: '',
    membershipType: '',
    branch: '',
    registrationType: '',
  });

  // Resource Limits
  const [showLimitModal, setShowLimitModal] = useState(false);
  const memberLimit = useResourceLimit('members');

  const frontendUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
  const registrationLink = `${frontendUrl}/register/${merchantId}`;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const branchId = params.get('branchId');
    if (branchId) {
      setFilters(f => ({ ...f, branch: branchId }));
    }
  }, [location.search]);

  useEffect(() => {
    fetchMembers();
    fetchStats();
  }, [currentPage, searchQuery, activeTab, filters]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
        search: searchQuery,
      };

      if (activeTab !== 'all') {
        if (activeTab === 'first-timer') {
          params.registrationType = 'first-timer';
        } else {
          params.membershipType = activeTab;
        }
      }

      if (filters.status) params.status = filters.status;
      if (filters.gender) params.gender = filters.gender;
      if (filters.branch) params.branch = filters.branch;
      
      if (filters.membershipType && activeTab === 'all') {
        params.membershipType = filters.membershipType;
      }
      if (filters.registrationType && activeTab === 'all') {
        params.registrationType = filters.registrationType;
      }

      const response = await memberAPI.getMembers(params);
      setMembers(response.data.data.members);
      setTotalPages(response.data.data.pagination.totalPages);
      setTotalMembers(response.data.data.pagination.totalItems);
    } catch (error: any) {
      showToast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await memberAPI.getStats();
      const data = response.data.data?.stats;

      const statusMap = data.byStatus.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {});
      
      const genderMap = data.byGender.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      setStats({
        total: data.total,
        active: statusMap.active || 0,
        inactive: statusMap.inactive || 0,
        visitors: statusMap.visitor || 0,
        male: genderMap.male || 0,
        female: genderMap.female || 0,
        leaders: data?.leaders,
        members: data?.regularMembers || 0,
        firstTimers: statusMap.first_timer || 0, 
      });
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleAddMemberClick = () => {
    if (!memberLimit.canCreate) {
      setShowLimitModal(true);
      return;
    }
    navigate('/members/new');
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await memberAPI.exportMembers();
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `members_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToast.success('Members exported successfully!');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to export members');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportComplete = () => {
    fetchMembers();
    fetchStats();
  };

  const handleDelete = (member: any) => {
    setSelectedMember({
      id: member._id,
      name: member.fullName || `${member.firstName} ${member.lastName}`
    });
    setShowDeleteModal(true);
  };

  const handleSuccess = async() => {
    await memberAPI.deleteMember(selectedMember.id);
    showToast.success('Member deleted successfully');
    setShowDeleteModal(false);
    setSelectedMember(null);
    fetchMembers();
    fetchStats();
  };

  const copyRegistrationLink = () => {
    navigator.clipboard.writeText(registrationLink);
    showToast.success('Registration link copied to clipboard!');
  };

  // ⭐ NEW: Share via WhatsApp
  const shareViaWhatsApp = () => {
    const message = `Join ${merchantName}! Register here: ${registrationLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // ⭐ NEW: Share via SMS
  const shareViaSMS = () => {
    const message = `Join ${merchantName}! Register here: ${registrationLink}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  // ⭐ NEW: Share via Email
  const shareViaEmail = () => {
    const subject = `Join ${merchantName}`;
    const body = `You're invited to register as a member of ${merchantName}!\n\nClick here to register: ${registrationLink}\n\nYou can choose to register as a member or mark yourself as a first-time visitor.`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  // ⭐ NEW: Native Share API (for mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${merchantName}`,
          text: `Register as a member of ${merchantName}`,
          url: registrationLink,
        });
        showToast.success('Link shared successfully!');
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // Fallback: just copy to clipboard
      copyRegistrationLink();
    }
  };

  const tabs = [
    { id: 'all', label: 'All', count: stats?.total },
    { id: 'leader', label: 'Leaders', count: stats?.leaders?.leaders || 0 },
    { id: 'pastor', label: 'Pastors', count: stats?.leaders?.pastors || 0 },
    { id: 'member', label: 'Members', count: stats?.members || 0 },
    { id: 'first-timer', label: 'First Timers', count: stats?.firstTimers || 0 },
  ];

  const handleTabClick = (tab: any) => {
    setActiveTab(tab.id);
    setCurrentPage(1);
    
    setFilters(prev => ({
      ...prev,
      registrationType: '',
      membershipType: ''
    }));
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: any = {
      pastor: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
      leader: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      elder: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
      deacon: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300',
      member: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      youth: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      children: 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300',
      visitor: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    };
    return colors[role] || colors.member;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: any = {
      active: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      visitor: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      first_timer: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
      new_convert: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
      transferred: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    };
    return colors[status] || colors.active;
  };

  return (
    <FeatureGate feature={'memberManagement'}>
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Member Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your church members and their information
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || members.length === 0}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>

          {/* Import Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </button>

          {/* Add Member Button */}
          <button
            onClick={handleAddMemberClick}
            disabled={!memberLimit.canCreate}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              memberLimit.canCreate
                ? 'text-white bg-primary-600 hover:bg-primary-700'
                : 'text-gray-400 bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            }`}
            title={!memberLimit.canCreate ? `Member limit reached (${memberLimit.current}/${memberLimit.limit})` : ''}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Member
            {memberLimit.isNearLimit && memberLimit.canCreate && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                {memberLimit.remaining} left
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Public Registration Link Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Public Registration Link
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Share this link for members to self-register
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Settings Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center space-x-2"
              title="Registration Settings"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
            
            {/* Get Link Button */}
            <button
              onClick={() => setShowLinkModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Get Link
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Male</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.male}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Female</p>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 mt-1">{stats.female}</p>
            </div>
            <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
              <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Tabs and Search */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 text-xs">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No members found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {members.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {member.fullName || `${member.firstName} ${member.lastName}`}
                            </div>
                            {member.registrationType && member.registrationType !== 'admin-added' && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {member.registrationType === 'member' ? '📝 Self-registered' : '👋 First Timer'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{member.email || 'N/A'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{member.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {member.branch?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.membershipType)}`}>
                          {member.membershipType?.charAt(0).toUpperCase() + member.membershipType?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(member.membershipStatus)}`}>
                          {member.membershipStatus?.charAt(0).toUpperCase() + member.membershipStatus?.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/members/${member._id}`)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/members/${member._id}/edit`)}
                            className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalMembers)} of {totalMembers} members
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ⭐ UPDATED: Registration Link Modal with Share Options */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Share Registration Link
              </h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Share this link with members so they can register themselves. They can choose between member registration or first-timer forms.
            </p>

            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
              <code className="text-sm text-gray-800 dark:text-gray-200 break-all">
                {registrationLink}
              </code>
            </div>

            {/* ⭐ NEW: Action Buttons Grid */}
            <div className="space-y-3">
              {/* Copy and Open buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyRegistrationLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Link</span>
                </button>
                
                <button
                  onClick={() => window.open(registrationLink, '_blank')}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open</span>
                </button>
              </div>

              {/* Share options divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Share via
                  </span>
                </div>
              </div>

              {/* ⭐ NEW: Share via buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <button
                  onClick={shareViaWhatsApp}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>

                {/* SMS */}
                <button
                  onClick={shareViaSMS}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>SMS</span>
                </button>

                {/* Email */}
                <button
                  onClick={shareViaEmail}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </button>

                {/* Native Share (if supported) */}
                <button
                  onClick={handleNativeShare}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>More</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <DeleteMemberModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedMember(null);
        }}
        onDelete={handleSuccess}
        memberName={selectedMember?.name}
      />

      <ImportMembersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />

      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        resourceType="members"
        planName={plan}
        current={memberLimit.current}
        limit={memberLimit.limit || 0}
      />

      {/* Registration Settings Modal */}
      <RegistrationSettingsPanel
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
    </FeatureGate>
  );
};

export default AllMembers;