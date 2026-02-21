import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Lock, Shield, Tag, Zap, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { adminAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { CreateRoleModal, RoleDetailsModal } from '../../components/roles';
import { CreatePermissionModal, AssignPermissionsModal, EditPermissionModal } from '../../components/permissions';

interface Role {
  _id: string;
  name: string;
  slug: string;
  description: string;
  type: 'system' | 'custom';
  level: number;
  permissions: Array<{
    permissionId: {
      _id: string;
      category: string;
      action: string;
      displayName: string;
      description?: string;
      scope: 'system' | 'custom';
    };
    assignedAt: string;
    assignedBy?: string;
  }>;
  usageCount: number;
  isActive: boolean;
}

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

interface PermissionCategory {
  _id: string;
  slug: string;
  name: string;
  description: string;
  order: number;
  permissionCount: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateCategoryFormData {
  name: string;
  slug: string;
  description: string;
}

const AdminRolesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'categories'>('roles');
  
  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);

  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [showCreatePermissionModal, setShowCreatePermissionModal] = useState(false);
  const [showEditPermissionModal, setShowEditPermissionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [expandedPermissions, setExpandedPermissions] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [permissionFormData, setPermissionFormData] = useState({
    displayName: '',
    description: ''
  });

  // Categories state
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PermissionCategory | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<CreateCategoryFormData>({
    name: '',
    slug: '',
    description: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRoles(),
        fetchPermissions(),
        fetchCategories()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await api.get('/roles');
      setRoles(response.data.data);
    } catch (error) {
      showToast.error('Failed to load roles');
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const response = await api.get('/admin/permissions');
      setPermissions(response.data.data || []);
    } catch (error) {
      showToast.error('Failed to load permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await adminAPI.getAllPermissionCategories();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // ROLES HANDLERS
  const handleCreateRole = async (roleData: any) => {
    try {
      await api.post('/roles', roleData);
      showToast.success('Custom role created successfully');
      setShowCreateModal(false);
      fetchRoles();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;

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

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // PERMISSIONS HANDLERS
  const handleCreatePermission = async (permissionData: any) => {
    try {
      await api.post('/admin/permissions', permissionData);
      showToast.success('Permission created successfully');
      setShowCreatePermissionModal(false);
      fetchPermissions();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to create permission');
    }
  };

  const handleEditPermissionClick = (permission: Permission) => {
    setSelectedPermission(permission);
    setPermissionFormData({
      displayName: permission.displayName,
      description: permission.description || ''
    });
    setShowEditPermissionModal(true);
  };

  const handleAssignPermissions = async (assignmentData: any) => {
    try {
      await api.post(`/admin/permissions/${selectedPermission?._id}/assign`, assignmentData);
      showToast.success('Permissions assigned successfully');
      setShowAssignModal(false);
      setSelectedPermission(null);
      fetchPermissions();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to assign permissions');
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!window.confirm('Are you sure? This will affect all roles using this permission.')) return;

    try {
      await api.delete(`/admin/permissions/${permissionId}`);
      showToast.success('Permission deleted successfully');
      fetchPermissions();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to delete permission');
    }
  };

  const toggleExpandPermission = (permId: string) => {
    setExpandedPermissions(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  // CATEGORY HANDLERS
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryFormData.name.trim()) {
      alert('Category name is required');
      return;
    }

    if (!categoryFormData.slug.trim()) {
      alert('Slug is required');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(categoryFormData.slug)) {
      alert('Slug must contain only lowercase letters, numbers, and underscores');
      return;
    }

    try {
      await adminAPI.createPermissionCategory(categoryFormData);
      alert('Category created successfully');
      setCategoryFormData({
        name: '',
        slug: '',
        description: ''
      });
      setShowCreateCategoryModal(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Error creating category:', error);
      alert(error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCategory) return;

    if (!categoryFormData.name.trim()) {
      alert('Category name is required');
      return;
    }

    if (!categoryFormData.slug.trim()) {
      alert('Slug is required');
      return;
    }

    try {
      await adminAPI.updatePermissionCategory(editingCategory._id, categoryFormData);
      alert('Category updated successfully');
      setCategoryFormData({
        name: '',
        slug: '',
        description: ''
      });
      setEditingCategory(null);
      setShowEditCategoryModal(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Error updating category:', error);
      alert(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await adminAPI.deletePermissionCategory(categoryId);
      alert('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleEditCategoryClick = (category: PermissionCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      slug: category.slug,
      description: category.description
    });
    setShowEditCategoryModal(true);
  };

  const handleOpenCreateCategoryModal = () => {
    setCategoryFormData({
      name: '',
      slug: '',
      description: ''
    });
    setShowCreateCategoryModal(true);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/-+/g, '_');
  };

  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCategoryFormData({
      ...categoryFormData,
      name,
      slug: generateSlug(name)
    });
  };

  const countEnabledPermissions = (permissions: any) => {
    // New architecture: array of permission references
    if (Array.isArray(permissions)) {
      return permissions.length;
    }
    // Legacy architecture: nested booleans
    let count = 0;
    Object.values(permissions).forEach((category: any) => {
      Object.values(category).forEach((permission: any) => {
        if (permission) count++;
      });
    });
    return count;
  };

  const permissionCategories = Array.from(new Set(permissions.map(p => p.category)));
  const filteredPermissions = filterCategory === 'all' 
    ? permissions 
    : permissions.filter(p => p.category === filterCategory);

  const isSuperAdmin = user?.role?.slug === 'super_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage system and custom roles, permissions, and categories
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          <Lock className="inline w-4 h-4 mr-2" />
          Roles ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'permissions'
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          <Shield className="inline w-4 h-4 mr-2" />
          Permissions ({permissions.length})
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Tag className="inline w-4 h-4 mr-2" />
            Categories ({categories.length})
          </button>
        )}
      </div>

      {/* ROLES TAB */}
      {activeTab === 'roles' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-stretch sm:items-center justify-between">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search roles by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchRoles}
                disabled={rolesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh roles"
              >
                <RefreshCw className={`w-5 h-5 ${rolesLoading ? 'animate-spin' : ''}`} />
                {rolesLoading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={() => {
                  setSelectedRole(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Create Custom Role
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredRoles.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'No roles found matching your search' : 'No roles found'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredRoles.map(role => (
                <div
                  key={role._id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => toggleExpandRole(role._id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        {expandedRoles.includes(role._id) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {role.name}
                          </h3>
                          {role.type === 'system' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                              <Lock className="w-3 h-3" />
                              System
                            </span>
                          )}
                          {role.type === 'custom' && (
                            <span className="inline-flex px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-primary-300 rounded-full text-xs font-medium">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {role.description || 'No description'}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                          {countEnabledPermissions(role.permissions)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">permissions</p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {role.usageCount}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">users</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedRole(role);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 hover:bg-primary-100 dark:hover:bg-blue-900/30 text-primary-600 rounded transition-colors"
                        title="View details"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
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
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role._id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                            title="Delete role"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {expandedRoles.includes(role._id) && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                      <PermissionMatrix permissions={role.permissions} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PERMISSIONS TAB */}
      {activeTab === 'permissions' && (
        <div>
          <div className="flex gap-2 justify-end mb-4">
            <button
              onClick={fetchPermissions}
              disabled={permissionsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh permissions"
            >
              <RefreshCw className={`w-5 h-5 ${permissionsLoading ? 'animate-spin' : ''}`} />
              {permissionsLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={() => {
                setSelectedPermission(null);
                setShowCreatePermissionModal(true);
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
            {permissionCategories.map(cat => (
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
              </div>
            ) : (
              filteredPermissions.map(permission => (
                <div
                  key={permission._id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
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
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
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

                    <div className="flex items-center gap-2 ml-4">
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
                        onClick={() => handleEditPermissionClick(permission)}
                        className="p-2 hover:bg-primary-100 dark:hover:bg-blue-900/30 text-primary-600 rounded transition-colors"
                        title="Edit permission"
                      >
                        <Edit2 className="w-5 h-5" />
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
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && isSuperAdmin && (
        <div>
          <div className="flex gap-2 justify-end mb-4">
            <button
              onClick={fetchCategories}
              disabled={categoriesLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh categories"
            >
              <RefreshCw className={`w-5 h-5 ${categoriesLoading ? 'animate-spin' : ''}`} />
              {categoriesLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={handleOpenCreateCategoryModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div
                  key={category._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
                >
                  <div
                    className="h-2 w-full bg-primary-500"
                  ></div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 dark:text-gray-400">
                      {category.description || 'No description'}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Slug:</span>
                        <code className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs dark:bg-gray-700 dark:text-gray-300">
                          {category.slug}
                        </code>
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-primary-50 rounded-lg dark:bg-primary-900/30">
                      <p className="text-sm text-primary-900 dark:text-blue-300">
                        <span className="font-semibold">{category.permissionCount}</span> permissions
                      </p>
                    </div>

                    <div className="mb-4">
                      {category.isActive ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium dark:bg-green-900/30 dark:text-green-300">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium dark:bg-gray-700 dark:text-gray-400">
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleEditCategoryClick(category)}
                        className="flex-1 px-3 py-2 rounded text-sm font-medium transition-colors bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="flex-1 px-3 py-2 rounded text-sm font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center dark:bg-gray-800 dark:border-gray-700">
                <p className="text-gray-600 mb-4 dark:text-gray-400">No categories found</p>
                <button
                  onClick={handleOpenCreateCategoryModal}
                  className="text-primary-600 hover:text-primary-700 font-medium dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Create the first category
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
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

      {showDetailsModal && selectedRole && (
        <RoleDetailsModal
          role={selectedRole}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRole(null);
          }}
        />
      )}

      {showCreatePermissionModal && (
        <CreatePermissionModal
          roles={roles}
          onClose={() => setShowCreatePermissionModal(false)}
          onSave={handleCreatePermission}
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

      {/* Edit Permission Modal */}
      {showEditPermissionModal && selectedPermission && (
        <EditPermissionModal
          permission={selectedPermission as any}
          allPermissions={permissions as any}
          onClose={() => {
            setShowEditPermissionModal(false);
            setSelectedPermission(null);
            setPermissionFormData({
              displayName: '',
              description: ''
            });
          }}
          onSave={(updatedPermission: any) => {
            setPermissions(permissions.map(p =>
              p._id === updatedPermission._id ? updatedPermission : p
            ));
            setShowEditPermissionModal(false);
            setSelectedPermission(null);
            setPermissionFormData({
              displayName: '',
              description: ''
            });
            fetchPermissions();
          }}
        />
      )}

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Category</h2>
              <button
                onClick={() => setShowCreateCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={handleCategoryNameChange}
                  placeholder="e.g., Member Management"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={categoryFormData.slug}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                  placeholder="e.g., member_management"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Lowercase letters, numbers, and underscores only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateCategoryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium dark:bg-blue-700 dark:hover:bg-primary-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Category</h2>
              <button
                onClick={() => setShowEditCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="p-6 space-y-4">
              {editingCategory.isSystem && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300">
                  ⚠️ System categories cannot be modified
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={handleCategoryNameChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={categoryFormData.slug}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Lowercase letters, numbers, and underscores only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditCategoryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium dark:bg-blue-700 dark:hover:bg-primary-600"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
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
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              {categoryNames[category] || category}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {perms.map((perm: any) => (
                <div
                  key={perm._id}
                  className="px-3 py-2 rounded text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 transition-colors"
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
      {Object.entries(permissions).map(([category, actions]) => (
        <div key={category}>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            {categoryNames[category] || category}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(actions as any).map(([action, enabled]) => {
              const actionLabel = typeof action === 'string' 
                ? action.replace(/([A-Z])/g, ' $1').trim()
                : String(action);
              
              return (
                <div
                  key={action}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    enabled
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {actionLabel}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminRolesPage;
