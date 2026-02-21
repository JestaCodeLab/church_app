import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  UserPlus, 
  UserMinus,
  Mail,
  Phone,
  Users,
  Loader,
  Eye,
  X,
  Download
} from 'lucide-react';
import { branchAPI, memberAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import FeatureGate from '../../../components/access/FeatureGate';
import PermissionGuard from '../../../components/guards/PermissionGuard';

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
    _id: string;
    name: string;
  };
}

const BranchMembers = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Branch ID

  const [branch, setBranch] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  
  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Add Members Modal
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [modalSearching, setModalSearching] = useState(false);
  const modalSearchTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Remove Member Confirmation
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  useEffect(() => {
    fetchBranch();
    window.scrollTo({top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    fetchBranchMembers();
  }, [id, currentPage]);

  // Debounced search for member list
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm) {
      searchTimeoutRef.current = setTimeout(() => {
        setCurrentPage(1);
        fetchBranchMembers();
      }, 300);
    } else {
      fetchBranchMembers();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Debounced search for modal
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

  const fetchBranch = async () => {
    try {
      setLoading(true);
      const response = await branchAPI.getBranch(id);
      setBranch(response.data.data.branch);
    } catch (error: any) {
      showToast.error('Failed to load branch');
      navigate('/branches');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchMembers = async () => {
    try {
      setMembersLoading(true);
      
      const response = await memberAPI.getMembers({
        page: currentPage,
        limit: 20,
        branchId: id,
        search: searchTerm || undefined,
        status: 'active'
      });

      if (response.data.success) {
        setMembers(response.data.data.members);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalMembers(response.data.data.pagination.totalItems);
      }
    } catch (error: any) {
      showToast.error('Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchAvailableMembers = async () => {
    try {
      setModalSearching(true);
      
      const response = await memberAPI.getMembers({ 
        status: 'active', 
        limit: 50,
        search: memberSearchTerm || undefined
      });

      if (response.data.success) {
        // Filter out members already in this branch
        const currentMemberIds = members.map(m => m._id);
        const available = response.data.data.members.filter(
          (m: Member) => m.branch?._id !== id && !currentMemberIds.includes(m._id)
        );
        setAvailableMembers(available);
      }
    } catch (error: any) {
      showToast.error('Failed to load available members');
    } finally {
      setModalSearching(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedMemberIds.length === 0) {
      showToast.error('Please select at least one member');
      return;
    }

    try {
      setAddingMembers(true);

      // Update each selected member's branch
      const promises = selectedMemberIds.map(memberId => {
        return memberAPI.updateMember(memberId, {
          branch: id
        });
      });

      await Promise.all(promises);

      showToast.success(`${selectedMemberIds.length} member(s) added to branch`);
      setShowAddMembersModal(false);
      setSelectedMemberIds([]);
      setMemberSearchTerm('');
      fetchBranchMembers(); // Refresh the members list

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

      // Remove branch from member (set to null)
      await memberAPI.updateMember(memberToRemove._id, {
        branch: null
      });

      showToast.success('Member removed from branch');
      setMemberToRemove(null);
      fetchBranchMembers(); // Refresh the members list

    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  };

  const handleExportMembers = () => {
    if (members.length === 0) {
      showToast.error('No members to export');
      return;
    }

    // Prepare CSV data
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Membership Type', 'Status'];
    const rows = members.map(member => [
      member.firstName,
      member.lastName,
      member.email || '',
      member.phone || '',
      member.membershipType || '',
      member.membershipStatus || ''
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${branch.name}-members-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast.success(`Exported ${members.length} member(s)`);
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

  if (!branch) return null;

  return (
    <FeatureGate feature={'branchManagement'}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(`/branches/${id}`)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {branch.name} - Members
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {totalMembers} member(s) in this branch
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <PermissionGuard permission="branches.canExportMembers">
                <button
                  onClick={handleExportMembers}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  disabled={members.length === 0}
                  title="Export members as CSV"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
                </PermissionGuard>
                <PermissionGuard permission="branches.canAddMembers">
                <button
                  onClick={() => {
                    setMemberSearchTerm('');
                    setShowAddMembersModal(true);
                    fetchAvailableMembers();
                  }}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Members
                </button>
                </PermissionGuard>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
              />
              {membersLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader className="w-4 h-4 text-primary-500 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Members List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {membersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No members found' : 'No members in this branch yet'}
                </p>
                <button
                  onClick={() => navigate('/members/new', { state: { branchId: id } })}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Member
                </button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {members.map((member) => (
                    <div
                      key={member._id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Avatar */}
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
                        
                        {/* Member Info */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => navigate(`/members/${member._id}`)}
                        >
                          <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                            {member.firstName} {member.lastName}
                          </p>
                          <div className="flex items-center space-x-3 mt-1">
                            {member.email && (
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Mail className="w-3 h-3 mr-1" />
                                {member.email}
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Phone className="w-3 h-3 mr-1" />
                                {member.phone}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            member.membershipStatus === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {member.membershipStatus}
                          </span>

                          <button
                            onClick={() => navigate(`/members/${member._id}`)}
                            className="p-2 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title="View member"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <PermissionGuard permission="branches.canRemoveMembers">
                          <button
                            onClick={() => setMemberToRemove(member)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove from branch"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                          </PermissionGuard>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalMembers)} of {totalMembers} members
                    </p>
                    <div className="flex items-center space-x-2">
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
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add Existing Members Modal */}
        {showAddMembersModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Add Members to {branch.name}
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
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
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
                  <div className="mt-3 text-sm text-primary-600 dark:text-primary-400">
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
                        : 'All active members are already in this branch'}
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
                          className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="ml-3 flex items-center flex-1">
                          {member.photo ? (
                            <img
                              src={member.photo}
                              alt={`${member.firstName} ${member.lastName}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-gray-600 dark:text-gray-300 font-semibold">
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
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
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

        {/* Remove Member Confirmation Modal */}
        {memberToRemove && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Remove Member from Branch?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to remove <strong>{memberToRemove.firstName} {memberToRemove.lastName}</strong> from {branch.name}?
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
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove Member
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

export default BranchMembers;