import React, { useState, useRef, useEffect } from 'react';
import { Church, ChevronDown, Check, Plus } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { useResourceLimit } from '../../hooks/useResourceLimit';
import { usePermission } from '../../hooks/usePermission';
import ConfirmModal from '../modals/ConfirmModal';
import QuickAddBranchModal from '../modals/QuickAddBranchModal';
import LimitReachedModal from '../modals/LimitReachedModal';

interface Branch {
  _id: string;
  name: string;
  code?: string;
}

interface BranchSelectorProps {
  className?: string;
}

const BranchSelector: React.FC<BranchSelectorProps> = ({ className = '' }) => {
  const { selectedBranch, setSelectedBranch, clearBranchContext, branches, loadingBranches, isLockedToBranch, refreshBranches } = useBranch();
  const { user, fetchAndUpdateSubscription } = useAuth();
  const branchLimit = useResourceLimit('branches');
  const createPermission = usePermission('branches.create');
  const [isOpen, setIsOpen] = useState(false);
  const [pendingBranch, setPendingBranch] = useState<Branch | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSwitchingToAll, setIsSwitchingToAll] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canAddBranch = createPermission.hasPermission || createPermission.isSuperAdmin;

  const handleAddBranchClick = () => {
    setIsOpen(false);
    if (!branchLimit.canCreate) {
      setShowLimitModal(true);
      return;
    }
    setShowAddBranchModal(true);
  };

  const handleAddBranchSuccess = async (branch: Branch) => {
    setShowAddBranchModal(false);
    await Promise.all([refreshBranches(), fetchAndUpdateSubscription()]);
    setSelectedBranch(branch);
  };

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
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg max-w-[200px] ${className}`}>
        <Church className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
          {selectedBranch?.name || 'Branch'}
        </span>
      </div>
    );
  }

  if (branches.length === 0 && !loadingBranches && !canAddBranch) return null;

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
            inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium max-w-[220px]
            transition-all duration-200
            ${selectedBranch
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
        >
          <Church className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {selectedBranch ? selectedBranch.name : 'All Branches'}
          </span>
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                    <Church className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{branch.name}</span>
                    {branch.code && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">({branch.code})</span>
                    )}
                  </div>
                  {selectedBranch?._id === branch._id && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              ))
            )}

            {canAddBranch && (
              <>
                <div className="border-t border-gray-100 dark:border-gray-700" />
                <button
                  onClick={handleAddBranchClick}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span>Add Branch</span>
                </button>
              </>
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

      {/* Add Branch Modal */}
      <QuickAddBranchModal
        isOpen={showAddBranchModal}
        onClose={() => setShowAddBranchModal(false)}
        onSuccess={handleAddBranchSuccess}
      />

      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        resourceType="branches"
        current={branchLimit.current}
        limit={branchLimit.limit || 0}
        planName={user?.merchant?.subscription?.plan || 'starter'}
      />
    </>
  );
};

export default BranchSelector;
