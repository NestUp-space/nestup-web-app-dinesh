/**
 * Material Routes
 * Defines API routes for project materials
 */

import { Router } from 'express';
import { materialController } from '../controllers/material.controller';
// Uncomment and fix the import when auth middleware is needed
// import { authMiddleware } from '../middlewares/auth.middleware';

const materialRouter = Router();

// Apply auth middleware to all material routes if needed
// materialRouter.use(authMiddleware);

/**
 * @openapi
 * /projects/{projectId}/materials:
 *   get:
 *     tags:
 *       - Materials
 *     summary: Get all materials for a project
 *     description: Retrieves all materials defined for a specific project.
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project.
 *     responses:
 *       200:
 *         description: Materials retrieved successfully.
 *       400:
 *         description: Invalid project ID.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
materialRouter.get('/projects/:projectId/materials', materialController.getMaterialsByProject);

/**
 * @openapi
 * /projects/{projectId}/materials:
 *   post:
 *     tags:
 *       - Materials
 *     summary: Create a new material
 *     description: Creates a new material for a specific project.
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - materialId
 *               - plyThickness
 *               - innerLaminateCode
 *               - outerLaminateCode
 *               - plyType
 *               - edgebandingInnerCode
 *               - edgebandingExposedCode
 *             properties:
 *               materialId:
 *                 type: string
 *                 description: User-defined unique ID for the material within the project.
 *               plyThickness:
 *                 type: number
 *                 description: Thickness of the ply in mm.
 *               innerLaminateCode:
 *                 type: string
 *                 description: Code for the inner laminate.
 *               outerLaminateCode:
 *                 type: string
 *                 description: Code for the outer laminate.
 *               plyType:
 *                 type: string
 *                 description: Type of ply (e.g., HDHMR, Blockboard).
 *               grainDirection:
 *                 type: string
 *                 description: Direction of the grain (optional).
 *               edgebandingInnerCode:
 *                 type: string
 *                 description: Code for the inner edgebanding.
 *               edgebandingExposedCode:
 *                 type: string
 *                 description: Code for the exposed edgebanding.
 *     responses:
 *       200:
 *         description: Material created successfully.
 *       400:
 *         description: Invalid input or material ID already exists.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
materialRouter.post('/projects/:projectId/materials', materialController.createMaterial);

/**
 * @openapi
 * /materials/{materialId}:
 *   get:
 *     tags:
 *       - Materials
 *     summary: Get a material by ID
 *     description: Retrieves a specific material by its ID.
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the material.
 *     responses:
 *       200:
 *         description: Material retrieved successfully.
 *       400:
 *         description: Invalid material ID.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Material not found.
 *       500:
 *         description: Server error.
 */
materialRouter.get('/materials/:materialId', materialController.getMaterialById);

/**
 * @openapi
 * /materials/{materialId}:
 *   put:
 *     tags:
 *       - Materials
 *     summary: Update a material
 *     description: Updates a specific material by its ID.
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the material.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               materialId:
 *                 type: string
 *                 description: User-defined unique ID for the material within the project.
 *               plyThickness:
 *                 type: number
 *                 description: Thickness of the ply in mm.
 *               innerLaminateCode:
 *                 type: string
 *                 description: Code for the inner laminate.
 *               outerLaminateCode:
 *                 type: string
 *                 description: Code for the outer laminate.
 *               plyType:
 *                 type: string
 *                 description: Type of ply (e.g., HDHMR, Blockboard).
 *               grainDirection:
 *                 type: string
 *                 description: Direction of the grain (optional).
 *               edgebandingInnerCode:
 *                 type: string
 *                 description: Code for the inner edgebanding.
 *               edgebandingExposedCode:
 *                 type: string
 *                 description: Code for the exposed edgebanding.
 *     responses:
 *       200:
 *         description: Material updated successfully.
 *       400:
 *         description: Invalid input or material ID already exists.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Material not found.
 *       500:
 *         description: Server error.
 */
materialRouter.put('/materials/:materialId', materialController.updateMaterial);

/**
 * @openapi
 * /materials/{materialId}:
 *   delete:
 *     tags:
 *       - Materials
 *     summary: Delete a material
 *     description: Deletes a specific material by its ID.
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the material.
 *     responses:
 *       200:
 *         description: Material deleted successfully.
 *       400:
 *         description: Invalid material ID.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Material not found.
 *       500:
 *         description: Server error.
 */
materialRouter.delete('/materials/:materialId', materialController.deleteMaterial);

export default materialRouter;
