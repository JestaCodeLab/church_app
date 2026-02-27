import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { branchAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface Branch {
  _id: string;
  name: string;
  code?: string;
  type?: string;
  status?: string;
}

interface BranchContextType {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  clearBranchContext: () => void;
  branches: Branch[];
  loadingBranches: boolean;
  isBranchAdmin: boolean;
  isLockedToBranch: boolean;
  userBranch: Branch | null;
  switching: boolean;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | null>(null);

export const BranchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [switching, setSwitching] = useState(false);

  const userRoleSlug = user?.role?.slug;
  const isBranchAdmin = userRoleSlug === 'branch_admin';

  // Derive the user's assigned branch from their direct branch assignment or member profile
  const branchSource = user?.branch || user?.memberProfile?.branch;
  const userBranch: Branch | null = branchSource
    ? {
        _id: branchSource._id,
        name: branchSource.name,
        code: branchSource.code,
      }
    : null;

  // User is locked to a branch if they have an assigned branch and are NOT a top-level admin
  const isLockedToBranch = !!userBranch &&
    userRoleSlug !== 'church_admin' &&
    userRoleSlug !== 'super_admin';

  // Fetch branches when authenticated (for admins who can switch)
  const fetchBranches = useCallback(async () => {
    if (!isAuthenticated || !user?.merchant) return;
    // Branch-locked users don't need the full list
    if (isLockedToBranch) return;

    try {
      setLoadingBranches(true);
      const response = await branchAPI.getBranches({ limit: 100, status: 'active' });
      if (response.data.success) {
        const branchList = response.data.data.branches || response.data.data || [];
        setBranches(branchList);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  }, [isAuthenticated, user?.merchant, isLockedToBranch]);

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Auto-lock branch for users locked to a branch
  useEffect(() => {
    if (isLockedToBranch && userBranch) {
      setSelectedBranchState(userBranch);
    }
  }, [isLockedToBranch, userBranch?._id]);

  // After branches are loaded, restore selectedBranch from localStorage (for non-locked users)
  useEffect(() => {
    if (branches.length === 0 || isLockedToBranch) return;

    const savedBranchId = localStorage.getItem('selectedBranchId');

    if (savedBranchId) {
      const foundBranch = branches.find((b: Branch) => b._id === savedBranchId);

      if (foundBranch) {
        setSelectedBranchState(foundBranch);
      } else {
        // Stale branch from different merchant or deleted — clear it
        localStorage.removeItem('selectedBranchId');
        localStorage.removeItem('selectedBranchName');
        setSelectedBranchState(null);
      }
    } else {
      setSelectedBranchState(null);
    }
  }, [branches, isLockedToBranch]);

  // Save/clear branch to localStorage whenever it changes
  const setSelectedBranch = useCallback((branch: Branch | null) => {
    if (isLockedToBranch) return; // locked users can't switch

    setSwitching(true);
    setSelectedBranchState(branch);

    if (branch) {
      localStorage.setItem('selectedBranchId', branch._id);
      localStorage.setItem('selectedBranchName', branch.name);
    } else {
      localStorage.removeItem('selectedBranchId');
      localStorage.removeItem('selectedBranchName');
    }

    // Brief delay so child routes remount and fetch fresh data
    setTimeout(() => setSwitching(false), 600);
  }, [isLockedToBranch]);

  const clearBranchContext = useCallback(() => {
    if (isLockedToBranch) return; // locked users can't clear
    setSwitching(true);
    setSelectedBranchState(null);
    localStorage.removeItem('selectedBranchId');
    localStorage.removeItem('selectedBranchName');
    setTimeout(() => setSwitching(false), 600);
  }, [isLockedToBranch]);

  // Clear branch context on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedBranchState(null);
      setBranches([]);
    }
  }, [isAuthenticated]);

  const value: BranchContextType = {
    selectedBranch,
    setSelectedBranch,
    clearBranchContext,
    branches,
    loadingBranches,
    isBranchAdmin,
    isLockedToBranch,
    userBranch,
    switching,
    refreshBranches: fetchBranches,
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = (): BranchContextType => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};

export default BranchContext;
