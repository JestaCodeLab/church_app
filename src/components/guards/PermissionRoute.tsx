import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermission, usePermissions } from '../../hooks/usePermission';

interface PermissionRouteProps {
  /** Single permission required to access route */
  permission?: string;
  
  /** Multiple permissions required (AND logic) */
  permissions?: string[];
  
  /** Redirect to this path if access denied */
  redirectTo?: string;
  
  /** Fallback component to show if access denied */
  fallback?: React.ComponentType;
  
  /** Children to render if access granted */
  children?: React.ReactNode;
}

/**
 * Route component for permission-based access control
 * 
 * Usage in routing config:
 * ```tsx
 * <Route element={<PermissionRoute permission="members.view" />}>
 *   <Route path="/members" element={<MembersPage />} />
 * </Route>
 * ```
 * 
 * Or with redirect:
 * ```tsx
 * <Route element={<PermissionRoute permission="finance.view" redirectTo="/dashboard" />}>
 *   <Route path="/finance" element={<FinancePage />} />
 * </Route>
 * ```
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  permission,
  permissions,
  redirectTo = '/dashboard',
  fallback: Fallback,
  children,
}) => {
  const { loading } = useAuth();
  const singlePermResult = usePermission(permission || '');
  const multiPermResult = usePermissions(permissions || []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Determine access
  let hasAccess = false;
  if (permission) {
    hasAccess = singlePermResult.hasPermission;
  } else if (permissions && permissions.length > 0) {
    hasAccess = multiPermResult.hasPermission;
  }

  if (!hasAccess) {
    if (Fallback) {
      return <Fallback />;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

/**
 * Hook to check if user has permission to access a route
 * 
 * Usage:
 * ```tsx
 * const { hasAccess, isSuperAdmin } = useRoutePermission('members.view');
 * 
 * if (!hasAccess) {
 *   return <Navigate to="/dashboard" />;
 * }
 * ```
 */
export const useRoutePermission = (permission?: string, permissions?: string[]) => {
  const singlePermResult = usePermission(permission || '');
  const multiPermResult = usePermissions(permissions || []);

  let hasAccess = false;
  if (permission) {
    hasAccess = singlePermResult.hasPermission;
  } else if (permissions && permissions.length > 0) {
    hasAccess = multiPermResult.hasPermission;
  }

  return {
    hasAccess,
    isSuperAdmin: singlePermResult.isSuperAdmin || multiPermResult.isSuperAdmin,
    roleName: singlePermResult.roleName || multiPermResult.roleName,
  };
};
