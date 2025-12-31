
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, Loader } from 'lucide-react';

interface SearchableSelectProps {
  label: string;
  placeholder?: string;
  value: string;
  options: Array<{ 
    _id: string; 
    firstName: string; 
    lastName: string; 
    email?: string;
    phone?: string;
    membershipType?: string;
  }>;
  onChange: (value: string) => void;
  onSearch?: (searchTerm: string) => Promise<any[]>; 
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  searchPlaceholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = 'Search...',
  value,
  options: initialOptions,
  onChange,
  onSearch, 
  required = false,
  disabled = false,
  error,
  helperText,
  searchPlaceholder = 'Search by name, email, or phone...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Get selected option details
  const selectedOption = initialOptions.find(opt => opt._id === value);
  const displayText = selectedOption 
    ? `${selectedOption.firstName} ${selectedOption.lastName}`
    : placeholder;

  // Combine initial options with search results
  const allOptions = searchTerm && searchResults.length > 0 
    ? searchResults 
    : initialOptions;

  // Filter options based on search (for client-side filtering)
  const filteredOptions = searchTerm && !onSearch
    ? allOptions.filter(opt => {
        const fullName = `${opt.firstName} ${opt.lastName}`.toLowerCase();
        const email = opt.email?.toLowerCase() || '';
        const phone = opt.phone?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || email.includes(search) || phone.includes(search);
      })
    : allOptions;

  // ✅ Debounced API search
  useEffect(() => {
    if (!onSearch || !searchTerm) {
      setSearchResults([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await onSearch(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, onSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setSearchResults([]);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Selected Value Display */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } rounded-lg bg-white dark:bg-gray-900 cursor-pointer flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-500 focus:ring-1 focus:ring-primary-500'
        }`}
      >
        <span className={`text-sm ${!value ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
          {displayText}
        </span>
        <div className="flex items-center space-x-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {helperText && !error && <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{helperText}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-600 sticky top-0 bg-white dark:bg-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader className="w-4 h-4 text-primary-500 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-80 overflow-y-auto">
            {/* No Selection Option */}
            <div
              onClick={() => handleSelect('')}
              className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700"
            >
              <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                -- No Selection --
              </span>
            </div>

            {/* Loading State */}
            {searching && (
              <div className="px-4 py-8 text-center">
                <Loader className="w-6 h-6 text-primary-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Searching...
                </p>
              </div>
            )}

            {/* Filtered Options */}
            {!searching && filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option._id}
                  onClick={() => handleSelect(option._id)}
                  className={`px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer transition-colors ${
                    value === option._id ? 'bg-primary-100 dark:bg-primary-900/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {option.firstName} {option.lastName}
                      </div>
                      {(option.email || option.phone) && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {option.email || option.phone}
                        </div>
                      )}
                    </div>
                    {option.membershipType && (
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded capitalize ml-2">
                        {option.membershipType}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : !searching && searchTerm ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No members found matching "{searchTerm}"
                </p>
                {onSearch && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Try searching by name, email, or phone
                  </p>
                )}
              </div>
            ) : !searching && !searchTerm && filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Start typing to search for members
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;