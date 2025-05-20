import { Router, Request, Response } from 'express'; // Added Request, Response
// Import the BimController CLASS
import { BimController } from '../controllers/bim.controller'; 
import { isAuthenticated } from '../middlewares/auth.middleware'; 

const router = Router();
// Create an instance of the controller for this router
const bimControllerInstance: BimController = new BimController();

// PING-DEBUG TEST ROUTE
router.get('/ping-bim-debug', (_req: Request, res: Response) => {
  console.log('--- /api/bim/ping-bim-debug HIT ---');
  res.status(200).send('BIM router is alive! Ping-debug successful.');
});

/*
// ORIGINAL TEST ROUTE (can be kept or removed)
router.get('/test-bim-route', (req: Request, res: Response) => { // Added types
  res.status(200).json({ message: 'BIM test route is working!' });
});
*/

/*
// Route to get all BIM model templates
// Applying authentication middleware, adjust as needed
router.get(
  '/model-templates',
  isAuthenticated, 
  bimControllerInstance.getModelTemplates.bind(bimControllerInstance)
);
*/

// Route to generate plank list and update subtask
// Applying authentication middleware, adjust as needed
router.post(
  '/generate-plank-list',
  isAuthenticated,
  bimControllerInstance.generatePlankListAndUpdateSubtask.bind(bimControllerInstance)
);

export default router;
