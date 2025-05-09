import { Request, Response, NextFunction } from 'express';
import { BimService, ModelTemplate } from '../services/bim.service';
import { SubtaskRepository, subtaskRepository as globalSubtaskRepository } from '../repositories/subtask.repository'; // Use the exported singleton or instantiate
import prisma from '../config/db'; // Corrected import for default export

export class BimController {
  private bimService: BimService;
  private subtaskRepository: SubtaskRepository; // Or use globalSubtaskRepository directly

  constructor() {
    this.bimService = new BimService();
    // The SubtaskRepository constructor doesn't take arguments, 
    // or we can use the exported singleton instance.
    this.subtaskRepository = globalSubtaskRepository; // Using the singleton instance
  }

  /**
   * @openapi
   * /api/bim/model-templates:
   *   get:
   *     tags:
   *       - BIM
   *     summary: Retrieves all available BIM model templates
   *     responses:
   *       200:
   *         description: A list of BIM model templates.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ModelTemplate' # Assuming you'll define this schema
   *       500:
   *         description: Internal server error
   */
  public async getModelTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates: ModelTemplate[] = await this.bimService.getModelTemplates();
      res.status(200).json(templates);
    } catch (error) {
      next(error); // Pass error to global error handler
    }
  }

  /**
   * @openapi
   * /api/bim/generate-plank-list:
   *   post:
   *     tags:
   *       - BIM
   *     summary: Generates a plank list based on selected model and inputs, and updates a subtask
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - modelName
   *               - inputs
   *               - subtaskId
   *               - boxNumber
   *               - packetNumber
   *             properties:
   *               modelName:
   *                 type: string
   *                 description: The name of the BIM model template to use.
   *               inputs:
   *                 type: object
   *                 description: Key-value pairs of runtime inputs for the model.
   *               subtaskId:
   *                 type: integer
   *                 description: The ID of the 'Collect Model and dimensions' subtask to update.
   *               boxNumber:
   *                 type: string
   *                 description: The box number for generating plank IDs.
   *               packetNumber:
   *                 type: string
   *                 description: The packet number for generating plank IDs.
   *               plankList: # To store the generated list in the subtask
   *                 type: array
   *                 items:
   *                   type: object 
   *     responses:
   *       200:
   *         description: Plank list generated successfully and subtask updated.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 plankList:
   *                   type: array
   *                   items:
   *                     type: object # Define plank structure here if needed
   *       400:
   *         description: Bad request (e.g., missing parameters)
   *       404:
   *         description: Subtask not found
   *       500:
   *         description: Internal server error
   */
  public async generatePlankListAndUpdateSubtask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { modelName, inputs, subtaskId, boxNumber, packetNumber } = req.body;

      if (!modelName || !inputs || subtaskId == null || !boxNumber || !packetNumber) {
        res.status(400).json({ message: 'Missing required parameters: modelName, inputs, subtaskId, boxNumber, packetNumber.' });
        return;
      }

      const plankList = await this.bimService.generatePlankList(modelName, inputs, boxNumber, packetNumber);

      // Update the subtask with the generated plank list and mark as completed
      // The plank list could be stored in a JSON field in the Subtask model, e.g., 'metadataJson' or a dedicated 'plankListJson'
      const updatedSubtask = await this.subtaskRepository.update(subtaskId, { // Changed to 'update'
        // Assuming 'metadataJson' can store this. Adjust if Subtask model has a specific field.
        metadataJson: JSON.stringify({ plankListGenerated: true, generatedPlanks: plankList }),
        completed: true, // Mark subtask as completed
      });

      if (!updatedSubtask) {
        res.status(404).json({ message: `Subtask with ID ${subtaskId} not found.` });
        return;
      }
      
      res.status(200).json({ message: 'Plank list generated and subtask updated successfully.', plankList });
    } catch (error) {
      next(error);
    }
  }
}
