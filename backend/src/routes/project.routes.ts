import { Router } from 'express';
import { 
  projectController,
  taskController,
  subtaskController
} from '../controllers/project';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

// Project routes
router.post('/', isAuthenticated, projectController.createProject.bind(projectController));
router.get('/', isAuthenticated, projectController.getProjects.bind(projectController));
router.get('/:projectId', isAuthenticated, projectController.getProjectById.bind(projectController));
router.put('/:projectId', isAuthenticated, projectController.updateProject.bind(projectController));
router.delete('/:projectId', isAuthenticated, projectController.deleteProject.bind(projectController));

// Task routes
router.post('/:projectId/tasks', isAuthenticated, taskController.createTask.bind(taskController));
router.get('/:projectId/tasks', isAuthenticated, taskController.getTasks.bind(taskController));
router.put('/tasks/:taskId', isAuthenticated, taskController.updateTask.bind(taskController));
router.delete('/tasks/:taskId', isAuthenticated, taskController.deleteTask.bind(taskController));
router.put('/tasks/:taskId/status', isAuthenticated, taskController.updateTaskStatus.bind(taskController));

// Subtask routes
router.post('/tasks/:taskId/subtasks', isAuthenticated, subtaskController.createSubtask.bind(subtaskController));
router.get('/tasks/:taskId/subtasks', isAuthenticated, subtaskController.getSubtasksForTask.bind(subtaskController));
router.put('/subtasks/:subtaskId', isAuthenticated, subtaskController.updateSubtask.bind(subtaskController));
router.delete('/subtasks/:subtaskId', isAuthenticated, subtaskController.deleteSubtask.bind(subtaskController));

export default router;
