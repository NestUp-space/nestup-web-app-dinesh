import express from 'express';
import modelDefinitionRoutes from './model.routes';
import projectModelInstanceRoutes from './project-model-instance.routes';
import generationRoutes from './generation.routes'; // Assuming this will be for plank list generation etc.
import catalogueMetaRoutes from './catalogue-meta.routes';
import validationRoutes from './validation.routes';

const router = express.Router();

router.use('/definitions', modelDefinitionRoutes); // e.g., /api/v1/catalogue/definitions
router.use('/project-instances', projectModelInstanceRoutes); // e.g., /api/v1/catalogue/project-instances
router.use('/generate', generationRoutes); // e.g., /api/v1/catalogue/generate/plank-list
router.use('/', catalogueMetaRoutes); // e.g., /api/v1/catalogue/global-constants
router.use('/', validationRoutes); // e.g., /api/v1/catalogue/validate-item-logic

export default router;
