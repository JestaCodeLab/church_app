import React, { useState, useRef, useEffect } from 'react';
import { GitBranch, ChevronDown, Check } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import ConfirmModal from '../modals/ConfirmModal';

interface Branch {
  _id: string;
  name: string;
  code?: string;
}

interface BranchSelectorProps {
  className?: string;
}

const BranchSelector: React.FC<BranchSelectorProps> = ({ className = '' }) => {
  const { selectedBranch, setSelectedBranch, clearBranchContext, branches, loadingBranches, isLockedToBranch } = useBranch();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingBranch, setPendingBranch] = useState<Branch | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSwitchingToAll, setIsSwitchingToAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBranchClick = (branch: Branch) => {
    if (selectedBranch?._id === branch._id) {
      setIsOpen(false);
      return;
    }
    setPendingBranch(branch);
    setIsSwitchingToAll(false);
    setShowConfirm(true);
    setIsOpen(false);
  };

  const handleAllBranchesClick = () => {
    if (!selectedBranch) {
      setIsOpen(false);
      return;
    }
    setPendingBranch(null);
    setIsSwitchingToAll(true);
    setShowConfirm(true);
    setIsOpen(false);
  };

  const handleConfirmSwitch = () => {
    if (isSwitchingToAll) {
      clearBranchContext();
    } else if (pendingBranch) {
      setSelectedBranch(pendingBranch);
    }
    setShowConfirm(false);
    setPendingBranch(null);
  };

  const handleCancelSwitch = () => {
    setShowConfirm(false);
    setPendingBranch(null);
    setIsSwitchingToAll(false);
  };

  // Branch-locked users see a static label (branch_admin, or any role assigned to a branch)
  if (isLockedToBranch) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`}>
        <GitBranch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300 max-w-[150px] truncate">
          {selectedBranch?.name || 'Branch'}
        </span>
      </div>
    );
  }

  if (branches.length === 0 && !loadingBranches) return null;

  const confirmTitle = isSwitchingToAll
    ? 'Switch to All Branches'
    : `Switch to ${pendingBranch?.name || 'Branch'}`;

  const confirmMessage = isSwitchingToAll
    ? 'You will now see data across all branches.'
    : `You are about to switch to "${pendingBranch?.name}". All data (members, events, finance, etc.) will be filtered to this branch only.`;

  return (
    <>
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-sm font-medium
            transition-all duration-200
            ${selectedBranch
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
        >
          <GitBranch className="w-4 h-4" />
          <span className="max-w-[150px] truncate">
            {selectedBranch ? selectedBranch.name : 'All Branches'}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
            {/* All Branches option */}
            <button
              onClick={handleAllBranchesClick}
              className={`
                w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                ${!selectedBranch ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'}
              `}
            >
              <span>All Branches</span>
              {!selectedBranch && <Check className="w-4 h-4" />}
            </button>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            {/* Branch list */}
            {loadingBranches ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Loading branches...</div>
            ) : (
              branches.map((branch) => (
                <button
                  key={branch._id}
                  onClick={() => handleBranchClick(branch)}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    ${selectedBranch?._id === branch._id ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'}
                  `}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <GitBranch className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{branch.name}</span>
                    {branch.code && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">({branch.code})</span>
                    )}
                  </div>
                  {selectedBranch?._id === branch._id && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={handleCancelSwitch}
        onConfirm={handleConfirmSwitch}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={isSwitchingToAll ? 'View All Branches' : 'Switch Branch'}
        cancelText="Cancel"
        type="info"
      />
    </>
  );
};

export default BranchSelector;
