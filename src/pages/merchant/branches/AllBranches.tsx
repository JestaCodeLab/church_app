import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit2, Trash2, MapPin, Users, Phone, Mail, Church } from 'lucide-react';
import { branchAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import DeleteBranchModal from '../../../components/branch/DeleteBranchModal';
import FeatureGate from '../../../components/access/FeatureGate';
import { useResourceLimit } from '../../../hooks/useResourceLimit';
import LimitReachedModal from '../../../components/modals/LimitReachedModal';
import { useAuth } from '../../../context/AuthContext';
import PermissionGuard from '../../../components/guards/PermissionGuard';

const Branches = () => {
  const navigate = useNavigate();
  const { fetchAndUpdateSubscription, user } = useAuth();
  const plan = user?.merchant?.subscription?.plan;
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBranches, setTotalBranches] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const branchLimit = useResourceLimit('branches');

  const handleAddBranchClick = () => {
    if (!branchLimit.canCreate) {
      setShowLimitModal(true);
      return;
    }
    navigate('/branches/new');
  };

  const [filters, setFilters] = useState({
    status: '',
    type: '',
  });

  useEffect(() => {
    fetchBranches();
    fetchSummary();
  }, [currentPage, searchTerm, filters, activeTab]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (searchTerm) params.search = searchTerm;
      if (activeTab !== 'all') params.type = activeTab;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;

      const response = await branchAPI.getBranches(params);
      setBranches(response.data.data.branches);
      setTotalPages(response.data.data.pagination.pages);
      setTotalBranches(response.data.data.pagination.totalItems);
    } catch (error: any) {
      showToast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await branchAPI.getSummary();
      setSummary(response.data.data);
    } catch (error) {
      console.error('Failed to load summary');
    }
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
        fetchBranches();
        fetchSummary();
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
      main: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
      branch: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
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

  return (
    <FeatureGate feature={'branchManagement'}>
    <div className="min-h-screen dark:bg-gray-900">
      <div className='rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700'>
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Branches
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage your church locations and campuses
              </p>
            </div>
            <PermissionGuard permission="branches.create">
            <div className="flex flex-col items-end">
              <button
                onClick={handleAddBranchClick}
                className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
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
        <div className="bg-white dark:bg-gray-800 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center space-x-4">
          {/* Tabs */}
          <div className="flex items-center space-x-1 mt-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
            
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search branches..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid View */}
      <div className="px-0 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No branches found</p>
            <button
              onClick={() => navigate('/branches/new')}
              className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Add Your First Branch
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map((branch) => (
                <div
                  key={branch._id}
                  onClick={() => handleView(branch._id)}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all cursor-pointer group"
                >
                  {/* Header with Church Name and Icon */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Church className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {branch.name}
                        </h3>
                        <div className="mt-0 flex items-center space-x-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadgeColor(branch.type)}`}>
                            {branch.type.charAt(0).toUpperCase() + branch.type.slice(1)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeColor(branch.status)}`}>
                            {branch.status.charAt(0).toUpperCase() + branch.status.slice(1)}
                          </span>
                          </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Members Count Box */}
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-6 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-700 dark:text-green-300 font-medium">Total Members</span>
                      </div>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {branch.statistics?.memberCount || 0}
                      </p>
                    </div>

                    {/* Location */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase mb-2">Location</p>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {branch.address?.street && branch.address?.city
                            ? `${branch.address.street}, ${branch.address.city}`
                            : 'Location not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-2">
                    <PermissionGuard permission="branches.edit">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(branch._id);
                      }}
                      className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    </PermissionGuard>
                    <PermissionGuard permission="branches.delete">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(branch);
                      }}
                      className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    </PermissionGuard>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white dark:bg-gray-800 px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalBranches)} of {totalBranches} branches
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
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