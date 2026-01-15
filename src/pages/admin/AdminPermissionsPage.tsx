import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Shield, Tag, Zap } from 'lucide-react';
import api from '../../services/api';
import { showToast } from '../../utils/toasts';
import { CreatePermissionModal, AssignPermissionsModal, EditPermissionModal } from '../../components/permissions';

interface Permission {
  _id: string;
  category: string;
  action: string;
  displayName: string;
  description?: string;
  roles: Array<{ _id: string; name: string; isActive: boolean }>;
  createdAt: string;
  updatedAt: string;
}

interface Role {
  _id: string;
  name: string;
  slug: string;
  permissions: any;
}

const AdminPermissionsPage = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [expandedPermissions, setExpandedPermissions] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchPermissionsAndRoles();
  }, []);

  const fetchPermissionsAndRoles = async () => {
    try {
      setLoading(true);
      const [permRes, rolesRes] = await Promise.all([
        api.get('/admin/permissions'),
        api.get('/roles')
      ]);
      setPermissions(permRes.data.data || []);
      setRoles(rolesRes.data.data || []);
    } catch (error) {
      showToast.error('Failed to load permissions and roles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async (permissionData: any) => {
    try {
      await api.post('/admin/permissions', permissionData);
      showToast.success('Permission created successfully');
      setShowCreateModal(false);
      fetchPermissionsAndRoles();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to create permission');
    }
  };

  const handleAssignPermissions = async (assignmentData: any) => {
    try {
      await api.post(`/admin/permissions/${selectedPermission?._id}/assign`, assignmentData);
      showToast.success('Permissions assigned successfully');
      setShowAssignModal(false);
      setSelectedPermission(null);
      fetchPermissionsAndRoles();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to assign permissions');
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!window.confirm('Are you sure? This will affect all roles using this permission.')) return;

    try {
      await api.delete(`/admin/permissions/${permissionId}`);
      showToast.success('Permission deleted successfully');
      fetchPermissionsAndRoles();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to delete permission');
    }
  };

  const handleEditPermission = (updatedPermission: Permission) => {
    setPermissions(permissions.map(p => 
      p._id === updatedPermission._id ? updatedPermission : p
    ));
    setShowEditModal(false);
    setSelectedPermission(null);
  };

  const toggleExpandPermission = (permId: string) => {
    setExpandedPermissions(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const filteredPermissions = filterCategory === 'all' 
    ? permissions 
    : permissions.filter(p => p.category === filterCategory);

  const categories = Array.from(new Set(permissions.map(p => p.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-600" />
            Permissions Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage granular permissions, then assign them to roles
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedPermission(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Permission
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filterCategory === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          All Permissions ({permissions.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterCategory === cat
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {cat} ({permissions.filter(p => p.category === cat).length})
          </button>
        ))}
      </div>

      {/* Permissions List */}
      <div className="space-y-3">
        {filteredPermissions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">No permissions found</p>
            {filterCategory !== 'all' && (
              <button
                onClick={() => setFilterCategory('all')}
                className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                View all permissions
              </button>
            )}
          </div>
        ) : (
          filteredPermissions.map(permission => (
            <div
              key={permission._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Permission Header */}
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleExpandPermission(permission._id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    {expandedPermissions.includes(permission._id) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {permission.displayName}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                        <Tag className="w-3 h-3" />
                        {permission.category}
                      </span>
                    </div>
                    {permission.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {permission.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {permission.category}.{permission.action}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {permission.roles.filter(r => r.isActive).length}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">active roles</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedPermission(permission);
                      setShowEditModal(true);
                    }}
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded transition-colors"
                    title="Edit permission"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPermission(permission);
                      setShowAssignModal(true);
                    }}
                    className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded transition-colors"
                    title="Assign to roles"
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeletePermission(permission._id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                    title="Delete permission"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Expanded Details - Roles assigned */}
              {expandedPermissions.includes(permission._id) && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Assigned to {permission.roles.length} role(s)
                  </h4>
                  {permission.roles.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">Not assigned to any role yet</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {permission.roles.map(role => (
                        <div
                          key={role._id}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            role.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {role.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePermissionModal
          roles={roles}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreatePermission}
        />
      )}

      {showEditModal && selectedPermission && (
        <EditPermissionModal
          permission={selectedPermission}
          allPermissions={permissions}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPermission(null);
          }}
          onSave={handleEditPermission}
        />
      )}

      {showAssignModal && selectedPermission && (
        <AssignPermissionsModal
          permission={selectedPermission}
          roles={roles}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedPermission(null);
          }}
          onSave={handleAssignPermissions}
        />
      )}
    </div>
  );
};

export default AdminPermissionsPage;
