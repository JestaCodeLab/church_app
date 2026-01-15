import { usePermission, usePermissions, usePermissionsOr } from './usePermission';

interface ButtonPermissionState {
  /** Is the button enabled? */
  isEnabled: boolean;
  
  /** Tooltip text to show when disabled (optional) */
  tooltipText?: string;
  
  /** CSS class to apply when disabled */
  disabledClass?: string;
  
  /** Can user access this action? */
  hasAccess: boolean;
}

/**
 * Hook for controlling button visibility and state based on permissions
 * 
 * Usage:
 * ```tsx
 * const { isEnabled, tooltipText } = useButtonPermission('members.create');
 * 
 * return (
 *   <button 
 *     disabled={!isEnabled}
 *     title={tooltipText}
 *   >
 *     Create Member
 *   </button>
 * );
 * ```
 */
export const useButtonPermission = (permission: string): ButtonPermissionState => {
  const { hasPermission, isSuperAdmin } = usePermission(permission);

  return {
    isEnabled: hasPermission,
    tooltipText: hasPermission ? undefined : `You don't have permission to perform this action`,
    disabledClass: hasPermission ? '' : 'opacity-50 cursor-not-allowed',
    hasAccess: hasPermission,
  };
};

/**
 * Hook for button permission with multiple conditions (AND logic)
 */
export const useButtonPermissions = (permissions: string[]): ButtonPermissionState => {
  const { hasPermission } = usePermissions(permissions);

  return {
    isEnabled: hasPermission,
    tooltipText: hasPermission ? undefined : `You need multiple permissions to perform this action`,
    disabledClass: hasPermission ? '' : 'opacity-50 cursor-not-allowed',
    hasAccess: hasPermission,
  };
};

/**
 * Hook for button permission with multiple conditions (OR logic)
 */
export const useButtonPermissionsOr = (permissions: string[]): ButtonPermissionState => {
  const { hasPermission } = usePermissionsOr(permissions);

  return {
    isEnabled: hasPermission,
    tooltipText: hasPermission ? undefined : `You don't have any of the required permissions`,
    disabledClass: hasPermission ? '' : 'opacity-50 cursor-not-allowed',
    hasAccess: hasPermission,
  };
};

/**
 * Hook for controlling visibility of buttons based on permissions
 * Returns whether the button should be visible at all
 * 
 * Usage:
 * ```tsx
 * if (!useButtonVisibility('members.export')) return null;
 * ```
 */
export const useButtonVisibility = (permission: string): boolean => {
  const { hasPermission } = usePermission(permission);
  return hasPermission;
};
