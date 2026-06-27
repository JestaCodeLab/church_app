import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Loader } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import { branchAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface GivingBranchGateProps {
  children: React.ReactNode;
}

const GivingBranchGate: React.FC<GivingBranchGateProps> = ({ children }) => {
  const navigate = useNavigate();
  const { selectedBranch, setSelectedBranch, branches, loadingBranches, isLockedToBranch } = useBranch();

  // Branch-locked users skip the gate entirely
  if (isLockedToBranch) {
    return <>{children}</>;
  }

  // Still loading branches
  if (loadingBranches) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
      </div>
    );
  }

  // Single branch — auto-select it silently
  if (branches.length === 1 && !selectedBranch) {
    setSelectedBranch(branches[0]);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
      </div>
    );
  }

  // No branch selected and multiple branches available — show blocking modal
  if (!selectedBranch && branches.length > 1) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="px-6 py-8">
            <div className="flex items-center gap-3 mb-6">
              <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                Branch Required
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              The Giving module shows data per branch. Please select a branch to continue.
            </p>

            {/* Dropdown Select */}
            {branches.length > 1 && (
              <div className="mb-6">
                <select
                  onChange={(e) => {
                    const branch = branches.find((b: any) => b._id === e.target.value);
                    if (branch) {
                      setSelectedBranch(branch);
                    }
                  }}
                  defaultValue=""
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="">Select a branch...</option>
                  {branches.map((branch: any) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Branch is selected — render children
  return <>{children}</>;
};

export default GivingBranchGate;
