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

export const VIEW_PERMISSIONS = {
  [SECTIONS.DASHBOARD]: [`${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.VIEW}`],
  [SECTIONS.USERS]: [`${SECTIONS.USERS.toLowerCase()}.${ACTIONS.VIEW}`],
  [SECTIONS.PROJECTS]: [`${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.VIEW}`],
  [SECTIONS.CATALOGUE]: [`${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.VIEW}`],
  [SECTIONS.BIM]: [`${SECTIONS.BIM.toLowerCase()}.${ACTIONS.VIEW}`],
  [SECTIONS.SETTINGS]: [`${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.VIEW}`]
};

export const EDIT_PERMISSIONS = {
  [SECTIONS.DASHBOARD]: [
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.EDIT}`
  ],
  [SECTIONS.USERS]: [
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.CREATE}`,
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.EDIT}`
  ],
  [SECTIONS.PROJECTS]: [
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.CREATE}`,
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.EDIT}`
  ],
  [SECTIONS.CATALOGUE]: [
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.CREATE}`,
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.EDIT}`
  ],
  [SECTIONS.BIM]: [
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.CREATE}`,
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.EDIT}`
  ],
  [SECTIONS.SETTINGS]: [
    `${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.EDIT}`
  ]
};

export const ADMIN_PERMISSIONS = {
  [SECTIONS.DASHBOARD]: [
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.CREATE}`,
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.EDIT}`,
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.DELETE}`
  ],
  [SECTIONS.USERS]: [
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.CREATE}`,
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.EDIT}`,
    `${SECTIONS.USERS.toLowerCase()}.${ACTIONS.DELETE}`
  ],
  [SECTIONS.PROJECTS]: [
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.CREATE}`,
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.EDIT}`,
    `${SECTIONS.PROJECTS.toLowerCase()}.${ACTIONS.DELETE}`
  ],
  [SECTIONS.CATALOGUE]: [
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.CREATE}`,
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.EDIT}`,
    `${SECTIONS.CATALOGUE.toLowerCase()}.${ACTIONS.DELETE}`
  ],
  [SECTIONS.BIM]: [
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.CREATE}`,
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.EDIT}`,
    `${SECTIONS.BIM.toLowerCase()}.${ACTIONS.DELETE}`
  ],
  [SECTIONS.SETTINGS]: [
    `${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.CREATE}`,
    `${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.EDIT}`,
    `${SECTIONS.SETTINGS.toLowerCase()}.${ACTIONS.DELETE}`
  ]
};

export type Section = keyof typeof SECTIONS;
export type Action = typeof ACTIONS[keyof typeof ACTIONS];
export type Permission = `${Lowercase<Section>}.${Action}`;

export interface PermissionTemplate {
  [key: string]: Permission[];
}
