import { Router } from 'express';
import { BimController } from '../controllers/bim.controller';
// import { authMiddleware } from '../../middlewares/auth.middleware'; // Assuming auth middleware exists
// import { validateRequest } from '../../common/middleware/validateRequest'; // Assuming validation middleware exists
// import { createPlankListSchema, /* other schemas */ } from '../../validations/bim.validation'; // Assuming Zod schemas for validation

const bimRouter = Router();
const bimController = new BimController();

// Apply auth middleware to all BIM routes if needed
// bimRouter.use(authMiddleware);

/**
 * @openapi
 * /bim/site-measurements:
 *   post:
 *     tags:
 *       - BIM
 *     summary: Process site measurements
 *     description: Submits site measurement data to initiate or update a BIM project.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *                 example: "project-123"
 *               measurements:
 *                 type: object
 *                 example: { "length": 10, "width": 5, "height": 3 }
 *     responses:
 *       200:
 *         description: Site measurements processed successfully.
 *       400:
 *         description: Invalid input.
 */
bimRouter.post('/site-measurements', bimController.processSiteMeasurements);

/**
 * @openapi
 * /bim/3d-design:
 *   post:
 *     tags:
 *       - BIM
 *     summary: Create 3D design
 *     description: Initiates the creation of a 3D design based on provided model data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modelType:
 *                 type: string
 *                 example: "SimpleBox"
 *               parameters:
 *                 type: object
 *                 example: { "boxHeight": 2000, "boxWidth": 1000 }
 *     responses:
 *       200:
 *         description: 3D design creation initiated.
 *       400:
 *         description: Invalid input.
 */
bimRouter.post('/3d-design', bimController.create3DDesign);

/**
 * @openapi
 * /bim/plank-list/{modelType}:
 *   post:
 *     tags:
 *       - BIM
 *     summary: Create plank list for a model
 *     description: Generates a detailed plank list for a specified model type and inputs.
 *     parameters:
 *       - in: path
 *         name: modelType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of the BIM model (e.g., "Simple Box").
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               boxHeight:
 *                 type: number
 *                 example: 2200
 *               boxWidth:
 *                 type: number
 *                 example: 1200
 *               # Add other model-specific inputs here
 *     responses:
 *       200:
 *         description: Plank list generated successfully.
 *       400:
 *         description: Invalid input or model type not supported.
 *       404:
 *         description: Model type not found.
 */
// Example with validation middleware (uncomment and define schema if using)
// bimRouter.post('/plank-list/:modelType', validateRequest({ body: createPlankListSchema }), bimController.createPlankList);
bimRouter.post('/plank-list/:modelType', bimController.createPlankList);


/**
 * @openapi
 * /bim/cut-list:
 *   post:
 *     tags:
 *       - BIM
 *     summary: Generate cut list
 *     description: Generates an optimized cut list from a provided plank list.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plankList:
 *                 type: array
 *                 items:
 *                   type: object # Define plank object structure
 *                 example: [{ "plankId": "B1P1L", "width": 800, "height": 600, "materialCode": "M001" }]
 *     responses:
 *       200:
 *         description: Cut list generation initiated.
 *       400:
 *         description: Invalid input (e.g., missing plankList).
 */
bimRouter.post('/cut-list', bimController.generateCutList);

/**
 * @openapi
 * /bim/g-code:
 *   post:
 *     tags:
 *       - BIM
 *     summary: Generate G-code
 *     description: Generates G-code instructions from a provided cut list for CNC machining.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cutList:
 *                 type: object # Define cut list structure
 *                 example: { "sheetId": "S001", "cuts": [] }
 *     responses:
 *       200:
 *         description: G-code generation initiated.
 *       400:
 *         description: Invalid input (e.g., missing cutList).
 */
bimRouter.post('/g-code', bimController.generateGCode);

/**
 * @openapi
 * /bim/rules/global:
 *   get:
 *     tags:
 *       - BIM
 *     summary: Get global BIM rules
 *     description: Retrieves the global rules and configurations for the BIM process.
 *     responses:
 *       200:
 *         description: Global BIM rules retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object # Define structure of globalRules.json
 */
bimRouter.get('/rules/global', bimController.getGlobalRules);

/**
 * @openapi
 * /bim/models/{modelType}/template:
 *   get:
 *     tags:
 *       - BIM
 *     summary: Get BIM model template
 *     description: Retrieves the template for a specific BIM model type.
 *     parameters:
 *       - in: path
 *         name: modelType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of the BIM model (e.g., "Simple Box").
 *     responses:
 *       200:
 *         description: Model template retrieved successfully.
 *       404:
 *         description: Model type not found.
 */
bimRouter.get('/models/:modelType/template', bimController.getModelTemplate);

export default bimRouter;
