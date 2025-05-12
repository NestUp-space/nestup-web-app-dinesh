import express from 'express';
import { 
    createProjectModelInstance, 
    getAllProjectModelInstancesByProjectId, 
    getProjectModelInstanceById, 
    updateProjectModelInstance, 
    deleteProjectModelInstance,
    getGeneratedPlankListsForInstance,
    batchUpdateProjectModelInstances
} from '../controllers/project-model-instance.controller';
import { validateRequest } from '../../common/middleware/validateRequest';
import { isAuthenticated } from '../../middlewares/auth.middleware';
import {
    createProjectModelInstanceSchema,
    updateProjectModelInstanceSchema,
    getProjectModelInstancesSchema,
    batchUpdateProjectModelInstancesSchema
} from '../dtos/project-model-instance.dto';

const router = express.Router({ mergeParams: true });

// Create a single project model instance
// POST /projects/:projectId/model-instances
router.post('/',
    isAuthenticated,
    validateRequest(createProjectModelInstanceSchema),
    createProjectModelInstance
);

// Get all project model instances for a project (ordered by uiDisplayOrder)
// GET /projects/:projectId/model-instances
router.get('/',
    isAuthenticated,
    validateRequest(getProjectModelInstancesSchema),
    getAllProjectModelInstancesByProjectId
);

// Get a specific project model instance
// GET /projects/:projectId/model-instances/:instanceId
router.get('/:instanceId',
    isAuthenticated,
    getProjectModelInstanceById
);

// Update a single project model instance
// PUT /projects/:projectId/model-instances/:instanceId
router.put('/:instanceId',
    isAuthenticated,
    validateRequest(updateProjectModelInstanceSchema),
    updateProjectModelInstance
);

// Delete a single project model instance
// DELETE /projects/:projectId/model-instances/:instanceId
router.delete('/:instanceId',
    isAuthenticated,
    deleteProjectModelInstance
);

// Get generated plank lists for a specific instance
// GET /projects/:projectId/model-instances/:instanceId/generated-plank-lists
router.get('/:instanceId/generated-plank-lists',
    isAuthenticated,
    getGeneratedPlankListsForInstance
);

// Batch update project model instances
// PUT /projects/:projectId/model-instances/batch
router.put('/batch',
    isAuthenticated,
    validateRequest(batchUpdateProjectModelInstancesSchema),
    batchUpdateProjectModelInstances
);

export default router;
