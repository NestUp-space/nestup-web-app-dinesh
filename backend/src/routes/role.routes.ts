import express from 'express';
import { RoleController } from '../controllers/role.controller';
import { hasPermission } from '../middlewares/permission.middleware';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = express.Router();

// Public route for fetching external roles for registration
router.get('/registration/external-roles', RoleController.getExternalRolesForRegistration);

// Apply authentication to all routes
router.use(isAuthenticated);

// Role management routes
router.get('/', 
  hasPermission(PERMISSIONS.ROLES.VIEW),
  RoleController.getRoles
);

router.get('/:id', 
  hasPermission(PERMISSIONS.ROLES.VIEW),
  RoleController.getRoleById
);

router.post('/', 
  hasPermission([PERMISSIONS.ROLES.CREATE, PERMISSIONS.ROLES.MANAGE]),
  RoleController.createRole
);

router.put('/:id', 
  hasPermission([PERMISSIONS.ROLES.EDIT, PERMISSIONS.ROLES.MANAGE]),
  RoleController.updateRole
);

// Only users with role.delete or role.manage permissions can delete roles
router.delete('/:id', 
  hasPermission([PERMISSIONS.ROLES.DELETE, PERMISSIONS.ROLES.MANAGE]),
  RoleController.deleteRole
);

export default router;
