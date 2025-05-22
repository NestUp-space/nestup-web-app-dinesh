/**
 * Subtask Repository
 * Handles database operations for subtasks
 */

import { PrismaClient, Subtask, Prisma } from '@prisma/client';
import prisma from '../config/db';
import { SubtaskWithoutRelations } from '../types/project.types';
import { CreateSubtaskDto, UpdateSubtaskDto } from '../dtos/project.dto';

export interface ISubtaskRepository {
  create(data: CreateSubtaskDto): Promise<SubtaskWithoutRelations>;
  findMany(params: {
    where?: Prisma.SubtaskWhereInput;
    orderBy?: Prisma.SubtaskOrderByWithRelationInput;
  }): Promise<SubtaskWithoutRelations[]>;
  findById(id: number): Promise<SubtaskWithoutRelations | null>;
  update(id: number, data: UpdateSubtaskDto): Promise<Subtask>;
  delete(id: number): Promise<Subtask>;
  findByTaskId(taskId: number): Promise<SubtaskWithoutRelations[]>;
  areAllSubtasksCompleted(taskId: number): Promise<boolean>;
}

export class SubtaskRepository implements ISubtaskRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: CreateSubtaskDto): Promise<SubtaskWithoutRelations> {
    const subtask = await this.prisma.subtask.create({
      data: {
        name: data.name,
        description: data.description || null,
        actionRequired: data.actionRequired || null,
        type: data.type || null,
        metadataJson: data.metadataJson || null,
        completed: false,
        taskId: data.taskId,
        isTemplateSubtask: data.isTemplateSubtask || false
      } satisfies Prisma.SubtaskUncheckedCreateInput,
      include: {
        task: false // Explicitly exclude task relation
      }
    });
    return subtask as SubtaskWithoutRelations;
  }

  async findMany(params: {
    where?: Prisma.SubtaskWhereInput;
    orderBy?: Prisma.SubtaskOrderByWithRelationInput;
  }): Promise<SubtaskWithoutRelations[]> {
    const { where, orderBy } = params;
    
    const subtasks = await this.prisma.subtask.findMany({
      where,
      orderBy: orderBy || { createdAt: 'asc' },
      include: {
        task: false
      }
    });
    
    return subtasks as SubtaskWithoutRelations[];
  }

  async findById(id: number): Promise<SubtaskWithoutRelations | null> {
    const subtask = await this.prisma.subtask.findUnique({
      where: { id },
      include: {
        task: false
      }
    });
    
    return subtask as SubtaskWithoutRelations | null;
  }

  async update(id: number, data: UpdateSubtaskDto): Promise<SubtaskWithoutRelations> {
    const subtask = await this.prisma.subtask.update({
      where: { id },
      data,
      include: {
        task: false
      }
    });
    return subtask as SubtaskWithoutRelations;
  }

  async delete(id: number): Promise<Subtask> {
    return this.prisma.subtask.delete({
      where: { id },
      include: {
        task: false
      }
    });
  }

  async findByTaskId(taskId: number): Promise<SubtaskWithoutRelations[]> {
    const subtasks = await this.prisma.subtask.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        task: false
      }
    });
    
    return subtasks as SubtaskWithoutRelations[];
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
