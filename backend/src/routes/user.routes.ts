import express from 'express';
import { UserController } from '../controllers/user.controller';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(isAuthenticated);

// User profile route - accessible to all authenticated users
router.get('/profile', UserController.getCurrentUserProfile);

// Admin-only routes
router.get('/', adminMiddleware, UserController.getUsers);
router.post('/', adminMiddleware, UserController.createUser);
router.patch('/:id/toggle-active', adminMiddleware, UserController.toggleUserActiveStatus);
router.patch('/:id/update-password', adminMiddleware, UserController.updateUserPassword);
router.get('/by-role', adminMiddleware, UserController.getUsersByRole);
router.get('/:id', adminMiddleware, UserController.getUserById);

export default router;
