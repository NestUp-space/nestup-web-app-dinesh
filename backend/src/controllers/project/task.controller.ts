/**
 * Task Controller
 * Handles HTTP requests for task operations
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { taskService } from '../../services/project';
import { CreateTaskDto, UpdateTaskDto } from '../../dtos/project.dto';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string | { name: string; /* other role props */ } };
}

export class TaskController {
  /**
   * Create a new task
   */
  async createTask(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
      }

      const projectId = parseInt(req.params.projectId, 10);
      if (isNaN(projectId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid project ID' });
      }

      const taskData: CreateTaskDto = {
        projectId,
        name: req.body.name,
        stage: req.body.stage,
        statusId: req.body.statusId,
        uploaderRole: req.body.uploaderRole,
        viewerRoles: req.body.viewerRoles
      };

      const task = await taskService.createTask(projectId, taskData);
      
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
  async getTasks(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
      }

      const projectId = parseInt(req.params.projectId, 10);
      if (isNaN(projectId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid project ID' });
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
  async updateTask(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
      }

      const taskId = parseInt(req.params.taskId, 10);
      if (isNaN(taskId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID' });
      }

      // Add updatedById to the request body
      const updateData: UpdateTaskDto = {
        ...req.body,
        updatedById: req.user.id
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
  async deleteTask(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
      }

      const taskId = parseInt(req.params.taskId, 10);
      if (isNaN(taskId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID' });
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
  async updateTaskStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
      }

      const taskId = parseInt(req.params.taskId, 10);
      if (isNaN(taskId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID' });
      }

      const statusId = parseInt(req.body.status, 10);
      if (isNaN(statusId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid status ID' });
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
