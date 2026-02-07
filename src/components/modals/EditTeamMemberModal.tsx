import React, { useState, useEffect } from 'react';
import { X, Loader, UserCog } from 'lucide-react';
import { teamAPI } from '../../services/api';
import api from '../../services/api';
import { showToast } from '../../utils/toasts';

interface EditTeamMemberModalProps {
  member: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: {
      _id: string;
      name: string;
      slug: string;
    } | string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface RoleOption {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

const EditTeamMemberModal: React.FC<EditTeamMemberModalProps> = ({ member, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [selectedRole, setSelectedRole] = useState('');

  // Fetch available roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/roles');
        // Filter out super_admin role
        const filteredRoles = response.data.data.filter(
          (role: RoleOption) => role.slug !== 'super_admin'
        );
        setRoleOptions(filteredRoles);
        
        // Set current role as default
        const currentRoleSlug = typeof member.role === 'string' ? member.role : member.role.slug;
        setSelectedRole(currentRoleSlug);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        showToast.error('Failed to load available roles');
      } finally {
        setFetching(false);
      }
    };

    fetchRoles();
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      showToast.error('Please select a role');
      return;
    }

    setLoading(true);

    try {
      await teamAPI.updateMemberRole(member._id, { role: selectedRole });
      showToast.success('Team member role updated successfully!');
      onSuccess();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update team member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Team Member</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Member Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {member.firstName} {member.lastName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {member.email}
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <UserCog className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                required
                disabled={fetching}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fetching ? (
                  <option>Loading roles...</option>
                ) : roleOptions.length === 0 ? (
                  <option>No available roles</option>
                ) : (
                  roleOptions.map((option) => (
                    <option key={option._id} value={option.slug}>
                      {option.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Changing the role will update the member's permissions immediately.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Updating...' : 'Update Role'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeamMemberModal;
