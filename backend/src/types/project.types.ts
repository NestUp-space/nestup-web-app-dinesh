import { Prisma, PlyType, GrainDirection } from '@prisma/client';
// For request body validation / DTOs
export type ProjectCreateInput = {
  name: string;
  description?: string;
  statusId?: number;
  designerId: number;         // Required: project must have a designer
  projectManagerId: number;   // Required: project must have a project manager
  address?: string;
  location?: string;
  sqft?: number;
  engineerId?: number;
  estimatedTime?: Date;
  vbCount?: number;
  startedAt?: Date;
  completedAt?: Date;
}

export type ProjectCreateWithRelations = Prisma.ProjectCreateInput & {
  status: { connect: { id: number } };
  designer: { connect: { id: number } };
  projectManager: { connect: { id: number } };
  engineer?: { connect: { id: number } };
  createdBy: { connect: { id: number } };
  updatedBy: { connect: { id: number } };
};

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  statusId?: number;
  designerId?: number | null;
  projectManagerId?: number | null;
  address?: string;
  location?: string;
  sqft?: number;
  engineerId?: number | null;
  estimatedTime?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  vbCount?: number;
}

export type ProjectUpdateWithRelations = {
  name?: string;
  description?: string;
  address?: string;
  location?: string;
  sqft?: number;
  vbCount?: number;
  estimatedTime?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  status?: { connect: { id: number } };
  designer?: { connect: { id: number } } | { disconnect: true };
  projectManager?: { connect: { id: number } } | { disconnect: true };
  engineer?: { connect: { id: number } } | { disconnect: true };
  updatedBy?: { connect: { id: number } };
};

export interface ProjectAssign {
  designerId?: number | null;
  projectManagerId?: number | null;
  engineerId?: number | null;
}

export interface ProjectMaterialInput {
  materialId: string; 
  plyThickness: number;
  innerLaminateCode: string;
  outerLaminateCode: string;
  overallThickness: number;
  plyType: PlyType;
  grainDirection: GrainDirection;
  // quantity and unit were in the original type.
  // They are not part of the Material model itself.
  // The controller logic will need to determine how to use these fields
  // if they are not intended for direct creation of Material records.
  quantity: number; 
  unit: string;
}

export const projectIncludes = {
  status: true,
  engineer: {
    select: { 
      id: true, 
      name: true, 
      email: true,
      role: { select: { role: true } }
    }
  },
  designer: {
    select: { 
      id: true, 
      name: true, 
      email: true,
      role: { select: { role: true } }
    }
  },
  projectManager: {
    select: { 
      id: true, 
      name: true, 
      email: true,
      role: { select: { role: true } }
    }
  },
  createdBy: {
    select: { id: true, name: true, email: true }
  },
  updatedBy: {
    select: { id: true, name: true, email: true }
  },
  materials: true,
  comments: {
    include: {
      createdByUser: {
        select: { id: true, name: true, email: true }
      }
    }
  },
  tasks: { // Modified to include subtasks and status for tasks
    include: {
      status: true,
      subtasks: true
    }
  }
} as const;

export type ProjectWithDetails = Prisma.ProjectGetPayload<{
  include: typeof projectIncludes;
}>;

export interface UserContext {
  id: number;
  role: {
    name: string;
    // Add other role properties if needed, e.g., permissions
  };
  // Add other user properties if needed, e.g., email, name
}

// Define TaskWithSubtasks type for task service
export type TaskWithSubtasks = Prisma.TaskGetPayload<{
  include: {
    status: true;
    subtasks: true;
  }
}>;

// Define SubtaskBase type for subtask service
export type SubtaskBase = Prisma.SubtaskGetPayload<{}>;
