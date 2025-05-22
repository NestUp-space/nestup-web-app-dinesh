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
  MANAGE: 'manage',
  CHANGE_STATUS: 'change_status', // Added CHANGE_STATUS
  // New task-specific actions mirroring backend
  UPDATE_STATUS_AS_CLIENT: 'update_status_as_client',
  UPDATE_STATUS_AS_BIM_ENGINEER: 'update_status_as_bim_engineer',
  UPDATE_STATUS_ANY: 'update_status_any'
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
