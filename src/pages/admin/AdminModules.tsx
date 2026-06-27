import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { Plus, Edit2, Trash2, X, Loader, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';

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

const AdminModules: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PermissionCategory | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryFormData>({
    name: '',
    slug: '',
    description: ''
  });


  // Check authorization
  useEffect(() => {
    if (user?.role?.slug !== 'super_admin') {
      toast.error('You do not have permission to access this page');
      navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllPermissionCategories();
      setCategories(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching modules:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Module name is required');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(formData.slug)) {
      toast.error('Slug must contain only lowercase letters, numbers, and underscores');
      return;
    }

    try {
      await adminAPI.createPermissionCategory(formData);
      toast.success('Module created successfully');
      setFormData({
        name: '',
        slug: '',
        description: ''
      });
      setShowCreateModal(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Error creating module:', error);
      toast.error(error.response?.data?.message || 'Failed to create module');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCategory) return;

    if (!formData.name.trim()) {
      toast.error('Module name is required');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    try {
      await adminAPI.updatePermissionCategory(editingCategory._id, formData);
      toast.success('Module updated successfully');
      setFormData({
        name: '',
        slug: '',
        description: ''
      });
      setEditingCategory(null);
      setShowEditModal(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Error updating module:', error);
      toast.error(error.response?.data?.message || 'Failed to update module');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      await adminAPI.deletePermissionCategory(categoryId);
      toast.success('Module deleted successfully');
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting module:', error);
      toast.error(error.response?.data?.message || 'Failed to delete module');
    }
  };

  const handleEditClick = (category: PermissionCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description
    });
    setShowEditModal(true);
  };

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      slug: '',
      description: ''
    });
    setShowCreateModal(true);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/-+/g, '_');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Modules</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage feature modules and categories for your organization</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh modules"
          >
            <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Module
          </button>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div
                key={category._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md dark:hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{category.name}</h3>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {category.description || 'No description'}
                  </p>

                  <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                    <p className="text-sm text-primary-900 dark:text-primary-200">
                      <span className="font-semibold">{category.permissionCount}</span> Permissions
                    </p>
                  </div>

                  <div className="mb-4">
                    {category.isActive ? (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleEditClick(category)}
                      className="flex-1 px-3 py-2 rounded text-sm font-medium transition-colors bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30"
                    >
                      <Edit2 className="w-4 h-4 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="flex-1 px-3 py-2 rounded text-sm font-medium transition-colors bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No modules found</p>
              <button
                onClick={handleOpenCreateModal}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Create the first module
              </button>
            </div>
          )}
        </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Module</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Module Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g., Member Management"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., member_management"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this module"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Module</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Module Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
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

export default AdminModules;
