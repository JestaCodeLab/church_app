import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, MapPin, Calendar, TrendingUp, UserPlus, Building2,
  Activity, Clock, ChevronRight, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, Target,
  Plus
} from 'lucide-react';
import { memberAPI, branchAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalBranches: 0,
    activeBranches: 0,
    recentMembers: 0,
    membersByBranch: [] as any[],
    recentBranches: [] as any[],
    memberStats: {
      male: 0,
      female: 0,
      active: 0,
      inactive: 0,
      visitors: 0,
      leaders: { total: 0, pastors: 0, elders: 0, deacons: 0, leaders: 0 }
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch member stats
      const memberResponse = await memberAPI.getStats();
      const memberStats = memberResponse.data.data.stats;
      
      // Fetch branch summary
      const branchResponse = await branchAPI.getSummary();
      const branchSummary = branchResponse.data.data;
      
      setStats({
        totalMembers: memberStats.totalMembers || 0,
        totalBranches: branchSummary.totalBranches || 0,
        activeBranches: branchSummary.activeBranches || 0,
        recentMembers: memberStats.recentMembers?.length || 0,
        membersByBranch: branchSummary.membersByBranch || [],
        recentBranches: branchSummary.recentBranches || [],
        memberStats: {
          male: memberStats?.byGender?.find(g => g._id === "male")?.count || 0,
          female: memberStats.byGender?.find(g => g._id === "female")?.count || 0,
          active: memberStats.byStatus?.find(g => g._id === "active")?.count || 0,
          inactive: memberStats.byStatus?.find(g => g._id === "inactive")?.count || 0,
          visitors: memberStats.visitors || 0,
          leaders: memberStats.leaders || { total: 0, pastors: 0, elders: 0, deacons: 0, leaders: 0 }
        }
      });
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's an overview of your church community.
          </p>
        </div>

         {/* Quick Actions Banner */}
        <div className="mb-8 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">
                Ready to grow your community?
              </h2>
              <p className="text-primary-100">
                Add new members, create branches, and manage your church effectively.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/members/new')}
                className="px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-md flex items-center justify-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Add Member
              </button>
              <button
                onClick={() => navigate('/branches/new')}
                className="px-6 py-3 bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center justify-center"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Add Branch
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
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    {stats.recentMembers} this month
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <button
              onClick={() => navigate('/members')}
              className="w-full mt-4 py-2 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              View all members
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Total Branches */}
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
                <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <button
              onClick={() => navigate('/branches')}
              className="w-full mt-4 py-2 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              Manage branches
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Active Members */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.memberStats.active}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {((stats.memberStats.active / stats.totalMembers) * 100 || 0).toFixed(1)}% of total
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <button
              onClick={() => navigate('/members?status=active')}
              className="w-full mt-4 py-2 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              View active
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Leadership */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Leadership Team</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.memberStats.leaders.total}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.memberStats.leaders.pastors} pastors
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <button
              onClick={() => navigate('/members?type=leadership')}
              className="w-full mt-4 py-2 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              View leaders
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members by Branch - Larger Section */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Members Distribution by Branch
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
              <div className="space-y-4">
                {stats.membersByBranch.slice(0, 5).map((branch: any, index: number) => {
                  const percentage = stats.totalMembers > 0 
                    ? (branch.memberCount / stats.totalMembers) * 100 
                    : 0;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                              {branch.branchCode}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {branch.branchName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {branch.memberCount} members
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
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

          {/* Right Column */}
          <div className="space-y-6">
            {/* Member Demographics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <PieChart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Demographics
                </h2>
              </div>

              <div className="space-y-4">
                {/* Gender */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Gender Distribution</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
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

                {/* Membership Types */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium dark:text-gray-400">Membership Types</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Visitors</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {stats.memberStats.visitors}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Inactive</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {stats.memberStats.inactive}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Branches */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Recent Branches
                </h2>
              </div>

              {stats.recentBranches.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentBranches.slice(0, 4).map((branch: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/branches/${branch._id}`)}>
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                          {branch.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1 justify-between">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                            {branch.code}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(branch.createdAt).toLocaleDateString('en-GH', {day: '2-digit', month: 'short', year:'numeric'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No recent branches
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
};

export default Dashboard;