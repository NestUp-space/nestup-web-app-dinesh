import { Router } from 'express';
import { 
  projectController,
  taskController,
  subtaskController
} from '../controllers/project';
import { materialController } from '../controllers/material.controller'; // Added import
import { isAuthenticated } from '../middlewares/auth.middleware';

import { Request, Response } from 'express'; // Ensure Request and Response are imported from express

const router = Router();

// Project routes
router.post('/', isAuthenticated, (req: Request, res: Response) => projectController.createProject(req, res));
router.get('/', isAuthenticated, (req: Request, res: Response) => projectController.getProjects(req, res));
router.get('/:projectId', isAuthenticated, (req: Request, res: Response) => projectController.getProjectById(req, res));
router.put('/:projectId', isAuthenticated, (req: Request, res: Response) => projectController.updateProject(req, res));
router.delete('/:projectId', isAuthenticated, (req: Request, res: Response) => projectController.deleteProject(req, res));

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

// Material routes
// Note: Frontend uses /projects/:projectId/materials for list (GET) and create (POST)
// And /materials/:materialId for update (PUT) and delete (DELETE)
router.post('/:projectId/materials', isAuthenticated, materialController.createMaterial.bind(materialController));
router.get('/:projectId/materials', isAuthenticated, materialController.getMaterialsByProject.bind(materialController));
router.get('/materials/:materialId', isAuthenticated, materialController.getMaterialById.bind(materialController)); // For direct fetch if needed
router.put('/materials/:materialId', isAuthenticated, materialController.updateMaterial.bind(materialController));
router.delete('/materials/:materialId', isAuthenticated, materialController.deleteMaterial.bind(materialController));

export default router;
