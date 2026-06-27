import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, MapPin, Users, Church } from 'lucide-react';
import { branchAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import DeleteBranchModal from '../../../components/branch/DeleteBranchModal';
import FeatureGate from '../../../components/access/FeatureGate';
import { useResourceLimit } from '../../../hooks/useResourceLimit';
import LimitReachedModal from '../../../components/modals/LimitReachedModal';
import { useAuth } from '../../../context/AuthContext';
import PermissionGuard from '../../../components/guards/PermissionGuard';
import { usePaginatedQuery } from '../../../hooks/usePaginatedQuery';
import { DataTable, Column } from '../../../components/ui/DataTable';

const Branches = () => {
  const navigate = useNavigate();
  const { fetchAndUpdateSubscription, user } = useAuth();
  const plan = user?.merchant?.subscription?.plan;
  const [activeTab, setActiveTab] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const branchLimit = useResourceLimit('branches');

  const branchFetcher = async (params: any) => {
    const response = await branchAPI.getBranches(params);
    return {
      items: response.data.data.branches,
      pagination: {
        currentPage: response.data.data.pagination.currentPage,
        pages: response.data.data.pagination.pages,
        totalItems: response.data.data.pagination.totalItems,
      },
    };
  };

  const { data: branches, loading, currentPage, totalPages, totalItems, setPage, setSearch, setFilters, refetch } =
    usePaginatedQuery<any>('branches', branchFetcher, { limit: 10 });

  useEffect(() => {
    fetchSummary();
  }, [activeTab]);

  useEffect(() => {
    setFilters({ type: activeTab !== 'all' ? activeTab : '' });
  }, [activeTab, setFilters]);

  const fetchSummary = async () => {
    try {
      const response = await branchAPI.getSummary();
      setSummary(response.data.data);
    } catch (error) {
      console.error('Failed to load summary');
    }
  };

  const handleAddBranchClick = () => {
    if (!branchLimit.canCreate) {
      setShowLimitModal(true);
      return;
    }
    navigate('/branches/new');
  };

  const handleView = (branchId: string) => {
    navigate(`/branches/${branchId}`);
  };

  const handleEdit = (branchId: string) => {
    navigate(`/branches/${branchId}/edit`);
  };

  const handleDelete = (branch: any) => {
    setSelectedBranch({
      id: branch._id,
      name: branch.name,
      memberCount: branch.statistics?.memberCount || 0
    });
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = async (permanent: boolean) => {
    try {
      setIsDeleting(true);
      if (selectedBranch) {
        await branchAPI.deleteBranch(selectedBranch.id, permanent);
        showToast.success(permanent ? 'Branch deleted permanently' : 'Branch archived');
        setShowDeleteModal(false);
        setSelectedBranch(null);
        setIsDeleting(false);
        await fetchAndUpdateSubscription();
        fetchSummary();
        refetch();
      }
    } catch (error: any) {
      setIsDeleting(false);
      showToast.error(error?.response?.data?.message || 'Failed to delete branch');
    }
  };

  const tabs = [
    { id: 'all', label: 'All Branches', count: summary?.totalBranches },
    { id: 'main', label: 'Main', count: summary?.byType?.main || 0 },
    { id: 'branch', label: 'Branches', count: summary?.byType?.branch || 0 },
    { id: 'campus', label: 'Campuses', count: summary?.byType?.campus || 0 },
  ];

  const getTypeBadgeColor = (type: string) => {
    const colors: any = {
      main: 'bg-purple-100 dark:bg-purple-900/20 text-primary-700 dark:text-primary-300',
      branch: 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-blue-300',
      campus: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      satellite: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    };
    return colors[type] || colors.branch;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: any = {
      active: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      closed: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      upcoming: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    };
    return colors[status] || colors.inactive;
  };

  // DataTable columns for table view
  const tableColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Church className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(row.type)}`}>
          {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(row.status)}`}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Location',
      render: (row) => (
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {row.address?.street && row.address?.city
            ? `${row.address.street}, ${row.address.city}`
            : 'Location not specified'}
        </p>
      ),
    },
    {
      key: 'statistics',
      header: 'Members',
      render: (row: any) => (
        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100 font-medium">
          <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
          {row.statistics?.memberCount || 0}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <PermissionGuard permission="branches.edit">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row._id);
              }}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-blue-900/30 hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission="branches.delete">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <FeatureGate feature={'branchManagement'}>
      <div className="min-h-screen dark:bg-gray-900">
        <div className='rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700'>
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Branches
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage your church locations and campuses
                </p>
              </div>
              <PermissionGuard permission="branches.create">
                <div className="flex flex-col items-start sm:items-end">
                  <button
                    onClick={handleAddBranchClick}
                    className="flex items-center px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                    Add Branch
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {branchLimit.current} / {branchLimit.limit || '∞'} used
                  </span>
                </div>
              </PermissionGuard>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white dark:bg-gray-800 dark:border-gray-700 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2 sm:pb-0">
              {/* Tabs */}
              <div className="flex items-center space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-1 sm:ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="flex-1 min-w-0 sm:max-w-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search branches..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="px-0 sm:px-0 py-6 sm:py-8">
          <DataTable
            columns={tableColumns}
            data={branches}
            loading={loading}
            emptyIcon={<MapPin className="w-12 h-12 text-gray-400" />}
            emptyMessage="No branches found"
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={10}
            onPageChange={setPage}
            onRowClick={(row) => handleView(row._id)}
          />
        </div>

        {/* Delete Modal */}
        <DeleteBranchModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedBranch(null);
          }}
          onDelete={handleDeleteSuccess}
          branchName={selectedBranch?.name || ''}
          memberCount={selectedBranch?.memberCount || 0}
          isDeleting={isDeleting}
        />

        {/* Limit Modal */}
        <LimitReachedModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          resourceType="branches"
          planName={plan}
          current={branchLimit.current}
          limit={branchLimit.limit || 0}
        />
      </div>
    </FeatureGate>
  );
};

export default Branches;
