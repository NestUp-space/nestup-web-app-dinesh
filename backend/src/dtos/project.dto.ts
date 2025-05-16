/**
 * Data Transfer Objects for Project-related operations
 */

export interface CreateProjectDto {
  name: string;
  description?: string;
  address?: string;
  location?: string;
  sqft?: number;
  estimatedTime?: Date | string;
  vbCount?: number;
  statusId?: number;
  designerId?: number;
  projectManagerId?: number;
  engineerId?: number;
  createdById: number;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  address?: string;
  location?: string;
  sqft?: number;
  estimatedTime?: Date | string;
  vbCount?: number;
  statusId?: number;
  designerId?: number;
  projectManagerId?: number;
  engineerId?: number;
  updatedById?: number;
}

export interface ProjectResponseDto {
  id: number;
  name: string;
  description?: string | null;
  address?: string | null;
  location?: string | null;
  sqft?: number | null;
  vbCount: number;
  status?: { id: number; status: string } | null;
  designer?: { id: number; name: string; email: string } | null;
  projectManager?: { id: number; name: string; email: string } | null;
  engineer?: { id: number; name: string; email: string } | null;
  estimatedTime?: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: TaskResponseDto[];
}

export interface CreateTaskDto {
  projectId: number;
  name: string;
  stage?: string;
  statusId?: number;
  uploaderRole?: string;
  viewerRoles?: string | string[];
  metadataJson?: string; // For additional structured data
}

export interface UpdateTaskDto {
  name?: string;
  stage?: string;
  statusId?: number;
  uploaderRole?: string;
  viewerRoles?: string | string[];
  metadataJson?: string; // For additional structured data
  updatedById?: number;
}

export interface TaskResponseDto {
  id: number;
  name: string;
  stage?: string | null;
  uploaderRole?: string | null;
  viewerRoles?: string | null;
  status: { id: number; status: string };
  createdAt: string;
  updatedAt: string;
  metadataJson?: string | null; // For additional structured data
  subtasks?: SubtaskResponseDto[];
}

export interface CreateSubtaskDto {
  taskId: number;
  name: string;
  description?: string;
  actionRequired?: string;
  type?: string;
  metadataJson?: string;
}

export interface UpdateSubtaskDto {
  name?: string;
  description?: string;
  actionRequired?: string;
  type?: string;
  metadataJson?: string;
  completed?: boolean;
}

export interface SubtaskResponseDto {
  id: number;
  name: string;
  description?: string | null;
  actionRequired?: string | null;
  type?: string | null;
  metadataJson?: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  taskId: number;
}
