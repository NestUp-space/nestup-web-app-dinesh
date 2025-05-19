import { useUser } from '@/context/UserContext';
import { PERMISSIONS } from '@/constants/permissions'; // Ensure this path is correct
import { useCallback } from 'react';

export function usePermissions() {
  const { user } = useUser();

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions) {
      return false;
    }
    return user.permissions.includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!user || !user.permissions) {
      return false;
    }
    return permissions.some(p => user.permissions!.includes(p));
  }, [user]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!user || !user.permissions) {
      return false;
    }
    return permissions.every(p => user.permissions!.includes(p));
  }, [user]);

  return {
    userPermissions: user?.permissions || [], // Expose the raw permissions list if needed
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    // Add specific permission checks if frequently used, e.g.:
    // canViewUsers: hasPermission(PERMISSIONS.USERS.VIEW),
    // canCreateProjects: hasPermission(PERMISSIONS.PROJECTS.CREATE),
  };
}
