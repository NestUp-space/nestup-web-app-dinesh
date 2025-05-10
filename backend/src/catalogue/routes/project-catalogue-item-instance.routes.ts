import express from 'express';
import { ProjectModelInstanceController } from '../controllers/project-model-instance.controller'; // To be created
import { validateRequest } from '../../common/middleware/validateRequest'; // Corrected path again
import { CreateProjectModelInstanceSchema, UpdateProjectModelInstanceSchema } from '../dtos/model.dto';
// import { authMiddleware, adminMiddleware } from '../../middlewares/auth.middleware'; // Assuming auth middlewares

const router = express.Router({ mergeParams: true }); // mergeParams might be useful if nested under projects
const projectModelInstanceController = new ProjectModelInstanceController(); // To be created

// POST /api/v1/model-management/project-model-instances - Create a new instance
router.post(
  '/',
  // authMiddleware, // Protect route
  validateRequest(CreateProjectModelInstanceSchema),
  projectModelInstanceController.createProjectModelInstance
);

// GET /api/v1/model-management/project-model-instances/by-project/:projectId - Get all instances for a project
router.get(
  '/by-project/:projectId',
  // authMiddleware,
  projectModelInstanceController.getProjectModelInstancesByProjectId
);

// GET /api/v1/model-management/project-model-instances/:id - Get a specific instance by ID
router.get(
  '/:id',
  // authMiddleware,
  projectModelInstanceController.getProjectModelInstanceById
);

// PUT /api/v1/model-management/project-model-instances/:id - Update an instance
router.put(
  '/:id',
  // authMiddleware,
  validateRequest(UpdateProjectModelInstanceSchema),
  projectModelInstanceController.updateProjectModelInstance
);

// DELETE /api/v1/model-management/project-model-instances/:id - Delete an instance
router.delete(
  '/:id',
  // authMiddleware, // Potentially admin/specific role
  projectModelInstanceController.deleteProjectModelInstance
);

// GET /api/v1/model-management/project-model-instances/:instanceId/generated-plank-lists - Get all generated plank lists for an instance
router.get(
  '/:instanceId/generated-plank-lists',
  // authMiddleware,
  projectModelInstanceController.getGeneratedPlankListsByInstanceId // New controller method
);

export default router;
