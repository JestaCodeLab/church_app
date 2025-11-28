import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { memberAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import AddMemberModal from '../../components/member/AddMemberModal';
import EditMemberModal from '../../components/member/EditMemberModal';
import DeleteMemberModal from '../../components/member/DeleteMemberModal';

const Members = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    visitors: 0,
    male: 0,
    female: 0,
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    gender: '',
    membershipType: '',
  });

  useEffect(() => {
    fetchMembers();
    fetchStats();
  }, [currentPage, searchQuery, activeTab, filters]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
        search: searchQuery,
      };

      // Add filters based on active tab
      if (activeTab !== 'all') {
        params.membershipType = activeTab;
      }

      // Add additional filters
      if (filters.status) params.status = filters.status;
      if (filters.gender) params.gender = filters.gender;
      if (filters.membershipType) params.membershipType = filters.membershipType;

      const response = await memberAPI.getMembers(params);
      console.log('Members response:', response);
      setMembers(response.data.data.members);
      setTotalPages(response.data.data.pagination.pages);
      setTotalMembers(response.data.data.pagination.totalItems);
    } catch (error: any) {
      showToast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await memberAPI.getStats();
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleEdit = (member: any) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleDelete = (member: any) => {
    setSelectedMember({
      id: member._id,
      name: member.fullName || `${member.firstName} ${member.lastName}`
    });
    setShowDeleteModal(true);
  };

  const handleView = (memberId: string) => {
    navigate(`/members/${memberId}`);
  };

  const handleSuccess = () => {
    fetchMembers();
    fetchStats();
  };

  const tabs = [
    { id: 'all', label: 'All', count: stats?.total },
    { id: 'member', label: 'Members', count: stats?.total - stats?.visitors },
    { id: 'leader', label: 'Leaders', count: 0 },
    { id: 'visitor', label: 'Visitors', count: stats?.visitors },
  ];

  const getRoleBadgeColor = (role: string) => {
    const colors: any = {
      pastor: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
      leader: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      elder: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
      deacon: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300',
      member: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      youth: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      children: 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300',
    };
    return colors[role] || colors.member;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: any = {
      active: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      visitor: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      new_convert: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
      transferred: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    };
    return colors[status] || colors.active;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Member Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your church members and their information
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            className="flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Member
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {stats?.total}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {stats?.active}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Male</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {stats?.male}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Female</p>
          <p className="text-3xl font-bold text-pink-600 dark:text-pink-400 mt-2">
            {stats?.female}
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Tabs & Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Tabs */}
            <div className="flex items-center space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search & Filter */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search members..."
                  className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 transition-colors w-64"
                />
              </div>
              <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400">No members found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium"
            >
              Add your first member
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {members.map((member) => (
                    <tr
                      key={member._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={member.photo || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}&background=4F46E5&color=fff`}
                            alt={member.firstName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {member.firstName} {member.lastName}
                            </div>
                            {member.age && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {member.age} years old
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {member.email || 'No email'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.phone || 'No phone'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.membershipType)}`}
                        >
                          {member.membershipType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(member.membershipStatus)}`}
                        >
                          {member.membershipStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleView(member._id)}
                            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalMembers)} of {totalMembers} members
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Modals */}
      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />

      <EditMemberModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMember(null);
        }}
        onSuccess={handleSuccess}
        memberId={selectedMember?._id || ''}
      />

      <DeleteMemberModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedMember(null);
        }}
        onSuccess={handleSuccess}
        member={selectedMember}
      />
    </div>
  );
};

export default Members;
