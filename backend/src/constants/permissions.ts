export const PERMISSION_GROUPS = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  PROJECTS: 'projects',
  MATERIALS: 'materials',
  BIM: 'bim',
  CATALOGUE: 'catalogue',
  TASKS: 'tasks', // New group for task-specific permissions
  SUBTASKS: 'subtasks', // New group for subtask-specific permissions
  SETTINGS: 'settings'
} as const;

export const ACTIONS = {
  MANAGE_USER_ADDED: 'manage_user_added', // New action for managing user-added subtasks
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  MANAGE: 'manage',  // Higher-level permission that implies other permissions
  CHANGE_STATUS: 'change_status',
  ARCHIVE: 'archive',
  COMPLETE: 'complete',
  UPDATE_STATUS_AS_CLIENT: 'update_status_as_client', // New action
  UPDATE_STATUS_AS_BIM_ENGINEER: 'update_status_as_bim_engineer', // New action
  UPDATE_STATUS_ANY: 'update_status_any' // New action for admins
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
