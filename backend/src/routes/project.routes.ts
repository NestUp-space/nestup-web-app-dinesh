import express from 'express';
import { ProjectController } from '../controllers/project.controller';
import { hasPermission } from '../middlewares/permission.middleware';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';
import { validateProjectStatusTransition } from '../middlewares/validateProjectStatus';
import type { Request, Response, NextFunction } from 'express';
import type { CustomRequest } from '../middlewares/auth.middleware';
import projectModelInstanceRouter from '../catalogue/routes/project-model-instance.routes';
import taskRouter from './task.routes'; // Import the new task router

const router = express.Router();

// Request handler type helper
const handleCustomRequest = (handler: (req: CustomRequest, res: Response) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as CustomRequest, res).catch(next);
  };
};

// Apply authentication to all routes
router.use(isAuthenticated);

// Project list and search
router.get('/', 
  hasPermission(PERMISSIONS.PROJECTS.VIEW),
  handleCustomRequest(ProjectController.getProjects)
);

// Create new project
router.post('/',
  hasPermission([PERMISSIONS.PROJECTS.CREATE, PERMISSIONS.PROJECTS.MANAGE]),
  handleCustomRequest(ProjectController.createProject)
);

// Get project by ID
router.get('/:id',
  hasPermission(PERMISSIONS.PROJECTS.VIEW),
  ProjectController.getProjectById
);

// Update project details
router.put('/:id',
  hasPermission([PERMISSIONS.PROJECTS.EDIT, PERMISSIONS.PROJECTS.MANAGE]),
  handleCustomRequest(ProjectController.updateProject)
);

// Delete project (REMOVED)
// router.delete('/:id',
//   hasPermission([PERMISSIONS.PROJECTS.DELETE, PERMISSIONS.PROJECTS.MANAGE]),
//   ProjectController.deleteProject
// );

// Project status management
router.patch('/:id/status',
  hasPermission([PERMISSIONS.PROJECTS.CHANGE_STATUS, PERMISSIONS.PROJECTS.MANAGE]), // Updated permission
  validateProjectStatusTransition,
  handleCustomRequest(ProjectController.updateProjectStatus)
);

// Project sharing and collaboration
router.post('/:id/share',
  hasPermission([PERMISSIONS.PROJECTS.MANAGE]), // Simplified, assuming MANAGE covers sharing
  handleCustomRequest(ProjectController.shareProject)
);

// Project comments and activity
router.post('/:id/comments',
  hasPermission([PERMISSIONS.PROJECTS.EDIT, PERMISSIONS.PROJECTS.MANAGE]), // Assuming EDIT implies ability to comment
  handleCustomRequest(ProjectController.addComment)
);

router.get('/:id/activity',
  hasPermission(PERMISSIONS.PROJECTS.VIEW),
  ProjectController.getProjectActivity
);

// Project materials management
router.get('/:id/materials',
  hasPermission([PERMISSIONS.PROJECTS.VIEW, PERMISSIONS.MATERIALS.VIEW]),
  ProjectController.getProjectMaterials
);

router.post('/:id/materials',
  hasPermission([PERMISSIONS.PROJECTS.EDIT, PERMISSIONS.MATERIALS.EDIT]),
  handleCustomRequest(ProjectController.updateProjectMaterials)
);

// Project model instances management
router.use('/:id/model-instances', projectModelInstanceRouter);

// Mount task router for project-specific tasks
// :id here will be projectId, accessible in taskRouter via req.params.projectId due to mergeParams
router.use('/:id/tasks', taskRouter); 

export default router;
