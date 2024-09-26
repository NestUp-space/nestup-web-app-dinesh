import express from 'express';
import { UserController } from '../controllers/user.controller';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(isAuthenticated);

// Routes
router.get('/', adminMiddleware, UserController.getUsers);
router.post('/', adminMiddleware, UserController.createUser);
router.patch('/:id/toggle', adminMiddleware, UserController.toggleUserActiveStatus);
router.get('/:id', adminMiddleware, UserController.getUserById);

export default router;
