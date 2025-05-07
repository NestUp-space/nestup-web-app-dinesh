import { Router } from 'express';
import { createProject, getProjects, updateProject, deleteProject, createTask, getTasks, updateTask, deleteTask, updateTaskStatus } from '../controllers/project.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

// Project routes
router.post('/', isAuthenticated, createProject);
router.get('/', isAuthenticated, getProjects);
router.put('/:projectId', isAuthenticated, updateProject);
router.delete('/:projectId', isAuthenticated, deleteProject);

// Task routes
router.post('/:projectId/tasks', isAuthenticated, createTask);
router.get('/:projectId/tasks', isAuthenticated, getTasks);
router.put('/tasks/:taskId', isAuthenticated, updateTask);
router.delete('/tasks/:taskId', isAuthenticated, deleteTask);
router.put('/task/:taskId/status', isAuthenticated, updateTaskStatus);

export default router;
