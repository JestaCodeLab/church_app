import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Download, RefreshCw, Users, Target, TrendingUp, HandHeart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { partnershipAPI } from '../../../../services/api';
import { showToast } from '../../../../utils/toasts';
import { formatCurrency, getMerchantCurrency } from '../../../../utils/currency';
import PermissionGuard from '../../../../components/guards/PermissionGuard';

interface Tier {
  name: string;
  minimumAmount: number;
  description?: string;
  benefits?: string[];
  badgeColor?: string;
}

interface PartnershipProgramme {
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

const PartnershipProgrammes = () => {
  const navigate = useNavigate();
  const merchantCurrency = getMerchantCurrency();

  const [programmes, setProgrammes] = useState<PartnershipProgramme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    paused: 0,
    completed: 0,
    totalPartners: 0,
    totalRaised: 0,
  });

  useEffect(() => {
    fetchProgrammes();
  }, [statusFilter]);

  const fetchProgrammes = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await partnershipAPI.getAll(params);
      const data = response.data.data;
      setProgrammes(data.programmes || []);

      // Calculate stats
      const all = data.programmes || [];
      setStats({
        total: all.length,
        active: all.filter((p: PartnershipProgramme) => p.status === 'active').length,
        draft: all.filter((p: PartnershipProgramme) => p.status === 'draft').length,
        paused: all.filter((p: PartnershipProgramme) => p.status === 'paused').length,
        completed: all.filter((p: PartnershipProgramme) => p.status === 'completed').length,
        totalPartners: all.reduce((sum: number, p: PartnershipProgramme) => sum + (p.stats?.totalPartners || 0), 0),
        totalRaised: all.reduce((sum: number, p: PartnershipProgramme) => sum + (p.goal?.raisedAmount || 0), 0),
      });
    } catch (error: any) {
      showToast.error('Failed to load partnership programmes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await partnershipAPI.delete(id);
      showToast.success('Partnership programme deleted successfully');
      fetchProgrammes();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to delete partnership programme');
    }
  };

  const filteredProgrammes = programmes.filter((programme) => {
    const matchesSearch = searchQuery === '' || 
      programme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      programme.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
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
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <HandHeart className="w-8 h-8 text-purple-600" />
            Partnership Programmes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage partnership programmes with tiered giving levels
          </p>
        </div>
        <PermissionGuard permission="members.create">
          <button
            onClick={() => navigate('/members/partnership/new')}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Programme
          </button>
        </PermissionGuard>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Programmes</dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Partners</dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.totalPartners}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Raised</dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(stats.totalRaised, merchantCurrency)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HandHeart className="h-6 w-6 text-pink-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active Programmes</dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.active}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
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
                placeholder="Search programmes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Programmes List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading programmes...</p>
        </div>
      ) : filteredProgrammes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <HandHeart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No partnership programmes</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new partnership programme.</p>
          <PermissionGuard permission="members.create">
            <div className="mt-6">
              <button
                onClick={() => navigate('/members/partnership/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Programme
              </button>
            </div>
          </PermissionGuard>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProgrammes.map((programme) => {
            const raisedAmount = programme.goal?.raisedAmount || 0;
            const targetAmount = programme.goal?.targetAmount || 0;
            const progress = calculateProgress(raisedAmount, targetAmount);
            
            return (
              <div key={programme._id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                {/* Cover Image */}
                {programme.coverImage?.url && (
                  <div className="h-40 overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600">
                    <img
                      src={programme.coverImage.url}
                      alt={programme.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{programme.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(programme.status)}`}>
                        {programme.status}
                      </span>
                    </div>
                    <PermissionGuard permission="members.editPartnership">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/members/partnership/${programme._id}/edit`);
                        }}
                        className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        title="Edit Programme"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                  </div>

                  {/* Description */}
                  {programme.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{programme.description}</p>
                  )}

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(raisedAmount, programme.goal?.currency || merchantCurrency)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        of {formatCurrency(targetAmount, programme.goal?.currency || merchantCurrency)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{progress.toFixed(1)}%</div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tiers</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{programme.tiers?.length || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Partners</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{programme.stats?.totalPartners || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Payments</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{programme.stats?.totalTransactions || 0}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => navigate(`/members/partnership/${programme._id}`)}
                      className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                    <PermissionGuard permission="members.update">
                      <button
                        onClick={() => navigate(`/members/partnership/${programme._id}/edit`)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard permission="members.delete">
                      <button
                        onClick={() => handleDelete(programme._id, programme.name)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-red-300 dark:border-red-700 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PartnershipProgrammes;
