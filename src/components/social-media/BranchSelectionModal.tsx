import React from 'react';
import { Church, Building2 } from 'lucide-react';

interface Branch {
  _id: string;
  name: string;
  code: string;
  type: 'main' | 'branch';
}

interface BranchSelectionModalProps {
  isOpen: boolean;
  branches: Branch[];
  onSelect: (branchId: string, branchName: string) => void;
}

const BranchSelectionModal: React.FC<BranchSelectionModalProps> = ({
  isOpen,
  branches,
  onSelect,
}) => {
  if (!isOpen || branches.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex items-start gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
            <Church className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Branch-Based Social Media
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Social media accounts are managed per branch. Select a branch to continue.
            </p>
          </div>
        </div>
        <div className="space-y-2 p-6 overflow-y-auto flex-1">
          {branches.map((branch) => (
            <button
              key={branch._id}
              onClick={() => onSelect(branch._id, branch.name)}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                branch.type === 'main' 
                  ? 'bg-primary-100 dark:bg-primary-900/20' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {branch.type === 'main' ? (
                  <Building2 className="w-5 h-5 text-primary-600" />
                ) : (
                  <Church className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {branch.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {branch.type === 'main' ? 'Main Branch' : 'Branch'} • {branch.code}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BranchSelectionModal;
