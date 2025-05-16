import express from 'express';
import { UserController } from '../controllers/user.controller';
import { hasPermission } from '../middlewares/permission.middleware';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { ensureCustomRequest } from '../middlewares/customRequest.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = express.Router();

// Apply authentication to all routes
router.use(isAuthenticated);

// User management routes with specific permissions
router.get('/', 
  hasPermission(PERMISSIONS.USERS.VIEW),
  UserController.getUsers
);

router.get('/by-role',
  hasPermission(PERMISSIONS.USERS.VIEW),
  UserController.getUsersByRole
);

// No special permission needed - users can view their own profile
router.get('/profile',
  ensureCustomRequest(UserController.getCurrentUserProfile)
);

router.get('/:id',
  hasPermission(PERMISSIONS.USERS.VIEW),
  UserController.getUserById
);

// Admin-only operations with specific permissions
router.post('/',
  hasPermission(PERMISSIONS.USERS.CREATE),
  UserController.createUser
);

router.patch('/:id/toggle-active',
  hasPermission([PERMISSIONS.USERS.EDIT, PERMISSIONS.USERS.MANAGE]),
  UserController.toggleUserActiveStatus
);

router.patch('/:id/update-password',
  hasPermission([PERMISSIONS.USERS.EDIT, PERMISSIONS.USERS.MANAGE]),
  ensureCustomRequest(UserController.updateUserPassword)
);

export default router;
