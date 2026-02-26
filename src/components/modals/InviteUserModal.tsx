import React, { useState, useEffect } from 'react';
import { X, Loader, Mail, User, UserCog, GitBranch } from 'lucide-react';
import { teamAPI, branchAPI } from '../../services/api';
import api from '../../services/api';
import { showToast } from '../../utils/toasts';

interface InviteUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface RoleOption {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

interface BranchOption {
  _id: string;
  name: string;
}

const ADMIN_ROLES = ['super_admin', 'church_admin'];

const InviteUserModal: React.FC<InviteUserModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    branch: '',
  });

  // Fetch available roles and branches on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, branchesRes] = await Promise.all([
          api.get('/roles'),
          branchAPI.getBranches({ status: 'active', limit: 100 }),
        ]);

        // Filter out super_admin role
        const filteredRoles = rolesRes.data.data.filter(
          (role: RoleOption) => role.slug !== 'super_admin'
        );
        setRoleOptions(filteredRoles);

        // Set default to first role
        if (filteredRoles.length > 0) {
          setFormData(prev => ({ ...prev, role: filteredRoles[0].slug }));
        }

        // Set branches
        const branchList = branchesRes.data.data?.branches || branchesRes.data.data || [];
        setBranches(branchList);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        showToast.error('Failed to load roles or branches');
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Clear branch when switching to an admin role
      if (name === 'role' && ADMIN_ROLES.includes(value)) {
        updated.branch = '';
      }
      return updated;
    });
  };

  const selectedRole = roleOptions.find(r => r.slug === formData.role);
  const isAdminRole = selectedRole ? ADMIN_ROLES.includes(selectedRole.slug) : false;
  const showBranchSelector = !isAdminRole && branches.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.role) {
      showToast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
      };
      // Only send branch if one is selected (not "All Branches")
      if (formData.branch) {
        payload.branch = formData.branch;
      }

      await teamAPI.inviteTeamMember(payload);
      showToast.success('Team member invited successfully!');
      onSuccess();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to invite team member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Invite Team Member</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="John"
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="john.doe@example.com"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <UserCog className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
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

          {/* Branch Selector — only shown for non-admin roles */}
          {showBranchSelector && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign to Branch
              </label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Restrict this user's access to a specific branch, or leave as "All Branches" for full access.
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-primary-700 dark:text-blue-300">
              An invitation email will be sent to the user with login credentials.
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
              <span>{loading ? 'Sending...' : 'Send Invitation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;
