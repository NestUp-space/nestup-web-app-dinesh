/**
 * Task Controller
 * Handles HTTP requests for task operations
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { taskService } from '../../services/project';
import { UpdateTaskDto } from '../../dtos/project.dto';
import { CustomRequest } from '../../middlewares/auth.middleware'; // Import CustomRequest
import { TaskTemplate } from '../../types/projectTemplate.types'; // Import TaskTemplate

// Removed local AuthenticatedRequest interface

export class TaskController {
  /**
   * Create a new task
   */
  async createTask(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const projectId = parseInt(customReq.params.projectId, 10);
      if (isNaN(projectId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid project ID' });
        return;
      }

      // Expect TaskTemplate in the body, similar to project.controller.ts (standalone)
      const taskTemplateItem = customReq.body as TaskTemplate;

      // Validate taskTemplateItem if necessary (e.g., check for taskName)
      if (!taskTemplateItem || typeof taskTemplateItem.taskName === 'undefined') {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task template data: taskName is required.' });
        return;
      }
      
      const task = await taskService.createTaskFromTemplate(projectId, taskTemplateItem);
      
      // Transform task to response DTO
      const transformedTask = taskService.transformToResponseDto(task as any); 
      
      res.status(StatusCodes.CREATED).json({ task: transformedTask });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Get all tasks for a project
   */
  async getTasks(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const projectId = parseInt(customReq.params.projectId, 10);
      if (isNaN(projectId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid project ID' });
        return;
      }

      const tasks = await taskService.getTasks(projectId);
      
      // Transform tasks to response DTOs
      const transformedTasks = tasks.map(task => 
        taskService.transformToResponseDto(task)
      );

      res.status(StatusCodes.OK).json({ tasks: transformedTasks });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Update a task
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const taskId = parseInt(customReq.params.taskId, 10);
      if (isNaN(taskId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID' });
        return;
      }

      // Add updatedById to the request body
      const updateData: UpdateTaskDto = {
        ...customReq.body,
        updatedById: customReq.user.id
      };

      const task = await taskService.updateTask(taskId, updateData);
      res.status(StatusCodes.OK).json({ task });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const taskId = parseInt(customReq.params.taskId, 10);
      if (isNaN(taskId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID' });
        return;
      }

      await taskService.deleteTask(taskId);
      res.status(StatusCodes.OK).json({ message: 'Task deleted successfully' });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Update a task's status
   */
  async updateTaskStatus(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const taskId = parseInt(customReq.params.taskId, 10);
      if (isNaN(taskId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID' });
        return;
      }

      const statusId = parseInt(customReq.body.status, 10);
      if (isNaN(statusId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid status ID' });
        return;
      }

      await taskService.updateTaskStatus(taskId, statusId);
      res.status(StatusCodes.OK).json({ message: 'Task status updated successfully' });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }
}

// Export a singleton instance
export const taskController = new TaskController();
