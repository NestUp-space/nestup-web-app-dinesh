import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import { BimService } from '../services/bim.service'; // Corrected: ModelTemplate not directly exported for controller use here
import { SubtaskRepository, subtaskRepository as globalSubtaskRepository } from '../repositories/subtask.repository';
// prisma instance is not passed to repositories as they instantiate their own
import { ProjectModelInstanceRepository } from '../catalogue/repositories/project-model-instance.repository'; // Updated repository name
import { ModelRepository } from '../catalogue/repositories/model.repository'; // Updated repository name and import
import { Plank } from '../bim/types/bim.types';

export class BimController {
  private bimService: BimService;
  private subtaskRepository: SubtaskRepository;
  private projectModelInstanceRepository: ProjectModelInstanceRepository; // Updated repository type
  private modelRepository: ModelRepository; // Updated repository type

  constructor() {
    this.bimService = new BimService();
    this.subtaskRepository = globalSubtaskRepository;
    this.projectModelInstanceRepository = new ProjectModelInstanceRepository(); // Updated instantiation
    this.modelRepository = new ModelRepository(); // Updated instantiation
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
    const customReq = req as CustomRequest;
    try {
      // BimService.getModelTemplates() returns Promise<ModelTemplate[]>
      // ModelTemplate is defined in BimService, ensure it's compatible or map it.
      // For now, assume the structure returned by service is what frontend expects.
      const templates = await this.bimService.getModelTemplates(); 
      console.log('[BimController.getModelTemplates] Templates to be sent:', JSON.stringify(templates, null, 2));
      res.status(200).json(templates); // Sending what the service returns
    } catch (error) {
      console.error('[BimController.getModelTemplates] Error caught:', error); // DEBUG LOG
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
    const customReq = req as CustomRequest; // Cast to CustomRequest
    try {
      // Note: customReq.user might be used here for role-based access or logging if needed
      const { modelName, inputs, subtaskId, boxNumber, packetNumber } = customReq.body;

      if (!modelName || !inputs || subtaskId == null || !boxNumber || !packetNumber) {
        res.status(400).json({ message: 'Missing required parameters: modelName, inputs, subtaskId, boxNumber, packetNumber.' });
        return;
      }
      
      // The BimService.generatePlankList is the correct method to call.
      // It internally handles loading the model definition JSON.
      const plankListArray = await this.bimService.generatePlankList(modelName, inputs, boxNumber, packetNumber);

      if (!plankListArray) { // Or check for specific error response from service if it returns one
        res.status(500).json({ message: 'Failed to generate plank list from service.' });
        return;
      }
      const plankList = plankListArray as Plank[]; // Cast if necessary, ensure service returns compatible type

      const updatedSubtask = await this.subtaskRepository.update(subtaskId, { 
        metadataJson: JSON.stringify({ plankListGenerated: true, generatedPlanks: plankList }),
        completed: true, 
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

  /**
   * @openapi
   * /api/catalogue/generate/plank-list:
   *   post:
   *     tags:
   *       - BIM Generation
   *     summary: Generates a plank list CSV for a ProjectCatalogueItemInstance
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - projectModelInstanceId
   *             properties:
   *               projectModelInstanceId:
   *                 type: string
   *                 description: The ID of the ProjectCatalogueItemInstance.
   *               boxNumber: # Optional, can be derived or defaulted
   *                 type: string 
   *               packetNumber: # Optional
   *                 type: string
   *     responses:
   *       200:
   *         description: Plank list CSV generated successfully.
   *         content:
   *           text/csv:
   *             schema:
   *               type: string
   *               format: binary
   *       400:
   *         description: Bad request (e.g., missing projectModelInstanceId)
   *       404:
   *         description: ProjectCatalogueItemInstance or related ModelDefinition not found
   *       500:
   *         description: Internal server error
   */
  public async generatePlankListCsvForInstance(req: Request, res: Response, next: NextFunction): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      const { projectModelInstanceId, boxNumber = '1', packetNumber = '1' } = customReq.body;

      if (!projectModelInstanceId) {
        res.status(400).json({ message: 'Missing required parameter: projectModelInstanceId.' });
        return;
      }

      const instance = await this.projectModelInstanceRepository.findById(projectModelInstanceId); // Corrected repository name
      if (!instance) {
        res.status(404).json({ message: `ProjectModelInstance with ID ${projectModelInstanceId} not found.` }); // Corrected message
        return;
      }

      // The CatalogueItemDefinition is what BimService expects as "ModelDefinition"
      // It's loaded by BimService from JSON files based on modelType.
      // We need to get the modelType (name) from the instance's linked CatalogueItemDefinition.
      // However, instance.modelDefinitionId links to CatalogueItemDefinition, which has the 'name' (modelType).
      // The BimService's getModelTemplate(modelType) loads the full ModelDefinition from JSON.
      
      // First, get the ModelDefinition to find its name (which is the modelType)
      const modelDef = await this.modelRepository.findById(instance.modelDefinitionId); // Updated repository and method
      if (!modelDef) {
          res.status(404).json({ message: `ModelDefinition with ID ${instance.modelDefinitionId} not found.` }); // Updated message
          return;
      }
      const modelType = modelDef.name; // Use updated variable

      // BimService.generatePlankList will internally load the model definition JSON based on modelType
      const runtimeInputs = instance.runtimeInputsJson as any;

      const plankListArray = await this.bimService.generatePlankList(modelType, runtimeInputs, boxNumber, packetNumber);

      if (!plankListArray) { // Or check for specific error response from service
        res.status(500).json({ message: 'Failed to generate plank list from service.' });
        return;
      }
      const plankList: Plank[] = plankListArray as Plank[]; // Cast if necessary

      // Convert plank list to CSV
      // Assuming BimService has a method to do this, or we implement it here/in utils
      // For now, let's assume a simple CSV conversion.
      // A more robust solution would use a library or a dedicated service method.
      
      let csvContent = "PlankID,Name,Width,Height,MaterialCode,Thickness,GrainDirection,EdgeTop,EdgeRight,EdgeBottom,EdgeLeft,Holes,Grooves\n";
      plankList.forEach(p => {
        const holesStr = p.holes?.map(h => `(x:${h.x},y:${h.y},z:${h.z},t:${h.t})`).join('; ') || '';
        const groovesStr = p.grooves?.map(g => `(x1:${g.x1},y1:${g.y1},x2:${g.x2},y2:${g.y2},z:${g.z},t:${g.t})`).join('; ') || '';
        csvContent += `${p.plankId},${p.name},${p.width},${p.height},${p.materialCode},${p.thickness || ''},${p.grainDirection || ''},${p.edgeBanding?.top || ''},${p.edgeBanding?.right || ''},${p.edgeBanding?.bottom || ''},${p.edgeBanding?.left || ''},"${holesStr}","${groovesStr}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="plank_list_${projectModelInstanceId}.csv"`);
      res.status(200).send(csvContent);

    } catch (error) {
      console.error('Error in generatePlankListCsvForInstance:', error);
      next(error);
    }
  }
}
