/**
 * SiteVisitBox Routes
 * Defines API routes for site visit box configurations
 */

import { Router } from 'express';
import { siteVisitBoxController } from '../controllers/siteVisitBox.controller';
// Uncomment and fix the import when auth middleware is needed
// import { authMiddleware } from '../middlewares/auth.middleware';

const siteVisitBoxRouter = Router();

// Apply auth middleware to all site visit box routes if needed
// siteVisitBoxRouter.use(authMiddleware);

/**
 * @openapi
 * /tasks/{taskId}/site-visit/boxes:
 *   get:
 *     tags:
 *       - Site Visit Boxes
 *     summary: Get all site visit boxes for a task
 *     description: Retrieves all box configurations for a specific site visit task.
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the task.
 *     responses:
 *       200:
 *         description: Site visit boxes retrieved successfully.
 *       400:
 *         description: Invalid task ID.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
siteVisitBoxRouter.get('/tasks/:taskId/site-visit/boxes', siteVisitBoxController.getBoxesByTask);

/**
 * @openapi
 * /tasks/{taskId}/site-visit/boxes:
 *   post:
 *     tags:
 *       - Site Visit Boxes
 *     summary: Create a new site visit box
 *     description: Creates a new box configuration for a specific site visit task.
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the task.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelType
 *               - inputs
 *             properties:
 *               order:
 *                 type: integer
 *                 description: The order of the box in the task (optional, will be auto-assigned if not provided).
 *               modelType:
 *                 type: string
 *                 description: The type of the box model (e.g., "Simple Box", "L-Shaped Box").
 *               inputs:
 *                 type: object
 *                 description: The inputs for the box model (varies by model type).
 *     responses:
 *       200:
 *         description: Site visit box created successfully.
 *       400:
 *         description: Invalid input or model type not supported.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
siteVisitBoxRouter.post('/tasks/:taskId/site-visit/boxes', siteVisitBoxController.createBox);

/**
 * @openapi
 * /tasks/{taskId}/site-visit/boxes/reorder:
 *   post:
 *     tags:
 *       - Site Visit Boxes
 *     summary: Reorder site visit boxes
 *     description: Reorders the boxes in a specific site visit task.
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the task.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderedIds
 *             properties:
 *               orderedIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: The IDs of the boxes in the desired order.
 *     responses:
 *       200:
 *         description: Site visit boxes reordered successfully.
 *       400:
 *         description: Invalid input or box IDs not found.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
siteVisitBoxRouter.post('/tasks/:taskId/site-visit/boxes/reorder', siteVisitBoxController.reorderBoxes);

/**
 * @openapi
 * /tasks/{taskId}/site-visit/generate-planklist:
 *   post:
 *     tags:
 *       - Site Visit Boxes
 *     summary: Generate a combined plank list
 *     description: Generates a combined plank list from all boxes in a specific site visit task.
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the task.
 *     responses:
 *       200:
 *         description: Plank list generated successfully.
 *       400:
 *         description: Invalid task ID or no boxes found.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
siteVisitBoxRouter.post('/tasks/:taskId/site-visit/generate-planklist', siteVisitBoxController.generatePlankList);

/**
 * @openapi
 * /tasks/{taskId}/site-visit/download-planklist-csv:
 *   get:
 *     tags:
 *       - Site Visit Boxes
 *     summary: Download a combined plank list as CSV
 *     description: Downloads a combined plank list from all boxes in a specific site visit task as a CSV file.
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the task.
 *     responses:
 *       200:
 *         description: CSV file download.
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid task ID or no boxes found.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
siteVisitBoxRouter.get('/tasks/:taskId/site-visit/download-planklist-csv', siteVisitBoxController.downloadPlankListCsv);

/**
 * @openapi
 * /site-visit/boxes/{boxId}:
 *   get:
 *     tags:
 *       - Site Visit Boxes
 *     summary: Get a site visit box by ID
 *     description: Retrieves a specific site visit box by its ID.
 *     parameters:
 *       - in: path
 *         name: boxId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the box.
 *     responses:
 *       200:
 *         description: Site visit box retrieved successfully.
 *       400:
 *         description: Invalid box ID.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Box not found.
 *       500:
 *         description: Server error.
 */
siteVisitBoxRouter.get('/site-visit/boxes/:boxId', siteVisitBoxController.getBoxById);

/**
 * @openapi
 * /site-visit/boxes/{boxId}:
 *   put:
 *     tags:
 *       - Site Visit Boxes
 *     summary: Update a site visit box
 *     description: Updates a specific site visit box by its ID.
 *     parameters:
 *       - in: path
 *         name: boxId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the box.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order:
 *                 type: integer
 *                 description: The order of the box in the task.
 *               modelType:
 *                 type: string
 *                 description: The type of the box model (e.g., "Simple Box", "L-Shaped Box").
 *               inputs:
 *                 type: object
 *                 description: The inputs for the box model (varies by model type).
 *     responses:
 *       200:
 *         description: Site visit box updated successfully.
 *       400:
 *         description: Invalid input or model type not supported.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Box not found.
 *       500:
 *         description: Server error.
 */
siteVisitBoxRouter.put('/site-visit/boxes/:boxId', siteVisitBoxController.updateBox);

/**
 * @openapi
 * /site-visit/boxes/{boxId}:
 *   delete:
 *     tags:
 *       - Site Visit Boxes
 *     summary: Delete a site visit box
 *     description: Deletes a specific site visit box by its ID.
 *     parameters:
 *       - in: path
 *         name: boxId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the box.
 *     responses:
 *       200:
 *         description: Site visit box deleted successfully.
 *       400:
 *         description: Invalid box ID.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Box not found.
 *       500:
 *         description: Server error.
 */
siteVisitBoxRouter.delete('/site-visit/boxes/:boxId', siteVisitBoxController.deleteBox);

export default siteVisitBoxRouter;
