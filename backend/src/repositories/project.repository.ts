/**
 * Project Repository
 * Handles database operations for projects
 */

import { PrismaClient, Project, Prisma } from '@prisma/client';
import prisma from '../config/db';
import { ProjectWithDetails } from '../types/project.types'; // Changed ProjectWithRelations to ProjectWithDetails
import { CreateProjectDto, UpdateProjectDto } from '../dtos/project.dto';

export interface IProjectRepository {
  create(data: CreateProjectDto): Promise<Project>;
  findMany(params: {
    where?: Prisma.ProjectWhereInput;
    include?: Prisma.ProjectInclude;
    orderBy?: Prisma.ProjectOrderByWithRelationInput;
  }): Promise<ProjectWithDetails[]>; // Changed ProjectWithRelations to ProjectWithDetails
  findById(id: number, include?: Prisma.ProjectInclude): Promise<ProjectWithDetails | null>; // Changed ProjectWithRelations to ProjectWithDetails
  update(id: number, data: UpdateProjectDto): Promise<Project>;
  delete(id: number): Promise<Project>;
}

export class ProjectRepository implements IProjectRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: CreateProjectDto): Promise<Project> {
    const projectInput: Prisma.ProjectCreateInput = {
      name: data.name,
      description: data.description ?? null,
      estimatedTime: data.estimatedTime ? new Date(data.estimatedTime) : new Date(),
      vbCount: data.vbCount || 0,
      status: data.statusId ? { connect: { id: data.statusId } } : undefined,
      createdBy: { connect: { id: data.createdById } },
      updatedBy: { connect: { id: data.createdById } },
      engineer: data.engineerId ? { connect: { id: data.engineerId } } : undefined,
    };

    // For fields with @default in schema, only set them if explicitly provided
    if (data.address !== undefined) {
      projectInput.address = data.address;
    }
    if (data.location !== undefined) {
      projectInput.location = data.location;
    }
    if (data.sqft !== undefined) {
      projectInput.sqft = data.sqft;
    }

    // Handle client connection if provided
    if (data.clientId) {
      projectInput.client = {
        create: {
          client: { connect: { id: data.clientId } }
        }
      };
    }

    return this.prisma.project.create({
      data: projectInput,
    });
  }

  async findMany(params: {
    where?: Prisma.ProjectWhereInput;
    include?: Prisma.ProjectInclude;
    orderBy?: Prisma.ProjectOrderByWithRelationInput;
  }): Promise<ProjectWithDetails[]> { // Changed ProjectWithRelations to ProjectWithDetails
    const { where, include, orderBy } = params;
    
    const defaultInclude: Prisma.ProjectInclude = {
      status: true,
      engineer: { select: { id: true, name: true, email: true } },
      client: {
        select: {
          client: { select: { id: true, name: true, email: true } }
        }
      },
      tasks: {
        orderBy: { createdAt: 'asc' },
        include: {
          status: true,
          subtasks: { orderBy: { createdAt: 'asc' } }
        }
      },
    };

    const projects = await this.prisma.project.findMany({
      where,
      include: include || defaultInclude,
      orderBy: orderBy || { createdAt: 'desc' }
    });
    
    // Type assertion is necessary because Prisma's return type doesn't match our interface exactly
    return projects as unknown as ProjectWithDetails[]; // Changed ProjectWithRelations to ProjectWithDetails
  }

  async findById(id: number, include?: Prisma.ProjectInclude): Promise<ProjectWithDetails | null> { // Changed ProjectWithRelations to ProjectWithDetails
    const defaultInclude: Prisma.ProjectInclude = {
      status: true,
      engineer: { select: { id: true, name: true, email: true } },
      client: {
        select: {
          client: { select: { id: true, name: true, email: true } }
        }
      },
      tasks: {
        orderBy: { createdAt: 'asc' },
        include: {
          status: true,
          subtasks: { orderBy: { createdAt: 'asc' } }
        }
      },
    };

    const project = await this.prisma.project.findUnique({
      where: { id },
      include: include || defaultInclude,
    });
    
    // Type assertion is necessary because Prisma's return type doesn't match our interface exactly
    return project as unknown as ProjectWithDetails | null; // Changed ProjectWithRelations to ProjectWithDetails
  }

  async update(id: number, data: UpdateProjectDto): Promise<Project> {
    const updateData: Prisma.ProjectUpdateInput = {};
    
    // Copy simple fields
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.sqft !== undefined) updateData.sqft = data.sqft;
    if (data.vbCount !== undefined) updateData.vbCount = data.vbCount;
    if (data.estimatedTime !== undefined) {
      updateData.estimatedTime = data.estimatedTime instanceof Date 
        ? data.estimatedTime 
        : new Date(data.estimatedTime);
    }
    
    // Handle special fields that need to be connected
    if (data.statusId !== undefined) {
      updateData.status = data.statusId ? { connect: { id: data.statusId } } : { disconnect: true };
    }
    
    if (data.engineerId !== undefined) {
      updateData.engineer = data.engineerId ? { connect: { id: data.engineerId } } : { disconnect: true };
    }
    
    if (data.updatedById !== undefined) {
      updateData.updatedBy = { connect: { id: data.updatedById } };
    }
    
    // Handle client connection if provided
    // Note: This is more complex and might require deleting existing mappings first
    // For simplicity, we're not handling client updates here
    
    return this.prisma.project.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number): Promise<Project> {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}

// Export a singleton instance
export const projectRepository = new ProjectRepository();
