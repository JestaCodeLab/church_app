import React from 'react';
import { Building2, AlertCircle } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';

interface BranchFieldProps {
  value: string;
  onChange: (branchId: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  allBranches?: Array<{ _id: string; name: string }>;
  disabled?: boolean;
  className?: string;
}

/**
 * BranchField Component
 * 
 * Automatically scopes branch selection based on user role:
 * - church_admin: Shows all branches, can select any
 * - branch_admin: Shows their locked branch (disabled, non-selectable)
 * 
 * Key Features:
 * - Auto-populates from current selectedBranch context
 * - Disables field for branch_admin users
 * - Shows visual indicator of branch scope
 * - Integrates with form validation
 */
export const BranchField: React.FC<BranchFieldProps> = ({
  value,
  onChange,
  error,
  required = true,
  label = 'Branch',
  allBranches = [],
  disabled = false,
  className = '',
}) => {
  const { selectedBranch, isLockedToBranch, branches } = useBranch();
  const { user } = useAuth();

  // Get the branch list to display
  const branchOptions = allBranches.length > 0 ? allBranches : branches;

  // Branch is fixed when: user is role-locked OR church_admin has switched into a branch
  const isBranchFixed = isLockedToBranch || !!selectedBranch;

  // Show locked/pre-selected field when branch context is active
  if (isBranchFixed) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>

        <div className="relative">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 cursor-not-allowed">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{selectedBranch?.name || 'No Branch'}</span>
            <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
              {isLockedToBranch ? 'Locked' : 'Active'}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {isLockedToBranch
            ? `📍 You are working within the ${selectedBranch?.name} branch. All data will be scoped to this branch.`
            : `📍 Branch context active: ${selectedBranch?.name}. Clear branch context from the header to select a different branch.`
          }
        </p>
      </div>
    );
  }

  // No branch context — show dropdown with all branches
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <select
            value={value || selectedBranch?._id || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 transition-colors ${
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
            } ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60' : 'focus:ring-2'}`}
          >
            <option value="">Select a branch...</option>
            {branchOptions.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Show current selection info */}
        {value && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
            <span>📍 Selected: <span className="font-medium">{branchOptions.find(b => b._id === value)?.name || 'Unknown'}</span></span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 mt-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        📌 This entity will be created/updated in the selected branch only.
      </p>
    </div>
  );
};

export default BranchField;
