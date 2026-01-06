import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Building2, Check, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';

interface Church {
  _id: string;
  name: string;
  subdomain: string;
  memberCount: number;
  status: string;
}

interface ChurchSelectorProps {
  onSelectChurch?: (church: Church) => void;
  selectedChurchId?: string;
  className?: string;
  variant?: 'dropdown' | 'modal';
}

const ChurchSelector: React.FC<ChurchSelectorProps> = ({
  onSelectChurch,
  selectedChurchId,
  className = '',
  variant = 'dropdown'
}) => {
  const { user } = useAuth();
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.role?.slug === 'super_admin') {
      fetchChurches();
    }
  }, [user?.role?.slug]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only show for super admin
  if (user?.role?.slug !== 'super_admin') {
    return null;
  }

  const fetchChurches = async () => {
    try {
      setLoading(true);
      // Get all merchants (churches) - super admin can access all
      const response = await adminAPI.getAllMerchants({});
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      
      const mappedChurches: Church[] = data.map((merchant: any) => ({
        _id: merchant._id,
        name: merchant.name,
        subdomain: merchant.subdomain,
        memberCount: merchant.memberCount || 0,
        status: merchant.status
      }));

      setChurches(mappedChurches);
    } catch (error) {
      console.error('Failed to fetch churches:', error);
      showToast.error('Failed to load churches');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChurch = (church: Church) => {
    setIsOpen(false);
    if (onSelectChurch) {
      onSelectChurch(church);
    }
  };

  const selectedChurch = churches.find(c => c._id === selectedChurchId);
  const filteredChurches = churches.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (variant === 'modal') {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Select a Church
          </h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search churches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Churches List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-5 h-5 text-primary-600 animate-spin" />
              </div>
            ) : filteredChurches.length > 0 ? (
              filteredChurches.map((church) => (
                <button
                  key={church._id}
                  onClick={() => handleSelectChurch(church)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedChurchId === church._id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {church.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {church.subdomain}.thechurchhq.com
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {church.memberCount} members
                      </p>
                    </div>
                    {selectedChurchId === church._id && (
                      <Check className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8">
                <Building2 className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {searchTerm ? 'No churches found' : 'No churches available'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
          {selectedChurch?.name || 'Select Church'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search churches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Churches List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader className="w-5 h-5 text-primary-600 animate-spin" />
              </div>
            ) : filteredChurches.length > 0 ? (
              filteredChurches.map((church) => (
                <button
                  key={church._id}
                  onClick={() => handleSelectChurch(church)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                    selectedChurchId === church._id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {church.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {church.subdomain}.thechurchhq.com · {church.memberCount} members
                      </p>
                    </div>
                    {selectedChurchId === church._id && (
                      <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {searchTerm ? 'No churches found' : 'No churches available'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChurchSelector;
