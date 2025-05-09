/**
 * Task Service
 * Handles business logic for tasks
 */

import { Task } from '@prisma/client';
import { CreateTaskDto, TaskResponseDto, UpdateTaskDto } from '../../dtos/project.dto';
import { ITaskRepository, taskRepository } from '../../repositories/task.repository';
import { TaskWithSubtasks } from '../../types/project.types';
export class TaskService {
  constructor(
    private taskRepository: ITaskRepository
  ) {}

  // Inject subtaskService to avoid circular dependency
  private _subtaskService: any;
  set subtaskService(service: any) {
    this._subtaskService = service;
  }

  /**
   * Creates a new task with optional subtasks
   */
  async createTask(projectId: number, templateTaskData: any): Promise<Task> {
    const taskDataToCreate: CreateTaskDto = {
      projectId: projectId,
      name: templateTaskData.taskName,
      stage: templateTaskData.stage,
      statusId: templateTaskData.statusId || 1, // Default to statusId 1 (e.g., 'Pending')
      uploaderRole: templateTaskData.uploaderRole,
      // viewerRoles could be stored as JSON string or comma-separated.
      // If it's an array in template, convert to string:
      viewerRoles: Array.isArray(templateTaskData.viewerRoles) 
        ? templateTaskData.viewerRoles.join(',') 
        : templateTaskData.viewerRoles,
    };

    const createdTask = await this.taskRepository.create(taskDataToCreate);

    // If the template task has subtasks, create them
    if (templateTaskData.subtasks && templateTaskData.subtasks.length > 0) {
      for (const subtaskTemplate of templateTaskData.subtasks) {
        await this._subtaskService.createSubtask({
          taskId: createdTask.id,
          name: subtaskTemplate.name,
          description: subtaskTemplate.description, // Optional
          actionRequired: subtaskTemplate.actionRequired,
          type: subtaskTemplate.type,
          metadataJson: subtaskTemplate.metadataJson
        });
      }
    }

    return createdTask;
  }

  /**
   * Gets all tasks for a project
   */
  async getTasks(projectId: number): Promise<TaskWithSubtasks[]> {
    return this.taskRepository.findMany({
      where: { projectId },
    });
  }

  /**
   * Updates a task by ID
   */
  async updateTask(taskId: number, data: UpdateTaskDto): Promise<Task> {
    // When updating a task, especially its status to 'completed',
    // we might need to check if all its subtasks are completed.
    if (data.statusId) {
      const taskWithSubtasks = await this.taskRepository.findById(taskId);

      if (taskWithSubtasks && taskWithSubtasks.subtasks && taskWithSubtasks.subtasks.length > 0) {
        // Assuming 'completed' status has a specific ID (e.g., 3)
        // This ID should come from a constant or config
        const COMPLETED_STATUS_ID = 3; // Placeholder: replace with actual ID for "Completed"
        
        // Check if the task is being marked as completed
        // And if it has subtasks, ensure all are completed
        if (data.statusId === COMPLETED_STATUS_ID) {
          const allSubtasksCompleted = taskWithSubtasks.subtasks.every(st => st.completed);
          if (!allSubtasksCompleted) {
            throw new Error('Cannot mark task as completed: Not all subtasks are completed.');
          }
        }
      }
    }

    return this.taskRepository.update(taskId, data);
  }

  /**
   * Deletes a task by ID
   */
  async deleteTask(taskId: number): Promise<Task> {
    return this.taskRepository.delete(taskId);
  }

  /**
   * Updates a task's status by ID
   */
  async updateTaskStatus(taskId: number, newStatusId: number): Promise<TaskWithSubtasks> {
    return this.taskRepository.updateStatus(taskId, newStatusId);
  }

  /**
   * Transforms a task with subtasks to a response DTO
   */
  transformToResponseDto(task: TaskWithSubtasks): TaskResponseDto {
    return {
      id: task.id,
      name: task.name,
      stage: task.stage,
      uploaderRole: task.uploaderRole,
      viewerRoles: task.viewerRoles,
      status: task.status,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      subtasks: task.subtasks?.map(subtask => ({
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
      }))
    };
  }
}

// Create a singleton instance
export const taskService = new TaskService(taskRepository);
