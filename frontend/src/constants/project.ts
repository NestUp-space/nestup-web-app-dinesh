export const PROJECT_STATUS = {
  DRAFT: 1,
  ACTIVE: 2,
  ARCHIVED: 3,
  COMPLETED: 4, // Assuming COMPLETED is also a status
} as const;

export type ProjectStatusId = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

export const PROJECT_STATUS_NAMES: Record<ProjectStatusId, string> = {
  [PROJECT_STATUS.DRAFT]: 'Draft',
  [PROJECT_STATUS.ACTIVE]: 'Active',
  [PROJECT_STATUS.ARCHIVED]: 'Archived',
  [PROJECT_STATUS.COMPLETED]: 'Completed',
};

// This can be expanded if frontend needs to know about transitions,
// but for now, just mapping IDs to names is sufficient.
// export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatusId, ProjectStatusId[]> = {
//   [PROJECT_STATUS.DRAFT]: [PROJECT_STATUS.ACTIVE],
//   [PROJECT_STATUS.ACTIVE]: [PROJECT_STATUS.ARCHIVED, PROJECT_STATUS.COMPLETED],
//   [PROJECT_STATUS.ARCHIVED]: [PROJECT_STATUS.ACTIVE], // Or maybe not, depending on business logic
//   [PROJECT_STATUS.COMPLETED]: [PROJECT_STATUS.ARCHIVED], // Or maybe not
// };

export const PROJECT_STATUS_COLORS: Record<ProjectStatusId, string> = {
  [PROJECT_STATUS.DRAFT]: 'bg-yellow-100 text-yellow-800',
  [PROJECT_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [PROJECT_STATUS.ARCHIVED]: 'bg-gray-100 text-gray-800',
  [PROJECT_STATUS.COMPLETED]: 'bg-blue-100 text-blue-800',
};
