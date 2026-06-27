import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Download, RefreshCw, Users, Target, TrendingUp, HandHeart, Filter, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../../../../services/api';
import { showToast } from '../../../../utils/toasts';
import { formatCurrency, getMerchantCurrency } from '../../../../utils/currency';
import { getDateRange, DateFilterType } from '../../../../utils/dateRangeFilter';
import PermissionGuard from '../../../../components/guards/PermissionGuard';
import DatePicker from '../../../../components/ui/DatePicker';

interface Tier {
  name: string;
  minimumAmount: number;
  description?: string;
  benefits?: string[];
  badgeColor?: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  coverImage?: {
    url: string;
    publicId: string;
  };
  tiers: Tier[];
  goal: {
    targetAmount: number;
    raisedAmount: number;
    currency: string;
  };
  stats: {
    totalPartners: number;
    activePartners: number;
    totalTransactions: number;
  };
  status: 'draft' | 'active' | 'paused' | 'completed';
  dates?: {
    startDate?: string;
    endDate?: string;
    createdAt: string;
  };
}

const Projects = () => {
  const navigate = useNavigate();
  const merchantCurrency = getMerchantCurrency();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filterTrigger, setFilterTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    paused: 0,
    completed: 0,
    totalPartners: 0,
    totalRaised: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, dateFilter, filterTrigger]);

  const fetchProjects = async () => {
    setLoading(true);
    setStatsLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Add date filter
      if (dateFilter !== 'all') {
        const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();
      }

      const response = await projectAPI.getAll(params);
      const data = response.data.data;
      setProjects(data.projects || []);
      console.log('Projects fetched:', data.projects);

      // Calculate stats
      const all = data.projects || [];
      setStats({
        total: all.length,
        active: all.filter((p: Project) => p.status === 'active').length,
        draft: all.filter((p: Project) => p.status === 'draft').length,
        paused: all.filter((p: Project) => p.status === 'paused').length,
        completed: all.filter((p: Project) => p.status === 'completed').length,
        totalPartners: all.reduce((sum: number, p: Project) => sum + (p.stats?.totalPartners || 0), 0),
        totalRaised: all.reduce((sum: number, p: Project) => sum + (p.goal?.raisedAmount || 0), 0),
      });
    } catch (error: any) {
      showToast.error('Failed to load projects');
      console.error(error);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await projectAPI.delete(id);
      showToast.success('Project deleted successfully');
      fetchProjects();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = searchQuery === '' ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const calculateProgress = (raised: number, target: number) => {
    return Math.min((raised / target) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-8xl mx-auto sm:px-6 lg:px-4 py-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
           
            Giving Projects
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage projects with tiered giving levels
          </p>
        </div>
        <PermissionGuard permission="members.create">
          <button
            onClick={() => navigate('/giving/projects/new')}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </button>
        </PermissionGuard>
      </div>

       {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
            >
              <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">All Time</option>
              <option value="today" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Today</option>
              <option value="yesterday" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Yesterday</option>
              <option value="thisWeek" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">This Week</option>
              <option value="lastWeek" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Last Week</option>
              <option value="thisMonth" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">This Month</option>
              <option value="lastMonth" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Last Month</option>
              <option value="thisYear" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">This Year</option>
              <option value="lastYear" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Last Year</option>
              <option value="custom" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Custom Range</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
            >
              <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">All Status</option>
              <option value="draft" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Draft</option>
              <option value="active" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Active</option>
              <option value="paused" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Paused</option>
              <option value="completed" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Completed</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex gap-1 ml-auto">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'card'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title="Card view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title="Table view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <DatePicker
                    value={customStartDate}
                    onChange={setCustomStartDate}
                    placeholder="Select start date"
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <DatePicker
                    value={customEndDate}
                    onChange={setCustomEndDate}
                    placeholder="Select end date"
                    className="w-full"
                    min={customStartDate || undefined}
                  />
                </div>
                <button
                  onClick={() => {
                    if (!customStartDate || !customEndDate) {
                      showToast.error('Please enter both start and end dates');
                      return;
                    }
                    setFilterTrigger(prev => prev + 1);
                  }}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg inline-flex items-center gap-2 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-3"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Total Projects Card */}
            <div className="relative overflow-hidden rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-purple-200 dark:bg-purple-900/30 opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Projects</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-primary-600/10 dark:bg-purple-500/10 rounded-lg">
                    <Target className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Partners Card */}
            <div className="relative overflow-hidden rounded-xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-green-200 dark:bg-green-900/30 opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Partners</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPartners}</p>
                  </div>
                  <div className="p-3 bg-green-600/10 dark:bg-green-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Raised Card */}
            <div className="relative overflow-hidden rounded-xl border border-primary-200 dark:border-primary-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-200 dark:bg-primary-900/30 opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Raised</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(stats.totalRaised, merchantCurrency)}
                    </p>
                  </div>
                  <div className="p-3 bg-primary-600/10 dark:bg-primary-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Projects Card */}
            <div className="relative overflow-hidden rounded-xl border border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/10 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-pink-200 dark:bg-pink-900/30 opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Projects</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
                  </div>
                  <div className="p-3 bg-pink-600/10 dark:bg-pink-500/10 rounded-lg">
                    <HandHeart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

     

      {/* Projects List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <HandHeart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No projects</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new project.</p>
          <PermissionGuard permission="members.create">
            <div className="mt-6">
              <button
                onClick={() => navigate('/giving/projects/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Project
              </button>
            </div>
          </PermissionGuard>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project) => {
            const raisedAmount = project.goal?.raisedAmount || 0;
            const targetAmount = project.goal?.targetAmount || 0;
            const progress = calculateProgress(raisedAmount, targetAmount);

            return (
              <div key={project._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/giving/projects/${project._id}`)}>

                {/* Cover Image with Overlay */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600">
                  {project.coverImage?.url ? (
                    <img
                      src={project.coverImage.url}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${project.status === 'active' ? 'bg-green-500/90 text-white' :
                      project.status === 'draft' ? 'bg-gray-500/90 text-white' :
                        project.status === 'paused' ? 'bg-yellow-500/90 text-white' :
                          'bg-primary-500/90 text-white'
                      }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </div>

                  {/* Icon Placeholder */}
                  {!project.coverImage?.url && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <HandHeart className="w-16 h-16 text-white opacity-30" />
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Title and Description */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-purple-400 transition-colors">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Progress Section */}
                  <div className="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">PROGRESS</span>
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatCurrency(raisedAmount, project.goal?.currency || merchantCurrency)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {formatCurrency(targetAmount, project.goal?.currency || merchantCurrency)}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 text-center">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tiers</p>
                      <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{project.tiers?.length || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 text-center">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Partners</p>
                      <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{project.stats?.totalPartners || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 text-center">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Payments</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">{project.stats?.totalTransactions || 0}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end" onClick={(e) => e.stopPropagation()}>
                    {/* <button
                      onClick={() => navigate(`/giving/projects/${project._id}`)}
                      className="inline-flex items-center justify-center p-2 border border-primary-300 dark:border-primary-700 rounded-lg text-primary-700 dark:text-primary-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                      title="View project"
                    >
                      <Eye className="w-5 h-5" />
                    </button> */}
                    <button
                      onClick={() => navigate(`/giving/projects/${project._id}/edit`)}
                      className="inline-flex items-center justify-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      title="Edit project"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <PermissionGuard permission="members.delete">
                      <button
                        onClick={() => handleDelete(project._id, project.name)}
                        className="inline-flex items-center justify-center p-2 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Table View
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Partners</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Raised</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Goal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProjects.map((project) => {
                  const raisedAmount = project.goal?.raisedAmount || 0;
                  const targetAmount = project.goal?.targetAmount || 0;
                  const progress = calculateProgress(raisedAmount, targetAmount);

                  return (
                    <tr key={project._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/giving/projects/${project._id}`)}
                          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                        >
                          {project.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          project.status === 'draft' ? 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200' :
                          project.status === 'paused' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        }`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{progress.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {project.stats?.totalPartners || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(raisedAmount, project.goal?.currency || merchantCurrency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(targetAmount, project.goal?.currency || merchantCurrency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex gap-4 justify-end">
                          <button
                            onClick={() => navigate(`/giving/projects/${project._id}`)}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                            title="View"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => navigate(`/giving/projects/${project._id}/edit`)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <PermissionGuard permission="members.delete">
                            <button
                              onClick={() => handleDelete(project._id, project.name)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
