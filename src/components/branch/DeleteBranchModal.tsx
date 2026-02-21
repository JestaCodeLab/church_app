import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Archive, Loader } from 'lucide-react';

interface DeleteBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (permanent: boolean) => void;
  branchName: string;
  memberCount: number;
  isDeleting?: boolean;
}

const DeleteBranchModal: React.FC<DeleteBranchModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  branchName,
  memberCount,
  isDeleting = false,
}) => {
  const [deletePermanently, setDeletePermanently] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!isDeleting) {
      onDelete(deletePermanently);
    }
  };

  // Prevent permanent deletion if there are active members
  const canDeletePermanently = memberCount === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Delete Branch
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  This action will remove <span className="font-medium text-gray-900 dark:text-gray-100">{branchName}</span> from your locations.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Member Count Warning */}
            {memberCount > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Branch has {memberCount} active member{memberCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                      You can only archive this branch. To delete permanently, please reassign all members to another branch first.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Options */}
            <div className="space-y-3">
              {/* Archive Option (Default) */}
              <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                !deletePermanently
                  ? 'border-blue-300 dark:border-blue-700 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}>
                <input
                  type="radio"
                  name="deleteOption"
                  checked={!deletePermanently}
                  onChange={() => setDeletePermanently(false)}
                  className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <Archive className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Archive Branch
                    </span>
                    <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Branch will be hidden from the active list but can be restored later if needed.
                  </p>
                </div>
              </label>

              {/* Permanent Delete Option */}
              <label className={`relative flex items-start p-4 border-2 rounded-lg transition-colors ${
                deletePermanently
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              } ${!canDeletePermanently ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="radio"
                  name="deleteOption"
                  checked={deletePermanently}
                  onChange={() => canDeletePermanently && setDeletePermanently(true)}
                  disabled={!canDeletePermanently}
                  className="mt-0.5 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Delete Permanently
                    </span>
                    {!canDeletePermanently && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                        Unavailable
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    All branch data will be permanently removed. This action cannot be undone.
                  </p>
                </div>
              </label>
            </div>

            {/* Warning for Permanent Delete */}
            {deletePermanently && canDeletePermanently && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      Warning: This action is permanent
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      All branch information, service times, facilities, and associated data will be permanently deleted and cannot be recovered.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isDeleting}
                className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                  deletePermanently
                    ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400 disabled:cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white disabled:bg-blue-400 disabled:cursor-not-allowed'
                }`}
              >
                {isDeleting && <Loader className="w-4 h-4 animate-spin" />}
                {deletePermanently ? (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    {isDeleting ? 'Archiving...' : 'Archive Branch'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteBranchModal;