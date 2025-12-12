import React, { useState, useEffect } from 'react';
import {
  Church,
  Search,
  Loader,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Building2,
  Calendar
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Branch {
  _id: string;
  name: string;
  isMainBranch: boolean;
  location: {
    address: string;
    city: string;
    region: string;
    country: string;
  };
  contactInfo: {
    email: string;
    phone: string;
  };
  memberCount: number;
  status: string;
  createdAt: string;
  merchant: {
    _id: string;
    name: string;
    subdomain: string;
  };
}

const AdminBranches = () => {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBranches, setTotalBranches] = useState(0);

  useEffect(() => {
    fetchBranches();
  }, [currentPage]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (searchQuery) params.search = searchQuery;

      const response = await adminAPI.getAllBranches(params);
      setBranches(response.data.data.branches);
      setTotalPages(response.data.data.pagination.totalPages);
      setTotalBranches(response.data.data.pagination.totalItems);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchBranches();
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
            All Branches
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View all church branches across the platform
          </p>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{totalBranches}</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by branch name, city, or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12">
            <Church className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No branches found</p>
          </div>
        ) : (
          <>
            {/* Branch Cards */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {branches.map((branch) => (
                <div
                  key={branch._id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    {/* Left Side */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Church className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {branch.name}
                            </h3>
                            {branch.isMainBranch && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                Main
                              </span>
                            )}
                          </div>
                          {branch.merchant && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                              <Building2 className="w-4 h-4 mr-1" />
                              {branch.merchant.name}
                              <span className="text-gray-400 mx-2">•</span>
                              <span className="text-gray-500">{branch.merchant.subdomain}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {branch.location.address && `${branch.location.address}, `}
                          {branch.location.city}
                          {branch.location.region && `, ${branch.location.region}`}
                          {branch.location.country && `, ${branch.location.country}`}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {branch.contactInfo?.email && (
                          <span className="flex items-center">
                            📧 {branch.contactInfo.email}
                          </span>
                        )}
                        {branch.contactInfo?.phone && (
                          <span className="flex items-center">
                            📞 {branch.contactInfo.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Side - Stats */}
                    <div className="ml-6 flex flex-col items-end space-y-2">
                      <div className="text-right">
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4" />
                          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {branch.memberCount || 0}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Members
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        branch.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
                      }`}>
                        {branch.status === 'active' ? 'Active' : branch.status}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3 mr-1" />
                    Created {formatDate(branch.createdAt)}
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
    </div>
  );
};

export default AdminBranches;