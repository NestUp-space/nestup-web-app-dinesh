/**
 * Task Controller
 * Handles HTTP requests for task operations
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { taskService } from '../../services/project';
import { UpdateTaskDto } from '../../dtos/project.dto';
import { CustomRequest } from '../../middlewares/auth.middleware'; // Import CustomRequest
// import { TaskTemplate } from '../../types/projectTemplate.types'; // Import TaskTemplate - Removed as it's unused
import prisma from '../../config/db'; // Import prisma client
import { User as PrismaUser, UserRole, RolePermissionMapping, UserPermission as PrismaUserPermission } from '@prisma/client'; // Import PrismaUser types


// Removed local AuthenticatedRequest interface

export class TaskController {
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

      await taskService.updateTaskStatus(taskId, statusId, fullCurrentUser as PrismaUser & { role: UserRole & { roleMappings: (RolePermissionMapping & { permission: PrismaUserPermission })[] } });
      res.status(StatusCodes.OK).json({ message: 'Task status updated successfully' });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }
}

// Export a singleton instance
export const taskController = new TaskController();
