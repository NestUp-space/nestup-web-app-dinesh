import express from 'express';
import { GenerationController } from '../controllers/generation.controller';
import { validateRequest } from '../../common/middleware/validateRequest';
import { GeneratePlankListSchema, GenerateMaterialEstimateSchema, TestItemScriptDtoSchema } from '../dtos/model.dto'; // Added TestItemScriptDtoSchema
// import { authMiddleware } from '../../middlewares/auth.middleware'; // TODO: Add auth middleware

const router = express.Router();
const generationController = new GenerationController();

// POST /api/v1/model-management/generate/plank-list
router.post(
  '/plank-list',
  // authMiddleware,
  validateRequest(GeneratePlankListSchema),
  generationController.generatePlankList
);

// POST /api/v1/model-management/generate/material-estimate
router.post(
  '/material-estimate',
  // authMiddleware,
  validateRequest(GenerateMaterialEstimateSchema),
  generationController.generateMaterialEstimate
);

// POST /api/v1/model-management/generate/test-item-script - For testing a BOM item's logic script
router.post(
  '/test-item-script',
  // authMiddleware, // Consider if this needs auth
  validateRequest(TestItemScriptDtoSchema),
  generationController.testItemScript
);

export default router;
