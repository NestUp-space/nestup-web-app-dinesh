/**
 * Subtask Controller
 * Handles HTTP requests for subtask operations
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { subtaskService, taskService } from '../../services/project'; // Import taskService
import { CreateSubtaskDto, UpdateSubtaskDto, SubtaskResponseDto } from '../../dtos/project.dto';
import { SubtaskWithoutRelations } from '../../types/project.types';
import { CustomRequest } from '../../middlewares/auth.middleware'; // Import CustomRequest
import { User as PrismaUser, UserRole, RolePermissionMapping, UserPermission as PrismaUserPermission } from '@prisma/client'; // Import PrismaUser types
import prisma from '../../config/db'; // Import prisma client

// Removed local AuthenticatedRequest interface

export class SubtaskController {
  /**
   * Create a new subtask
   */
  async createSubtask(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const taskId = parseInt(customReq.params.taskId, 10);
      if (isNaN(taskId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID.' });
        return;
      }

      const { name, description, actionRequired, type, metadataJson } = customReq.body;

      if (!name) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Subtask name is required.' });
        return;
      }

      // Get full user object for permission check
      const fullCurrentUser = await prisma.user.findUnique({
        where: { id: customReq.user.id },
        include: {
          role: {
            include: {
              roleMappings: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!fullCurrentUser) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'User details not found for permission check.' });
        return;
      }

      const subtaskData: CreateSubtaskDto = {
        taskId,
        name,
        description,
        actionRequired,
        type,
        metadataJson,
        isTemplateSubtask: false // User-added subtasks are never template subtasks
      };

      const subtask = (await subtaskService.createSubtask(
        subtaskData,
        fullCurrentUser as PrismaUser & { role: UserRole & { roleMappings: (RolePermissionMapping & { permission: PrismaUserPermission })[] } }
      )) as SubtaskWithoutRelations;

      const responseDto: SubtaskResponseDto = {
        ...subtask,
        createdAt: subtask.createdAt.toISOString(),
        updatedAt: subtask.updatedAt.toISOString(),
        isTemplateSubtask: subtask.isTemplateSubtask
      };
      
      res.status(StatusCodes.CREATED).json({ 
        subtask: responseDto, 
        message: 'Subtask created successfully.' 
      });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Get all subtasks for a task
   */
  async getSubtasksForTask(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const taskId = parseInt(customReq.params.taskId, 10);
      if (isNaN(taskId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID.' });
        return;
      }

      const subtasks = await subtaskService.getSubtasksByTaskId(taskId);
      
      const responseDtos: SubtaskResponseDto[] = subtasks.map(subtask => ({
        ...subtask,
        createdAt: subtask.createdAt.toISOString(),
        updatedAt: subtask.updatedAt.toISOString(),
        isTemplateSubtask: subtask.isTemplateSubtask
      }));

      res.status(StatusCodes.OK).json({ 
        subtasks: responseDtos
      });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Update a subtask
   */
  async updateSubtask(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const subtaskId = parseInt(customReq.params.subtaskId, 10);
      if (isNaN(subtaskId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid subtask ID.' });
        return;
      }

      const { name, description, completed, actionRequired, type, metadataJson } = customReq.body;

      // Ensure at least one updatable field is provided
      if (name === undefined && description === undefined && completed === undefined && 
          actionRequired === undefined && type === undefined && metadataJson === undefined) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'No update data provided.' });
        return;
      }

      const updateData: UpdateSubtaskDto = {
        name,
        description,
        completed,
        actionRequired,
        type,
        metadataJson
      };

      // The frontend calls this endpoint when toggling subtask completion.
      // We need to call taskService.updateSubtaskAndPotentiallyParent if subtaskService.updateSubtask doesn't handle parent task update.
      // Based on current taskService, updateSubtaskAndPotentiallyParent is the one to call.
      // It internally calls subtaskService.updateSubtask.
      
      if (!customReq.user) { // Should have been caught by isAuthenticated middleware, but good for safety
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized for subtask update' });
        return;
      }
      
      // Cast req.user to the detailed PrismaUser type expected by the service
      // const currentUser = customReq.user as PrismaUser & { role: UserRole & { roleMappings: (RolePermissionMapping & { permission: PrismaUserPermission })[] } };

      // Fetch full user object for permission check
      const fullCurrentUser = await prisma.user.findUnique({
        where: { id: customReq.user.id },
        include: {
          role: {
            include: {
              roleMappings: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!fullCurrentUser) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'User details not found for permission check.' });
        return;
      }

      const { task: updatedParentTask, subtask: updatedSubtask } = await taskService.updateSubtaskAndPotentiallyParent(
        subtaskId, 
        updateData,
        fullCurrentUser as PrismaUser & { role: UserRole & { roleMappings: (RolePermissionMapping & { permission: PrismaUserPermission })[] } } // Pass the full current user
      );
      
      const subtaskResponseDto: SubtaskResponseDto = {
        ...updatedSubtask,
        createdAt: updatedSubtask.createdAt.toISOString(),
        updatedAt: updatedSubtask.updatedAt.toISOString(),
        isTemplateSubtask: updatedSubtask.isTemplateSubtask
      };

      res.status(StatusCodes.OK).json({ 
        subtask: subtaskResponseDto,
        parentTask: updatedParentTask ? taskService.transformToResponseDto(updatedParentTask) : null,
        message: 'Subtask updated successfully.' 
      });
    } catch (error) {
      // Handle specific error from service (e.g., parent task completion blocked)
      if ((error as Error).message.includes('Cannot mark task as completed')) {
        res.status(StatusCodes.CONFLICT).json({ message: (error as Error).message });
        return;
      }
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Delete a subtask
   */
  async deleteSubtask(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const subtaskId = parseInt(customReq.params.subtaskId, 10);
      if (isNaN(subtaskId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid subtask ID.' });
        return;
      }

      // Get full user object for permission check
      const fullCurrentUser = await prisma.user.findUnique({
        where: { id: customReq.user.id },
        include: {
          role: {
            include: {
              roleMappings: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!fullCurrentUser) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'User details not found for permission check.' });
        return;
      }

      await subtaskService.deleteSubtask(
        subtaskId,
        fullCurrentUser as PrismaUser & { role: UserRole & { roleMappings: (RolePermissionMapping & { permission: PrismaUserPermission })[] } }
      );
      res.status(StatusCodes.OK).json({ message: 'Subtask deleted successfully.' });
    } catch (error) {
      if ((error as Error).message === 'Cannot delete template-generated subtasks') {
        res.status(StatusCodes.FORBIDDEN).json({ message: (error as Error).message });
        return;
      }
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }
}

// Export a singleton instance
export const subtaskController = new SubtaskController();
