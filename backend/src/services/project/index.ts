/**
 * Project Services Index
 * Exports all project-related services and sets up dependencies
 */

import { projectService } from './project.service';
import { taskService } from './task.service';
import { subtaskService } from './subtask.service';

// Set up dependencies to avoid circular references
projectService.taskService = taskService;
taskService.subtaskService = subtaskService;

// Export all services
export {
  projectService,
  taskService,
  subtaskService
};
