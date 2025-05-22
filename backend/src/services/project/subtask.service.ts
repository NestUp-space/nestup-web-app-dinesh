/**
 * Subtask Service
 * Handles business logic for subtasks
 */

import { Subtask, User as PrismaUser, UserRole, RolePermissionMapping, UserPermission as PrismaUserPermission } from '@prisma/client';
import { CreateSubtaskDto, SubtaskResponseDto, UpdateSubtaskDto } from '../../dtos/project.dto';
import { ISubtaskRepository, subtaskRepository } from '../../repositories/subtask.repository';
import { SubtaskBase, SubtaskWithoutRelations } from '../../types/project.types';
import { PERMISSIONS } from '../../constants/permissions';
import { ForbiddenError } from '../../common/errors/customErrors';

export class SubtaskService {
  constructor(private subtaskRepository: ISubtaskRepository) {}

  /**
   * Creates a new subtask. When created during project creation from a template,
   * isTemplateSubtask should be set to true.
   */
  async createSubtask(
    data: CreateSubtaskDto,
    currentUser?: PrismaUser & { role: UserRole & { roleMappings: (RolePermissionMapping & { permission: PrismaUserPermission })[] } }
  ): Promise<Subtask> {
    // If creating a non-template subtask, check permissions
    if (!data.isTemplateSubtask && currentUser) {
      const userPermissions = currentUser.role.roleMappings.map(rm => rm.permission.permission);
      const canManageUserAdded = userPermissions.includes(PERMISSIONS.SUBTASKS.MANAGE_USER_ADDED);
      
      if (!canManageUserAdded) {
        throw new ForbiddenError('User does not have permission to create subtasks');
      }
    }
    let cleanedMetadataJson = data.metadataJson;
    if (cleanedMetadataJson && typeof cleanedMetadataJson === 'string') { // Ensure it's a string
      try {
        const metadata = JSON.parse(cleanedMetadataJson);
        if (metadata.allowedFileTypes && Array.isArray(metadata.allowedFileTypes)) {
          // Remove dots from file extensions if present
          metadata.allowedFileTypes = metadata.allowedFileTypes.map((type: string) =>
            typeof type === 'string' && type.startsWith('.') ? type.substring(1) : type
          );
          cleanedMetadataJson = JSON.stringify(metadata);
        }
      } catch (e) {
        // console.warn('Failed to parse metadataJson for cleaning, using as-is:', e);
        // It's often better to let Prisma handle invalid JSON if the column type expects JSON,
        // or ensure DTO validation catches this earlier.
        // For now, if parsing fails, we'll proceed with the original string,
        // but ideally, this should be validated at DTO level or handled more robustly.
      }
    }

    const dataToCreate: CreateSubtaskDto = {
      ...data,
      metadataJson: cleanedMetadataJson,
    };

    return this.subtaskRepository.create(dataToCreate);
  }

  /**
   * Gets all subtasks for a task
   */
  async getSubtasksByTaskId(taskId: number): Promise<SubtaskBase[]> {
    return this.subtaskRepository.findByTaskId(taskId);
  }

  /**
   * Updates a subtask by ID
   * @returns An object containing the updated subtask and a boolean indicating if all its sibling subtasks are completed.
   */
  async updateSubtask(
    subtaskId: number, 
    data: UpdateSubtaskDto
  ): Promise<{ subtask: SubtaskWithoutRelations; allSiblingSubtasksCompleted: boolean }> {
    const subtask = await this.subtaskRepository.update(subtaskId, data);
    let allSiblingSubtasksCompleted = false;

    if (data.completed === true) {
      // If this subtask was marked as complete, check if all its siblings are also complete
      allSiblingSubtasksCompleted = await this.subtaskRepository.areAllSubtasksCompleted(subtask.taskId);
    } else if (data.completed === false) {
      // If a subtask is marked incomplete, the parent task cannot be considered fully completed solely based on subtasks.
      // The flag remains false.
    }
    // If data.completed is undefined, we don't re-evaluate all subtasks unless specifically needed.
    // However, for robustness, if the subtask itself is complete, we should check.
    // Let's refine: always check if the updated subtask is part of a task whose subtasks might now be all complete.
    // The most relevant trigger is when a subtask becomes 'completed: true'.
    // If a subtask becomes 'completed: false', then `allSiblingSubtasksCompleted` should reflect that not all are done.

    // Re-evaluating the condition for checking all subtasks:
    // We should check the status of all sibling subtasks if this subtask's completion status *might* affect the overall completion.
    // This is primarily when 'completed' is explicitly set in 'data'.
    // If 'data.completed' is not provided, but other fields are updated, we might not need to re-check all subtasks
    // unless the subtask was already complete and something else changed.
    // For simplicity and to ensure correctness when a subtask is updated:
    // Let's fetch the current state of all subtasks for the parent task if data.completed is involved.
    // The current logic `if (data.completed === true)` is a good primary trigger.
    // If a subtask is marked from true to false, `allSiblingSubtasksCompleted` will naturally be false
    // if we call `areAllSubtasksCompleted` again, or we can infer it.

    // Let's stick to: if data.completed is true, we check. If data.completed is false, we know they are not all complete.
    // If data.completed is undefined, we don't need to set allSiblingSubtasksCompleted to true.
    // The existing logic for `if (data.completed === true)` is mostly fine.
    // If a subtask is marked from complete to incomplete, `allSiblingSubtasksCompleted` should be false.
    if (data.completed === false) {
      allSiblingSubtasksCompleted = false; // Explicitly set to false
    }
    
    return { subtask: subtask as SubtaskWithoutRelations, allSiblingSubtasksCompleted };
  }

  /**
   * Deletes a subtask by ID.
   * Template subtasks cannot be deleted.
   * Only users with SUBTASKS.MANAGE_USER_ADDED permission can delete user-added subtasks.
   */
  async deleteSubtask(
    subtaskId: number,
    currentUser: PrismaUser & { role: UserRole & { roleMappings: (RolePermissionMapping & { permission: PrismaUserPermission })[] } }
  ): Promise<Subtask> {
    // Check if subtask exists and if it's a template subtask
    const subtask = await this.subtaskRepository.findById(subtaskId);
    if (!subtask) {
      throw new Error('Subtask not found');
    }
    
    if (subtask.isTemplateSubtask) {
      throw new ForbiddenError('Cannot delete template-generated subtasks');
    }

    // Check user permissions
    const userPermissions = currentUser.role.roleMappings.map(rm => rm.permission.permission);
    const canManageUserAdded = userPermissions.includes(PERMISSIONS.SUBTASKS.MANAGE_USER_ADDED);
    
    if (!canManageUserAdded) {
      throw new ForbiddenError('User does not have permission to delete subtasks');
    }

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
      taskId: subtask.taskId,
      isTemplateSubtask: subtask.isTemplateSubtask || false
    };
  }
}

// Export a singleton instance
export const subtaskService = new SubtaskService(subtaskRepository);
