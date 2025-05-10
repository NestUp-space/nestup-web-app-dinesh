/**
 * Subtask Controller
 * Handles HTTP requests for subtask operations
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { subtaskService } from '../../services/project';
import { CreateSubtaskDto, UpdateSubtaskDto } from '../../dtos/project.dto';
import { CustomRequest } from '../../middlewares/auth.middleware'; // Import CustomRequest

// Removed local AuthenticatedRequest interface

export class SubtaskController {
  /**
   * Create a new subtask
   */
  async createSubtask(req: Request, res: Response) {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
      }

      const taskId = parseInt(customReq.params.taskId, 10);
      if (isNaN(taskId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID.' });
      }

      const { name, description, actionRequired, type, metadataJson } = customReq.body;

      if (!name) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Subtask name is required.' });
      }

      const subtaskData: CreateSubtaskDto = {
        taskId,
        name,
        description,
        actionRequired,
        type,
        metadataJson
      };

      const subtask = await subtaskService.createSubtask(subtaskData);
      
      // Transform subtask to response DTO
      const transformedSubtask = subtaskService.transformToResponseDto(subtask as any);
      
      res.status(StatusCodes.CREATED).json({ subtask: transformedSubtask, message: 'Subtask created successfully.' });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Get all subtasks for a task
   */
  async getSubtasksForTask(req: Request, res: Response) {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
      }

      const taskId = parseInt(customReq.params.taskId, 10);
      if (isNaN(taskId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID.' });
      }

      const subtasks = await subtaskService.getSubtasksByTaskId(taskId);
      
      // Transform subtasks to response DTOs
      const transformedSubtasks = subtasks.map(subtask => 
        subtaskService.transformToResponseDto(subtask)
      );

      res.status(StatusCodes.OK).json({ subtasks: transformedSubtasks });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Update a subtask
   */
  async updateSubtask(req: Request, res: Response) {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
      }

      const subtaskId = parseInt(customReq.params.subtaskId, 10);
      if (isNaN(subtaskId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid subtask ID.' });
      }

      const { name, description, completed, actionRequired, type, metadataJson } = customReq.body;

      // Ensure at least one updatable field is provided
      if (name === undefined && description === undefined && completed === undefined && 
          actionRequired === undefined && type === undefined && metadataJson === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No update data provided.' });
      }

      const updateData: UpdateSubtaskDto = {
        name,
        description,
        completed,
        actionRequired,
        type,
        metadataJson
      };

      const subtask = await subtaskService.updateSubtask(subtaskId, updateData);
      
      // Transform subtask to response DTO
      const transformedSubtask = subtaskService.transformToResponseDto(subtask as any);
      
      res.status(StatusCodes.OK).json({ subtask: transformedSubtask, message: 'Subtask updated successfully.' });
    } catch (error) {
      // Handle specific error from service (e.g., parent task completion blocked)
      if ((error as Error).message.includes('Cannot mark task as completed')) {
        return res.status(StatusCodes.CONFLICT).json({ message: (error as Error).message });
      }
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Delete a subtask
   */
  async deleteSubtask(req: Request, res: Response) {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
      }

      const subtaskId = parseInt(customReq.params.subtaskId, 10);
      if (isNaN(subtaskId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid subtask ID.' });
      }

      await subtaskService.deleteSubtask(subtaskId);
      res.status(StatusCodes.OK).json({ message: 'Subtask deleted successfully.' });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }
}

// Export a singleton instance
export const subtaskController = new SubtaskController();
