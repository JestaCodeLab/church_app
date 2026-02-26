import { useEffect, useRef, useCallback } from 'react';
import { useBranch } from '../context/BranchContext';

interface UseUnsavedChangesOptions {
  isDirty: boolean;
  onBranchSwitch?: () => void;
}

/**
 * useUnsavedChanges Hook
 * 
 * Detects when a form has unsaved changes and prompts before branch switching.
 * Prevents accidental loss of form data when changing branches.
 * 
 * Usage:
 * const { isDirty, setIsDirty } = useMyFormState();
 * useUnsavedChanges({ isDirty });
 */
export const useUnsavedChanges = ({ isDirty, onBranchSwitch }: UseUnsavedChangesOptions) => {
  const { switching } = useBranch();
  const promptShownRef = useRef(false);

  useEffect(() => {
    if (!isDirty || !switching) return;

    // Prevent branch switch if form has unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Show prompt on branch switch attempt
    if (!promptShownRef.current) {
      promptShownRef.current = true;
      const shouldContinue = window.confirm(
        'You have unsaved changes in this form. Do you want to save before switching branches?\n\n✓ OK to save and switch\n✗ Cancel to keep editing'
      );

      if (!shouldContinue) {
        // Prevent switch
        return;
      } else if (onBranchSwitch) {
        onBranchSwitch();
      }
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      promptShownRef.current = false;
    };
  }, [isDirty, switching, onBranchSwitch]);
};

export default useUnsavedChanges;
