import { ACTIONS, PERMISSION_GROUPS } from '../constants/permissions';

// Maps permissions to their implied (inherited) permissions
export const PERMISSION_INHERITANCE: Record<string, string[]> = {
  // Action-based inheritance (generic rules)
  [ACTIONS.MANAGE]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.APPROVE
  ],
  [ACTIONS.EDIT]: [ACTIONS.VIEW],
  [ACTIONS.DELETE]: [ACTIONS.VIEW],
  [ACTIONS.APPROVE]: [ACTIONS.VIEW],

  // Resource-based inheritance
  [`${PERMISSION_GROUPS.USERS}.${ACTIONS.MANAGE}`]: [
    `${PERMISSION_GROUPS.ROLES}.${ACTIONS.VIEW}`,
    `${PERMISSION_GROUPS.PERMISSIONS}.${ACTIONS.VIEW}`
  ],
  [`${PERMISSION_GROUPS.ROLES}.${ACTIONS.MANAGE}`]: [
    `${PERMISSION_GROUPS.PERMISSIONS}.${ACTIONS.VIEW}`
  ],
  [`${PERMISSION_GROUPS.PROJECTS}.${ACTIONS.MANAGE}`]: [
    `${PERMISSION_GROUPS.MATERIALS}.${ACTIONS.VIEW}`,
    `${PERMISSION_GROUPS.BIM}.${ACTIONS.VIEW}`,
    `${PERMISSION_GROUPS.CATALOGUE}.${ACTIONS.VIEW}`
  ]
};

export interface PermissionOptions {
  requireAll?: boolean;  // If true, user must have ALL permissions. Default: false (ANY)
  checkInheritance?: boolean;  // Whether to check inherited permissions. Default: true
}

// Helper function to expand a permission to include all its inherited permissions
export function expandPermission(permission: string): Set<string> {
  const result = new Set<string>();
  result.add(permission);

  // Check direct inheritance for this specific permission
  if (PERMISSION_INHERITANCE[permission]) {
    PERMISSION_INHERITANCE[permission].forEach(inherited => {
      result.add(inherited);
      // Recursively expand inherited permissions
      expandPermission(inherited).forEach(p => result.add(p));
    });
  }

  // Check action-based inheritance
  const [group, action] = permission.split('.');
  if (action && PERMISSION_INHERITANCE[action]) {
    PERMISSION_INHERITANCE[action].forEach(inheritedAction => {
      const inheritedPermission = `${group}.${inheritedAction}`;
      result.add(inheritedPermission);
      // Recursively expand inherited permissions
      expandPermission(inheritedPermission).forEach(p => result.add(p));
    });
  }

  return result;
}

// Helper function to check if a user has required permissions
export function hasRequiredPermissions(
  userPermissions: Set<string>,
  requiredPermissions: string[],
  options: PermissionOptions = {}
): boolean {
  const { requireAll = false, checkInheritance = true } = options;

  // Expand user permissions to include inherited ones if checkInheritance is true
  const expandedUserPerms = checkInheritance
    ? new Set(
        Array.from(userPermissions).flatMap(p => Array.from(expandPermission(p)))
      )
    : userPermissions;

  if (requireAll) {
    return requiredPermissions.every(permission => expandedUserPerms.has(permission));
  }

  return requiredPermissions.some(permission => expandedUserPerms.has(permission));
}
