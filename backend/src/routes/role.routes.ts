import express from 'express';
import { RoleController } from '../controllers/role.controller';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(isAuthenticated);

// Apply admin middleware to all routes
router.use(adminMiddleware);

// Role routes
router.post('/', RoleController.createRole);
router.get('/', RoleController.getRoles);
router.get('/:id', RoleController.getRoleById);
router.put('/:id', RoleController.updateRole);
router.delete('/:id', RoleController.deleteRole);

export default router;
