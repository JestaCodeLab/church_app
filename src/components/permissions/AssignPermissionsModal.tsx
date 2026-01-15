import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface Role {
  _id: string;
  name: string;
  slug: string;
  permissions: any;
}

interface Permission {
  _id: string;
  category: string;
  action: string;
  displayName: string;
  roles: Array<{ _id: string; name: string; isActive: boolean }>;
}

interface AssignPermissionsModalProps {
  permission: Permission;
  roles: Role[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const AssignPermissionsModal: React.FC<AssignPermissionsModalProps> = ({
  permission,
  roles,
  onClose,
  onSave
}) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Initialize with currently assigned roles
    setSelectedRoles(permission.roles.map(r => r._id));
  }, [permission]);

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRoles.length === filteredRoles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(filteredRoles.map(r => r._id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        roleIds: selectedRoles
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSystemRole = (role: Role) => role.slug === 'super_admin' || role.slug === 'church_admin';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Assign Permission to Roles
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {permission.displayName} ({permission.category}.{permission.action})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Search Bar */}
          <div>
            <input
              type="text"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Select All */}
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedRoles.length === filteredRoles.length && filteredRoles.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-primary-600 rounded cursor-pointer"
            />
            <label
              htmlFor="select-all"
              className="ml-3 cursor-pointer font-medium text-gray-900 dark:text-white"
            >
              {selectedRoles.length === filteredRoles.length && filteredRoles.length > 0
                ? 'Deselect All'
                : `Select All (${filteredRoles.length})`}
            </label>
          </div>

          {/* Roles List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredRoles.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                No roles found
              </div>
            ) : (
              filteredRoles.map(role => (
                <div
                  key={role._id}
                  className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    id={`role-${role._id}`}
                    checked={selectedRoles.includes(role._id)}
                    onChange={() => handleRoleToggle(role._id)}
                    className="w-4 h-4 text-primary-600 rounded cursor-pointer"
                  />
                  <label
                    htmlFor={`role-${role._id}`}
                    className="ml-3 flex-1 cursor-pointer"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {role.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {role.slug}
                    </div>
                  </label>
                  {isSystemRole(role) && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full ml-2">
                      System
                    </span>
                  )}
                  {selectedRoles.includes(role._id) && (
                    <Check className="w-5 h-5 text-green-600 ml-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <span className="font-semibold">{selectedRoles.length}</span> role(s) selected
              {selectedRoles.length > 0 && (
                <>
                  {' '} - This permission will be{' '}
                  <span className="font-semibold">
                    {permission.roles.length === selectedRoles.length && 
                    permission.roles.every(r => selectedRoles.includes(r._id))
                      ? 'unchanged'
                      : 'updated'}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Assign Permission
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignPermissionsModal;
