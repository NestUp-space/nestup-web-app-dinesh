import express from 'express';
import { taskController } from '../controllers/project/task.controller'; // Adjusted path
import { subtaskController } from '../controllers/project/subtask.controller'; // Adjusted path
import { isAuthenticated } from '../middlewares/auth.middleware';
import { hasPermission } from '../middlewares/permission.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = express.Router({ mergeParams: true }); // Enable mergeParams to access :projectId

// Apply authentication to all task routes
router.use(isAuthenticated);

// --- Task Routes ---
// Create a new task for a project (expects projectId from parent router)
router.post(
  '/',
  hasPermission([PERMISSIONS.TASKS.CREATE, PERMISSIONS.PROJECTS.EDIT]), // Example permission
  taskController.createTask
);

// Get all tasks for a project (expects projectId from parent router)
router.get(
  '/',
  hasPermission(PERMISSIONS.TASKS.VIEW),
  taskController.getTasks
);

// Update a specific task
router.put(
  '/:taskId',
  hasPermission([PERMISSIONS.TASKS.EDIT, PERMISSIONS.PROJECTS.EDIT]), // General task edit
  taskController.updateTask
);

// Delete a specific task
router.delete(
  '/:taskId',
  hasPermission([PERMISSIONS.TASKS.DELETE, PERMISSIONS.PROJECTS.EDIT]),
  taskController.deleteTask
);

// Update a task's status
router.patch(
  '/:taskId/status',
  // Permission check will be more granular in the service layer based on task type/uploaderRole
  // For the route, a general permission to change any task status or manage tasks might be suitable
  // Or rely on isAuthenticated and let service layer do the full check.
  // Using a general task edit permission for now, or a specific "change_status_any" if available.
  hasPermission([PERMISSIONS.TASKS.CHANGE_STATUS, PERMISSIONS.TASKS.EDIT, PERMISSIONS.TASKS.UPDATE_STATUS_ANY]), 
  taskController.updateTaskStatus
);

// --- Subtask Routes (nested under a task) ---
// Create a new subtask for a task
router.post(
  '/:taskId/subtasks',
  hasPermission([PERMISSIONS.TASKS.EDIT]), // If you can edit a task, you can add subtasks
  subtaskController.createSubtask
);

// Update a specific subtask
router.put(
  '/:taskId/subtasks/:subtaskId',
  hasPermission([PERMISSIONS.TASKS.EDIT]),
  subtaskController.updateSubtask
);

// Delete a specific subtask
router.delete(
  '/:taskId/subtasks/:subtaskId',
  hasPermission([PERMISSIONS.TASKS.EDIT]),
  subtaskController.deleteSubtask
);

export default router;
