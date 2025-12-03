import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Lock,
  Unlock,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Loader,
  Building2,
  Activity,
  Clock,
  Key,
  Trash2,
  Ban
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmModal from '../../components/ui/ConfirmModal';

const AdminUserDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
const [showUnlockModal, setShowUnlockModal] = useState(false);
const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [showStatusModal, setShowStatusModal] = useState(false);
const [selectedStatus, setSelectedStatus] = useState('');
const [lockReason, setLockReason] = useState('');

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUserById(id);
      setData(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load user details');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const confirmLockAccount = async () => {
  if (!lockReason.trim()) {
    toast.error('Please provide a reason for locking this account');
    return;
  }

  try {
    setActionLoading(true);
    await adminAPI.lockUser(id, { reason: lockReason });
    toast.success('Account locked successfully');
    setShowLockModal(false);
    setLockReason('');
    await fetchUserDetails();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to lock account');
  } finally {
    setActionLoading(false);
  }
};

  const confirmUnlockAccount = async () => {
  try {
    setActionLoading(true);
    await adminAPI.unlockUser(id);
    toast.success('Account unlocked successfully');
    setShowUnlockModal(false);
    await fetchUserDetails();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to unlock account');
  } finally {
    setActionLoading(false);
  }
};

const confirmStatusChange = async () => {
  const action = selectedStatus === 'active' ? 'activate' : selectedStatus === 'inactive' ? 'disable' : 'suspend';
  
  try {
    setActionLoading(true);
    await adminAPI.updateUserStatus(id, { status: selectedStatus });
    toast.success(`User ${action}d successfully`);
    setShowStatusModal(false);
    await fetchUserDetails();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to update status');
  } finally {
    setActionLoading(false);
  }
};

 const confirmResetPassword = async () => {
  try {
    setActionLoading(true);
    const response = await adminAPI.resetUserPassword(id);
    toast.success('Password reset successfully');
    
    if (response.data.data.tempPassword) {
      alert(`Temporary password: ${response.data.data.tempPassword}\n\nPlease share this with the user securely.`);
    }
    
    setShowResetPasswordModal(false);
    await fetchUserDetails();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to reset password');
  } finally {
    setActionLoading(false);
  }
};

  const confirmDeleteAccount = async () => {
  try {
    setActionLoading(true);
    await adminAPI.deleteUser(id);
    toast.success('User deleted successfully');
    navigate('/admin/users');
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to delete user');
    setActionLoading(false);
  }
};

  const formatDate = (date: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    const badges: any = {
      super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' },
      church_admin: { label: 'Church Admin', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' },
      pastor: { label: 'Pastor', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' },
      leader: { label: 'Leader', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300' },
      member: { label: 'Member', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300' },
    };
    return badges[role] || badges.member;
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
      suspended: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    };
    return colors[status] || colors.active;
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' },
    { id: 'security', label: 'Security' },
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
        <p className="text-gray-600 dark:text-gray-400">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="mt-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {data.user.firstName} {data.user.lastName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {data.user.email}
              </p>
              <div className="flex items-center space-x-3 mt-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleBadge(data.user.role).color}`}>
                  {getRoleBadge(data.user.role).label}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(data.user.status)}`}>
                  {data.user.status.charAt(0).toUpperCase() + data.user.status.slice(1)}
                </span>
                {data.user.accountLocked && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 flex items-center">
                    <Lock className="w-4 h-4 mr-1" />
                    Locked
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          {data.user.accountLocked ? (
            <>
              <button
                onClick={() => setShowUnlockModal(true)}
                disabled={actionLoading}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Unlock className="w-5 h-5 mr-2" />
                Unlock
              </button>
              {showUnlockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Unlock Account
                    </h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                      Are you sure you want to unlock this account? The user will regain access to the platform.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setShowUnlockModal(false)}
                        className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={()=>setShowUnlockModal(true)}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                        disabled={actionLoading}
                      >
                        Confirm Unlock
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setShowLockModal(true)}
              disabled={actionLoading}
              className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Lock className="w-5 h-5 mr-2" />
              Lock
            </button>
          )}
        </div>
      </div>

      {/* Account Locked Warning */}
      {data.user.accountLocked && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-300">
                Account Locked
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {data.user.accountLockedReason || 'No reason provided'}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Locked on: {formatDate(data.user.accountLockedAt)}
              </p>
            </div>
          </div>
        </div>
      )}

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
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* User Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                User Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 truncate">
                      {data.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                      {data.user.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Church</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                      {data.user.merchant?.name || 'No church'}
                    </p>
                    {data.user.merchant?.subdomain && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {data.user.merchant.subdomain}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Joined</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                      {formatDate(data.user.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Account Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-center">
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.stats.loginCount}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Logins</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg text-center">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.stats.accountAge}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Days Old</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg text-center">
                  <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(data.stats.lastLogin)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Last Login</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg text-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.stats.failedLoginAttempts}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Failed Attempts</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Login History
            </h3>
            {data.loginHistory && data.loginHistory.length > 0 ? (
              <div className="space-y-3">
                {data.loginHistory.map((login: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Login #{data.loginHistory.length - index}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formatDate(login.timestamp)}
                        </p>
                        {login.ipAddress && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            IP: {login.ipAddress}
                          </p>
                        )}
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                No login history available
              </p>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Security Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className={`w-5 h-5 ${data.user.accountLocked ? 'text-red-600' : 'text-green-600'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Account Lock Status
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {data.user.accountLocked ? 'Account is currently locked' : 'Account is unlocked'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    data.user.accountLocked
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                  }`}>
                    {data.user.accountLocked ? 'Locked' : 'Active'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Password Status
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {data.user.mustChangePassword ? 'Must change on next login' : 'Password is current'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    data.user.mustChangePassword
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                  }`}>
                    {data.user.mustChangePassword ? 'Reset Required' : 'OK'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Failed Login Attempts
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Number of recent failed login attempts
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {data.stats.failedLoginAttempts}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              User Management Actions
            </h3>

            <div className="space-y-6">
              {/* Account Lock/Unlock */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Account Access
                </h4>
                <div className="space-y-3">
                  {data.user.accountLocked ? (
                    <>
                      <button
                        onClick={() => setShowUnlockModal(true)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 border border-green-200 dark:border-green-900/20"
                      >
                        <div className="flex items-center space-x-3">
                          <Unlock className="w-6 h-6 text-green-600 flex-shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Unlock Account
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Restore user access to the platform
                            </p>
                          </div>
                        </div>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={()=> setShowLockModal(true)}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 border border-orange-200 dark:border-orange-900/20"
                    >
                      <div className="flex items-center space-x-3">
                        <Lock className="w-6 h-6 text-orange-600 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Lock Account
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Temporarily prevent user from logging in
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Management */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Status Management
                </h4>
                <div className="space-y-3">
                  {data.user.status !== 'active' && (
                    <button
                      onClick={() => {
                        setSelectedStatus('active');
                        setShowStatusModal(true);
                      }}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 border border-green-200 dark:border-green-900/20"
                    >
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Activate Account
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Set account status to active
                          </p>
                        </div>
                      </div>
                    </button>
                  )}

                  {data.user.status !== 'suspended' && (
                    <button
                      onClick={() => {
                        setSelectedStatus('suspended');
                        setShowStatusModal(true);
                      }}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 border border-red-200 dark:border-red-900/20"
                    >
                      <div className="flex items-center space-x-3">
                        <Ban className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Suspend Account
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Suspend user account
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                  
                  {data.user.status !== 'inactive' && (
                    <button
                      onClick={() => {
                        setSelectedStatus('inactive');
                        setShowStatusModal(true);
                      }}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <XCircle className="w-6 h-6 text-gray-600 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Disable Account
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Permanently disable user account
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Password Reset */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Security Actions
                </h4>
                <button
                  onClick={()=> setShowResetPasswordModal(true)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 border border-blue-200 dark:border-blue-900/20"
                >
                  <div className="flex items-center space-x-3">
                    <Key className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Reset Password
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Force user to change password on next login
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Danger Zone */}
              {data.user.role !== 'super_admin' && (
                <div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/20 mb-3">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-900 dark:text-red-300">
                          Danger Zone
                        </h4>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                          These actions are permanent and cannot be undone
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={()=>setShowDeleteModal(true)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 border border-red-200 dark:border-red-900/20"
                  >
                    <div className="flex items-center space-x-3">
                      <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Delete Account
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Permanently delete this user account
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showLockModal}
        onClose={() => {
          setShowLockModal(false);
          setLockReason('');
        }}
        onConfirm={confirmLockAccount}
        title="Lock Account"
        message="This will prevent the user from logging in until the account is unlocked."
        confirmText="Lock Account"
        type="warning"
        isLoading={actionLoading}
        requireInput={true}
        inputPlaceholder="Enter reason for locking (required)"
        inputValue={lockReason}
        onInputChange={setLockReason}
      />

      <ConfirmModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onConfirm={confirmUnlockAccount}
        title="Unlock Account"
        message="This will restore the user's access to the platform."
        confirmText="Unlock Account"
        type="success"
        isLoading={actionLoading}
      />

      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={confirmStatusChange}
        title={`Change Status to ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}`}
        message={`Are you sure you want to change this user's status to ${selectedStatus}?`}
        confirmText="Change Status"
        type={selectedStatus === 'suspended' ? 'danger' : 'info'}
        isLoading={actionLoading}
      />

      <ConfirmModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        onConfirm={confirmResetPassword}
        title="Reset Password"
        message="This will generate a temporary password and force the user to change it on next login."
        confirmText="Reset Password"
        type="warning"
        isLoading={actionLoading}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        message="This action cannot be undone. Are you absolutely sure you want to delete this user account?"
        confirmText="Delete Account"
        type="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};

export default AdminUserDetails;