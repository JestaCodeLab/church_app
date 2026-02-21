import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Crown,
  TrendingUp,
  CheckCircle,
  Ban,
  Settings,
  Loader,
  Church,
  UserCheck,
  TrendingDown,
  Activity,
  Target,
  Zap,
  AlertCircle,
  Plus,
  UserPlus
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmModal from '../../components/modals/ConfirmModal';
import AdminAddMemberModal from '../../components/admin/AdminAddMemberModal';
import AddBranchModal from '../../components/admin/AddBranchModal';

const MerchantDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMerchantDetails();
    }
  }, [id]);

  const fetchMerchantDetails = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getMerchant(id);
      setData(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load merchant details');
      navigate('/admin/churches');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
  if (newStatus === 'active') {
    setShowActivateModal(true);
  } else {
    setShowSuspendModal(true);
  }
};

const confirmActivate = async () => {
  try {
    setActionLoading(true);
    await adminAPI.updateMerchantStatus(id, 'active');
    toast.success('Merchant activated successfully');
    setShowActivateModal(false);
    await fetchMerchantDetails();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to activate merchant');
  } finally {
    setActionLoading(false);
  }
};

const confirmSuspend = async () => {
  try {
    setActionLoading(true);
    await adminAPI.updateMerchantStatus(id, 'suspended');
    toast.success('Merchant suspended successfully');
    setShowSuspendModal(false);
    await fetchMerchantDetails();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to suspend merchant');
  } finally {
    setActionLoading(false);
  }
};

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatGrowthData = () => {
    if (!data?.memberGrowth) return [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return data.memberGrowth.map((item: any) => ({
      name: `${monthNames[item._id.month - 1]}`,
      members: item.count
    }));
  };

  const formatRoleData = () => {
    if (!data?.roleDistribution) return [];
    const roleNames: any = {
      church_admin: 'Church Admin',
      pastor: 'Pastor',
      leader: 'Leader',
      member: 'Member'
    };
    return data.roleDistribution.map((item: any) => ({
      name: roleNames[item._id] || item._id,
      count: item.count
    }));
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      pending_verification: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
      pending_onboarding: 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-blue-300',
      suspended: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
    };
    return colors[status] || colors.inactive;
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      active: 'Active',
      pending_verification: 'Pending Verification',
      pending_onboarding: 'Pending Onboarding',
      suspended: 'Suspended',
      inactive: 'Inactive',
    };
    return labels[status] || status;
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stats', label: 'Statistics' },
    { id: 'branches', label: 'Branches', count: data?.stats.totalBranches },
    { id: 'members', label: 'Members', count: data?.stats.totalMembers },
    { id: 'users', label: 'Users', count: data?.stats.totalUsers },
    { id: 'actions', label: 'Actions' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Merchant not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <button
            onClick={() => navigate('/admin/churches')}
            className="mt-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {data.merchant.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {data.merchant.subdomain}.The Church HQ.com
              </p>
              <div className="flex items-center space-x-3 mt-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(data.merchant.status)}`}>
                  {getStatusLabel(data.merchant.status)}
                </span>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-blue-300 capitalize">
                  {data.subscriptionInfo?.current?.plan || 'Free'} Plan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          {data.merchant.status !== 'active' && (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={actionLoading}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Activate
            </button>
          )}
          {data.merchant.status === 'active' && (
            <button
              onClick={() => handleStatusChange('suspended')}
              disabled={actionLoading}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Ban className="w-5 h-5 mr-2" />
              Suspend
            </button>
          )}
          <button
            onClick={() => navigate('/admin/features')}
            className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 mr-2" />
            Manage Features
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Church Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Church Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 truncate">
                      {data.merchant.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                      {data.merchant.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Joined</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                      {formatDate(data.merchant.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                      {data.merchant.location?.region || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Quick Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg text-center">
                  <Church className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.stats.totalBranches}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Branches</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg text-center">
                  <Users className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.stats.totalMembers}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Members</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg text-center">
                  <UserCheck className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.stats.totalUsers}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Users</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg text-center">
                  <Crown className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.stats.churchAdmins}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Admins</p>
                </div>
              </div>
            </div>

            {/* Monthly Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                This Month's Activity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {data.monthlyActivity.newMembers}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">New Members</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {data.monthlyActivity.newUsers}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">New Users</p>
                    </div>
                    <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {data.monthlyActivity.newBranches}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">New Branches</p>
                    </div>
                    <Church className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Stats Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-primary-200 dark:border-primary-800 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-700 dark:text-blue-300">Total Members</p>
                    <p className="text-3xl font-bold text-primary-900 dark:text-primary-100 mt-2">
                      {data.stats.totalMembers}
                    </p>
                  </div>
                  <Users className="w-10 h-10 text-blue-400 opacity-50" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl border border-green-200 dark:border-green-800 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Users</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                      {data.stats.totalUsers}
                    </p>
                  </div>
                  <UserCheck className="w-10 h-10 text-green-400 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-700 dark:text-primary-300">Branches</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-primary-100 mt-2">
                      {data.stats.totalBranches}
                    </p>
                  </div>
                  <Church className="w-10 h-10 text-purple-400 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Admins</p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-2">
                      {data.stats.churchAdmins}
                    </p>
                  </div>
                  <Crown className="w-10 h-10 text-orange-400 opacity-50" />
                </div>
              </div>
            </div>

            {/* Monthly Activity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</span>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300">New Members</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">+{data.monthlyActivity.newMembers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/10 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300">New Users</span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">+{data.monthlyActivity.newUsers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300">New Branches</span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">+{data.monthlyActivity.newBranches}</span>
                  </div>
                </div>
              </div>

              {/* Growth Indicators */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  Growth Rate
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Member Growth</span>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">+12.5%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">User Engagement</span>
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">+8.3%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Branch Expansion</span>
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">+5.2%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '52%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  Key Metrics
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Avg Members/Branch</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {data.stats.totalBranches > 0 ? Math.round(data.stats.totalMembers / data.stats.totalBranches) : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Avg Users/Admin</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {data.stats.churchAdmins > 0 ? Math.round(data.stats.totalUsers / data.stats.churchAdmins) : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Joined Date</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {formatDate(data.merchant.createdAt).split(',')[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Member Growth Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Member Growth (Last 6 Months)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatGrowthData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="members"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Role Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  User Role Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatRoleData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Branches Tab */}
        {activeTab === 'branches' && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-700 dark:text-primary-300">Total Branches</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-primary-100 mt-2">
                      {data.stats.totalBranches}
                    </p>
                  </div>
                  <Church className="w-10 h-10 text-purple-400 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl border border-green-200 dark:border-green-800 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Members</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                      {data.stats.totalMembers}
                    </p>
                  </div>
                  <Users className="w-10 h-10 text-green-400 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-primary-200 dark:border-primary-800 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-700 dark:text-blue-300">Avg per Branch</p>
                    <p className="text-3xl font-bold text-primary-900 dark:text-primary-100 mt-2">
                      {data.stats.totalBranches > 0 ? Math.round(data.stats.totalMembers / data.stats.totalBranches) : 0}
                    </p>
                  </div>
                  <Zap className="w-10 h-10 text-blue-400 opacity-50" />
                </div>
              </div>
            </div>

            {/* Branches Grid */}
            {data.branches && data.branches.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Branches
                  </h3>
                  <button
                    onClick={() => setShowAddBranchModal(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Branch
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {data.branches.map((branch: any, index: number) => (
                  <div
                    key={branch._id}
                    className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all hover:border-primary-300 dark:hover:border-primary-700"
                  >
                    {/* Header with gradient background */}
                    <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 p-5 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                              <Church className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                                {branch.name || 'Unnamed Branch'}
                              </h4>
                              {branch.isMainBranch && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-blue-300">
                                  <Zap className="w-3 h-3" />
                                  Main Branch
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 space-y-4">
                      {/* Member Count Stat */}
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Members</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {branch.memberCount || 0}
                        </div>
                      </div>

                      {/* Location Information */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Location</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {branch.location?.city || branch.location?.region ? (
                                <>{branch.location?.city && `${branch.location?.city}, `}{branch.location?.region || 'Not specified'}</>
                              ) : (
                                'Location not specified'
                              )}
                            </p>
                          </div>
                        </div>

                        {branch.location?.address && (
                          <div className="flex items-start gap-2 pl-6">
                            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {branch.location?.address}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Contact Info if available */}
                      {(branch.phone || branch.email) && (
                        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          {branch.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {branch.email}
                              </p>
                            </div>
                          )}
                          {branch.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {branch.phone}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer - Created Date */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Created {new Date(branch.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Church className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">No branches yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 mb-4">Branches will appear here when they are created</p>
                <button
                  onClick={() => setShowAddBranchModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Branch
                </button>
              </div>
            )}

            {/* List View Alternative */}
            {data.branches && data.branches.length > 4 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Members</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.branches.map((branch: any) => (
                        <tr key={branch._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Church className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{branch.name}</p>
                                {branch.isMainBranch && (
                                  <span className="text-xs text-primary-600 dark:text-primary-400">Main Branch</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {branch.location?.city && `${branch.location?.city}, `}{branch.location?.region}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{branch.memberCount || 0}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-gray-500 dark:text-gray-400">
                            {new Date(branch.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Members ({data.stats.totalMembers} total)
              </h3>
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </button>
            </div>
            {data.recentMembers && data.recentMembers.length > 0 ? (
              <div className="space-y-3">
                {data.recentMembers.map((member: any) => (
                  <div
                    key={member._id}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {member.firstName} {member.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {member.email}
                        </p>
                        {member.phone && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {member.phone}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                          {member.membershipStatus || 'Member'}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(member.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">No members yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Members will appear here when they are added</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Church Staff & Admins ({data.stats.totalUsers} total)
              </h3>
            </div>
            {data.users && data.users.length > 0 ? (
              <div className="space-y-3">
                {data.users.map((user: any) => (
                  <div
                    key={user._id}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {user.firstName} {user.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Joined: {formatDate(user.createdAt)}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <span className="block px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-blue-300 capitalize">
                          {user.role?.slug?.replace('_', ' ')}
                        </span>
                        <span className={`block px-3 py-1 text-xs font-medium rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                No users yet
              </p>
            )}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Merchant Management Actions
            </h3>

            <div className="space-y-6">
              {/* Status Actions */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Status Management
                </h4>
                <div className="space-y-3">
                  {data.merchant.status !== 'active' && (
                    <button
                      onClick={() => handleStatusChange('active')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 border border-green-200 dark:border-green-900/20"
                    >
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Activate Merchant
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Grant full access to the platform
                          </p>
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-green-600 rotate-180" />
                    </button>
                  )}

                  {data.merchant.status !== 'suspended' && (
                    <button
                      onClick={() => handleStatusChange('suspended')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 border border-red-200 dark:border-red-900/20"
                    >
                      <div className="flex items-center space-x-3">
                        <Ban className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Suspend Merchant
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Temporarily block access
                          </p>
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-red-600 rotate-180" />
                    </button>
                  )}
                </div>
              </div>

              {/* Feature Management */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Feature Management
                </h4>
                <button
                  onClick={() => navigate('/admin/features')}
                  className="w-full flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-primary-200 dark:border-blue-900/20"
                >
                  <div className="flex items-center space-x-3">
                    <Settings className="w-6 h-6 text-primary-600 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Manage Features
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Configure feature access for this merchant
                      </p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-primary-600 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

       {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showActivateModal}
        onClose={() => setShowActivateModal(false)}
        onConfirm={confirmActivate}
        title="Activate Merchant"
        message="This will grant full access to the platform for this church."
        confirmText="Activate Merchant"
        type="success"
        isLoading={actionLoading}
      />

      <ConfirmModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={confirmSuspend}
        title="Suspend Merchant"
        message="This will temporarily block access to the platform for this church. Members will not be able to login until the merchant is reactivated."
        confirmText="Suspend Merchant"
        type="danger"
        isLoading={actionLoading}
      />

      {/* Admin Modals */}
      {data && (
        <>
          <AdminAddMemberModal
            isOpen={showAddMemberModal}
            onClose={() => setShowAddMemberModal(false)}
            onSuccess={() => {
              setShowAddMemberModal(false);
              fetchMerchantDetails();
            }}
            merchantId={id!}
            merchantName={data.merchant.name}
          />

          <AddBranchModal
            isOpen={showAddBranchModal}
            onClose={() => setShowAddBranchModal(false)}
            onSuccess={() => {
              setShowAddBranchModal(false);
              fetchMerchantDetails();
            }}
            merchantId={id!}
            merchantName={data.merchant.name}
          />
        </>
      )}

    </div>
  );
};

export default MerchantDetail;