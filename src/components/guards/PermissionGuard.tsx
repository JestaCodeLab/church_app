import React, { ReactNode } from 'react';
import { usePermission, usePermissions, usePermissionsOr } from '../../hooks/usePermission';

interface PermissionGuardProps {
  /** Single permission to check (e.g., "members.create") */
  permission?: string;
  
  /** Multiple permissions to check (AND logic - all must be true) */
  permissions?: string[];
  
  /** Multiple permissions to check (OR logic - any can be true) */
  permissionsOr?: string[];
  
  /** Content to render if permission is granted */
  children: ReactNode;
  
  /** Content to render if permission is denied (optional) */
  fallback?: ReactNode;
  
  /** If true, renders nothing instead of fallback when denied */
  silent?: boolean;
  
  /** Require super admin? */
  requireSuperAdmin?: boolean;
}

/**
 * Component to conditionally render content based on role permissions
 * 
 * Usage Examples:
 * 
 * Single permission:
 * ```tsx
 * <PermissionGuard permission="members.create">
 *   <CreateMemberButton />
 * </PermissionGuard>
 * ```
 * 
 * Multiple permissions (all required):
 * ```tsx
 * <PermissionGuard permissions={["members.view", "members.export"]}>
 *   <ExportButton />
 * </PermissionGuard>
 * ```
 * 
 * Multiple permissions (any required):
 * ```tsx
 * <PermissionGuard permissionsOr={["members.edit", "members.delete"]}>
 *   <AdvancedMemberActions />
 * </PermissionGuard>
 * ```
 * 
 * With fallback UI:
 * ```tsx
 * <PermissionGuard permission="finance.view" fallback={<AccessDenied />}>
 *   <FinanceReport />
 * </PermissionGuard>
 * ```
 * 
 * Super admin only:
 * ```tsx
 * <PermissionGuard requireSuperAdmin>
 *   <AdminPanel />
 * </PermissionGuard>
 * ```
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions,
  permissionsOr,
  children,
  fallback = null,
  silent = false,
  requireSuperAdmin = false,
}) => {
  const singlePermResult = usePermission(permission || '');
  const multiPermResult = usePermissions(permissions || []);
  const multiPermOrResult = usePermissionsOr(permissionsOr || []);

  // Determine which check to use
  let hasAccess = false;

  if (requireSuperAdmin) {
    hasAccess = singlePermResult.isSuperAdmin;
  } else if (permission) {
    hasAccess = singlePermResult.hasPermission;
  } else if (permissions && permissions.length > 0) {
    hasAccess = multiPermResult.hasPermission;
  } else if (permissionsOr && permissionsOr.length > 0) {
    hasAccess = multiPermOrResult.hasPermission;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (silent) {
    return null;
  }

  return <>{fallback}</>;
};

export default PermissionGuard;
