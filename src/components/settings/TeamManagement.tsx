import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Trash2, Mail, Loader, Shield, Edit2, Users } from 'lucide-react';
import { teamAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { useAuth } from '../../context/AuthContext';
import InviteUserModal from '../modals/InviteUserModal';
import EditTeamMemberModal from '../modals/EditTeamMemberModal';
import ConfirmModal from '../modals/ConfirmModal';
import ManageRolesModal from '../roles/ManageRolesModal';

interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: {
    _id: string;
    name: string;
    slug: string;
  } | string;
  status: string;
  photo?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

const TeamManagement = () => {
  const { fetchAndUpdateSubscription, user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageRoles, setShowManageRoles] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);

  const roleOptions = [
    { value: 'church_admin', label: 'Admin' },
  ];

  useEffect(() => {
    fetchTeamMembers();
  }, [currentPage, searchQuery]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getTeamMembers({
        page: currentPage,
        limit: 10,
        search: searchQuery,
      });

      setMembers(response.data.data.users);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error: any) {
      console.error('Failed to fetch team members:', error);
      showToast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await teamAPI.updateMemberRole(memberId, { role: newRole });
      showToast.success('Role updated successfully');
      fetchTeamMembers();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setMemberToEdit(member);
    setShowEditModal(true);
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setShowDeleteModal(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToDelete) return;

    try {
      setDeleting(true);
      await teamAPI.removeTeamMember(memberToDelete.id);
      showToast.success('Team member removed successfully');
      setShowDeleteModal(false);
      setMemberToDelete(null);
      fetchTeamMembers();
      // Refresh subscription data to update usage counter
      await fetchAndUpdateSubscription();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setDeleting(false);
    }
  };

  const handleResendInvitation = async (memberId: string) => {
    try {
      setResendingInvite(memberId);
      await teamAPI.resendInvitation(memberId);
      showToast.success('Invitation resent successfully');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to resend invitation');
    } finally {
      setResendingInvite(null);
    }
  };

  const getStatusBadge = (member: TeamMember) => {
    if (member.status === 'pending' || !member.isEmailVerified) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-500/30">
          Pending
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-500/30">
        Active
      </span>
    );
  };

  const getRoleLabel = (role: string | { _id: string; name: string; slug: string }) => {
    if (typeof role === 'object' && role.name) {
      return role.name;
    }
    const option = roleOptions.find(r => r.value === role);
    return option?.label || String(role);
  };

  const getRoleSlug = (role: string | { _id: string; name: string; slug: string }): string => {
    if (typeof role === 'object' && role?.slug) {
      return role.slug;
    }
    return String(role);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Usage Stats */}
      {user?.merchant?.subscription && (
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Team Members
                </h3>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {user.merchant.subscription.usage?.users || 0}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">/</span>
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                    {user.merchant.subscription.limits?.users === null 
                      ? 'Unlimited' 
                      : user.merchant.subscription.limits?.users || 0}
                  </span>
                </div>
              </div>
            </div>
            {user.merchant.subscription.limits?.users !== null && (
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {Math.round(
                    ((user.merchant.subscription.usage?.users || 0) / 
                    (user.merchant.subscription.limits?.users || 1)) * 100
                  )}% used
                </span>
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        ((user.merchant.subscription.usage?.users || 0) / 
                        (user.merchant.subscription.limits?.users || 1)) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManageRoles(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            <Shield className="w-5 h-5" />
            <span>Manage Roles</span>
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span>Invite User</span>
          </button>
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No team members found</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="col-span-4 text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Name
              </div>
              <div className="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Status
              </div>
              <div className="col-span-3 text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Role
              </div>
              <div className="col-span-3 text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider text-right">
                Actions
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {/* Name */}
                  <div className="col-span-4 flex items-center space-x-3">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-gray-600 flex items-center justify-center text-primary-700 dark:text-gray-300 font-medium">
                        {getInitials(member.firstName, member.lastName)}
                      </div>
                    )}
                    <div>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
                      {member.status === 'pending' && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Invitation sent</p>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center">
                    {getStatusBadge(member)}
                  </div>

                  {/* Role */}
                  <div className="col-span-3 flex items-center">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {getRoleLabel(member.role)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEditMember(member)}
                      disabled={member.email === user?.email}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={member.email === user?.email ? "You cannot edit yourself" : "Edit role and permissions"}
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    {member.status === 'pending' && (
                      <button
                        onClick={() => handleResendInvitation(member._id)}
                        disabled={resendingInvite === member._id}
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Resend invitation"
                      >
                        {resendingInvite === member._id ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Mail className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveMember(member._id, `${member.firstName} ${member.lastName}`)}
                      disabled={member.email === user?.email}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={member.email === user?.email ? "You cannot remove yourself" : "Remove member"}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-6 py-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={async () => {
            setShowInviteModal(false);
            fetchTeamMembers();
            // Refresh subscription data to update usage counter
            await fetchAndUpdateSubscription();
          }}
        />
      )}

      {/* Edit Team Member Modal */}
      {showEditModal && memberToEdit && (
        <EditTeamMemberModal
          member={memberToEdit}
          onClose={() => {
            setShowEditModal(false);
            setMemberToEdit(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setMemberToEdit(null);
            fetchTeamMembers();
          }}
        />
      )}

      {/* Manage Roles Modal */}
      {showManageRoles && (
        <ManageRolesModal
          onClose={() => setShowManageRoles(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMemberToDelete(null);
        }}
        onConfirm={confirmRemoveMember}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${memberToDelete?.name || 'this team member'} from your team? This action cannot be undone.`}
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default TeamManagement;