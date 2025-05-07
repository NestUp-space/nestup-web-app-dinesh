/**
 * Checks if the user has the required role.
 * @param userRole The role of the current user.
 * @param requiredRole The role required to access a resource.
 * @returns True if the user has the required role, false otherwise.
 */
export const hasPermission = (userRole: string | undefined, requiredRole: string): boolean => {
  if (!userRole) {
    return false;
  }
  // Assuming 'super admin' and 'admin' are the admin roles
  if (requiredRole === 'admin') {
    return userRole === 'super admin' || userRole === 'admin';
  }
  return userRole === requiredRole;
};

/**
 * Checks if the current user is an admin.
 * @param userRole The role of the current user.
 * @returns True if the user is an admin, false otherwise.
 */
export const isAdmin = (userRole: string | undefined): boolean => {
  if (!userRole) {
    return false;
  }
  return userRole === 'super admin' || userRole === 'admin';
};
