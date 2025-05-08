import { Router } from 'express';
import { 
  createProject, 
  getProjects, 
  getProjectById, // Added
  updateProject, 
  deleteProject, 
  createTask, 
  getTasks, 
  updateTask, 
  deleteTask, 
  updateTaskStatus,
  // Subtask controllers
  createSubtask,
  getSubtasksForTask,
  updateSubtask,
  deleteSubtask
} from '../controllers/project.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

// Project routes
router.post('/', isAuthenticated, createProject);
router.get('/', isAuthenticated, getProjects);
router.get('/:projectId', isAuthenticated, getProjectById); // Added route for getProjectById
router.put('/:projectId', isAuthenticated, updateProject);
router.delete('/:projectId', isAuthenticated, deleteProject);

// Task routes
router.post('/:projectId/tasks', isAuthenticated, createTask);
router.get('/:projectId/tasks', isAuthenticated, getTasks);
router.put('/tasks/:taskId', isAuthenticated, updateTask);
router.delete('/tasks/:taskId', isAuthenticated, deleteTask);
router.put('/tasks/:taskId/status', isAuthenticated, updateTaskStatus); // Changed /task to /tasks for consistency

// Subtask routes
// POST /api/projects/tasks/:taskId/subtasks - Create a subtask for a specific task
router.post('/tasks/:taskId/subtasks', isAuthenticated, createSubtask);

// GET /api/projects/tasks/:taskId/subtasks - Get all subtasks for a specific task
router.get('/tasks/:taskId/subtasks', isAuthenticated, getSubtasksForTask);

// PUT /api/projects/subtasks/:subtaskId - Update a specific subtask
router.put('/subtasks/:subtaskId', isAuthenticated, updateSubtask);

// DELETE /api/projects/subtasks/:subtaskId - Delete a specific subtask
router.delete('/subtasks/:subtaskId', isAuthenticated, deleteSubtask);

export default router;
