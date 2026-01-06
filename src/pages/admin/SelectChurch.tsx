import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMerchant } from '../../context/MerchantContext';
import { adminAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';

interface Church {
  _id: string;
  name: string;
  subdomain: string;
  memberCount: number;
  status: string;
  createdAt: string;
}

const SelectChurch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setSelectedMerchantId, setSelectedMerchantSubdomain } = useMerchant();
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Only show for super admin
  useEffect(() => {
    if (user && user.role?.slug !== 'super_admin') {
      navigate('/dashboard');
      return;
    }

    fetchChurches();
  }, [user, navigate]);

  const fetchChurches = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllMerchants({});
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];

      const mappedChurches: Church[] = data.map((merchant: any) => ({
        _id: merchant._id,
        name: merchant.name,
        subdomain: merchant.subdomain,
        memberCount: merchant.memberCount || 0,
        status: merchant.status,
        createdAt: merchant.createdAt
      }));

      setChurches(mappedChurches);

      // Auto-select if only one church
      if (mappedChurches.length === 1) {
        setSelectedId(mappedChurches[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch churches:', error);
      showToast.error('Failed to load churches');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChurch = (church: Church) => {
    setSelectedId(church._id);
  };

  const handleEnterChurch = () => {
    if (!selectedId) {
      showToast.error('Please select a church');
      return;
    }

    const church = churches.find(c => c._id === selectedId);
    if (church) {
      setSelectedMerchantId(selectedId);
      setSelectedMerchantSubdomain(church.subdomain);
      navigate('/dashboard');
    }
  };

  const filteredChurches = churches.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChurch = churches.find(c => c._id === selectedId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-lg mb-6">
            <Building2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Select a Church
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Choose which church you'd like to manage
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader className="w-10 h-10 text-primary-600 dark:text-primary-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading churches...</p>
            </div>
          </div>
        ) : churches.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Churches Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              There are currently no churches to manage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search & List */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                {/* Search */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search churches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Churches Grid */}
                <div className="space-y-3">
                  {filteredChurches.length > 0 ? (
                    filteredChurches.map((church) => (
                      <button
                        key={church._id}
                        onClick={() => handleSelectChurch(church)}
                        className={`w-full text-left p-4 rounded-lg transition-all border-2 ${
                          selectedId === church._id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 hover:border-primary-300 dark:hover:border-primary-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                              {church.name}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <p>{church.subdomain}.thechurchhq.com</p>
                              <span className="hidden sm:inline">•</span>
                              <p>{church.memberCount} members</p>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ml-4 flex items-center justify-center ${
                              selectedId === church._id
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {selectedId === church._id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No churches found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary & Action */}
            <div className="flex flex-col gap-6">
              {/* Selected Church Summary */}
              {selectedChurch && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Selected Church
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Name</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {selectedChurch.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subdomain</p>
                      <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                        {selectedChurch.subdomain}.thechurchhq.com
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Members</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {selectedChurch.memberCount}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleEnterChurch}
                    className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <span>Enter Church</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Info Card */}
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-6">
                <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
                  💡 Tip
                </h3>
                <p className="text-sm text-primary-800 dark:text-primary-200">
                  As a super admin, you have access to all churches. Select one to manage its members, events, departments, and more.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectChurch;
