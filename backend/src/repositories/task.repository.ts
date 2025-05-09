/**
 * Task Repository
 * Handles database operations for tasks
 */

import { PrismaClient, Task, Prisma } from '@prisma/client';
import prisma from '../config/db';
import { TaskWithSubtasks } from '../types/project.types';
import { CreateTaskDto, UpdateTaskDto } from '../dtos/project.dto';

export interface ITaskRepository {
  create(data: CreateTaskDto): Promise<Task>;
  findMany(params: {
    where?: Prisma.TaskWhereInput;
    include?: Prisma.TaskInclude;
    orderBy?: Prisma.TaskOrderByWithRelationInput;
  }): Promise<TaskWithSubtasks[]>;
  findById(id: number, include?: Prisma.TaskInclude): Promise<TaskWithSubtasks | null>;
  update(id: number, data: UpdateTaskDto): Promise<Task>;
  delete(id: number): Promise<Task>;
  updateStatus(id: number, statusId: number): Promise<TaskWithSubtasks>;
}

export class TaskRepository implements ITaskRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: CreateTaskDto): Promise<Task> {
    const taskInput: Prisma.TaskCreateInput = {
      name: data.name,
      stage: data.stage,
      status: { connect: { id: data.statusId || 1 } }, // Default to status 1 if not provided
      project: { connect: { id: data.projectId } },
      uploaderRole: data.uploaderRole,
    };

    // Handle viewerRoles which could be an array or string
    if (data.viewerRoles) {
      taskInput.viewerRoles = Array.isArray(data.viewerRoles) 
        ? data.viewerRoles.join(',') 
        : data.viewerRoles;
    }

    return this.prisma.task.create({
      data: taskInput,
    });
  }

  async findMany(params: {
    where?: Prisma.TaskWhereInput;
    include?: Prisma.TaskInclude;
    orderBy?: Prisma.TaskOrderByWithRelationInput;
  }): Promise<TaskWithSubtasks[]> {
    const { where, include, orderBy } = params;
    
    const defaultInclude: Prisma.TaskInclude = {
      status: true,
      subtasks: { orderBy: { createdAt: 'asc' } }
    };

    const tasks = await this.prisma.task.findMany({
      where,
      include: include || defaultInclude,
      orderBy: orderBy || { createdAt: 'asc' }
    });
    
    // Type assertion is necessary because Prisma's return type doesn't match our interface exactly
    return tasks as unknown as TaskWithSubtasks[];
  }

  async findById(id: number, include?: Prisma.TaskInclude): Promise<TaskWithSubtasks | null> {
    const defaultInclude: Prisma.TaskInclude = {
      status: true,
      subtasks: { orderBy: { createdAt: 'asc' } }
    };

    const task = await this.prisma.task.findUnique({
      where: { id },
      include: include || defaultInclude,
    });
    
    // Type assertion is necessary because Prisma's return type doesn't match our interface exactly
    return task as unknown as TaskWithSubtasks | null;
  }

  async update(id: number, data: UpdateTaskDto): Promise<Task> {
    const updateData: Prisma.TaskUpdateInput = {};
    
    // Copy simple fields
    if (data.name !== undefined) updateData.name = data.name;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.uploaderRole !== undefined) updateData.uploaderRole = data.uploaderRole;
    
    // Handle viewerRoles which could be an array or string
    if (data.viewerRoles !== undefined) {
      updateData.viewerRoles = Array.isArray(data.viewerRoles) 
        ? data.viewerRoles.join(',') 
        : data.viewerRoles;
    }
    
    // Handle special fields that need to be connected
    if (data.statusId !== undefined) {
      updateData.status = { connect: { id: data.statusId } };
    }
    
    if (data.updatedById !== undefined) {
      updateData.updatedBy = { connect: { id: data.updatedById } };
    }
    
    return this.prisma.task.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number): Promise<Task> {
    return this.prisma.task.delete({
      where: { id },
    });
  }

  async updateStatus(id: number, statusId: number): Promise<TaskWithSubtasks> {
    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: { 
        statusId: statusId,
      },
      include: {
        status: true,
        subtasks: { orderBy: { createdAt: 'asc' } }
      }
    });
    
    return updatedTask as unknown as TaskWithSubtasks;
  }
}

// Export a singleton instance
export const taskRepository = new TaskRepository();
