import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';

interface PermissionCategory {
  _id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
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
  icon: string;
  color: string;
}

const AdminPermissionCategoriesPage: React.FC = () => {
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
    description: '',
    icon: 'cube',
    color: '#3B82F6'
  });

  const iconOptions = [
    'cube', 'users', 'settings', 'shield', 'bell',
    'mail', 'calendar', 'chart', 'lock', 'key',
    'smartphone', 'database', 'cloud', 'zap', 'layers'
  ];

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#14B8A6', '#F97316', '#6366F1'
  ];

  // Check authorization
  useEffect(() => {
    if (user?.role?.slug !== 'super_admin') {
      alert('You do not have permission to access this page');
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
      console.error('Error fetching categories:', error);
      alert(error.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }

    if (!formData.slug.trim()) {
      alert('Slug is required');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(formData.slug)) {
      alert('Slug must contain only lowercase letters, numbers, and underscores');
      return;
    }

    try {
      await adminAPI.createPermissionCategory(formData);
      alert('Category created successfully');
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: 'cube',
        color: '#3B82F6'
      });
      setShowCreateModal(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Error creating category:', error);
      alert(error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCategory) return;

    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }

    if (!formData.slug.trim()) {
      alert('Slug is required');
      return;
    }

    if (editingCategory.isSystem) {
      alert('System categories cannot be modified');
      return;
    }

    try {
      await adminAPI.updatePermissionCategory(editingCategory._id, formData);
      alert('Category updated successfully');
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: 'cube',
        color: '#3B82F6'
      });
      setEditingCategory(null);
      setShowEditModal(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Error updating category:', error);
      alert(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string, isSystem: boolean) => {
    if (isSystem) {
      alert('System categories cannot be deleted');
      return;
    }

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

  const handleEditClick = (category: PermissionCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      color: category.color
    });
    setShowEditModal(true);
  };

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: 'cube',
      color: '#3B82F6'
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Permission Categories</h1>
            <p className="text-gray-600 mt-2">Manage permission categories for your organization</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Create Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div
                key={category._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: category.color }}
                ></div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    {category.isSystem && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded">
                        System
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {category.description || 'No description'}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Slug:</span>
                      <code className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {category.slug}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Icon:</span>
                      <span className="text-gray-700 text-sm">{category.icon}</span>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">{category.permissionCount}</span> permissions
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

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEditClick(category)}
                      disabled={category.isSystem}
                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        category.isSystem
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id, category.isSystem)}
                      disabled={category.isSystem}
                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        category.isSystem
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-600 mb-4">No categories found</p>
              <button
                onClick={handleOpenCreateModal}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create the first category
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Create Category</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g., Member Management"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., member_management"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase letters, numbers, and underscores only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`p-2 rounded border-2 transition-all ${
                        formData.icon === icon
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded border-2 transition-all ${
                        formData.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Edit Category</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="p-6 space-y-4">
              {editingCategory.isSystem && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                  ⚠️ System categories cannot be modified
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={editingCategory.isSystem}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={editingCategory.isSystem}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase letters, numbers, and underscores only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={editingCategory.isSystem}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      disabled={editingCategory.isSystem}
                      className={`p-2 rounded border-2 transition-all ${
                        editingCategory.isSystem ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        formData.icon === icon
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      disabled={editingCategory.isSystem}
                      className={`w-8 h-8 rounded border-2 transition-all ${
                        editingCategory.isSystem ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        formData.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingCategory.isSystem}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                    editingCategory.isSystem
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
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

export default AdminPermissionCategoriesPage;
