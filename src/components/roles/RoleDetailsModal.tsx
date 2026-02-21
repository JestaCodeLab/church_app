import React, { useState } from 'react';
import { X, User, Lock } from 'lucide-react';

interface Role {
  _id: string;
  name: string;
  slug: string;
  description: string;
  type: 'system' | 'custom';
  permissions: any;
  usageCount: number;
  usersWithRole?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

interface RoleDetailsModalProps {
  role: Role;
  onClose: () => void;
}

const permissionCategoryLabels: Record<string, string> = {
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

const RoleDetailsModal: React.FC<RoleDetailsModalProps> = ({ role, onClose }) => {
  const [activeTab, setActiveTab] = useState<'can' | 'cannot'>('can');
  
  const countEnabledPermissions = (permissions: any): number => {
    // New architecture: array count
    if (Array.isArray(permissions)) {
      return permissions.length;
    }
    // Legacy: nested boolean count
    let count = 0;
    Object.values(permissions).forEach((category: any) => {
      Object.values(category).forEach((permission: any) => {
        if (permission) count++;
      });
    });
    return count;
  };

  const getDisabledPermissions = (permissions: any) => {
    // New architecture: array - all are enabled
    if (Array.isArray(permissions)) {
      return [];
    }
    
    // Legacy: nested booleans
    const disabled: string[] = [];
    Object.entries(permissions).forEach(([category, actions]: [string, any]) => {
      Object.entries(actions).forEach(([action, enabled]) => {
        if (!enabled) {
          disabled.push(`${category}.${action}`);
        }
      });
    });
    return disabled;
  };

  const enabledCount: number = countEnabledPermissions(role.permissions);
  const disabledPermissions = getDisabledPermissions(role.permissions);
  
  // New architecture: array count, Legacy: nested boolean count
  const totalPermissions: number = Array.isArray(role.permissions)
    ? role.permissions.length
    : (Object.values(role.permissions as any).reduce(
        (sum: number, cat: any) => sum + Object.keys(cat).length,
        0
      ) as number);

  // Helper function to get permission display name
  const getPermissionDisplayName = (perm: any): string => {
    if (perm.displayName) {
      return perm.displayName;
    }
    // Fallback to action name formatted nicely
    const action = perm.action || perm;
    const actionStr = typeof action === 'string' ? action : String(action);
    return actionStr.replace(/([A-Z])/g, ' $1').trim();
  };

  // Helper function to get category label
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
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
    return labels[category] || category;
  };

  // Group enabled permissions by category (for new architecture)
  const groupPermissionsByCategory = (): Record<string, any[]> => {
    if (!Array.isArray(role.permissions)) {
      return {};
    }
    
    const grouped: Record<string, any[]> = {};
    role.permissions.forEach((perm: any) => {
      const permObj = perm.permissionId || perm;
      if (!permObj) return;
      
      const category = permObj.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permObj);
    });
    
    return grouped;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {role.name}
              </h2>
              {role.type === 'system' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                  <Lock className="w-3 h-3" />
                  System Role
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {role.description || 'No description'}
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
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{enabledCount}</p>
              <p className="text-sm text-green-700 dark:text-green-300">Permissions Enabled</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg p-4">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalPermissions - enabledCount}</p>
              <p className="text-sm text-red-700 dark:text-red-300">Permissions Disabled</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{role.usageCount}</p>
              <p className="text-sm text-primary-700 dark:text-blue-300">Users Assigned</p>
            </div>
          </div>

          {/* Permissions Tabs */}
          <div>
            <div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('can')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'can'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                ✓ Can Access ({enabledCount})
              </button>
              <button
                onClick={() => setActiveTab('cannot')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'cannot'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                ✗ Cannot Access ({totalPermissions - enabledCount})
              </button>
            </div>

            {/* Can Access Tab */}
            {activeTab === 'can' && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-4">
                {Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                  Object.entries(groupPermissionsByCategory()).map(([category, perms]) => (
                    <div key={category}>
                      <p className="font-medium text-green-900 dark:text-green-300 mb-2">
                        {getCategoryLabel(category)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {perms.map((perm: any) => (
                          <span
                            key={perm._id}
                            className="px-3 py-1 bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-300 rounded-full text-sm font-medium"
                            title={perm.description || ''}
                          >
                            ✓ {getPermissionDisplayName(perm)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No permissions assigned</p>
                )}
              </div>
            )}

            {/* Cannot Access Tab */}
            {activeTab === 'cannot' && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                {disabledPermissions.length === 0 ? (
                  <p className="text-red-800 dark:text-red-300">
                    This role has access to all available features.
                  </p>
                ) : (
                  <p className="text-red-800 dark:text-red-300">
                    Legacy permissions disabled. New architecture uses permission references.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Users with this role */}
          {role.usageCount > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Team Members ({role.usageCount})
              </h3>
              <div className="space-y-2">
                {role.usersWithRole?.map(user => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleDetailsModal;
