import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  MapPin,
  Activity,
  Target,
  Plus,
  ChevronRight,
  TrendingUp,
  Building2,
  Calendar,
  UserPlus,
  Send,
  BarChart3,
  PieChart,
  CalendarDays,
  Layers,
  ArrowRight,
  CheckCircle2,
  Music,
  Users2,
  Zap,
  BookOpen,
  Briefcase,
  Palette,
  Trophy,
  Heart,
  Lock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { showToast } from '../../utils/toasts';
import { usePageTour } from '../../hooks/usePageTour';
import Loader from '../../components/ui/Loader';

const getDepartmentIconAndColor = (deptName: string, index: number) => {
  const name = (deptName || '').toLowerCase();
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-600', dark: 'dark:bg-blue-900/20 dark:text-blue-400' },
    { bg: 'bg-purple-100', text: 'text-purple-600', dark: 'dark:bg-purple-900/20 dark:text-purple-400' },
    { bg: 'bg-green-100', text: 'text-green-600', dark: 'dark:bg-green-900/20 dark:text-green-400' },
    { bg: 'bg-red-100', text: 'text-red-600', dark: 'dark:bg-red-900/20 dark:text-red-400' },
    { bg: 'bg-yellow-100', text: 'text-yellow-600', dark: 'dark:bg-yellow-900/20 dark:text-yellow-400' },
    { bg: 'bg-pink-100', text: 'text-pink-600', dark: 'dark:bg-pink-900/20 dark:text-pink-400' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600', dark: 'dark:bg-indigo-900/20 dark:text-indigo-400' },
    { bg: 'bg-cyan-100', text: 'text-cyan-600', dark: 'dark:bg-cyan-900/20 dark:text-cyan-400' }
  ];

  const iconMap: Record<string, React.ReactNode> = {
    music: <Music className="w-5 h-5" />,
    youth: <Users2 className="w-5 h-5" />,
    prayer: <Zap className="w-5 h-5" />,
    study: <BookOpen className="w-5 h-5" />,
    finance: <Briefcase className="w-5 h-5" />,
    creative: <Palette className="w-5 h-5" />,
    sport: <Trophy className="w-5 h-5" />,
    care: <Heart className="w-5 h-5" />
  };

  let icon = <Building2 className="w-5 h-5" />;

  if (name.includes('music') || name.includes('worship')) icon = <Music className="w-5 h-5" />;
  else if (name.includes('youth')) icon = <Users2 className="w-5 h-5" />;
  else if (name.includes('prayer') || name.includes('spiritual')) icon = <Zap className="w-5 h-5" />;
  else if (name.includes('study') || name.includes('bible')) icon = <BookOpen className="w-5 h-5" />;
  else if (name.includes('finance') || name.includes('business')) icon = <Briefcase className="w-5 h-5" />;
  else if (name.includes('creative') || name.includes('art')) icon = <Palette className="w-5 h-5" />;
  else if (name.includes('sport') || name.includes('athletic')) icon = <Trophy className="w-5 h-5" />;
  else if (name.includes('care') || name.includes('pastoral')) icon = <Heart className="w-5 h-5" />;

  const color = colors[index % colors.length];
  return { icon, color };
};

