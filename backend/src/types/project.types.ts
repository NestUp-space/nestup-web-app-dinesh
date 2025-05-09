/**
 * Type definitions for Project-related entities
 */

import { Status, User } from '@prisma/client';

export interface ProjectBase {
  id: number;
  name: string;
  description?: string | null;
  address?: string | null;
  location?: string | null;
  sqft?: number | null;
  vbCount: number;
  statusId?: number | null;
  estimatedTime?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithRelations extends ProjectBase {
  status?: Status | null;
  engineer?: User | null;
  client?: any[]; // ClientProjectMapping[]
  tasks?: TaskWithSubtasks[];
}

export interface TaskBase {
  id: number;
  name: string;
  stage?: string | null;
  uploaderRole?: string | null;
  viewerRoles?: string | null;
  metadataJson?: string | null; // For additional structured data like associated frontend components
  statusId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskWithStatus extends TaskBase {
  status: Status;
}

export interface TaskWithSubtasks extends TaskWithStatus {
  subtasks?: SubtaskBase[];
}

export interface SubtaskBase {
  id: number;
  name: string;
  description?: string | null;
  actionRequired?: string | null;
  type?: string | null;
  metadataJson?: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  taskId: number;
}

export interface UserContext {
  id: number;
  role: {
    name: string;
  };
}
