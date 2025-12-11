import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  UserCheck, 
  TrendingUp,
  TrendingDown,
  Activity,
  Crown,
  MapPin,
  Calendar,
  Loader,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  current: {
    merchants: { total: number; active: number; pending: number; suspended: number };
    users: { total: number; active: number; churchAdmins: number; pastors: number; leaders: number; members: number };
    members: { total: number };
  };
  growth: {
    merchants: string;
    users: string;
    members: string;
  };
  monthlyGrowth: Array<{ _id: { year: number; month: number }; count: number }>;
  planDistribution: Array<{ _id: string; count: number }>;
  regionalDistribution: Array<{ _id: string; count: number }>;
  topChurches: Array<{ _id: string; name: string; subdomain: string; memberCount: number }>;
  recentMerchants: any[];
  recentUsers: any[];
  weeklyActivity: {
    newMerchants: number;
    newUsers: number;
    newMembers: number;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatGrowthData = () => {
    if (!stats?.monthlyGrowth) return [];
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return stats.monthlyGrowth.map(item => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      merchants: item.count
    }));
  };

  const formatPlanData = () => {
    if (!stats?.planDistribution) return [];
    return stats.planDistribution.map(item => ({
      name: item._id?.charAt(0)?.toUpperCase() + item._id?.slice(1),
      value: item.count
    }));
  };

  const formatRoleData = () => {
    if (!stats?.current.users) return [];
    return [
      { name: 'Church Admins', value: stats.current.users.churchAdmins },
      { name: 'Pastors', value: stats.current.users.pastors },
      { name: 'Leaders', value: stats.current.users.leaders },
      { name: 'Members', value: stats.current.users.members }
    ];
  };

  const formatRegionalData = () => {
    if (!stats?.regionalDistribution) return [];
    return stats.regionalDistribution.map(item => ({
      name: item._id || 'Unknown',
      churches: item.count
    }));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const StatCard = ({ 
    title, 
    value, 
    growth, 
    icon: Icon, 
    color, 
    onClick 
  }: { 
    title: string; 
    value: number; 
    growth: string; 
    icon: any; 
    color: string;
    onClick?: () => void;
  }) => {
    const isPositive = parseFloat(growth) >= 0;
    
    return (
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {value.toLocaleString()}
          </p>
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 mr-1" />
            )}
            <span className="text-sm font-semibold">{Math.abs(parseFloat(growth))}%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">vs last month</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Platform Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your platform's performance and growth
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Activity className="w-5 h-5 mr-2" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Merchants"
          value={stats?.current.merchants.total || 0}
          growth={stats?.growth.merchants || '0'}
          icon={Building2}
          color="bg-blue-500"
          onClick={() => navigate('/admin/merchants')}
        />
        <StatCard
          title="Total Users"
          value={stats?.current.users.total || 0}
          growth={stats?.growth.users || '0'}
          icon={Users}
          color="bg-green-500"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title="Total Members"
          value={stats?.current.members.total || 0}
          growth={stats?.growth.members || '0'}
          icon={UserCheck}
          color="bg-purple-500"
        />
        <StatCard
          title="Active This Week"
          value={stats?.weeklyActivity.newMerchants || 0}
          growth="0"
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Merchant Growth
          </h3>
          <ResponsiveContainer width="100%" height={300}>
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
                dataKey="merchants" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Plan Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formatPlanData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {formatPlanData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Roles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            User Distribution by Role
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
              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Regional Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Regional Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatRegionalData()}>
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
              <Bar dataKey="churches" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Churches */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Top Churches
            </h3>
            <Crown className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {stats?.topChurches && stats.topChurches.length > 0 ? (
              stats.topChurches.map((church, index) => (
                <div key={church._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {church.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {church.subdomain}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {church.memberCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">members</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No data available
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Activity
            </h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats?.recentMerchants && stats.recentMerchants.slice(0, 5).map((merchant) => (
              <div key={merchant._id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    New church registered
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {merchant.name} • {merchant.subdomain}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(merchant.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;