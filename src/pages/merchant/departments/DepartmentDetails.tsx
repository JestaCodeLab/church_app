import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Users, 
  UserCheck, 
  Clock, 
  Mail, 
  Phone, 
  MapPin,
  Loader,
  Send,
  TrendingUp,
  Calendar,
  Search,
  UserPlus,
  X,
  UserMinus,
  Trash
} from 'lucide-react';
import { showToast } from '../../../utils/toasts';
import { departmentAPI, memberAPI } from '../../../services/api';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo: string;
  membershipType: string;
  membershipStatus: string;
  branch: {
    name: string;
  };
  departments: string[];
}

const DepartmentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [department, setDepartment] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  
  // ✅ Member List Search
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Add Members Modal
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  
  // ✅ Modal Search
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [modalSearching, setModalSearching] = useState(false);
  const modalSearchTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Remove Member Confirmation
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  useEffect(() => {
    fetchDepartmentDetails();
    fetchDepartmentStatistics();
  }, [id]);

  // ✅ Fetch members when page or search changes
  useEffect(() => {
    fetchDepartmentMembers();
  }, [id, currentPage]);

  // ✅ Debounced search for member list
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm) {
      searchTimeoutRef.current = setTimeout(() => {
        setCurrentPage(1); // Reset to page 1 on new search
        fetchDepartmentMembers();
      }, 300);
    } else {
      fetchDepartmentMembers();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // ✅ Debounced search for modal
  useEffect(() => {
    if (!showAddMembersModal) return;

    if (modalSearchTimeoutRef.current) {
      clearTimeout(modalSearchTimeoutRef.current);
    }

    modalSearchTimeoutRef.current = setTimeout(() => {
      fetchAvailableMembers();
    }, 300);

    return () => {
      if (modalSearchTimeoutRef.current) {
        clearTimeout(modalSearchTimeoutRef.current);
      }
    };
  }, [memberSearchTerm, showAddMembersModal]);

  const fetchDepartmentDetails = async () => {
    try {
      setLoading(true);
      const response = await departmentAPI.getDepartment(id);

      if (response?.data.success) {
        setDepartment(response.data.data.department);
      }
    } catch (error: any) {
      showToast.error('Failed to load department details');
      navigate('/departments');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: API search for department members
  const fetchDepartmentMembers = async () => {
    try {
      setMembersLoading(true);
      const response = await departmentAPI.getDepartmentMembers(id, {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined
      });

      if (response?.data.success) {
        setMembers(response.data.data.members);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error: any) {
      showToast.error('Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchDepartmentStatistics = async () => {
    try {
      const response = await departmentAPI.getDepartmentStatistics(id);

      if (response.data.success) {
        setStatistics(response.data.data.statistics);
      }
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
    }
  };

  // ✅ FIXED: Fetch available members with API search + filter out current department members
  const fetchAvailableMembers = async () => {
    try {
      setModalSearching(true);
      
      const response = await memberAPI.getMembers({ 
        status: 'active', 
        limit: 50,
        search: memberSearchTerm || undefined
      });

      if (response.data.success) {
        // ✅ Filter out members already in this department
        const currentMemberIds = members.map(m => m._id);
        const available = response.data.data.members.filter(
          (m: Member) => !currentMemberIds.includes(m._id) && !m.departments?.includes(id!)
        );
        setAvailableMembers(available);
      }
    } catch (error: any) {
      showToast.error('Failed to load available members');
    } finally {
      setModalSearching(false);
    }
  };

  // ✅ Add members to department
  const handleAddMembers = async () => {
    if (selectedMemberIds.length === 0) {
      showToast.error('Please select at least one member');
      return;
    }

    try {
      setAddingMembers(true);

      // Add each selected member to the department
      const promises = selectedMemberIds.map(memberId => {
        const member = availableMembers.find(m => m._id === memberId);
        const currentDepartments = member?.departments || [];
        
        return memberAPI.updateMember(memberId, {
          departments: [...currentDepartments, id]
        });
      });

      await Promise.all(promises);

      showToast.success(`${selectedMemberIds.length} member(s) added successfully`);
      setShowAddMembersModal(false);
      setSelectedMemberIds([]);
      setMemberSearchTerm('');
      fetchDepartmentMembers(); // Refresh the members list
      fetchDepartmentStatistics(); // Refresh stats

    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to add members');
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      setRemovingMember(true);
      // Remove department from member's departments array
      console.log(memberToRemove)
      const updatedDepartments = memberToRemove?.departments.filter(
        (dept: any) => dept?.id !== id
      );
      console.log('here 2 ==>', updatedDepartments)

      await memberAPI.updateMember(memberToRemove._id, {
        departments: updatedDepartments
      });

      showToast.success('Member removed from department');
      setMemberToRemove(null);
      fetchDepartmentMembers(); // Refresh the members list
      fetchDepartmentStatistics(); // Refresh stats

    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!department) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <button
            onClick={() => navigate('/departments')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="flex items-start space-x-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${department.color}20` }}
            >
              {department.icon}
            </div>
            
            <div>
              <div className="flex flex-col items-start space-y-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {department.name}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  department.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {department.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {department.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {department.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setMemberSearchTerm('');
              setShowAddMembersModal(true);
              fetchAvailableMembers();
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Members
          </button>
          <button
            onClick={() => navigate(`/departments/${id}/edit`)}
            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Members</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics.totalMembers}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Members</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics.activeMembers}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Male / Female</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics.maleMembers} / {statistics.femaleMembers}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recent Joins</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics.recentJoins}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 30 days</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Department Details
            </h2>

            <div className="space-y-4">
              {/* Leader */}
              {department.leader && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Leader</p>
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {department.leader.firstName} {department.leader.lastName}
                    </span>
                  </div>
                  {department.leader.email && (
                    <div className="flex items-center space-x-2 mt-1 ml-6">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {department.leader.email}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Assistant Leaders */}
              {department.assistantLeaders && department.assistantLeaders.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Assistant Leaders</p>
                  <div className="space-y-2">
                    {department.assistantLeaders.map((leader: any) => (
                      <div key={leader._id} className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {leader.firstName} {leader.lastName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {(department.contactEmail || department.contactPhone) && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Contact</p>
                  {department.contactEmail && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a 
                        href={`mailto:${department.contactEmail}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {department.contactEmail}
                      </a>
                    </div>
                  )}
                  {department.contactPhone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a 
                        href={`tel:${department.contactPhone}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {department.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Meeting Schedule */}
              {department.meetingSchedule && department.meetingSchedule.day !== 'None' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Meeting Schedule</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {department.meetingSchedule.day}s at {department.meetingSchedule.time}
                      </span>
                    </div>
                    {department.meetingSchedule.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {department.meetingSchedule.location}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                      {department.meetingSchedule.frequency}
                    </p>
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Settings</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 dark:text-gray-100">Self-Registration</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      department.allowSelfRegistration
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {department.allowSelfRegistration ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Members ({statistics?.totalMembers || 0})
                </h2>
              </div>

              {/* ✅ Search with API */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                />
                {membersLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader className="w-4 h-4 text-primary-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {membersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-primary-600" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ? 'No members found' : 'No members in this department yet'}
                  </p>
                </div>
              ) : (
                <>
                  {members?.map((member) => (
                    <div
                      key={member._id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div 
                          className="flex-shrink-0 cursor-pointer"
                          onClick={() => navigate(`/members/${member._id}`)}
                        >
                          {member.photo ? (
                            <img
                              src={member.photo}
                              alt={`${member.firstName} ${member.lastName}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 dark:text-primary-400 font-semibold text-lg">
                                {member.firstName[0]}{member.lastName[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => navigate(`/members/${member._id}`)}
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {member.firstName} {member.lastName}
                          </p>
                          <div className="flex items-center space-x-3 mt-1">
                            {member.phone && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {member.phone}
                              </span>
                            )}
                            {member.branch && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                • {member.branch.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            member.membershipStatus === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {member.membershipStatus}
                          </span>

                          {/* ✅ Remove Member Button */}
                          <button
                            onClick={() => setMemberToRemove(member)}
                            className="p-1.5 text-white bg-red-600 hover:bg-red-500 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove from department"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Add Members Modal with API Search */}
      {showAddMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Add Members to {department?.name}
                </h3>
                <button
                  onClick={() => {
                    setShowAddMembersModal(false);
                    setSelectedMemberIds([]);
                    setMemberSearchTerm('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search */}
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members by name, email, or phone..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  {modalSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader className="w-4 h-4 text-primary-500 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Selected count */}
              {selectedMemberIds.length > 0 && (
                <div className="mt-3 text-sm text-blue-600 dark:text-blue-400">
                  {selectedMemberIds.length} member(s) selected
                </div>
              )}
            </div>

            {/* Modal Body - Members List */}
            <div className="flex-1 overflow-y-auto p-6">
              {modalSearching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : availableMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {memberSearchTerm
                      ? 'No members found matching your search'
                      : 'All active members are already in this department'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableMembers.map((member) => (
                    <label
                      key={member._id}
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(member._id)}
                        onChange={() => toggleMemberSelection(member._id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex items-center flex-1">
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-white dark:text-gray-300 font-semibold">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          </div>
                        )}
                        <div className="ml-3">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {member.email || member.phone}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddMembersModal(false);
                    setSelectedMemberIds([]);
                    setMemberSearchTerm('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={addingMembers}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMembers}
                  disabled={selectedMemberIds.length === 0 || addingMembers}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {addingMembers ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add {selectedMemberIds.length > 0 ? `(${selectedMemberIds.length})` : 'Members'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Remove Member from Department?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to remove <strong>{memberToRemove.firstName} {memberToRemove.lastName}</strong> from {department.name}?
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={removingMember}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={removingMember}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 inline-flex items-center"
              >
                {removingMember ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    Remove
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

export default DepartmentDetails;