export const SECTIONS = {
  DASHBOARD: "Dashboard",
  USERS: "Users",
  PROJECTS: "Projects",
  CATALOGUE: "Catalogue",
  BIM: "BIM Process",
  SETTINGS: "Settings"
} as const;

export const ACTIONS = {
  VIEW: "view",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete"
} as const;

export type Section = keyof typeof SECTIONS;
export type Action = typeof ACTIONS[keyof typeof ACTIONS];
// Ensure Permission is a union of specific literal strings
type LowercaseSection = Lowercase<Section>;
export type Permission = `${LowercaseSection}.${Action}`;

export interface PermissionTemplate {
  // Using a mapped type for keys to be specific SECTIONS values, if desired,
  // or keep as [key: string] if keys can be arbitrary.
  // For VIEW_PERMISSIONS etc., keys are from SECTIONS.
  [key: string]: Permission[]; // Or [K in typeof SECTIONS[keyof typeof SECTIONS]]?: Permission[];
}

export const VIEW_PERMISSIONS: PermissionTemplate = {
  [SECTIONS.DASHBOARD]: [`${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.VIEW}` as Permission],
  [SECTIONS.USERS]: [`${SECTIONS.USERS.toLowerCase()}.${ACTIONS.VIEW}` as Permission],
  [SECTIONS.PROJECTS]: [`${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.VIEW}` as Permission],
  [SECTIONS.CATALOGUE]: [`${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.VIEW}` as Permission],
  [SECTIONS.BIM]: [`${SECTIONS.BIM.toLowerCase()}.${ACTIONS.VIEW}` as Permission],
  [SECTIONS.SETTINGS]: [`${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.VIEW}` as Permission]
};

export const EDIT_PERMISSIONS: PermissionTemplate = {
  [SECTIONS.DASHBOARD]: [
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.VIEW}` as Permission,
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.EDIT}` as Permission
  ],
  [SECTIONS.USERS]: [
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.VIEW}` as Permission,
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.CREATE}` as Permission,
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.EDIT}` as Permission
  ],
  [SECTIONS.PROJECTS]: [
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.VIEW}` as Permission,
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.CREATE}` as Permission,
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.EDIT}` as Permission
  ],
  [SECTIONS.CATALOGUE]: [
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.VIEW}` as Permission,
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.CREATE}` as Permission,
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.EDIT}` as Permission
  ],
  [SECTIONS.BIM]: [
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.VIEW}` as Permission,
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.CREATE}` as Permission,
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.EDIT}` as Permission
  ],
  [SECTIONS.SETTINGS]: [
    `${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.VIEW}` as Permission,
    `${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.EDIT}` as Permission
  ]
};

export const ADMIN_PERMISSIONS: PermissionTemplate = {
  [SECTIONS.DASHBOARD]: [
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.VIEW}` as Permission,
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.CREATE}` as Permission,
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.EDIT}` as Permission,
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.DELETE}` as Permission
  ],
  [SECTIONS.USERS]: [
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.VIEW}` as Permission,
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.CREATE}` as Permission,
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.EDIT}` as Permission,
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.DELETE}` as Permission
  ],
  [SECTIONS.PROJECTS]: [
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.VIEW}` as Permission,
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.CREATE}` as Permission,
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.EDIT}` as Permission,
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.DELETE}` as Permission
  ],
  [SECTIONS.CATALOGUE]: [
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.VIEW}` as Permission,
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.CREATE}` as Permission,
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.EDIT}` as Permission,
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.DELETE}` as Permission
  ],
  [SECTIONS.BIM]: [
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.VIEW}` as Permission,
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.CREATE}` as Permission,
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.EDIT}` as Permission,
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.DELETE}` as Permission
  ],
  [SECTIONS.SETTINGS]: [
    `${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.VIEW}` as Permission,
    `${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.CREATE}` as Permission,
    `${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.EDIT}` as Permission,
    `${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.DELETE}` as Permission
  ]
};