const Dashboard = () => {
  const navigate = useNavigate();
  usePageTour('dashboard');
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    totalMembers: 0,
    totalBranches: 0,
    activeBranches: 0,
    totalDepartments: 0,
    totalEvents: 0,
    upcomingEvents: [],
    membersByBranch: [],
    departmentStats: [],
    recentActivity: [],
    memberStats: {
      active: 0,
      inactive: 0,
      male: 0,
      female: 0,
      children: 0,
      youth: 0,
      adults: 0,
      leaders: { total: 0, pastors: 0, elders: 0, deacons: 0 }
    }
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/stats');
      const data = response.data.data;

      setStats({
        totalMembers: data.totalMembers || 0,
        totalBranches: data.totalBranches || 0,
        activeBranches: data.activeBranches || 0,
        totalDepartments: data.totalDepartments || 0,
        totalEvents: data.totalEvents || 0,
        upcomingEvents: data.upcomingEvents || [],
        membersByBranch: data.membersByBranch || [],
        departmentStats: data.departmentStats || [],
        recentActivity: data.recentActivity || [],
        memberStats: {
          active: data.memberStats?.active || 0,
          inactive: data.memberStats?.inactive || 0,
          male: data.memberStats?.male || 0,
          female: data.memberStats?.female || 0,
          children: data.memberStats?.children || 0,
          youth: data.memberStats?.youth || 0,
          adults: data.memberStats?.adults || 0,
          leaders: data.memberStats?.leaders || { total: 0, pastors: 0, elders: 0, deacons: 0 }
        }
      });

      // Fetch subscription data
      if (data.subscriptionData) {
        setSubscriptionData(data.subscriptionData);
      }
    } catch (error) {
      showToast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen rounded-lg dark:bg-gray-900">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-4 py-4">
          <Loader variant="skeleton-dashboard" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rounded-lg dark:bg-gray-900">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-4 py-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's an overview of your church community.
          </p>
        </div>

        {/* Quick Actions Banner */}
        <div className="mb-8 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6" data-tour="dashboard-quick-actions">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="w-full md:w-auto text-center md:text-left">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                Ready to grow your church?
              </h2>
              <p className="text-primary-100 text-xs sm:text-sm">
                Add members, create events, and manage your church effectively.
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/members/new')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-white text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors shadow-sm text-sm"
              >
                <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="truncate">Add Member</span>
              </button>
              <button
                onClick={() => navigate('/events/new')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-lg font-medium transition-colors border border-white/30 text-sm"
              >
                <CalendarDays className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="truncate">New Event</span>
              </button>
              <button
                onClick={() => navigate('/messaging/send')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-lg font-medium transition-colors border border-white/30 text-sm"
              >
                <Send className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="truncate">Send SMS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-tour="dashboard-stats">
          {/* Total Members */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Members</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.totalMembers}
                </h3>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    {stats.memberStats.active} active
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>

          {/* Branches */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Branches</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.totalBranches}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.activeBranches} active
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>

          {/* Departments */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Departments</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.totalDepartments}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Active ministries
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>

          {/* Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.totalEvents}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.upcomingEvents.length} upcoming
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>
        </div>


        {/* Departments Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Department Overview
              </h2>
            </div>
            <button
              onClick={() => navigate('/departments')}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              View all →
            </button>
          </div>

          {stats.departmentStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.departmentStats.slice(0, 8).map((dept: any, index: number) => {
                const { icon, color } = getDepartmentIconAndColor(dept.name, index);

                return (
                  <div
                    key={dept._id}
                    onClick={() => navigate(`/departments/${dept._id}`)}
                    className="p-4 bg-white dark:bg-gray-700/50 rounded-lg hover:shadow-lg transition-all cursor-pointer border border-gray-200 dark:border-gray-600 group"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 ${color.bg} ${color.dark} rounded-lg ${color.text} group-hover:scale-110 transition-transform`}>
                        {icon}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                        {dept.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-600">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4 mr-1" />
                        <span className="font-medium">{dept.memberCount || 0}</span>
                        <span className="ml-1">members</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Layers className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No departments created yet</p>
              <button
                onClick={() => navigate('/departments/new')}
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Department
              </button>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Members by Branch - Area Chart */}
          {stats.membersByBranch && stats.membersByBranch.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Members by Branch
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.membersByBranch}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    fill="#3b82f6"
                    stroke="#1e40af"
                    fillOpacity={0.6}
                    name="Members"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Upcoming Events
                </h2>
              </div>
              <button
                onClick={() => navigate('/events')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                View all →
              </button>
            </div>

            {stats.upcomingEvents.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {stats.upcomingEvents.slice(0, 6).map((event: any) => (
                  <div
                    key={event._id}
                    onClick={() => navigate(`/events/${event._id}`)}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                          {event.title}
                        </h4>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events</p>
              </div>
            )}
          </div>

          {/* Member Gender Distribution - Area Chart */}
          {stats.memberStats.male > 0 || stats.memberStats.female > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <PieChart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Gender Distribution
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={[
                    { category: 'Male', count: stats.memberStats.male },
                    { category: 'Female', count: stats.memberStats.female }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    fill="#3b82f6"
                    stroke="#1e40af"
                    fillOpacity={0.6}
                    name="Members"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {/* Age Group Distribution - Area Chart */}
          {stats.memberStats.children > 0 || stats.memberStats.youth > 0 || stats.memberStats.adults > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Age Group Distribution
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={[
                    { category: 'Children', count: stats.memberStats.children },
                    { category: 'Youth', count: stats.memberStats.youth },
                    { category: 'Adults', count: stats.memberStats.adults }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    fill="#8b5cf6"
                    stroke="#6d28d9"
                    fillOpacity={0.6}
                    name="Members"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;