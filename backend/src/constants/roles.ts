export const INTERNAL_ROLES = {
  PROJECT_MANAGER: 'Project Manager',
  CUSTOMER_ACQUISITION: 'Customer Acquisition',
  SITE_ENGINEER: 'Site Engineer',
  BIM_ENGINEER: 'BIM Engineer',
  INPUT_QA: 'Input QA',
  PRESSING: 'Pressing',
  CUTTING: 'Cutting',
  OUTPUT_QA: 'Output QA',
  PACKING: 'Packing',
  INSTALLATION: 'Installation'
} as const;

export const EXTERNAL_ROLES = {
  DESIGNER: 'Designer',
  HOME_OWNER: 'Home Owner'
} as const;

export const ALL_ROLES = {
  ...INTERNAL_ROLES,
  ...EXTERNAL_ROLES
} as const;

export type InternalRoleType = typeof INTERNAL_ROLES[keyof typeof INTERNAL_ROLES];
export type ExternalRoleType = typeof EXTERNAL_ROLES[keyof typeof EXTERNAL_ROLES];
export type RoleType = InternalRoleType | ExternalRoleType;

export const isInternalRole = (role: string): role is InternalRoleType => {
  return Object.values(INTERNAL_ROLES).includes(role as InternalRoleType);
};

export const isExternalRole = (role: string): role is ExternalRoleType => {
  return Object.values(EXTERNAL_ROLES).includes(role as ExternalRoleType);
};
