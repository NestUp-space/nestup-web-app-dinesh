import { Router } from 'express';
import { uploadFile, getFiles } from '../controllers/file.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

router.post('/upload', isAuthenticated, uploadFile);
router.get('/:taskId', isAuthenticated, getFiles);

export default router;
