/**
 * Types for the project task template.
 * These define the structure for default tasks and subtasks created with new projects.
 */

export interface SubtaskTemplate {
  name: string;
  description?: string;
  actionRequired?: string;
  actionByRole?: string;
  type?: string; // e.g., 'information', 'file_upload', 'approval', 'payment_confirmation', 'validation', 'status_update', 'confirmation'
  metadataJson?: string | null; // For additional structured data like allowedFileTypes, documentName, statuses
  isSystemDefined?: boolean; // Indicates if the subtask is a core, non-deletable part of the template
}

export interface TaskTemplate {
  taskName: string;
  stage: string; // e.g., "Site measurements", "Design", "Approval", "Pre-Production", "Production"
  statusId: number; // Default status ID for the task (e.g., 1 for 'Pending')
  uploaderRole: string; // Role expected to initiate/upload for this task (e.g., "Client", "BIM Engineer")
  viewerRoles: string | string[]; // Roles that can view this task (e.g., "All", or ["Admin", "Engineer"])
  actionRequired?: string; // Overall action or note for the task
  metadataJson?: string | null; // For additional structured data like associated frontend components
  subtasks: SubtaskTemplate[];
}
