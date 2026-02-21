import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { showToast } from '../../utils/toasts';

interface Permission {
  _id: string;
  category: string;
  action: string;
  displayName: string;
  description?: string;
  roles: Array<{ _id: string; name: string }>;
}

interface EditPermissionModalProps {
  permission: Permission;
  allPermissions: Permission[];
  onClose: () => void;
  onSave: (updatedPermission: Permission) => void;
}

const EditPermissionModal: React.FC<EditPermissionModalProps> = ({
  permission,
  allPermissions,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    displayName: permission.displayName,
    description: permission.description || '',
    action: permission.action,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  // Check for duplicate action in same category
  const checkDuplicateAction = (newAction: string): boolean => {
    return allPermissions.some(
      p => p._id !== permission._id &&
           p.category === permission.category &&
           p.action === newAction
    );
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAction = e.target.value;
    setFormData({ ...formData, action: newAction });

    if (newAction && checkDuplicateAction(newAction)) {
      setActionError(`Action "${newAction}" already exists in category "${permission.category}"`);
    } else {
      setActionError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return;
    }

    if (!formData.action.trim()) {
      setError('Action is required');
      return;
    }

    if (actionError) {
      setError('Please fix the action conflict');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.put(`/admin/permissions/${permission._id}`, {
        displayName: formData.displayName.trim(),
        description: formData.description.trim(),
        action: formData.action.trim(),
      });

      showToast.success('Permission updated successfully');
      onSave(response.data.data);
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update permission';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormChanged = 
    formData.displayName !== permission.displayName ||
    formData.description !== (permission.description || '') ||
    formData.action !== permission.action;

  const isFormValid = 
    formData.displayName.trim() &&
    formData.action.trim() &&
    !actionError &&
    isFormChanged;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Edit Permission
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., View Members"
            />
          </div>

          {/* Category & Action Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Permission Reference
            </label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 font-mono">
              {permission.category}.{permission.action}
            </div>
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Action (System Name) *
            </label>
            <input
              type="text"
              value={formData.action}
              onChange={handleActionChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                actionError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="e.g., view"
            />
            {actionError && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {actionError}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This will update the action for all roles using this permission
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Optional description"
              rows={3}
            />
          </div>

          {/* Info - Roles Using This Permission */}
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
            <p className="text-xs text-primary-800 dark:text-blue-300">
              <strong>Used by:</strong> {permission.roles.length} role(s)
              {permission.roles.length > 0 && (
                <>
                  {' - '}
                  {permission.roles.map(r => r.name).join(', ')}
                </>
              )}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPermissionModal;
