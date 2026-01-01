import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  Filter,
  Search,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader,
  Plus,
  Eye
} from 'lucide-react';
import { attendanceAPI } from '../../../services/api';
import toast from 'react-hot-toast';

interface GuestInfo {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

interface AttendanceRecord {
  _id: string;
  member: MemberInfo;
  guest?: GuestInfo | null;
  attendableType: string;
  status: string;
  attendanceDate: string;
  checkInMethod: string;
  recordedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface AttendanceStats {
  totalRecords: number;
  statusStats: {
    present?: number;
    absent?: number;
    'checked-in'?: number;
  };
  typeStats: {
    Event?: number;
    Service?: number;
  };
  methodStats: {
    admin?: number;
    'self-checkin-link'?: number;
    'qr-code'?: number;
  };
  recentAttendance: number;
}

interface MemberInfo {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface MemberAttendanceStats {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: string;
}

interface MemberAttendanceRecord {
  _id: string;
  member: MemberInfo;
  attendableType: 'Event' | 'Service';
  status: 'present' | 'absent' | 'checked-in';
  attendanceDate: string;
  checkInMethod: 'admin' | 'self-checkin-link' | 'qr-code';
  recordedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface MemberHistory {
  member: MemberInfo | null;
  statistics: MemberAttendanceStats;
  records: MemberAttendanceRecord[];
}

const MerchantAttendance = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'member'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberHistory, setMemberHistory] = useState<MemberHistory | null>(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);

  const recordsPerPage = 20;

  useEffect(() => {
    fetchAttendanceStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'records') {
      fetchAttendanceRecords();
    }
  }, [activeTab, currentPage, statusFilter, typeFilter, startDate, endDate]);

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getMerchantStats();
      setStats(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load attendance stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: recordsPerPage
      };

      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.attendableType = typeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await attendanceAPI.getAttendanceList(params);
      setRecords(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setFilteredRecords(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  // Helper to display attendee name (member or guest)
  const getAttendeeName = (record: AttendanceRecord) => {
    if (record.member) {
      return `${record.member.firstName} ${record.member.lastName}`;
    } else if (record.guest) {
      return `${record.guest.firstName} ${record.guest.lastName}`;
    }
    return 'Unknown';
  };

  // Helper to display attendee contact (member or guest)
  const getAttendeeContact = (record: AttendanceRecord) => {
    if (record.member) {
      return record.member.email || record.member.phoneNumber;
    } else if (record.guest) {
      return record.guest.email || record.guest.phone;
    }
    return '';
  };

  const fetchMemberHistory = async (memberId: string) => {
    try {
      const response = await attendanceAPI.getMemberHistory(memberId);
      setMemberHistory(response.data);
      setShowMemberDetails(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load member history');
    }
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.attendableType = typeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await attendanceAPI.exportAttendance(params);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link?.parentNode?.removeChild(link);
      
      toast.success('Attendance exported successfully');
    } catch (error: any) {
      toast.error('Failed to export attendance records');
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'present':
      case 'checked-in':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'self-checkin-link':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'qr-code':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getMethodBadgeColor = (method: string) => {
  switch (method) {
    case 'admin':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'self-checkin-link':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'qr-code':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

  if (loading && activeTab === 'overview') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Attendance Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track and manage member attendance across events and services
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'records'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Records
          </button>
          <button
            onClick={() => setActiveTab('member')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'member'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Member History
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Records */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Records</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {stats.totalRecords.toLocaleString()}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Present */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present</p>
                  <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {(stats.statusStats.present || 0).toLocaleString()}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Absent */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</p>
                  <h3 className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                    {(stats.statusStats.absent || 0).toLocaleString()}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            {/* Recent (30 days) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last 30 Days</p>
                  <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                    {stats.recentAttendance.toLocaleString()}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Type */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                By Types
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.typeStats).map(([type, count]: [string, any]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{type}</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Check-in Method */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Check-in Methods
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.methodStats).map(([method, count]: [string, any]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                      {method.replace('-', ' ')}
                    </span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="checked-in">Checked In</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All</option>
                  <option value="Event">Event</option>
                  <option value="Service">Service</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Export Button */}
              <div className="flex items-end">
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center justify-center transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Records Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No attendance records found</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {records.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {getAttendeeName(record)}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            {getAttendeeContact(record)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {record.attendableType}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMethodBadgeColor(record.checkInMethod)}`}>
                          {record.checkInMethod.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(record.attendanceDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {record.member ? (
                          <button
                            onClick={() => {
                              setSelectedMember(record.member!._id);
                              setActiveTab('member');
                              fetchMemberHistory(record.member!._id);
                            }}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Member History Tab */}
      {activeTab === 'member' && memberHistory && (
        <div className="space-y-6">
          {/* Member Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {memberHistory.member?.firstName?.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {memberHistory.member?.firstName} {memberHistory.member?.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {memberHistory.member?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Attendance</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {memberHistory.statistics.totalRecords}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {memberHistory.statistics.presentCount}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                {memberHistory.statistics.absentCount}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance Rate</p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
                {memberHistory.statistics.attendanceRate}
              </p>
            </div>
          </div>

          {/* Attendance Records */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Attendance History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Method
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {memberHistory.records.map((record: AttendanceRecord) => (
                    <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(record.attendanceDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {record.attendableType}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMethodBadgeColor(record.checkInMethod)}`}>
                          {record.checkInMethod.replace('-', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantAttendance;
