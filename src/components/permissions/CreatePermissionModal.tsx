import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { adminAPI } from '../../services/api';

interface Role {
  _id: string;
  name: string;
  slug: string;
}

interface PermissionCategory {
  _id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface CreatePermissionModalProps {
  roles: Role[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const CreatePermissionModal: React.FC<CreatePermissionModalProps> = ({
  roles,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    category: '',
    action: '',
    displayName: '',
    description: '',
    selectedRoles: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await adminAPI.getAllPermissionCategories();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleRoleToggle = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter(id => id !== roleId)
        : [...prev.selectedRoles, roleId]
    }));
  };

  const handleSelectAllRoles = () => {
    if (formData.selectedRoles.length === roles.length) {
      setFormData(prev => ({ ...prev, selectedRoles: [] }));
    } else {
      setFormData(prev => ({ ...prev, selectedRoles: roles.map(r => r._id) }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.category.trim()) {
      setError('Category/Area is required');
      return false;
    }
    if (!formData.action.trim()) {
      setError('Action name is required');
      return false;
    }
    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return false;
    }

    // Validate action format (lowercase, alphanumeric)
    if (!/^[a-zA-Z0-9_]+$/.test(formData.action)) {
      setError('Action can only contain letters, numbers, and underscores');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave({
        category: formData.category,
        action: formData.action.toLowerCase(),
        displayName: formData.displayName,
        description: formData.description,
        roleIds: formData.selectedRoles
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryName = categories.find(cat => cat.slug === formData.category)?.name || '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Permission</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Category/Area Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Area / Category
                <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={loadingCategories}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              >
                <option value="">{loadingCategories ? 'Loading categories...' : 'Select area...'}</option>
                {categories.map(cat => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {selectedCategoryName && !loadingCategories && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {categories.find(cat => cat.slug === formData.category)?.description}
                </p>
              )}
            </div>

            {/* Action Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Action Name
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="action"
                value={formData.action}
                onChange={handleInputChange}
                placeholder="e.g., create, view, edit, delete"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Display Name
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="e.g., Create Members, View Reports"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Description (optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of what this permission allows"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Permission Path Preview */}
          <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Permission Path:</p>
            <p className="text-sm font-mono text-gray-900 dark:text-white">
              {formData.category}.{formData.action || 'action'}
            </p>
          </div>

          {/* Role Selection */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                Assign to Roles
              </label>
              {roles.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllRoles}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  {formData.selectedRoles.length === roles.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {roles.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No roles available</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {roles.map(role => (
                  <div
                    key={role._id}
                    className="flex items-center p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <input
                      type="checkbox"
                      id={`role-${role._id}`}
                      checked={formData.selectedRoles.includes(role._id)}
                      onChange={() => handleRoleToggle(role._id)}
                      className="w-4 h-4 text-primary-600 rounded cursor-pointer"
                    />
                    <label
                      htmlFor={`role-${role._id}`}
                      className="ml-3 flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {role.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {role.slug}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {formData.selectedRoles.length} role(s) selected
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
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Permission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePermissionModal;
