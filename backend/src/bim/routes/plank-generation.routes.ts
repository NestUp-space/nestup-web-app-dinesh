import express from 'express';
import { generatePlanksForProject, generatePlanksForBox } from '../controllers/plank-generation.controller';
import { isAuthenticated } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../common/middleware/validateRequest';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const generatePlanksForBoxSchema = z.object({
    body: z.object({
        boxNumber: z.string(),
        modelDefinitionId: z.string(),
        inputs: z.record(z.any()).optional().default({}),
    }),
});

const generatePlanksForProjectSchema = z.object({
    params: z.object({
        projectId: z.string().transform(val => parseInt(val, 10)),
    }),
});

// Generate planks for an entire project
// GET /api/bim/plank-generation/projects/:projectId
router.get('/projects/:projectId',
    isAuthenticated,
    validateRequest(generatePlanksForProjectSchema),
    generatePlanksForProject
);

// Generate planks for a single box
// POST /api/bim/plank-generation/box
router.post('/box',
    isAuthenticated,
    validateRequest(generatePlanksForBoxSchema),
    generatePlanksForBox
);

export default router;
