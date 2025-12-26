import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  UserCog
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';

interface PlatformStats {
  overview: {
    totalMerchants: number;
    activeMerchants: number;
    pendingMerchants: number;
    suspendedMerchants: number;
    totalUsers: number;
    totalMembers: number;
    recentMerchants: number;
    totalRevenue: number;
  };
  planDistribution: Array<{
    _id: string | null;
    count: number;
  }>;
  merchantGrowth: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
  }>;
  topMerchants: Array<{
    _id: string;
    name: string;
    subdomain: string;
    memberCount: number;
    subscription?: any;
    createdAt: string;
  }>;
  userRoleDistribution: Array<{
    _id: string;
    name: string;
    count: number;
  }>;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      showToast.error('Failed to load platform statistics');
      console.error('Stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Failed to load statistics</p>
      </div>
    );
  }

  const { overview, planDistribution, merchantGrowth, topMerchants, userRoleDistribution } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Platform Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Overview of all churches and platform activity
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Merchants */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Churches
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {overview.totalMerchants}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {overview.recentMerchants} new this month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Active Merchants */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Active Churches
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {overview.activeMerchants}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {overview.pendingMerchants} pending approval
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Users
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {overview.totalUsers}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Church administrators
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Total Members */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Members
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {overview.totalMembers.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Across all churches
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <UserCog className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Approval */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin/merchants?status=pending_approval')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Approval
                </p>
              </div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {overview.pendingMerchants}
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Suspended */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin/merchants?status=suspended')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Suspended
                </p>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {overview.suspendedMerchants}
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Monthly Revenue
                </p>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(overview.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              User Role Distribution
            </h2>
          </div>
          <div className="p-6">
            {userRoleDistribution.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No users yet
              </p>
            ) : (
              <div className="space-y-4">
                {userRoleDistribution.map((role) => (
                  <div key={role._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        role._id === 'super_admin' 
                          ? 'bg-purple-100 dark:bg-purple-900/20' 
                          : role._id === 'church_admin'
                          ? 'bg-blue-100 dark:bg-blue-900/20'
                          : role._id === 'dept_admin'
                          ? 'bg-cyan-100 dark:bg-cyan-900/20'
                          : role._id === 'finance_admin'
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : 'bg-gray-100 dark:bg-gray-900/20'
                      }`}>
                        <UserCog className={`w-5 h-5 ${
                          role._id === 'super_admin' 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : role._id === 'church_admin'
                            ? 'text-blue-600 dark:text-blue-400'
                            : role._id === 'dept_admin'
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : role._id === 'finance_admin'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {role.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {role._id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {role.count}
                      </span>
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            role._id === 'super_admin' 
                              ? 'bg-purple-600' 
                              : role._id === 'church_admin'
                              ? 'bg-blue-600'
                              : role._id === 'dept_admin'
                              ? 'bg-cyan-600'
                              : 'bg-green-600'
                          }`}
                          style={{ 
                            width: `${(role.count / overview.totalUsers) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Subscription Plans
            </h2>
          </div>
          <div className="p-6">
            {planDistribution.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No subscriptions yet
              </p>
            ) : (
              <div className="space-y-4">
                {planDistribution.map((plan, index) => (
                  <div key={plan._id || 'no-plan'} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        plan._id === 'free' 
                          ? 'bg-gray-100 dark:bg-gray-900/20' 
                          : plan._id === 'basic'
                          ? 'bg-blue-100 dark:bg-blue-900/20'
                          : plan._id === 'pro'
                          ? 'bg-purple-100 dark:bg-purple-900/20'
                          : plan._id === 'enterprise'
                          ? 'bg-orange-100 dark:bg-orange-900/20'
                          : 'bg-yellow-100 dark:bg-yellow-900/20'
                      }`}>
                        <TrendingUp className={`w-5 h-5 ${
                          plan._id === 'free' 
                            ? 'text-gray-600 dark:text-gray-400' 
                            : plan._id === 'basic'
                            ? 'text-blue-600 dark:text-blue-400'
                            : plan._id === 'pro'
                            ? 'text-purple-600 dark:text-purple-400'
                            : plan._id === 'enterprise'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {plan._id || 'No Plan Assigned'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {plan.count}
                      </span>
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            plan._id === 'free' 
                              ? 'bg-gray-600' 
                              : plan._id === 'basic'
                              ? 'bg-blue-600'
                              : plan._id === 'pro'
                              ? 'bg-purple-600'
                              : 'bg-orange-600'
                          }`}
                          style={{ 
                            width: `${(plan.count / overview.totalMerchants) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Merchant Growth Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Church Registration Trend (Last 6 Months)
          </h2>
        </div>
        <div className="p-6">
          {merchantGrowth.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No data available
            </p>
          ) : (
            <div className="flex items-end justify-between space-x-2 h-64">
              {merchantGrowth.map((month, index) => {
                const maxCount = Math.max(...merchantGrowth.map(m => m.count));
                const height = (month.count / maxCount) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg relative" style={{ height: '100%' }}>
                      <div
                        className="w-full bg-primary-600 dark:bg-primary-500 rounded-t-lg absolute bottom-0 transition-all duration-300 hover:bg-primary-700 dark:hover:bg-primary-600"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {month.count}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      {getMonthName(month._id.month)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Merchants */}
      {topMerchants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Top Churches by Member Count
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Church
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subdomain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topMerchants.map((merchant) => (
                  <tr key={merchant._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {merchant.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {merchant.subdomain}.thechurchhq.com
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {merchant.memberCount.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(merchant.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => navigate(`/admin/merchants/${merchant._id}`)}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;