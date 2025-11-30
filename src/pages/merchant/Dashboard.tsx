import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, MapPin, Calendar, TrendingUp, UserPlus, Building2,
  Activity, Clock, ChevronRight
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
    recentBranches: [] as any[]
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
      const branchSummary = branchResponse.data.data.summary;
      
      setStats({
        totalMembers: memberStats.totalMembers || 0,
        totalBranches: branchSummary.totalBranches || 0,
        activeBranches: branchSummary.activeBranches || 0,
        recentMembers: memberStats.recentMembers?.length || 0,
        membersByBranch: branchSummary.membersByBranch || [],
        recentBranches: branchSummary.recentBranches || []
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-8xl mx-auto px-3 py-2">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your church.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Members */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Active
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stats.totalMembers}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
            <button
              onClick={() => navigate('/members')}
              className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
            >
              View all members
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Total Branches */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {stats.activeBranches} Active
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stats.totalBranches}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Branches</p>
            <button
              onClick={() => navigate('/branches')}
              className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
            >
              Manage branches
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Recent Members */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                This Month
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stats.recentMembers}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">New Members</p>
            <button
              onClick={() => navigate('/members/new')}
              className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
            >
              Add new member
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Coming Soon
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              -
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Events</p>
            <button
              className="mt-4 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed flex items-center"
              disabled
            >
              Coming soon
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members by Branch */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Members by Branch
                </h2>
              </div>
              <button
                onClick={() => navigate('/branches')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                View all
              </button>
            </div>

            {stats.membersByBranch.length > 0 ? (
              <div className="space-y-4">
                {stats.membersByBranch.map((branch: any, index: number) => {
                  const percentage = stats.totalMembers > 0 
                    ? (branch.memberCount / stats.totalMembers) * 100 
                    : 0;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
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
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No branch data available</p>
                <button
                  onClick={() => navigate('/branches/new')}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Add Your First Branch
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Branches
              </h2>
            </div>

            {stats.recentBranches.length > 0 ? (
              <div className="space-y-4">
                {stats.recentBranches.slice(0, 5).map((branch: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {branch.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                          {branch.code}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(branch.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No recent branches
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-white mb-2">
                Ready to grow your church?
              </h2>
              <p className="text-primary-100">
                Add new members, create branches, and manage your community effectively.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/members/new')}
                className="px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Add Member
              </button>
              <button
                onClick={() => navigate('/branches/new')}
                className="px-6 py-3 bg-primary-700 hover:bg-primary-800 text-white font-medium rounded-lg transition-colors"
              >
                Add Branch
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;