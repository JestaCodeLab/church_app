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
  UserCheck
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

const MerchantDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
const [showSuspendModal, setShowSuspendModal] = useState(false);

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
      navigate('/admin/merchants');
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
      pending_onboarding: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
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
            onClick={() => navigate('/admin/merchants')}
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
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 capitalize">
                  {data.subscriptionInfo.current.plan} Plan
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
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-center">
                  <Church className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
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
                  <UserCheck className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
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
                    <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
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
                    <Church className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Member Growth Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Member Growth (Last 6 Months)
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={formatGrowthData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
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
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Role Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                User Role Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatRoleData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
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
        )}

        {/* Branches Tab */}
        {activeTab === 'branches' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Church Branches ({data.stats.totalBranches})
              </h3>
            </div>
            {data.branches && data.branches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.branches.map((branch: any) => (
                  <div
                    key={branch._id}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {branch.name}
                          </h4>
                          {branch.isMainBranch && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                              Main
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {branch.location?.city}, {branch.location?.region}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Created: {formatDate(branch.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {branch.memberCount || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">members</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                No branches yet
              </p>
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
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                No members yet
              </p>
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
                        <span className="block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 capitalize">
                          {user.role.replace('_', ' ')}
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
                  className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-900/20"
                >
                  <div className="flex items-center space-x-3">
                    <Settings className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Manage Features
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Configure feature access for this merchant
                      </p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-blue-600 rotate-180" />
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
      
    </div>
  );
};

export default MerchantDetail;