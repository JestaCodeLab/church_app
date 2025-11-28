import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { memberAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: {
    id: string;
    name: string;
  } | null;
}

const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member
}) => {
  const [loading, setLoading] = useState(false);
  const [permanent, setPermanent] = useState(false);

  const handleDelete = async () => {
    if (!member) return;

    setLoading(true);
    try {
      await memberAPI.deleteMember(member.id, permanent);
      showToast.success(
        permanent ? 'Member permanently deleted' : 'Member deleted successfully'
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast.error(error?.response?.data?.message || 'Failed to delete member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Delete Member
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-gray-100">{member.name}</span>?
          </p>

          {!permanent && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> This member will be soft deleted and can be restored later from the archive.
              </p>
            </div>
          )}

          {/* Permanent Delete Option */}
          <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <input
              type="checkbox"
              id="permanent"
              checked={permanent}
              onChange={(e) => setPermanent(e.target.checked)}
              className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <label htmlFor="permanent" className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Permanently delete this member
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                This action cannot be undone. The member and all associated data will be permanently removed.
              </p>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 ${
              permanent
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {loading ? 'Deleting...' : permanent ? 'Permanently Delete' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMemberModal;
