/**
 * Subtask Service
 * Handles business logic for subtasks
 */

import { Subtask } from '@prisma/client';
import { CreateSubtaskDto, SubtaskResponseDto, UpdateSubtaskDto } from '../../dtos/project.dto';
import { ISubtaskRepository, subtaskRepository } from '../../repositories/subtask.repository';
import { SubtaskBase } from '../../types/project.types';

export class SubtaskService {
  constructor(private subtaskRepository: ISubtaskRepository) {}

  /**
   * Creates a new subtask
   */
  async createSubtask(data: CreateSubtaskDto): Promise<Subtask> {
    return this.subtaskRepository.create(data);
  }

  /**
   * Gets all subtasks for a task
   */
  async getSubtasksByTaskId(taskId: number): Promise<SubtaskBase[]> {
    return this.subtaskRepository.findByTaskId(taskId);
  }

  /**
   * Updates a subtask by ID
   */
  async updateSubtask(subtaskId: number, data: UpdateSubtaskDto): Promise<Subtask> {
    const subtask = await this.subtaskRepository.update(subtaskId, data);

    // After updating a subtask, check if all subtasks for the parent task are now completed.
    // This logic can be complex and might involve business rules (e.g., auto-completing tasks).
    if (data.completed === true) {
      const allSubtasksCompleted = await this.subtaskRepository.areAllSubtasksCompleted(subtask.taskId);
      
      // We could potentially update the parent task's status here if needed
      // This would be handled by a task service method
      // For now, we just return the updated subtask
    }
    
    return subtask;
  }

  /**
   * Deletes a subtask by ID
   */
  async deleteSubtask(subtaskId: number): Promise<Subtask> {
    return this.subtaskRepository.delete(subtaskId);
  }

  /**
   * Transforms a subtask to a response DTO
   */
  transformToResponseDto(subtask: SubtaskBase): SubtaskResponseDto {
    return {
      id: subtask.id,
      name: subtask.name,
      description: subtask.description,
      actionRequired: subtask.actionRequired,
      type: subtask.type,
      metadataJson: subtask.metadataJson,
      completed: subtask.completed,
      createdAt: subtask.createdAt.toISOString(),
      updatedAt: subtask.updatedAt.toISOString(),
      taskId: subtask.taskId
    };
  }
}

// Export a singleton instance
export const subtaskService = new SubtaskService(subtaskRepository);
