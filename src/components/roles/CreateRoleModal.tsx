import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import { showToast } from '../../utils/toasts';

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: any;
}

interface CreateRoleModalProps {
  role?: Role | null;
  onClose: () => void;
  onSave: (roleData: any) => Promise<void>;
}

type PermissionStructure = Record<string, { category: string; actions: Record<string, string> }>;

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ role, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {}
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [permissionCategories, setPermissionCategories] = useState<PermissionStructure>({});
  const [activeTab, setActiveTab] = useState<string>('');

  // Fetch permission structure from backend
  useEffect(() => {
    const fetchPermissionStructure = async () => {
      try {
        const response = await api.get('/roles/permissions/structure');
        setPermissionCategories(response.data.data);
        const firstKey = Object.keys(response.data.data)[0];
        setActiveTab(firstKey);
        setFormData(prev => ({
          ...prev,
          permissions: getDefaultPermissions(response.data.data)
        }));
      } catch (error) {
        showToast.error('Failed to load permission structure');
        console.error('Failed to fetch permission structure:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchPermissionStructure();
  }, []);

  // Load role data if editing
  useEffect(() => {
    if (role && Object.keys(permissionCategories).length > 0) {
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions as typeof formData.permissions
      });
    }
  }, [role, permissionCategories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionToggle = (category: string, action: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: {
          ...prev.permissions[category],
          [action]: !prev.permissions[category][action]
        }
      }
    }));
  };

  const handleSelectAll = (category: string) => {
    const allEnabled = Object.values(formData.permissions[category]).every(v => v);
    const newPermissions = { ...formData.permissions };

    Object.keys(newPermissions[category]).forEach(action => {
      newPermissions[category][action] = !allEnabled;
    });

    setFormData(prev => ({
      ...prev,
      permissions: newPermissions
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast.error('Role name is required');
      return;
    }

    setLoading(true);
    try {
      if (role) {
        await api.put(`/roles/${role._id}`, {
          description: formData.description,
          permissions: formData.permissions
        });
        showToast.success('Role updated successfully');
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const currentPermissions = formData.permissions[activeTab] || {};
  const currentCategory = permissionCategories[activeTab];
  const allSelected = currentCategory && Object.values(currentPermissions).every(v => v);

  if (fetching) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {role ? 'Edit Role' : 'Create Custom Role'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Role Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Finance Manager"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what this role is for..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Permissions
            </h3>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
              {Object.entries(permissionCategories).map(([key, categoryData]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === key
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {categoryData.category}
                </button>
              ))}
            </div>

            {/* Permission Checkboxes */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 space-y-3">
              <button
                type="button"
                onClick={() => handleSelectAll(activeTab)}
                className="mb-4 px-3 py-1 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>

              {currentCategory && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(currentCategory.actions).map(([action, label]) => (
                    <label key={action} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white dark:hover:bg-gray-800/50 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={currentPermissions[action] || false}
                        onChange={() => handlePermissionToggle(activeTab, action)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function getDefaultPermissions(structure: PermissionStructure) {
  const defaultPerms: Record<string, Record<string, boolean>> = {};
  
  Object.entries(structure).forEach(([category, data]) => {
    defaultPerms[category] = {};
    Object.keys(data.actions).forEach(action => {
      defaultPerms[category][action] = false;
    });
  });
  
  return defaultPerms;
}

export default CreateRoleModal;
