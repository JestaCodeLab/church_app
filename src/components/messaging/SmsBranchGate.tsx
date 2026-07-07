import React from 'react';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';

interface SmsBranchGateProps {
  children: React.ReactNode;
}

const SmsBranchGate: React.FC<SmsBranchGateProps> = ({ children }) => {
  const { selectedBranch, setSelectedBranch, branches } = useBranch();

  // Branch already selected — render SMS content
  if (selectedBranch) {
    return <>{children}</>;
  }

  // No branch selected — show picker
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Select a Branch</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              SMS credits are managed per branch — choose which branch to work with
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {branches.map((branch: any) => (
            <button
              key={branch._id}
              onClick={() => setSelectedBranch(branch)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{branch.name}</p>
                {branch.code && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{branch.code}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>
          ))}

          {branches.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
              No branches configured for your church.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmsBranchGate;
