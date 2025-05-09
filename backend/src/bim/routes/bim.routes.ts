import { Router } from 'express';
import { bimController } from '../controllers/bim.controller';
// import { authMiddleware } from '../../middlewares/auth.middleware'; // Assuming auth middleware exists
// import { validateRequest } from '../../common/middleware/validateRequest'; // Assuming validation middleware exists
// import { createPlankListSchema, /* other schemas */ } from '../../validations/bim.validation'; // Assuming Zod schemas for validation

const bimRouter = Router();

// Apply auth middleware to all BIM routes if needed
// bimRouter.use(authMiddleware);

/**
 * @openapi
 * /bim/models:
 *   get:
 *     tags:
 *       - BIM
 *     summary: Get available model types
 *     description: Retrieves a list of all available BIM model types.
 *     responses:
 *       200:
 *         description: Available model types retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Available model types retrieved successfully."
 *                 responseObject:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Simple Box", "L-Shaped Box"]
 */
bimRouter.get('/models', bimController.getAvailableModelTypes);

/**
 * @openapi
 * /bim/models/info:
 *   get:
 *     tags:
 *       - BIM
 *     summary: Get information about all available models
 *     description: Retrieves detailed information about all available BIM models, including descriptions, screenshots, and input requirements.
 *     responses:
 *       200:
 *         description: Available models information retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Available models retrieved successfully."
 *                 responseObject:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       modelType:
 *                         type: string
 *                         example: "Simple Box"
 *                       description:
 *                         type: string
 *                         example: "A simple rectangular box with customizable dimensions."
 *                       screenshotUrl:
 *                         type: string
 *                         example: "/img/models/simple-box.png"
 *                       runtimeInputs:
 *                         type: object
 *                         example: { "boxHeight": null, "boxWidth": null, "boxDepth": null }
 */
bimRouter.get('/models/info', bimController.getAvailableModels);

/**
 * @openapi
 * /bim/models/{modelType}/info:
 *   get:
 *     tags:
 *       - BIM
 *     summary: Get information about a specific model
 *     description: Retrieves detailed information about a specific BIM model, including description, screenshot, and input requirements.
 *     parameters:
 *       - in: path
 *         name: modelType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of the BIM model (e.g., "Simple Box").
 *     responses:
 *       200:
 *         description: Model information retrieved successfully.
 *       404:
 *         description: Model type not found.
 */
bimRouter.get('/models/:modelType/info', bimController.getModelInfo);

/**
 * @openapi
 * /bim/models/{modelType}/validate:
 *   post:
 *     tags:
 *       - BIM
 *     summary: Validate inputs for a specific model
 *     description: Validates the provided inputs against the requirements for a specific BIM model.
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
 *             example: { "boxHeight": 2000, "boxWidth": 1000, "boxDepth": 500 }
 *     responses:
 *       200:
 *         description: Inputs validated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Validation successful."
 *                 responseObject:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Validation failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed."
 *                 responseObject:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       example: false
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Missing required input: boxHeight"]
 *       404:
 *         description: Model type not found.
 */
bimRouter.post('/models/:modelType/validate', bimController.validateModelInputs);

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
 *               materialProperties:
 *                 type: object
 *                 description: Optional map of material properties by material code
 *                 example: { "M001": { "innerLaminate": "default", "outerLaminate": "default", "plyThickness_mm": 16, "overallMaterialThickness_mm": 18, "plyType": "HDHMR" } }
 *     responses:
 *       200:
 *         description: Cut list generation initiated.
 *       400:
 *         description: Invalid input (e.g., missing plankList).
 */
bimRouter.post('/cut-list', bimController.generateCutList);

/**
 * @openapi
 * /bim/cut-list/download/csv:
 *   post:
 *     tags:
 *       - BIM
 *     summary: Download cut list as CSV
 *     description: Downloads an optimized cut list as a CSV file.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cutList:
 *                 type: object # Define cut list structure
 *     responses:
 *       200:
 *         description: CSV file download.
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid input (e.g., missing cutList).
 */
bimRouter.post('/cut-list/download/csv', bimController.downloadCutListCsv);

/**
 * @openapi
 * /bim/cut-list/download/json:
 *   post:
 *     tags:
 *       - BIM
 *     summary: Download cut list as JSON
 *     description: Downloads an optimized cut list as a JSON file.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cutList:
 *                 type: object # Define cut list structure
 *     responses:
 *       200:
 *         description: JSON file download.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid input (e.g., missing cutList).
 */
bimRouter.post('/cut-list/download/json', bimController.downloadCutListJson);

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
 * /bim/g-code/download:
 *   post:
 *     tags:
 *       - BIM
 *     summary: Download G-code
 *     description: Downloads G-code instructions as a file for CNC machining.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cutList:
 *                 type: object # Define cut list structure
 *     responses:
 *       200:
 *         description: G-code file download.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid input (e.g., missing cutList).
 */
bimRouter.post('/g-code/download', bimController.downloadGCode);

/**
 * @openapi
 * /bim/visualize-planks:
 *   post:
 *     tags:
 *       - BIM
 *     summary: Visualize planks
 *     description: Generates an SVG visualization of a plank list.
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
 *               title:
 *                 type: string
 *                 example: "Simple Box Visualization"
 *     responses:
 *       200:
 *         description: SVG visualization.
 *         content:
 *           image/svg+xml:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid input (e.g., missing plankList).
 */
bimRouter.post('/visualize-planks', bimController.visualizePlanks);

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
