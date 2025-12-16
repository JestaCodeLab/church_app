import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserMinus,
  Search,
  Download,
  Loader,
  RefreshCw,
  ArrowUpCircle
} from 'lucide-react';
import { eventAPI, branchAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import { format } from 'date-fns';

const EventAttendance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'members' | 'guests'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Convert guest modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      fetchAttendance();
    }
  }, [id, activeTab, currentPage]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, attendance]);

  const fetchEventDetails = async () => {
    try {
      const response = await eventAPI.getEvent(id!);
      setEvent(response.data.data.event);
    } catch (error: any) {
      showToast.error('Failed to load event details');
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getAttendance(id!, {
        attendeeType: activeTab !== 'all' ? activeTab.slice(0, -1) : undefined,
        page: currentPage,
        limit: 20
      });

      setAttendance(response.data.data.attendance);
      setFilteredAttendance(response.data.data.attendance);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error: any) {
      showToast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredAttendance(attendance);
      return;
    }

    const filtered = attendance.filter((record) => {
      const name = record.attendeeType === 'member'
        ? `${record.member?.firstName} ${record.member?.lastName}`.toLowerCase()
        : `${record.guest?.firstName} ${record.guest?.lastName}`.toLowerCase();
      
      const phone = record.attendeeType === 'member'
        ? record.member?.phone || ''
        : record.guest?.phone || '';

      return name.includes(searchQuery.toLowerCase()) || 
             phone.includes(searchQuery);
    });

    setFilteredAttendance(filtered);
  };

  const handleConvertGuest = async (attendanceRecord: any) => {
    if (attendanceRecord.guest?.convertedToMember) {
      showToast.error('This guest has already been converted to a member');
      return;
    }

    try {
      const branchResponse = await branchAPI.getBranches({ status: 'active' });
      setBranches(branchResponse.data.data.branches);
      setSelectedAttendance(attendanceRecord);
      setShowConvertModal(true);
    } catch (error) {
      showToast.error('Failed to load branches');
    }
  };

  const confirmConvert = async () => {
    if (!selectedBranch) {
      showToast.error('Please select a branch');
      return;
    }

    setConverting(true);
    try {
      await eventAPI.convertGuestToMember(selectedAttendance._id, {
        branchId: selectedBranch
      });
      
      showToast.success('Guest converted to member successfully');
      setShowConvertModal(false);
      setSelectedBranch('');
      setSelectedAttendance(null);
      await fetchAttendance();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to convert guest');
    } finally {
      setConverting(false);
    }
  };

  const getTabCount = (tab: string) => {
    if (tab === 'all') return attendance.length;
    return attendance.filter(a => 
      a.attendeeType === (tab === 'members' ? 'member' : 'guest')
    ).length;
  };

  const formatCheckInTime = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  const tabs = [
    { key: 'all', label: 'All Attendees', icon: Users },
    { key: 'members', label: 'Members', icon: UserCheck },
    { key: 'guests', label: 'Guests', icon: UserMinus }
  ];

  return (
    <div className="p-2 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Event Attendance
            </h1>
            {event && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {event.title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAttendance}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => {/* Export to CSV */}}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key as any);
                    setCurrentPage(1);
                  }}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {getTabCount(tab.key)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Attendance List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No attendance records
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No results found for your search' : 'No one has checked in yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Check-in Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Method
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAttendance.map((record) => {
                    const isGuest = record.attendeeType === 'guest';
                    const name = isGuest
                      ? `${record.guest?.firstName} ${record.guest?.lastName}`
                      : `${record.member?.firstName} ${record.member?.lastName}`;
                    const phone = isGuest ? record.guest?.phone : record.member?.phone;
                    
                    return (
                      <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {name}
                          </div>
                          {isGuest && record.guest?.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {record.guest.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isGuest
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}>
                            {isGuest ? 'Guest' : 'Member'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatCheckInTime(record.checkIn.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            record.checkIn.method === 'qr'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {record.checkIn.method.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {isGuest && !record.guest?.convertedToMember && (
                            <button
                              onClick={() => handleConvertGuest(record)}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center ml-auto"
                            >
                              <ArrowUpCircle className="w-4 h-4 mr-1" />
                              Convert to Member
                            </button>
                          )}
                          {isGuest && record.guest?.convertedToMember && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              ✓ Converted
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Convert Guest Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Convert Guest to Member
            </h3>

            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>{selectedAttendance?.guest?.firstName} {selectedAttendance?.guest?.lastName}</strong>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {selectedAttendance?.guest?.phone}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Branch *
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Choose a branch...</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setSelectedBranch('');
                  setSelectedAttendance(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmConvert}
                disabled={converting || !selectedBranch}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {converting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  'Convert to Member'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAttendance;