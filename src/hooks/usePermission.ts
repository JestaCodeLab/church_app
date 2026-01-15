import { useAuth } from '../context/AuthContext';

/**
 * Permission can be specified as:
 * 1. Permission ID (UUID string) - for new architecture (Strategy A)
 * 2. Dot-notation path (e.g., "members.create") - for legacy compatibility
 */
type PermissionPath = string;

interface PermissionResult {
  /** Does user have the permission? */
  hasPermission: boolean;
  /** Is user a super admin? (has all permissions) */
  isSuperAdmin: boolean;
  /** User's role name */
  roleName: string | null;
  /** User's role slug */
  roleSlug: string | null;
}

/**
 * Check if a permission string is a UUID (permission ID) vs dot-notation
 */
const isPermissionId = (permission: string): boolean => {
  // UUID pattern (simplified)
  return /^[0-9a-f]{24}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(permission);
};

/**
 * Hook to check if user has a specific permission
 * Works with both new (permission ID) and legacy (category.action) formats
 * 
 * Usage (New - Strategy A):
 * ```tsx
 * const { hasPermission } = usePermission('507f1f77bcf86cd799439011');
 * ```
 * 
 * Usage (Legacy):
 * ```tsx
 * const { hasPermission } = usePermission('members.create');
 * ```
 * 
 * @param permission - Permission ID or dot-notation path
 * @returns {PermissionResult} Permission check result
 */
export const usePermission = (permission: PermissionPath): PermissionResult => {
  const { user } = useAuth();

  // Super admin has all permissions
  if (user?.role?.slug === 'super_admin') {
    return {
      hasPermission: true,
      isSuperAdmin: true,
      roleName: user.role.name,
      roleSlug: user.role.slug,
    };
  }

  // NEW ARCHITECTURE: Check by permission ID (Strategy A - IDs Only)
  if (isPermissionId(permission)) {
    // Check if permission ID exists in role.permissions array
    const perms = user?.role?.permissions as any;
    
    // Handle array structure (new architecture)
    if (Array.isArray(perms)) {
      const hasPermissionId = perms.some(
        (p: any) => p.permissionId?._id?.toString() === permission.toString() || 
                     p.permissionId?.toString() === permission.toString()
      );
      
      return {
        hasPermission: hasPermissionId,
        isSuperAdmin: false,
        roleName: user?.role?.name || null,
        roleSlug: user?.role?.slug || null,
      };
    }
    
    // Legacy structure - not applicable for permission IDs
    return {
      hasPermission: false,
      isSuperAdmin: false,
      roleName: user?.role?.name || null,
      roleSlug: user?.role?.slug || null,
    };
  }

  // LEGACY: Check by category.action (dot-notation)
  const [category, action] = permission.split('.');

  if (!category || !action) {
    console.warn(`Invalid permission path: "${permission}". Use format "permissionId" or "category.action" (e.g., "507f1f77bcf86cd799439011" or "members.create")`);
    return {
      hasPermission: false,
      isSuperAdmin: false,
      roleName: user?.role?.name || null,
      roleSlug: user?.role?.slug || null,
    };
  }

  // For legacy format, check if role structure still has boolean flags
  const categoryPermissions = (user?.role?.permissions as any)?.[category as string];
  const hasPermission = categoryPermissions?.[action] === true;

  return {
    hasPermission,
    isSuperAdmin: false,
    roleName: user?.role?.name || null,
    roleSlug: user?.role?.slug || null,
  };
};

/**
 * Hook to check multiple permissions (AND logic: all must be true)
 * Works with both permission IDs and dot-notation
 * 
 * Usage (New - Strategy A):
 * ```tsx
 * const { hasPermission } = usePermissions(['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']);
 * ```
 * 
 * Usage (Legacy):
 * ```tsx
 * const { hasPermission } = usePermissions(['members.create', 'members.export']);
 * ```
 */
export const usePermissions = (permissions: PermissionPath[]): PermissionResult => {
  const { user } = useAuth();

  // Super admin has all permissions
  if (user?.role?.slug === 'super_admin') {
    return {
      hasPermission: true,
      isSuperAdmin: true,
      roleName: user.role.name,
      roleSlug: user.role.slug,
    };
  }

  // Check if user has ALL permissions
  const hasAllPermissions = permissions.every((permission) => {
    // NEW ARCHITECTURE: Check by permission ID
    if (isPermissionId(permission)) {
      const perms = user?.role?.permissions as any;
      
      // Handle array structure (new architecture)
      if (Array.isArray(perms)) {
        return perms.some(
          (p: any) => p.permissionId?._id?.toString() === permission.toString() ||
                       p.permissionId?.toString() === permission.toString()
        );
      }
      return false;
    }

    // LEGACY: Check by category.action
    const [category, action] = permission.split('.');
    if (!category || !action) return false;

    const categoryPermissions = (user?.role?.permissions as any)?.[category as string];
    return categoryPermissions?.[action] === true;
  });

  return {
    hasPermission: hasAllPermissions,
    isSuperAdmin: false,
    roleName: user?.role?.name || null,
    roleSlug: user?.role?.slug || null,
  };
};

/**
 * Hook to check multiple permissions (OR logic: any can be true)
 * Works with both permission IDs and dot-notation
 * 
 * Usage (New - Strategy A):
 * ```tsx
 * const { hasPermission } = usePermissionsOr(['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']);
 * ```
 * 
 * Usage (Legacy):
 * ```tsx
 * const { hasPermission } = usePermissionsOr(['members.create', 'members.edit']);
 * ```
 */
export const usePermissionsOr = (permissions: PermissionPath[]): PermissionResult => {
  const { user } = useAuth();

  // Super admin has all permissions
  if (user?.role?.slug === 'super_admin') {
    return {
      hasPermission: true,
      isSuperAdmin: true,
      roleName: user.role.name,
      roleSlug: user.role.slug,
    };
  }

  // Check if user has ANY permission
  const hasAnyPermission = permissions.some((permission) => {
    // NEW ARCHITECTURE: Check by permission ID
    if (isPermissionId(permission)) {
      const perms = user?.role?.permissions as any;
      
      // Handle array structure (new architecture)
      if (Array.isArray(perms)) {
        return perms.some(
          (p: any) => p.permissionId?._id?.toString() === permission.toString() ||
                       p.permissionId?.toString() === permission.toString()
        );
      }
      return false;
    }

    // LEGACY: Check by category.action
    const [category, action] = permission.split('.');
    if (!category || !action) return false;

    const categoryPermissions = (user?.role?.permissions as any)?.[category as string];
    return categoryPermissions?.[action] === true;
  });

  return {
    hasPermission: hasAnyPermission,
    isSuperAdmin: false,
    roleName: user?.role?.name || null,
    roleSlug: user?.role?.slug || null,
  };
};

