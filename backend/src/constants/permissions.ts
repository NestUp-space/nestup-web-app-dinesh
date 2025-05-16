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
  MANAGE: 'manage'  // Higher-level permission that implies other permissions
} as const;

export type PermissionGroup = typeof PERMISSION_GROUPS[keyof typeof PERMISSION_GROUPS];
export type Action = typeof ACTIONS[keyof typeof ACTIONS];

// Generate all possible permissions
export const PERMISSIONS = Object.entries(PERMISSION_GROUPS).reduce((acc, [groupKey, groupValue]) => {
  acc[groupKey] = Object.entries(ACTIONS).reduce((actions, [actionKey, actionValue]) => {
    actions[actionKey] = `${groupValue}.${actionValue}`;
    return actions;
  }, {} as Record<string, string>);
  return acc;
}, {} as Record<string, Record<string, string>>);

// Helper function to get all permissions as a flat array
export function getAllPermissions(): string[] {
  return Object.values(PERMISSIONS).flatMap(group => Object.values(group));
}
