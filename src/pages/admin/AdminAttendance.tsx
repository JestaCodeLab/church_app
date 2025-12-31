import React, { useState, useEffect } from 'react';
import {
  attendanceAPI,
  eventAPI,
  memberAPI,
  servicesAPI,
} from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  Calendar,
  Users,
  TrendingUp,
} from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  member: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  status: string;
  attendanceDate: string;
  checkInMethod: string;
  recordedBy?: {
    firstName: string;
    lastName: string;
  };
}

const AdminAttendance = () => {
  const [attendableType, setAttendableType] = useState('Event');
  const [attendables, setAttendables] = useState<any[]>([]);
  const [selectedAttendable, setSelectedAttendable] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('present');
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    checkedIn: 0,
  });

  useEffect(() => {
    fetchAttendables();
    fetchMembers();
  }, [attendableType]);

  useEffect(() => {
    if (selectedAttendable) {
      fetchAttendance();
    }
  }, [selectedAttendable, attendanceDate]);

  useEffect(() => {
    calculateStats();
  }, [attendance]);

  const fetchAttendables = async () => {
    try {
      setLoading(true);
      if (attendableType === 'Event') {
        const response = await eventAPI.getEvents();
        setAttendables(response.data.data.events || []);
      } else {
        const response = await servicesAPI.getServices();
        setAttendables(response.data.data.services || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await memberAPI.getMembers({ status: 'active' });
      setMembers(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load members');
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getAttendance(
        attendableType,
        selectedAttendable,
        attendanceDate
      );
      setAttendance(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = attendance.length;
    const present = attendance.filter(
      (a) => a.status === 'present' || a.status === 'checked-in'
    ).length;
    const absent = attendance.filter((a) => a.status === 'absent').length;
    const checkedIn = attendance.filter((a) => a.status === 'checked-in').length;

    setStats({ total, present, absent, checkedIn });
  };

  const handleRecordAttendance = async (memberId: string, status: string) => {
    if (!selectedAttendable) {
      toast.error('Please select an event or service first.');
      return;
    }

    try {
      const attendanceRecord = {
        attendableType,
        attendableId: selectedAttendable,
        memberId,
        status,
        attendanceDate: new Date(attendanceDate).toISOString(),
      };

      await attendanceAPI.recordAttendance([attendanceRecord]);
      toast.success('Attendance recorded');
      await fetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record attendance');
    }
  };

  const handleBulkRecord = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    try {
      setLoading(true);
      const records = selectedMembers.map((memberId) => ({
        attendableType,
        attendableId: selectedAttendable,
        memberId,
        status: bulkStatus,
        attendanceDate: new Date(attendanceDate).toISOString(),
      }));

      await attendanceAPI.recordAttendance(records);
      toast.success(`Attendance recorded for ${selectedMembers.length} members`);
      setSelectedMembers([]);
      await fetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map((m) => m._id));
    }
  };

  const handleExport = async () => {
    if (!selectedAttendable) {
      toast.error('Please select an event or service first');
      return;
    }

    try {
      const response = await api.get('/attendance/export', {
        params: {
          attendableType,
          attendableId: selectedAttendable,
          startDate: attendanceDate,
          endDate: attendanceDate,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `attendance_${attendanceDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
      
      toast.success('Attendance exported successfully');
    } catch (error: any) {
      toast.error('Failed to export attendance');
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'present':
      case 'checked-in':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Attendance Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Record and manage attendance for events and services
        </p>
      </div>

      {/* Type Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="Event"
                checked={attendableType === 'Event'}
                onChange={() => {
                  setAttendableType('Event');
                  setSelectedAttendable('');
                  setAttendance([]);
                }}
                className="w-4 h-4"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Events
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="Service"
                checked={attendableType === 'Service'}
                onChange={() => {
                  setAttendableType('Service');
                  setSelectedAttendable('');
                  setAttendance([]);
                }}
                className="w-4 h-4"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Services
              </span>
            </label>
          </div>

          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select {attendableType}
            </label>
            <select
              onChange={(e) => {
                setSelectedAttendable(e.target.value);
                setSelectedMembers([]);
              }}
              value={selectedAttendable}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select an {attendableType}</option>
              {attendables.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      {selectedAttendable && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Recorded
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {stats.total}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats.present}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {stats.absent}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Checked In
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {stats.checkedIn}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      )}

      {/* Members Table */}
      {selectedAttendable && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Search and Actions */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedMembers.length > 0 && (
              <div className="flex items-center space-x-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedMembers.length} selected
                </span>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="present">Mark Present</option>
                  <option value="absent">Mark Absent</option>
                  <option value="checked-in">Mark Checked In</option>
                </select>
                <button
                  onClick={handleBulkRecord}
                  disabled={loading}
                  className="px-4 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Recording...' : 'Apply'}
                </button>
                <button
                  onClick={() => setSelectedMembers([])}
                  className="px-4 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {loading && !attendance.length ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMembers.map((member) => {
                    const attendanceRecord = attendance.find(
                      (a) => a.member._id === member._id
                    );
                    const isSelected = selectedMembers.includes(member._id);

                    return (
                      <tr
                        key={member._id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleMember(member._id)}
                            className="w-4 h-4 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {member.firstName} {member.lastName}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {attendanceRecord ? (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                                attendanceRecord.status
                              )}`}
                            >
                              {attendanceRecord.status}
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              Not Recorded
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button
                            onClick={() => handleRecordAttendance(member._id, 'present')}
                            className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg text-xs font-medium transition-colors"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleRecordAttendance(member._id, 'absent')}
                            className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg text-xs font-medium transition-colors"
                          >
                            Absent
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;

