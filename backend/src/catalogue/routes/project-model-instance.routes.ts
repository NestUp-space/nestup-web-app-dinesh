import express from 'express';
import { 
    createProjectModelInstance, 
    getAllProjectModelInstancesByProjectId, 
    getProjectModelInstanceById, 
    updateProjectModelInstance, 
    deleteProjectModelInstance,
    getGeneratedPlankListsForInstance
} from '../controllers/project-model-instance.controller'; // Updated controller import

const router = express.Router({ mergeParams: true }); // Ensure mergeParams is true if using nested routes like /projects/:projectId/instances

// Create a new project model instance (typically nested under a project)
// POST /projects/:projectId/instances
router.post('/', createProjectModelInstance);

// Get all project model instances for a specific project
// GET /projects/:projectId/instances
router.get('/', getAllProjectModelInstancesByProjectId);

// Get a specific project model instance by its ID
// GET /projects/:projectId/instances/:instanceId  OR /instances/:instanceId (depending on how you structure master routes)
router.get('/:instanceId', getProjectModelInstanceById);

// Update a project model instance
router.put('/:instanceId', updateProjectModelInstance);

// Delete a project model instance
router.delete('/:instanceId', deleteProjectModelInstance);

// Get generated plank lists for a specific project model instance
router.get('/:instanceId/generated-plank-lists', getGeneratedPlankListsForInstance);


export default router;
