import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit2, Trash2, MapPin, Users, Phone, Mail } from 'lucide-react';
import { branchAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import DeleteBranchModal from '../../../components/branch/DeleteBranchModal';
import FeatureGate from '../../../components/access/FeatureGate';

const Branches = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBranches, setTotalBranches] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

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
      setSummary(response.data.data.summary);
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
      if (selectedBranch) {
        await branchAPI.deleteBranch(selectedBranch.id, permanent);
        showToast.success(permanent ? 'Branch deleted permanently' : 'Branch archived');
        setShowDeleteModal(false);
        setSelectedBranch(null);
        fetchBranches();
        fetchSummary();
      }
    } catch (error: any) {
      showToast.error(error?.response?.data?.message || 'Failed to delete branch');
    }
  };

  const tabs = [
    { id: 'all', label: 'All Branches', count: summary?.totalBranches },
    { id: 'main', label: 'Main', count: summary?.branchesByType?.find((t: any) => t._id === 'main')?.count || 0 },
    { id: 'branch', label: 'Branches', count: summary?.branchesByType?.find((t: any) => t._id === 'branch')?.count || 0 },
    { id: 'campus', label: 'Campuses', count: summary?.branchesByType?.find((t: any) => t._id === 'campus')?.count || 0 },
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
                Branches & Locations
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage your church locations and campuses
              </p>
            </div>
            <button
              onClick={() => navigate('/branches/new')}
              className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Branch
            </button>
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
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Branch Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-0">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {branch.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {branch.code}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium capitalize rounded-full ${getTypeBadgeColor(branch.type)}`}>
                          {branch.type}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium capitalize rounded-full ${getStatusBadgeColor(branch.status)}`}>
                          {branch.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Branch Info */}
                  <div className="p-6 space-y-3">
                    {/* Address */}
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {branch.address?.street}, {branch.address?.city}
                      </p>
                    </div>

                    {/* Contact */}
                    {branch.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {branch.phone}
                        </p>
                      </div>
                    )}

                    {branch.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {branch.email}
                        </p>
                      </div>
                    )}

                    {/* Member Count */}
                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {branch.statistics?.memberCount || 0} Members
                      </p>
                    </div>

                    {/* Pastor */}
                    {branch.pastor && (
                      <div className="pt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pastor</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {branch.pastor.firstName} {branch.pastor.lastName}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleView(branch._id)}
                      className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(branch._id)}
                      className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch)}
                      className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
      />
    </div>
    </FeatureGate>
  );
};

export default Branches;