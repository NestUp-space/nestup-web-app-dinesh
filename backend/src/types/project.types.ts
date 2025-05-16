import { Prisma, PlyType, GrainDirection } from '@prisma/client';

// For request body validation / DTOs
export interface ProjectCreateInput {
  name: string;
  description?: string;
  projectStatus?: string; 
  clientId?: number;
  address?: string;
  location?: string;
  sqft?: number;
  engineerId?: number;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  projectStatus?: string; 
  clientId?: number | null;
  address?: string;
  location?: string;
  sqft?: number;
  engineerId?: number | null;
}

export interface ProjectShare {
  userIds: number[];
  permissions: string[];
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
  status: { select: { id: true, status: true } }, 
  createdBy: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
  engineer: { select: { id: true, name: true, email: true } },
  materials: true, 
  comments: { // Expanded include for comments with proper relation naming
    include: {
      createdByUser: { // Using the correct relation name from schema
        select: { id: true, name: true, email: true }
      }
    }
  },
  tasks: true, 
} satisfies Prisma.ProjectInclude;

export type ProjectWithDetails = Prisma.ProjectGetPayload<{
  include: typeof projectIncludes;
}>;
