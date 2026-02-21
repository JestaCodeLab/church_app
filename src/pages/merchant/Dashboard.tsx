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
  Clock,
  UserPlus,
  Send,
  BarChart3,
  PieChart,
  CalendarDays,
  Layers,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import { showToast } from '../../utils/toasts';

const Dashboard = () => {
  const navigate = useNavigate();
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
        <div className="mb-8 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Members */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
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
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <button
              onClick={() => navigate('/members/all')}
              className="w-full py-2 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              View all
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Branches */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
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
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <button
              onClick={() => navigate('/branches')}
              className="w-full py-2 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              Manage
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Departments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
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
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <button
              onClick={() => navigate('/departments')}
              className="w-full py-2 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              View all
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Events */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.totalEvents}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-orange-600 dark:text-orange-400">
                    {stats.upcomingEvents.length} upcoming
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <button
              onClick={() => navigate('/events')}
              className="w-full py-2 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              View calendar
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Members by Branch - 2 columns */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Members by Branch
                </h2>
              </div>
              <button
                onClick={() => navigate('/branches')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                View all →
              </button>
            </div>

            {stats.membersByBranch.length > 0 ? (
              <>

                {/* Branch Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.membersByBranch.slice(0, 4).map((branch: any, index: number) => {
                    const percentage = stats.totalMembers > 0
                      ? ((branch.count / stats.totalMembers) * 100).toFixed(1)
                      : 0;

                    const colors = [
                      { bg: 'bg-purple-50 dark:bg-purple-900/10', text: 'text-primary-600 dark:text-primary-400', border: 'border-purple-200 dark:border-purple-800' },
                      { bg: 'bg-primary-50 dark:bg-primary-900/10', text: 'text-primary-600 dark:text-primary-400', border: 'border-primary-200 dark:border-primary-800' },
                      { bg: 'bg-orange-50 dark:bg-orange-900/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
                      { bg: 'bg-green-50 dark:bg-green-900/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
                      { bg: 'bg-teal-50 dark:bg-teal-900/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
                    ];

                    const colorScheme = colors[index % colors.length];

                    return (
                      <div
                        key={branch._id}
                        onClick={() => navigate(`/branches/${branch._id}/members`)}
                        className={`relative ${colorScheme.bg} ${colorScheme.border} border-2 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 ${colorScheme.text} bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm`}>
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className={`font-semibold ${colorScheme.text} text-base group-hover:underline`}>
                                {branch.name}
                              </h3>
                            </div>
                          </div>
                          <span className={`px-2 py-1 ${colorScheme.bg} ${colorScheme.text} text-xs font-bold rounded-full border ${colorScheme.border}`}>
                            {percentage}%
                          </span>
                        </div>

                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Members</p>
                            <p className={`text-3xl font-bold ${colorScheme.text}`}>
                              {branch.count}
                            </p>
                          </div>
                          <Users className={`w-8 h-8 ${colorScheme.text} opacity-30`} />
                        </div>

                        <div className="mt-3 h-1.5 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colorScheme.text.replace('text-', 'bg-')} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {stats.membersByBranch.length > 4 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => navigate('/branches')}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
                    >
                      + {stats.membersByBranch.length - 4} more branches
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No branch data available</p>
                <button
                  onClick={() => navigate('/branches/new')}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Branch
                </button>
              </div>
            )}
          </div>

          {/* Upcoming Events - 1 column */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
              <div className="space-y-3">
                {stats.upcomingEvents.slice(0, 4).map((event: any) => (
                  <div
                    key={event._id}
                    onClick={() => navigate(`/events/${event._id}`)}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <CalendarDays className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                          {event.title}
                        </h4>
                        <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        {/* Attendance count now handled per event, not centralized. */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming events</p>
                <button
                  onClick={() => navigate('/events/new')}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </button>
              </div>
            )}
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
                const icons = ['🎵', '👨‍👩‍👧', '🙏', '📖', '🎓', '💼', '🎨', '⚽'];
                const icon = dept.icon || icons[index % icons.length];

                return (
                  <div
                    key={dept._id}
                    onClick={() => navigate(`/departments/${dept._id}`)}
                    className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-lg hover:shadow-md transition-all cursor-pointer border border-gray-200 dark:border-gray-700 group"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="text-2xl">{icon}</div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                        {dept.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4 mr-1" />
                        {dept.memberCount || 0} members
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

        {/* Bottom Row - Demographics & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Member Demographics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <PieChart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Member Demographics
              </h2>
            </div>

            <div className="space-y-4">
              {/* Gender */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Gender Distribution</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary-50 dark:bg-primary-900/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {stats.memberStats.male}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Male</p>
                  </div>
                  <div className="bg-pink-50 dark:bg-pink-900/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                      {stats.memberStats.female}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Female</p>
                  </div>
                </div>
              </div>

              {/* Age Groups */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Age Groups</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Children (0-12)</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.memberStats.children}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Youth (13-17)</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.memberStats.youth}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Adults (18+)</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.memberStats.adults}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Quick Stats
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {stats.memberStats.active}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500 opacity-50" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Leadership</p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {stats.memberStats.leaders.total}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {stats.memberStats.leaders.pastors} pastors, {stats.memberStats.leaders.elders} elders
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-500 opacity-50" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Branches</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.totalBranches}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;