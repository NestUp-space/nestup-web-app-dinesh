import express from 'express';
import modelDefinitionRoutes from './model.routes';
import projectModelInstanceRoutes from './project-model-instance.routes';
import generationRoutes from './generation.routes'; // Assuming this will be for plank list generation etc.

const router = express.Router();

router.use('/definitions', modelDefinitionRoutes); // e.g., /api/v1/model-management/definitions
router.use('/project-instances', projectModelInstanceRoutes); // e.g., /api/v1/model-management/project-instances
router.use('/generate', generationRoutes); // e.g., /api/v1/model-management/generate/plank-list

export default router;
