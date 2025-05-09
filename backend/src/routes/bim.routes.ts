import { Router } from 'express';
import { BimController } from '../controllers/bim.controller';
import { isAuthenticated } from '../middlewares/auth.middleware'; // Corrected import

const router = Router();
const bimController = new BimController();

// Route to get all BIM model templates
// Applying authentication middleware, adjust as needed
router.get(
  '/model-templates',
  isAuthenticated, 
  bimController.getModelTemplates.bind(bimController)
);

// Route to generate plank list and update subtask
// Applying authentication middleware, adjust as needed
router.post(
  '/generate-plank-list',
  isAuthenticated,
  bimController.generatePlankListAndUpdateSubtask.bind(bimController)
);

export default router;
