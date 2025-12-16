import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Loader,
  Calendar,
  Phone,
  Mail,
  CheckSquare,
  Square,
  RefreshCw
} from 'lucide-react';
import { eventAPI, branchAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import { format } from 'date-fns';

const GuestManagement = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState<any[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  
  // Convert modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchGuests();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, guests]);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getUnconvertedGuests();
      setGuests(response.data.data.guests);
      setFilteredGuests(response.data.data.guests);
    } catch (error: any) {
      showToast.error('Failed to fetch guests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredGuests(guests);
      return;
    }

    const filtered = guests.filter((guest) => {
      const name = `${guest.guest?.firstName} ${guest.guest?.lastName}`.toLowerCase();
      const phone = guest.guest?.phone || '';
      const eventTitle = guest.event?.title?.toLowerCase() || '';

      return name.includes(searchQuery.toLowerCase()) ||
             phone.includes(searchQuery) ||
             eventTitle.includes(searchQuery.toLowerCase());
    });

    setFilteredGuests(filtered);
  };

  const toggleSelectGuest = (guestId: string) => {
    setSelectedGuests(prev =>
      prev.includes(guestId)
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredGuests.map(g => g._id));
    }
  };

  const handleConvertSelected = async () => {
    if (selectedGuests.length === 0) {
      showToast.error('Please select at least one guest to convert');
      return;
    }

    try {
      const branchResponse = await branchAPI.getBranches({ status: 'active' });
      setBranches(branchResponse.data.data.branches);
      setShowConvertModal(true);
    } catch (error) {
      showToast.error('Failed to load branches');
    }
  };

  const confirmBulkConvert = async () => {
    if (!selectedBranch) {
      showToast.error('Please select a branch');
      return;
    }

    setConverting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const guestId of selectedGuests) {
        try {
          await eventAPI.convertGuestToMember(guestId, {
            branchId: selectedBranch
          });
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        showToast.success(`Successfully converted ${successCount} guest(s) to members`);
      }
      if (errorCount > 0) {
        showToast.error(`Failed to convert ${errorCount} guest(s)`);
      }

      setShowConvertModal(false);
      setSelectedBranch('');
      setSelectedGuests([]);
      await fetchGuests();
    } catch (error: any) {
      showToast.error('Bulk conversion failed');
    } finally {
      setConverting(false);
    }
  };

  // Group guests by person (same phone number)
  const groupedGuests = filteredGuests.reduce((acc, guest) => {
    const phone = guest.guest?.phone;
    if (!acc[phone]) {
      acc[phone] = {
        phone,
        name: `${guest.guest?.firstName} ${guest.guest?.lastName}`,
        email: guest.guest?.email,
        events: []
      };
    }
    acc[phone].events.push({
      id: guest._id,
      title: guest.event?.title,
      date: guest.event?.eventDate,
      checkInTime: guest.createdAt
    });
    return acc;
  }, {} as any);

  const uniqueGuests = Object.values(groupedGuests);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Guest Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Convert event guests to church members
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchGuests}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          
          {selectedGuests.length > 0 && (
            <button
              onClick={handleConvertSelected}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Convert Selected ({selectedGuests.length})
            </button>
          )}
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Search */}
        <div className="md:col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Total Count */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Unconverted Guests</p>
              <p className="text-3xl font-bold mt-1">{uniqueGuests.length}</p>
            </div>
            <Users className="w-10 h-10 opacity-80" />
          </div>
        </div>
      </div>

      {/* Guests List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : uniqueGuests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No unconverted guests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No results found for your search' : 'All event guests have been converted to members'}
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={toggleSelectAll}
                className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {selectedGuests.length === filteredGuests.length ? (
                  <CheckSquare className="w-5 h-5 mr-2 text-primary-600" />
                ) : (
                  <Square className="w-5 h-5 mr-2" />
                )}
                {selectedGuests.length === filteredGuests.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Guest Cards */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {uniqueGuests.map((guestGroup: any, index) => {
                const firstEvent = guestGroup.events[0];
                const isSelected = selectedGuests.includes(firstEvent.id);

                return (
                  <div
                    key={index}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                      isSelected ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelectGuest(firstEvent.id)}
                        className="mt-1"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-primary-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Guest Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {guestGroup.name}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-1" />
                                {guestGroup.phone}
                              </div>
                              {guestGroup.email && (
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-1" />
                                  {guestGroup.email}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedGuests([firstEvent.id]);
                              handleConvertSelected();
                            }}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors flex items-center"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Convert
                          </button>
                        </div>

                        {/* Event History */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Event History ({guestGroup.events.length})
                          </p>
                          <div className="space-y-2">
                            {guestGroup.events.slice(0, 3).map((event: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  <span className="font-medium text-gray-900 dark:text-gray-100 mr-2">
                                    {event.title}
                                  </span>
                                  <span className="text-xs">
                                    {format(new Date(event.date), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {guestGroup.events.length > 3 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                + {guestGroup.events.length - 3} more event(s)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Convert Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Convert Guests to Members
            </h3>

            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                You are converting <strong>{selectedGuests.length}</strong> guest(s) to church members
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Branch *
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Choose a branch...</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                All selected guests will be assigned to this branch
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setSelectedBranch('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkConvert}
                disabled={converting || !selectedBranch}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {converting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Convert to Members
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

export default GuestManagement;