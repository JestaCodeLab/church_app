import { useState, useEffect } from 'react';
import { branchAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Branch {
  _id: string;
  name: string;
  code: string;
  type: 'main' | 'branch';
}

export const useSocialBranchSelection = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const response = await branchAPI.getBranches({});
      
      // API returns { branches: [...] } at root level
      const branchList = response.data?.data?.branches || [];
      setBranches(branchList);

      // Smart branch selection
      if (!Array.isArray(branchList) || branchList.length === 0) {
        toast.error('No branches found. Please create a branch first.');
        setLoadingBranches(false);
        return;
      }

      if (branchList.length === 1) {
        // Auto-select single branch without showing modal
        const branch = branchList[0];
        setSelectedBranch(branch._id);
        localStorage.setItem('selectedBranchId', branch._id);
        localStorage.setItem('selectedBranchName', branch.name);
        // Dispatch event to notify other components (like topbar)
        window.dispatchEvent(new Event('branchChanged'));
        setShowBranchModal(false);
      } else {
        // Multiple branches - check localStorage first
        const savedBranchId = localStorage.getItem('selectedBranchId');
        const savedBranch = savedBranchId && branchList.find((b: Branch) => b._id === savedBranchId);
        
        if (savedBranch) {
          // User has previously selected a branch
          setSelectedBranch(savedBranch._id);
          setShowBranchModal(false);
        } else {
          // First time or no saved branch - show modal to inform about branch-based socials
          setShowBranchModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setLoadingBranches(false);
    }
  };

  const selectBranch = (branchId: string, branchName: string) => {
    setSelectedBranch(branchId);
    localStorage.setItem('selectedBranchId', branchId);
    localStorage.setItem('selectedBranchName', branchName);
    // Dispatch event to notify other components (like topbar)
    window.dispatchEvent(new Event('branchChanged'));
    setShowBranchModal(false);
  };

  useEffect(() => {
    // Check if branch is already selected in localStorage
    const savedBranchId = localStorage.getItem('selectedBranchId');
    const savedBranchName = localStorage.getItem('selectedBranchName');
    
    if (savedBranchId && savedBranchName) {
      // Branch already selected, use it without fetching all branches
      setSelectedBranch(savedBranchId);
      setShowBranchModal(false);
      setLoadingBranches(false);
    } else {
      // No saved branch, fetch branches to determine what to do
      fetchBranches();
    }
  }, []);

  return {
    branches,
    selectedBranch,
    showBranchModal,
    loadingBranches,
    setShowBranchModal,
    selectBranch,
  };
};
