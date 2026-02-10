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
  UserCog,
  Activity,
  CreditCard,
  BarChart3
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

  // Calculate growth percentage
  const previousMonthMerchants = merchantGrowth.length >= 2 ? merchantGrowth[merchantGrowth.length - 2].count : 0;
  const currentMonthMerchants = merchantGrowth.length > 0 ? merchantGrowth[merchantGrowth.length - 1].count : 0;
  const growthPercentage = previousMonthMerchants > 0 
    ? ((currentMonthMerchants - previousMonthMerchants) / previousMonthMerchants * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Platform Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor system performance and church activities
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin/churches')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            View All Churches
          </button>
        </div>
      </div>

      {/* Key Metrics - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Churches */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-blue-100 text-sm font-medium">+{overview.recentMerchants} this month</span>
          </div>
          <p className="text-4xl font-bold mb-1">{overview.totalMerchants}</p>
          <p className="text-blue-100 text-sm">Total Churches</p>
        </div>

        {/* Active Churches */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-green-100 text-sm font-medium">
              {((overview.activeMerchants / overview.totalMerchants) * 100).toFixed(0)}% active
            </span>
          </div>
          <p className="text-4xl font-bold mb-1">{overview.activeMerchants}</p>
          <p className="text-green-100 text-sm">Active Churches</p>
        </div>

        {/* Total Users */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <Activity className="w-5 h-5 text-purple-100" />
          </div>
          <p className="text-4xl font-bold mb-1">{overview.totalUsers}</p>
          <p className="text-purple-100 text-sm">Platform Users</p>
        </div>

        {/* Total Members */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <UserCog className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-orange-100" />
          </div>
          <p className="text-4xl font-bold mb-1">{overview.totalMembers.toLocaleString()}</p>
          <p className="text-orange-100 text-sm">Church Members</p>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pending Approval */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-yellow-200 dark:border-yellow-900/50 p-5 cursor-pointer hover:shadow-md transition-all hover:scale-105"
          onClick={() => navigate('/admin/churches?status=pending_approval')}
        >
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
            {overview.pendingMerchants}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
        </div>

        {/* Suspended */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-red-200 dark:border-red-900/50 p-5 cursor-pointer hover:shadow-md transition-all hover:scale-105"
          onClick={() => navigate('/admin/churches?status=suspended')}
        >
          <div className="flex items-center justify-between mb-3">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
            {overview.suspendedMerchants}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Suspended</p>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-green-200 dark:border-green-900/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            <CreditCard className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
            {formatCurrency(overview.totalRevenue)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</p>
        </div>

        {/* Growth Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-primary-200 dark:border-primary-900/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <div className={`flex items-center space-x-1 text-sm font-medium ${
              Number(growthPercentage) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {Number(growthPercentage) >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{Math.abs(Number(growthPercentage))}%</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
            {currentMonthMerchants}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">New This Month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Church Registration Trend - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Church Registration Trend
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Last 6 months performance
                </p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {merchantGrowth.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                No data available
              </p>
            ) : (
              <div className="space-y-6">
                {/* Bar Chart */}
                <div className="flex items-end justify-between space-x-3 h-80">
                  {merchantGrowth.map((month, index) => {
                    const maxCount = Math.max(...merchantGrowth.map(m => m.count));
                    const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group">
                        <div className="w-full relative" style={{ height: '280px' }}>
                          <div
                            className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-xl absolute bottom-0 transition-all duration-300 hover:from-primary-700 hover:to-primary-500 cursor-pointer shadow-lg group-hover:shadow-xl"
                            style={{ height: `${height}%`, minHeight: month.count > 0 ? '24px' : '0' }}
                          >
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {month.count} churches
                            </div>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-3">
                          {getMonthName(month._id.month)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {month._id.year}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Legend/Summary */}
                <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total: {merchantGrowth.reduce((sum, m) => sum + m.count, 0)} churches
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Avg: {(merchantGrowth.reduce((sum, m) => sum + m.count, 0) / merchantGrowth.length).toFixed(1)} per month
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Plans Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Subscription Plans
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Active subscriptions
            </p>
          </div>
          <div className="p-6">
            {planDistribution.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No subscriptions yet
              </p>
            ) : (
              <div className="space-y-4">
                {planDistribution.map((plan) => {
                  const percentage = ((plan.count / overview.totalMerchants) * 100).toFixed(0);
                  const colors = {
                    free: { bg: 'bg-gray-500', light: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-600 dark:text-gray-400' },
                    basic: { bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
                    starter: { bg: 'bg-cyan-500', light: 'bg-cyan-100 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400' },
                    professional: { bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
                    enterprise: { bg: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' }
                  };
                  const color = colors[plan._id as keyof typeof colors] || colors.free;

                  return (
                    <div key={plan._id || 'no-plan'} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {plan._id || 'No Plan'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {percentage}%
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {plan.count}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 ${color.bg} rounded-full transition-all duration-500 shadow-sm`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Role Distribution - Horizontal Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Role Distribution
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Platform user breakdown by role
          </p>
        </div>
        <div className="p-6">
          {userRoleDistribution.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No users yet
            </p>
          ) : (
            <div className="space-y-5">
              {userRoleDistribution.map((role) => {
                const percentage = ((role.count / overview.totalUsers) * 100).toFixed(0);
                const roleColors = {
                  super_admin: 'from-purple-500 to-purple-600',
                  church_admin: 'from-blue-500 to-blue-600',
                  dept_admin: 'from-cyan-500 to-cyan-600',
                  finance_admin: 'from-green-500 to-green-600',
                  pastor: 'from-indigo-500 to-indigo-600',
                  leader: 'from-pink-500 to-pink-600',
                };
                const gradient = roleColors[role._id as keyof typeof roleColors] || 'from-gray-500 to-gray-600';

                return (
                  <div key={role._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                          <UserCog className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {role.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {role._id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {percentage}%
                        </span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white min-w-[3rem] text-right">
                          {role.count}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className={`h-3 bg-gradient-to-r ${gradient} rounded-full transition-all duration-500 shadow-sm`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Churches Table */}
      {topMerchants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Churches by Member Count
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Most active churches on the platform
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Church Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Subdomain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topMerchants.map((merchant, index) => (
                  <tr key={merchant._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        index === 1 ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-400' :
                        index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {merchant.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded">
                        {merchant.subdomain}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {merchant.memberCount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(merchant.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => navigate(`/admin/churches/${merchant._id}`)}
                        className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        View Details
                        <ArrowUpRight className="w-4 h-4 ml-1" />
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
