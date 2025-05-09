/**
 * Subtask Repository
 * Handles database operations for subtasks
 */

import { PrismaClient, Subtask, Prisma } from '@prisma/client';
import prisma from '../config/db';
import { SubtaskBase } from '../types/project.types';
import { CreateSubtaskDto, UpdateSubtaskDto } from '../dtos/project.dto';

export interface ISubtaskRepository {
  create(data: CreateSubtaskDto): Promise<Subtask>;
  findMany(params: {
    where?: Prisma.SubtaskWhereInput;
    orderBy?: Prisma.SubtaskOrderByWithRelationInput;
  }): Promise<SubtaskBase[]>;
  findById(id: number): Promise<SubtaskBase | null>;
  update(id: number, data: UpdateSubtaskDto): Promise<Subtask>;
  delete(id: number): Promise<Subtask>;
  findByTaskId(taskId: number): Promise<SubtaskBase[]>;
  areAllSubtasksCompleted(taskId: number): Promise<boolean>;
}

export class SubtaskRepository implements ISubtaskRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: CreateSubtaskDto): Promise<Subtask> {
    return this.prisma.subtask.create({
      data: {
        taskId: data.taskId,
        name: data.name,
        description: data.description,
        actionRequired: data.actionRequired,
        type: data.type,
        metadataJson: data.metadataJson,
        // 'completed' defaults to false as per schema
      },
    });
  }

  async findMany(params: {
    where?: Prisma.SubtaskWhereInput;
    orderBy?: Prisma.SubtaskOrderByWithRelationInput;
  }): Promise<SubtaskBase[]> {
    const { where, orderBy } = params;
    
    const subtasks = await this.prisma.subtask.findMany({
      where,
      orderBy: orderBy || { createdAt: 'asc' }
    });
    
    return subtasks as SubtaskBase[];
  }

  async findById(id: number): Promise<SubtaskBase | null> {
    const subtask = await this.prisma.subtask.findUnique({
      where: { id },
    });
    
    return subtask as SubtaskBase | null;
  }

  async update(id: number, data: UpdateSubtaskDto): Promise<Subtask> {
    return this.prisma.subtask.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Subtask> {
    return this.prisma.subtask.delete({
      where: { id },
    });
  }

  async findByTaskId(taskId: number): Promise<SubtaskBase[]> {
    const subtasks = await this.prisma.subtask.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });
    
    return subtasks as SubtaskBase[];
  }

  async areAllSubtasksCompleted(taskId: number): Promise<boolean> {
    const subtasks = await this.prisma.subtask.findMany({
      where: { taskId },
      select: { completed: true }
    });
    
    if (subtasks.length === 0) {
      return true; // If there are no subtasks, consider them all completed
    }
    
    return subtasks.every(st => st.completed);
  }
}

// Export a singleton instance
export const subtaskRepository = new SubtaskRepository();
