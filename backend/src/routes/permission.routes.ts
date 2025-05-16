import express from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { hasPermission } from '../middlewares/permission.middleware';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = express.Router();

// Apply authentication to all routes
router.use(isAuthenticated);

// Get all available permissions - requires permissions.view permission
router.get('/', 
  hasPermission(PERMISSIONS.PERMISSIONS.VIEW), 
  PermissionController.getAllPermissions
);

// Get permissions by role ID - requires permissions.view permission
router.get('/by-role/:roleId',
  hasPermission(PERMISSIONS.PERMISSIONS.VIEW),
  PermissionController.getPermissionsByRoleId
);

// Get user permissions - requires permissions.view permission
router.get('/by-user/:userId',
  hasPermission(PERMISSIONS.PERMISSIONS.VIEW),
  PermissionController.getUserPermissions
);

export default router;
