import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Loader,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Merchant {
  _id: string;
  name: string;
  email: string;
  subdomain: string;
  status: string;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
  };
}

const AdminMerchants = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMerchants, setTotalMerchants] = useState(0);
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; merchantId: string | null; merchantName: string }>({
    show: false,
    merchantId: null,
    merchantName: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteInputValue, setDeleteInputValue] = useState('');

  useEffect(() => {
    fetchMerchants();
  }, [currentPage, statusFilter]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;

      const response = await adminAPI.getAllMerchants(params);
      setMerchants(response.data.data.merchants);
      setTotalPages(response.data.data.pagination.totalPages);
      setTotalMerchants(response.data.data.pagination.totalItems);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load merchants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMerchants();
  };

  const handleStatusChange = async (merchantId: string, newStatus: string) => {
    try {
      await adminAPI.updateMerchantStatus(merchantId, newStatus);
      toast.success('Merchant status updated successfully');
      fetchMerchants();
      setSelectedMerchant(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const openDeleteConfirmation = (merchantId: string, merchantName: string) => {
    setDeleteConfirmation({
      show: true,
      merchantId,
      merchantName
    });
    setDeleteInputValue('');
    setSelectedMerchant(null);
  };

  const handleDeleteMerchant = async () => {
    if (!deleteConfirmation.merchantId) return;

    try {
      setIsDeleting(true);
      await adminAPI.deleteMerchant(deleteConfirmation.merchantId);
      toast.success(`Merchant "${deleteConfirmation.merchantName}" and all associated records deleted successfully`);
      setDeleteConfirmation({ show: false, merchantId: null, merchantName: '' });
      setDeleteInputValue('');
      fetchMerchants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete merchant');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
  const colors: any = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    pending_verification: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
    pending_onboarding: 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-blue-300',
    pending_approval: 'bg-purple-100 text-primary-700 dark:bg-purple-900/20 dark:text-primary-300',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
  };
  return colors[status] || colors.inactive;
};

  const getStatusLabel = (status: string) => {
  const labels: any = {
    active: 'Active',
    pending_verification: 'Pending Verification',
    pending_onboarding: 'Pending Onboarding',
    pending_approval: 'Pending Approval',
    suspended: 'Suspended',
    inactive: 'Inactive',
  };
  return labels[status] || status;
};

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Churches
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all churches on the platform
          </p>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total Merchants: <span className="font-semibold text-gray-900 dark:text-gray-100">{totalMerchants}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
           {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="pending_onboarding">Pending Onboarding</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          
          {/* Search */}
          <div className='flex gap-2'>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or subdomain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : merchants.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No merchants found</p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Church
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subdomain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {merchants.map((merchant) => (
                    <tr key={merchant._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {/* ✅ CLICKABLE MERCHANT NAME */}
                          <button
                            onClick={() => navigate(`/admin/churches/${merchant._id}`)}
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 text-left transition-colors"
                          >
                            {merchant.name}
                          </button>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {merchant.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {merchant.subdomain}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-blue-300 capitalize">
                          {merchant.subscription?.plan || 'Free'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(merchant.status)}`}>
                          {getStatusLabel(merchant.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(merchant.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setSelectedMerchant(selectedMerchant === merchant._id ? null : merchant._id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {selectedMerchant === merchant._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <div className="py-1">
                                {/* ✅ VIEW DETAILS BUTTON */}
                                <button
                                  onClick={() => {
                                    navigate(`/admin/churches/${merchant._id}`);
                                    setSelectedMerchant(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </button>
                                {merchant.status !== 'active' && (
                                  <button
                                    onClick={() => handleStatusChange(merchant._id, 'active')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Activate
                                  </button>
                                )}
                                {merchant.status !== 'suspended' && (
                                  <button
                                    onClick={() => handleStatusChange(merchant._id, 'suspended')}
                                    className="w-full px-4 py-2 text-left text-sm text-red-700 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Suspend
                                  </button>
                                )}
                                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                                <button
                                  onClick={() => openDeleteConfirmation(merchant._id, merchant.name)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Merchant
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {merchants.map((merchant) => (
                <div 
                  key={merchant._id} 
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/churches/${merchant._id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {merchant.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {merchant.subdomain}
                      </p>
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(merchant.status)}`}>
                      {getStatusLabel(merchant.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(merchant.createdAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMerchant(selectedMerchant === merchant._id ? null : merchant._id);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Delete Merchant?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  This action cannot be undone
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-300">
                  <strong>Warning:</strong> Deleting "{deleteConfirmation.merchantName}" will permanently remove:
                </p>
                <ul className="mt-3 space-y-2 text-xs text-red-700 dark:text-red-400 ml-4">
                  <li>• All members and families</li>
                  <li>• All events and registrations</li>
                  <li>• All departments and branches</li>
                  <li>• All users and team members</li>
                  <li>• All donations and transactions</li>
                  <li>• All SMS templates and settings</li>
                  <li>• The custom subdomain (thechurchhq.com)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type the merchant name to confirm:
                </label>
                <input
                  type="text"
                  placeholder="Enter merchant name..."
                  value={deleteInputValue}
                  onChange={(e) => setDeleteInputValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteConfirmation({ show: false, merchantId: null, merchantName: '' });
                  setDeleteInputValue('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMerchant}
                disabled={isDeleting || deleteInputValue !== deleteConfirmation.merchantName}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMerchants;