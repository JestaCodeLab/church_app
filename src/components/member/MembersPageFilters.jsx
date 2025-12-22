import React, { useState } from 'react';

const MembersPageFilters = ({ onFilterChange, merchantId }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const frontendUrl = process.env.REACT_APP_PROJECT_URL || window.location.origin;
  const registrationLink = `${frontendUrl}/register/${merchantId}`;

  const filters = [
    { id: 'all', label: 'All Members', count: null },
    { id: 'admin-added', label: 'Admin Added', registrationType: 'admin-added' },
    { id: 'member', label: 'Member Registration', registrationType: 'member' },
    { id: 'first-timer', label: 'First Timers', registrationType: 'first-timer' }
  ];

  const handleFilterClick = (filter) => {
    setActiveFilter(filter.id);
    onFilterChange(filter.registrationType || null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(registrationLink);
    // You can use toast here
    alert('Registration link copied to clipboard!');
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow p-1 flex space-x-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterClick(filter)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeFilter === filter.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Public Registration Link Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Public Registration Link</h3>
              <p className="text-xs text-gray-600 mt-1">
                Share this link for members to self-register
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLinkModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Get Link
          </button>
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Public Registration Link
              </h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Share this link with members so they can register themselves. The link allows them to choose between member registration or first-timer forms.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <code className="text-sm text-gray-800 break-all">
                {registrationLink}
              </code>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Link</span>
              </button>
              
              <button
                onClick={() => window.open(registrationLink, '_blank')}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Open</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPageFilters;