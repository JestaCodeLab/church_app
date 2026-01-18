/**
 * Permission Utilities for RBAC
 * 
 * Helper functions for checking user permissions
 * Used throughout the app for access control
 */


/**
 * Type for permission paths
 * Format: "category.action"
 * Examples: "members.create", "finance.view", "events.delete"
 */
export type PermissionPath = string;

/**
 * Check if a user has a specific permission
 * 
 * Supports both:
 * 1. Legacy format: permissions = { category: { action: boolean } }
 * 2. New format: permissions = [{ permissionId: { category, action, ... }, assignedAt }]
 * 
 * Usage:
 * ```typescript
 * if (checkUserPermission(user, 'members.create')) {
 *   // User can create members
 * }
 * ```
 * 
 * @param user - User object from auth context
 * @param permissionPath - Permission to check in dot notation (e.g., "members.create")
 * @returns true if user has permission, false otherwise
 */
export const checkUserPermission = (
  user: any,
  permissionPath: PermissionPath
): boolean => {
  // No user or no permission specified
  if (!user?.role || !permissionPath) return false;

  // Super admin always has all permissions
  if (user.role.slug === 'super_admin') return true;

  // Parse permission path
  const [category, action] = permissionPath.split('.');
  
  // Invalid permission path format
  if (!category || !action) {
    console.warn(`Invalid permission path: "${permissionPath}". Use format "category.action"`);
    return false;
  }

  const permissions = user.role.permissions;

  // ✅ NEW FORMAT: Array of permission objects with permissionId
  if (Array.isArray(permissions)) {
    const categoryLower = category.toLowerCase();
    const actionLower = action.toLowerCase();
    
    return permissions.some(perm => {
      const permId = perm.permissionId;
      return (
        permId &&
        permId.category?.toLowerCase() === categoryLower &&
        permId.action?.toLowerCase() === actionLower
      );
    });
  }

  // ✅ LEGACY FORMAT: Nested boolean object
  const categoryPermissions = permissions?.[category];
  
  if (!categoryPermissions) return false;

  // Check if user has this specific action
  return categoryPermissions[action] === true;
};

/**
 * Check if user has multiple permissions (AND logic - all must be true)
 * 
 * Usage:
 * ```typescript
 * if (checkAllPermissions(user, ['members.view', 'members.export'])) {
 *   // User can view AND export members
 * }
 * ```
 */
export const checkAllPermissions = (
  user: any,
  permissionPaths: PermissionPath[]
): boolean => {
  if (!permissionPaths.length) return true;
  return permissionPaths.every(path => checkUserPermission(user, path));
};

/**
 * Check if user has any of multiple permissions (OR logic - any can be true)
 * 
 * Usage:
 * ```typescript
 * if (checkAnyPermission(user, ['members.edit', 'members.delete'])) {
 *   // User can edit OR delete members
 * }
 * ```
 */
export const checkAnyPermission = (
  user: any,
  permissionPaths: PermissionPath[]
): boolean => {
  if (!permissionPaths.length) return true;
  return permissionPaths.some(path => checkUserPermission(user, path));
};

/**
 * Get all permissions for a user (flattened)
 * 
 * Supports both legacy and new permission formats
 * 
 * Usage:
 * ```typescript
 * const perms = getAllUserPermissions(user);
 * // Returns: ['members.view', 'members.create', 'events.view', ...]
 * ```
 */
export const getAllUserPermissions = (user: any): PermissionPath[] => {
  if (!user?.role?.permissions) return [];

  const permissions: PermissionPath[] = [];
  const permsObj = user.role.permissions;

  // ✅ NEW FORMAT: Array of permission objects
  if (Array.isArray(permsObj)) {
    return permsObj
      .map(perm => {
        const permId = perm.permissionId;
        if (permId && permId.category && permId.action) {
          return `${permId.category}.${permId.action}`;
        }
        return null;
      })
      .filter((perm): perm is string => perm !== null);
  }

  // ✅ LEGACY FORMAT: Nested boolean object
  for (const [category, actions] of Object.entries(permsObj)) {
    if (typeof actions === 'object' && actions !== null) {
      for (const [action, allowed] of Object.entries(actions as Record<string, boolean>)) {
        if (allowed === true) {
          permissions.push(`${category}.${action}`);
        }
      }
    }
  }

  return permissions;
};

/**
 * Check if user has permission to perform an action on a resource
 * 
 * Usage:
 * ```typescript
 * const canManage = canManageResource(user, 'members', 'delete');
 * ```
 */
export const canManageResource = (
  user: any,
  resource: string,
  action: string
): boolean => {
  return checkUserPermission(user, `${resource}.${action}`);
};

/**
 * Get user's role name
 */
export const getUserRoleName = (user: any): string | null => {
  return user?.role?.name || null;
};

/**
 * Get user's role slug
 */
export const getUserRoleSlug = (user: any): string | null => {
  return user?.role?.slug || null;
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (user: any): boolean => {
  return user?.role?.slug === 'super_admin';
};

/**
 * Check if user is church admin
 */
export const isChurchAdmin = (user: any): boolean => {
  return user?.role?.slug === 'church_admin';
};

/**
 * Check if user is department admin
 */
export const isDepartmentAdmin = (user: any): boolean => {
  return user?.role?.slug === 'dept_admin';
};

/**
 * Check if user is finance admin
 */
export const isFinanceAdmin = (user: any): boolean => {
  return user?.role?.slug === 'finance_admin';
};

/**
 * Get permission value (for debugging)
 * 
 * Usage:
 * ```typescript
 * const value = getPermissionValue(user, 'members.create');
 * // Returns: true, false, or undefined
 * ```
 */
export const getPermissionValue = (
  user: any,
  permissionPath: PermissionPath
): boolean | undefined => {
  if (!user?.role || !permissionPath) return undefined;
  const [category, action] = permissionPath.split('.');
  return user.role.permissions?.[category]?.[action];
};

/**
 * Get all permissions for a specific category
 * 
 * Usage:
 * ```typescript
 * const memberPerms = getCategoryPermissions(user, 'members');
 * // Returns: { view: true, create: true, edit: false, delete: false, export: true }
 * ```
 */
export const getCategoryPermissions = (
  user: any,
  category: string
): Record<string, boolean> | null => {
  return user?.role?.permissions?.[category] || null;
};

/**
 * Check if permission is explicitly allowed (true)
 * vs denied (false) vs not set (undefined)
 */
export const getPermissionStatus = (
  user: any,
  permissionPath: PermissionPath
): 'allowed' | 'denied' | 'not-set' => {
  const value = getPermissionValue(user, permissionPath);
  if (value === true) return 'allowed';
  if (value === false) return 'denied';
  return 'not-set';
};

/**
 * Debug: Log all user permissions
 */
export const logUserPermissions = (user: any): void => {
  console.log('User Permissions Debug:');
  console.log('Role:', user?.role?.name);
  console.log('Role Slug:', user?.role?.slug);
  console.log('All Permissions:', getAllUserPermissions(user));
  console.log('Full Permission Object:', user?.role?.permissions);
};

/**
 * Validate permission path format
 */
export const isValidPermissionPath = (path: string): boolean => {
  if (!path || typeof path !== 'string') return false;
  const parts = path.split('.');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
};
