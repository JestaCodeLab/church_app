import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Search,
  Download,
  Loader,
  RefreshCw,
  ArrowUpCircle,
  MoreVertical,
  Mail
} from 'lucide-react';
import { eventAPI, branchAPI, memberAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import { format } from 'date-fns';
import ConfirmModal from '../../../components/modals/ConfirmModal';

const EventAttendance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'members' | 'guests' | 'absentees'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // Recurring event support
  const [isRecurring, setIsRecurring] = useState(false);
  const [instances, setInstances] = useState<any[]>([]); // For recurring event dates/instances
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  
  // Convert guest modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [converting, setConverting] = useState(false);
  
  // Absentees
  const [absentees, setAbsentees] = useState<any[]>([]);
  const [checkingInAbsentee, setCheckingInAbsentee] = useState<string | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [pendingCheckInAbsentee, setPendingCheckInAbsentee] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, members: 0, guests: 0, absentees: 0 });

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      fetchAttendance();
    }
  }, [id, activeTab, currentPage]);

  useEffect(() => {
    if (event && id) {
      fetchAbsentees();
    }
  }, [event, id]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, attendance, absentees, activeTab]);

  useEffect(() => {
    // Update stats whenever attendance or absentees change
    setStats({
      total: attendance.length,
      members: attendance.filter(a => a.attendeeType === 'member').length,
      guests: attendance.filter(a => a.attendeeType === 'guest').length,
      absentees: absentees.length
    });
  }, [attendance, absentees]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      let isClickInside = false;
      menuRefs.current.forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          isClickInside = true;
        }
      });
      if (!isClickInside) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchEventDetails = async () => {
    try {
      const response = await eventAPI.getEvent(id!);
      setEvent(response.data.data.event);
      // Detect recurring event
      if (response.data.data.event?.isRecurring || response.data.data.event?.recurrence) {
        setIsRecurring(true);
        // Fetch instances for recurring event (API should provide this or add endpoint)
        if (response.data.data.event.instances) {
          setInstances(response.data.data.event.instances);
        }
      } else {
        setIsRecurring(false);
        setInstances([]);
      }
    } catch (error: any) {
      showToast.error('Failed to load service details');
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      let response;
      if (isRecurring && selectedInstanceId) {
        // Fetch attendance for selected instance of recurring service
        response = await eventAPI.getAttendance(selectedInstanceId, {
          page: currentPage,
          limit: 20
        });
      } else {
        // One-time service or all instances
        response = await eventAPI.getAttendance(id!, {
          page: currentPage,
          limit: 20
        });
      }
      setAttendance(response.data.data.attendance);
      setFilteredAttendance(response.data.data.attendance);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error: any) {
      showToast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchAbsentees = async () => {
    try {
      if (!event || !event.branch) return;
      
      const branchId = event.branch._id || event.branch;
      
      // Fetch all members from the event's branch
      const membersResponse = await memberAPI.getMembers({ 
        branch: branchId,
        status: 'active',
        limit: 1000
      });
      const branchMembers = membersResponse.data.data.members || [];
      
      // Get IDs of members who checked in
      const checkedInMemberIds = attendance
        .filter(a => a.attendeeType === 'member')
        .map(a => a.member?._id)
        .filter(Boolean);
      
      // Find members who didn't check in
      const absenteeList = branchMembers.filter(
        member => !checkedInMemberIds.includes(member._id)
      );
      
      setAbsentees(absenteeList);
    } catch (error: any) {
      // Silently fail - absentees is optional
      console.error('Failed to fetch absentees:', error);
      setAbsentees([]);
    }
  };

  const handleSearch = () => {
    if (activeTab === 'absentees') {
      // Search within absentees
      if (!searchQuery.trim()) {
        setFilteredAttendance(absentees.map(a => ({ ...a, attendeeType: 'absentee' })));
        return;
      }
      
      const filtered = absentees.filter((member) => {
        const name = `${member.firstName} ${member.lastName}`.toLowerCase();
        const phone = member.phone || '';
        return name.includes(searchQuery.toLowerCase()) || phone.includes(searchQuery);
      });
      
      setFilteredAttendance(filtered.map(a => ({ ...a, attendeeType: 'absentee' })));
      return;
    }

    // For other tabs, first filter by attendee type
    let dataToSearch = attendance;
    if (activeTab === 'members') {
      dataToSearch = attendance.filter(a => a.attendeeType === 'member');
    } else if (activeTab === 'guests') {
      dataToSearch = attendance.filter(a => a.attendeeType === 'guest');
    }

    if (!searchQuery.trim()) {
      setFilteredAttendance(dataToSearch);
      return;
    }

    const filtered = dataToSearch.filter((record) => {
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
      setOpenMenuId(null);
      await fetchAttendance();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to convert guest');
    } finally {
      setConverting(false);
    }
  };

  const handleCheckInAbsentee = (absentee: any) => {
    setPendingCheckInAbsentee(absentee);
    setShowCheckInModal(true);
  };

  const confirmCheckInAbsentee = async () => {
    if (!pendingCheckInAbsentee) return;
    setCheckingInAbsentee(pendingCheckInAbsentee._id);
    try {
      await eventAPI.checkInAttendance(id!, {
        memberId: pendingCheckInAbsentee._id,
        attendeeType: 'member',
        method: 'manual'
      });
      showToast.success(`${pendingCheckInAbsentee.firstName} ${pendingCheckInAbsentee.lastName} checked in successfully`);
      setOpenMenuId(null);
      setShowCheckInModal(false);
      setPendingCheckInAbsentee(null);
      // Refresh attendance and absentees
      await fetchAttendance();
      await fetchAbsentees();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to check in member');
    } finally {
      setCheckingInAbsentee(null);
    }
  };

  const formatCheckInTime = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  const formatCheckInTimeShort = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  return (
    <div className="min-h-screen bg-gray-0 dark:bg-gray-900">
      {/* Recurring event instance selector */}
      {isRecurring && instances.length > 0 && (
        <div className="max-w-8xl mx-auto py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Event Instance</label>
            <select
              value={selectedInstanceId || ''}
              onChange={e => {
                setSelectedInstanceId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Instances</option>
              {instances.map(inst => (
                <option key={inst._id} value={inst._id}>
                  {inst.title || event.title} - {format(new Date(inst.date), 'MMM dd, yyyy')}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 dark:border-gray-700 sticky top-0">
        <div className="max-w-8xl mx-auto py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/services/${id}`)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
                {event && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {event.title}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={fetchAttendance}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => {/* Export to CSV */}}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Export"
              >
                <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Attendees</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Members</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.members}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Guests</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.guests}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <UserX className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Absentees</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.absentees}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {[
              { key: 'all', label: 'All', icon: Users, color: 'blue' },
              { key: 'members', label: 'Members', icon: UserCheck, color: 'green' },
              { key: 'guests', label: 'Guests', icon: UserX, color: 'purple' },
              { key: 'absentees', label: 'Absentees', icon: UserX, color: 'red' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const count = tab.key === 'all' ? stats.total : tab.key === 'members' ? stats.members : tab.key === 'guests' ? stats.guests : stats.absentees;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key as any);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? `border-${tab.color}-500 text-${tab.color}-600 dark:text-${tab.color}-400`
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? `bg-${tab.color}-100 dark:bg-${tab.color}-900/20 text-${tab.color}-700 dark:text-${tab.color}-300`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Attendance List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Loading attendance...</p>
              </div>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No attendance records
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {searchQuery ? 'No results found for your search' : 'No one has checked in yet'}
              </p>
            </div>
          ) : (
            <>
              {/* Attendance Table */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Phone</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Check-in Time</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Method</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance.map((record) => {
                        const isAbsentee = record.attendeeType === 'absentee';
                        const isGuest = record.attendeeType === 'guest';
                        const name = isAbsentee
                          ? `${record.firstName} ${record.lastName}`
                          : isGuest
                            ? `${record.guest?.firstName} ${record.guest?.lastName}`
                            : `${record.member?.firstName} ${record.member?.lastName}`;
                        const phone = isAbsentee ? record.phone : (isGuest ? record.guest?.phone : record.member?.phone);
                        const email = isAbsentee ? record.email : (isGuest ? record.guest?.email : record.member?.email);
                        
                        return (
                          <tr key={record._id || record.email} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isAbsentee ? 'bg-red-500' : isGuest ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                                {name}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                              {phone || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                              {email ? (
                                <a 
                                  href={`mailto:${email}`} 
                                  className="text-blue-600 dark:text-blue-400 hover:underline truncate block w-32"
                                  title={email}
                                >
                                  {email}
                                </a>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isAbsentee
                                  ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                  : isGuest
                                    ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                    : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              }`}>
                                {isAbsentee ? 'Absent' : isGuest ? 'Guest' : 'Member'}
                              </span>
                            </td>
                            {!isAbsentee && (
                              <>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                  <div>
                                    <div>{format(new Date(record.checkIn?.timestamp || record.createdAt), 'MMM dd, yyyy')}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500">{format(new Date(record.checkIn?.timestamp || record.createdAt), 'hh:mm a')}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  <span className={`px-3 py-1 rounded text-xs font-medium ${
                                    record.checkIn?.method === 'qr'
                                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {record.checkIn?.method ? record.checkIn.method.toUpperCase() : 'UNKNOWN'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  {isGuest && record.guest?.convertedToMember ? (
                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                                      Converted
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full font-medium">
                                      Checked In
                                    </span>
                                  )}
                                </td>
                              </>
                            )}
                            {isAbsentee && (
                              <>
                                <td></td>
                                <td></td>
                                <td className="px-6 py-4 text-sm">
                                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded-full font-medium">
                                    Not Checked In
                                  </span>
                                </td>
                              </>
                            )}
                            <td className="px-6 py-4 text-right">
                              <div 
                                className="relative" 
                                ref={(el) => {
                                  if (el) {
                                    menuRefs.current.set(record._id || record.email, el);
                                  } else {
                                    menuRefs.current.delete(record._id || record.email);
                                  }
                                }}
                              >
                                <button
                                  onClick={() => setOpenMenuId(openMenuId === (record._id || record.email) ? null : (record._id || record.email))}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                  <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </button>

                                {openMenuId === (record._id || record.email) && (
                                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-max">
                                    {isAbsentee ? (
                                      <button
                                        onClick={() => handleCheckInAbsentee(record)}
                                        disabled={checkingInAbsentee === record._id}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 first:rounded-t-lg disabled:opacity-50"
                                      >
                                        {checkingInAbsentee === record._id ? (
                                          <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Checking in...
                                          </>
                                        ) : (
                                          <>
                                            <UserCheck className="w-4 h-4" />
                                            Check In Now
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      <>
                                        {isGuest && !record.guest?.convertedToMember && (
                                          <button
                                            onClick={() => handleConvertGuest(record)}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 first:rounded-t-lg"
                                          >
                                            <ArrowUpCircle className="w-4 h-4" />
                                            Convert to Member
                                          </button>
                                        )}
                                        {isGuest && record.guest?.convertedToMember && (
                                          <div className="px-4 py-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                            <UserCheck className="w-4 h-4" />
                                            Already Converted
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Convert Guest Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Convert to Member
            </h3>

            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>{selectedAttendance?.guest?.firstName} {selectedAttendance?.guest?.lastName}</strong>
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                {selectedAttendance?.guest?.phone}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Select Branch <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
              >
                <option value="">Choose a branch...</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setSelectedBranch('');
                  setSelectedAttendance(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmConvert}
                disabled={converting || !selectedBranch}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {converting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  'Convert'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ConfirmModal for Absentee Check-In */}
      <ConfirmModal
        isOpen={showCheckInModal && !!pendingCheckInAbsentee}
        onClose={() => {
          setShowCheckInModal(false);
          setPendingCheckInAbsentee(null);
        }}
        onConfirm={confirmCheckInAbsentee}
        title="Confirm Check-In"
        message={pendingCheckInAbsentee ? `Are you sure you want to manually check in ${pendingCheckInAbsentee.firstName} ${pendingCheckInAbsentee.lastName}?` : ''}
        confirmText="Confirm Check-In"
        cancelText="Cancel"
        type="warning"
        isLoading={checkingInAbsentee === pendingCheckInAbsentee?._id}
      />
    </div>
  );
};

export default EventAttendance;