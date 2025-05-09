/**
 * Task Service
 * Handles business logic for tasks
 */

import { Task, Subtask } from '@prisma/client'; // Added Subtask
import { CreateTaskDto, TaskResponseDto, UpdateTaskDto, UpdateSubtaskDto, CreateSubtaskDto } from '../../dtos/project.dto'; // Added UpdateSubtaskDto, CreateSubtaskDto
import { ITaskRepository, taskRepository } from '../../repositories/task.repository';
import { TaskWithSubtasks } from '../../types/project.types';
import { TaskTemplate } from '../../types/projectTemplate.types'; // Import type for template items
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
   * Creates a new task and its associated subtasks from a template item.
   */
  async createTaskFromTemplate(projectId: number, taskTemplateItem: TaskTemplate): Promise<Task> {
    if (!taskTemplateItem || typeof taskTemplateItem.taskName === 'undefined') {
      console.warn('Invalid task template item received in TaskService, skipping:', taskTemplateItem);
      // Or throw an error, depending on desired strictness
      throw new Error('Invalid task template item provided to TaskService.createTaskFromTemplate');
    }

    const taskDataToCreate: CreateTaskDto = {
      projectId: projectId,
      name: taskTemplateItem.taskName,
      stage: taskTemplateItem.stage,
      statusId: taskTemplateItem.statusId || 1, // Default to statusId 1 (e.g., 'Pending')
      uploaderRole: taskTemplateItem.uploaderRole,
      viewerRoles: Array.isArray(taskTemplateItem.viewerRoles)
        ? taskTemplateItem.viewerRoles.join(',')
        : taskTemplateItem.viewerRoles,
      ...(taskTemplateItem.actionRequired && { actionRequired: taskTemplateItem.actionRequired }),
      ...(taskTemplateItem.metadataJson && { metadataJson: taskTemplateItem.metadataJson }), // Add metadataJson from template
    };

    const createdTask = await this.taskRepository.create(taskDataToCreate);

    // If the template task has subtasks, create them using SubtaskService
    if (this._subtaskService && taskTemplateItem.subtasks && taskTemplateItem.subtasks.length > 0) {
      for (const subtaskTemplate of taskTemplateItem.subtasks) {
        if (!subtaskTemplate || typeof subtaskTemplate.name === 'undefined') {
          console.warn('Invalid subtask template item, skipping:', subtaskTemplate);
          continue;
        }
        const subtaskDataToCreate: CreateSubtaskDto = {
          taskId: createdTask.id,
          name: subtaskTemplate.name,
          description: (subtaskTemplate.description !== null && subtaskTemplate.description !== undefined) ? subtaskTemplate.description : "",
          actionRequired: subtaskTemplate.actionRequired,
          type: subtaskTemplate.type,
          metadataJson: subtaskTemplate.metadataJson ?? undefined // Convert null to undefined
        };
        await this._subtaskService.createSubtask(subtaskDataToCreate);
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
   * Updates a subtask and, if all sibling subtasks are now complete,
   * updates the parent task's status to completed.
   */
  async updateSubtaskAndPotentiallyParent(
    subtaskId: number,
    subtaskData: UpdateSubtaskDto
  ): Promise<{ task: TaskWithSubtasks | null; subtask: Subtask }> {
    if (!this._subtaskService) {
      throw new Error('SubtaskService not injected into TaskService.');
    }

    const { subtask, allSiblingSubtasksCompleted } = await this._subtaskService.updateSubtask(subtaskId, subtaskData);

    let parentTask: TaskWithSubtasks | null = null;
    if (allSiblingSubtasksCompleted) {
      parentTask = await this.taskRepository.findById(subtask.taskId); // Fetch with relations
      if (parentTask) {
        // Placeholder for completed status ID. Should be from a constant.
        const COMPLETED_STATUS_ID = 3; 
        // Placeholder for 'In Progress' or other non-final statuses.
        // We only auto-complete if it's not already marked completed.
        if (parentTask.statusId !== COMPLETED_STATUS_ID) { 
          // Check if the task itself has any other conditions before marking complete (e.g. direct files, etc)
          // For now, if all subtasks are done, we mark the task done.
          parentTask = await this.updateTaskStatus(parentTask.id, COMPLETED_STATUS_ID);
        }
      }
    }
    // If not all subtasks were completed, or parent task was already complete,
    // parentTask might still be null or the original state before status update.
    // We should return the potentially updated parent task.
    // If no update to parent task happened, we can fetch it to return its current state.
    if (!parentTask && subtask) {
        parentTask = await this.taskRepository.findById(subtask.taskId);
    }


    return { task: parentTask, subtask };
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
      metadataJson: task.metadataJson, // Add metadataJson to response
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

// It's crucial that ProjectService (or wherever TaskService is instantiated and used)
// correctly injects SubtaskService into TaskService.
// Example in ProjectService:
// import { taskService } from './task.service';
// import { subtaskService } from './subtask.service'; // Assuming SubtaskService is also a singleton
// ...
// taskService.subtaskService = subtaskService;
// this._taskService = taskService;
