import { Router } from 'express';
import { createProject, getProjects, updateTaskStatus } from '../controllers/project.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', isAuthenticated, createProject);
router.get('/', isAuthenticated, getProjects);
router.put('/task/:taskId', isAuthenticated, updateTaskStatus);

export default router;
