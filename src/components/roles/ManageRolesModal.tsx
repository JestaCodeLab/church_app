import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { showToast } from '../../utils/toasts';
import CreateRoleModal from './CreateRoleModal';

interface Role {
  _id: string;
  name: string;
  slug: string;
  description: string;
  type: 'system' | 'custom';
  permissions: any;
  usageCount: number;
  isActive: boolean;
}

interface ManageRolesModalProps {
  onClose: () => void;
}

const ManageRolesModal: React.FC<ManageRolesModalProps> = ({ onClose }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles');
      setRoles(response.data.data);
    } catch (error) {
      showToast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (roleData: any) => {
    try {
      await api.post('/roles', roleData);
      showToast.success('Custom role created successfully');
      setShowCreateModal(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this custom role?')) return;

    try {
      await api.delete(`/roles/${roleId}`);
      showToast.success('Role deleted successfully');
      fetchRoles();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const toggleExpandRole = (roleId: string) => {
    setExpandedRoles(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const countEnabledPermissions = (permissions: any) => {
    // New architecture: array of permission references
    if (Array.isArray(permissions)) {
      return permissions.length;
    }
    // Legacy: nested booleans
    let count = 0;
    Object.values(permissions).forEach((category: any) => {
      Object.values(category).forEach((permission: any) => {
        if (permission) count++;
      });
    });
    return count;
  };

  const getPermissionSummary = (permissions: any) => {
    const enabled = countEnabledPermissions(permissions);
    
    // New architecture: array
    if (Array.isArray(permissions)) {
      return {
        enabled,
        total: enabled // All permissions in array are enabled
      };
    }
    
    // Legacy: nested booleans
    const categories = Object.keys(permissions);
    return {
      enabled,
      total: categories.reduce((sum, cat) => sum + Object.keys(permissions[cat]).length, 0)
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Team Roles</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              View available roles and create custom roles for your team
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Create Custom Role Button */}
              <button
                onClick={() => {
                  setSelectedRole(null);
                  setShowCreateModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Custom Role
              </button>

              {/* Roles List */}
              <div className="space-y-3 mt-6">
                {roles.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400">No roles available</p>
                  </div>
                ) : (
                  roles.map(role => {
                    const summary = getPermissionSummary(role.permissions);
                    const isExpanded = expandedRoles.includes(role._id);

                    return (
                      <div
                        key={role._id}
                        className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        {/* Role Header */}
                        <div className="p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                          <button
                            onClick={() => toggleExpandRole(role._id)}
                            className="flex items-center gap-4 flex-1 text-left"
                          >
                            <div className="flex-shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              )}
                            </div>

                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {role.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {role.description || 'No description'}
                              </p>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {summary.enabled}/{summary.total}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">permissions</p>
                            </div>
                          </button>

                          {/* Actions */}
                          <div className="flex items-center gap-2 ml-4">
                            {role.type === 'custom' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedRole(role);
                                    setShowCreateModal(true);
                                  }}
                                  className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 rounded transition-colors"
                                  title="Edit role"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRole(role._id)}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                                  title="Delete role"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                            <PermissionMatrix permissions={role.permissions} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <CreateRoleModal
          role={selectedRole}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedRole(null);
          }}
          onSave={handleCreateRole}
        />
      )}
    </div>
  );
};

// Permission Matrix Component
const PermissionMatrix: React.FC<{ permissions: any }> = ({
  permissions
}) => {
  const categoryNames: Record<string, string> = {
    members: 'Member Management',
    departments: 'Department Management',
    branches: 'Branch Management',
    events: 'Event Management',
    finance: 'Financial Management',
    sermons: 'Sermon Management',
    communications: 'Communications',
    reports: 'Reports & Analytics',
    users: 'User Management',
    settings: 'Settings'
  };

  // NEW ARCHITECTURE: Array of permission ID references
  if (Array.isArray(permissions)) {
    // Group permissions by category
    const groupedByCategory: Record<string, any[]> = {};
    
    permissions.forEach((perm: any) => {
      const permObj = perm.permissionId || perm;
      if (!permObj) return;
      
      const category = permObj.category;
      if (!groupedByCategory[category]) {
        groupedByCategory[category] = [];
      }
      groupedByCategory[category].push(permObj);
    });

    return (
      <div className="space-y-4">
        {Object.entries(groupedByCategory).map(([category, perms]) => (
          <div key={category}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {categoryNames[category] || category}
              </h4>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {perms.length}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {perms.map((perm: any) => (
                <div
                  key={perm._id}
                  className="px-3 py-2 rounded text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  title={perm.displayName}
                >
                  {perm.displayName || perm.action}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // LEGACY ARCHITECTURE: Nested booleans
  return (
    <div className="space-y-4">
      {Object.entries(permissions).map(([category, actions]) => {
        const enabledCount = Object.values(actions as any).filter(v => v).length;
        const totalCount = Object.keys(actions as any).length;

        return (
          <div key={category}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {categoryNames[category] || category}
              </h4>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {enabledCount}/{totalCount}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(actions).map(([action, enabled]) => (
                <div
                  key={action}
                  className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                    enabled
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {enabled ? '✓' : '✗'} {action.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ManageRolesModal;
