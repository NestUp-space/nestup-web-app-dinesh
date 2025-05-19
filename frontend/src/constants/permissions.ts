export const PERMISSION_GROUPS = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  PROJECTS: 'projects',
  MATERIALS: 'materials',
  BIM: 'bim',
  CATALOGUE: 'catalogue',
  SETTINGS: 'settings'
} as const;

export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  MANAGE: 'manage'
} as const;

export type PermissionGroup = typeof PERMISSION_GROUPS[keyof typeof PERMISSION_GROUPS];
export type Action = typeof ACTIONS[keyof typeof ACTIONS];

// Generate all possible permissions in the format 'group.action'
const generatePermissions = () => {
  const permissions: { [groupKey: string]: { [actionKey: string]: string } } = {};
  for (const groupKey in PERMISSION_GROUPS) {
    permissions[groupKey] = {};
    for (const actionKey in ACTIONS) {
      permissions[groupKey][actionKey] = `${PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS]}.${ACTIONS[actionKey as keyof typeof ACTIONS]}`;
    }
  }
  return permissions as Record<keyof typeof PERMISSION_GROUPS, Record<keyof typeof ACTIONS, string>>;
};

export const PERMISSIONS = generatePermissions();

// Helper function to get all permissions as a flat array (optional, if needed)
export function getAllPermissions(): string[] {
  return Object.values(PERMISSIONS).flatMap(group => Object.values(group));
}
