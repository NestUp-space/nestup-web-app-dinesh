import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BimService } from '../services/bim.service';
import { handleServiceResponse } from '../../common/utils/httpHandlers'; // Assuming this utility exists
import { subtaskRepository } from '../../repositories/subtask.repository'; // For updating subtask

// TODO: Add input validation using Zod or similar

export class BimController {
  private bimService: BimService;

  constructor() {
    this.bimService = new BimService();
  }

  /**
   * @description Gets all available model types.
   * @param _req Express request object (unused).
   * @param res Express response object.
   */
  /*
  public async getAvailableModelTypes(_req: Request, res: Response): Promise<void> {
    const serviceResponse = this.bimService.getAvailableModelTypes();
    handleServiceResponse(serviceResponse, res);
  }
  */

  /**
   * @description Gets information about all available models.
   * @param _req Express request object (unused).
   * @param res Express response object.
   */
  /*
  public async getAvailableModels(_req: Request, res: Response): Promise<void> {
    const serviceResponse = this.bimService.getAvailableModels();
    handleServiceResponse(serviceResponse, res);
  }
  */

  /**
   * @description Gets information about a specific model.
   * @param req Express request object.
   * @param res Express response object.
   */
  /*
  public async getModelInfo(req: Request, res: Response): Promise<void> {
    const { modelType } = req.params;
    if (!modelType) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing modelType in request params.' });
      return;
    }
    const serviceResponse = this.bimService.getModelInfo(modelType);
    handleServiceResponse(serviceResponse, res);
  }
  */

  /**
   * @description Validates inputs for a specific model.
   * @param req Express request object.
   * @param res Express response object.
   */
  /*
  public async validateModelInputs(req: Request, res: Response): Promise<void> {
    const { modelType } = req.params;
    const inputs = req.body;
    
    if (!modelType) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing modelType in request params.' });
      return;
    }
    
    const serviceResponse = this.bimService.validateModelInputs(modelType, inputs);
    handleServiceResponse(serviceResponse, res);
  }
  */

  /**
   * @description Processes site measurements.
   * @param req Express request object.
   * @param res Express response object.
   */
  /*
  public async processSiteMeasurements(req: Request, res: Response): Promise<void> {
    // TODO: Validate req.body
    const measurements = req.body;
    const serviceResponse = this.bimService.processSiteMeasurements(measurements);
    handleServiceResponse(serviceResponse, res);
  }
  */

  /**
   * @description Initiates 3D design creation.
   * @param req Express request object.
   * @param res Express response object.
   */
  /*
  public async create3DDesign(req: Request, res: Response): Promise<void> {
    // TODO: Validate req.body
    const modelData = req.body;
    const serviceResponse = this.bimService.create3DDesign(modelData);
    handleServiceResponse(serviceResponse, res);
  }
  */

  /**
   * @description Generates a plank list.
   * @param req Express request object.
   * @param res Express response object.
   */
  public async createPlankList(req: Request, res: Response): Promise<void> {
    console.log('--- BimController.createPlankList ENTERED ---', 'Body:', req.body, 'Params:', req.params); // Diagnostic log
    // modelType (or modelName) should come from the body as sent by the frontend
    const { modelName, inputs, subtaskId, boxNumber, packetNumber } = req.body;

    if (!modelName) { // Changed from modelType (params) to modelName (body)
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing modelName in request body.' });
      return;
    }
    if (!inputs || subtaskId == null || !boxNumber || !packetNumber) {
      res.status(StatusCodes.BAD_REQUEST).json({ 
        success: false, 
        message: 'Missing required body parameters: modelName, inputs, subtaskId, boxNumber, packetNumber.' 
      });
      return;
    }

    // Call the service to generate the plank list
    // Note: The existing bimService.createPlankList might need adjustment if it doesn't 
    // directly support passing boxNumber and packetNumber for ID generation.
    // For now, we assume the plank generation logic itself (e.g., in ../reference/CreatePlanklist)
    // will need to be aware of these or the service method will handle it.
    // The current bimService.createPlankList returns ServiceResponse<Plank[] | null>
    // It expects modelType as the first argument. We are using modelName from the body.
    const plankListServiceResponse = this.bimService.createPlankList(modelName, inputs /*, boxNumber, packetNumber */); // Pass modelName instead of modelType

    if (!plankListServiceResponse.success || !plankListServiceResponse.responseObject) {
      handleServiceResponse(plankListServiceResponse, res); // Let httpHandlers deal with the error response
      return;
    }

    const generatedPlanks = plankListServiceResponse.responseObject;

    // TODO: The plank IDs in `generatedPlanks` might need to be updated here
    // to include boxNumber and packetNumber if not handled by the core generation logic.
    // Example:
    // const finalPlanks = generatedPlanks.map((plank, index) => ({
    //   ...plank,
    //   plankId: `B${boxNumber}P${packetNumber}L${index + 1}` // Or use existing plank.plankId suffix
    // }));


    try {
      const updatedSubtask = await subtaskRepository.update(subtaskId, {
        metadataJson: JSON.stringify({ plankListGenerated: true, generatedPlanks: generatedPlanks /* or finalPlanks */ }),
        completed: true,
      });

      if (!updatedSubtask) {
        res.status(StatusCodes.NOT_FOUND).json({ success: false, message: `Subtask with ID ${subtaskId} not found.` });
        return;
      }

      res.status(StatusCodes.OK).json({ 
        success: true, 
        message: 'Plank list generated and subtask updated successfully.', 
        plankList: generatedPlanks /* or finalPlanks */
      });
    } catch (error) {
      console.error('Error updating subtask:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to update subtask.' });
    }
  }

  /**
   * @description Generates a cut list.
   * @param req Express request object.
   * @param res Express response object.
   */
  /*
  public async generateCutList(req: Request, res: Response): Promise<void> {
    // TODO: Validate req.body
    const plankList = req.body.plankList; // Assuming plankList is passed in body
    const materialProperties = req.body.materialProperties; // Optional material properties
    
    if (!plankList) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing plankList in request body.' });
      return;
    }
    
    const serviceResponse = this.bimService.generateCutList(plankList, materialProperties);
    handleServiceResponse(serviceResponse, res);
  }
  */

  /**
   * @description Downloads a cut list as CSV.
   * @param req Express request object.
   * @param res Express response object.
   */
  /*
  public async downloadCutListCsv(req: Request, res: Response): Promise<void> {
    // TODO: Validate req.body
    const cutList = req.body.cutList as CutList; // Assuming cutList is passed in body
    if (!cutList) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing cutList in request body.' });
      return;
    }
    
    const serviceResponse = this.bimService.formatCutListAsCsv(cutList);
    
    if (serviceResponse.success && serviceResponse.responseObject) {
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="cutlist.csv"');
      
      // Send the CSV data
      res.send(serviceResponse.responseObject);
    } else {
      // Handle error
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: serviceResponse.message || 'Error formatting cut list as CSV.'
      });
    }
  }
  */

  /**
   * @description Downloads a cut list as JSON.
   * @param req Express request object.
   * @param res Express response object.
   */
  /*
  public async downloadCutListJson(req: Request, res: Response): Promise<void> {
    // TODO: Validate req.body
    const cutList = req.body.cutList as CutList; // Assuming cutList is passed in body
    if (!cutList) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing cutList in request body.' });
      return;
    }
    
    const serviceResponse = this.bimService.formatCutListAsJson(cutList);
    
    if (serviceResponse.success && serviceResponse.responseObject) {
      // Set headers for JSON download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="cutlist.json"');
      
      // Send the JSON data
      res.send(serviceResponse.responseObject);
    } else {
      // Handle error
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: serviceResponse.message || 'Error formatting cut list as JSON.'
      });
    }
  }
  */

  /**
   * @description Generates G-code.
   * @param req Express request object.
   * @param res Express response object.
   */
  /*
  public async generateGCode(req: Request, res: Response): Promise<void> {
    // TODO: Validate req.body
    const cutList = req.body.cutList as CutList; // Assuming cutList is passed in body
    if (!cutList) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing cutList in request body.' });
      return;
    }
    const serviceResponse = this.bimService.generateGCode(cutList);
    handleServiceResponse(serviceResponse, res);
  }
  */

  /**
   * @description Downloads G-code.
   * @param req Express request object.
   * @param res Express response object.
   */
  /*
  public async downloadGCode(req: Request, res: Response): Promise<void> {
    // TODO: Validate req.body
    const cutList = req.body.cutList as CutList; // Assuming cutList is passed in body
    if (!cutList) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing cutList in request body.' });
      return;
    }
    
    const serviceResponse = this.bimService.generateGCode(cutList);
    
    if (serviceResponse.success && serviceResponse.responseObject) {
      // Set headers for G-code download
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="gcode.nc"');
      
      // Send the G-code data
      res.send(serviceResponse.responseObject);
    } else {
      // Handle error
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: serviceResponse.message || 'Error generating G-code.'
      });
    }
  }
  */

  /**
   * @description Visualizes planks as SVG.
   * @param req Express request object.
   * @param res Express response object.
   */
  /*
  public async visualizePlanks(req: Request, res: Response): Promise<void> {
    // TODO: Validate req.body
    const plankList = req.body.plankList as Plank[]; // Assuming plankList is passed in body
    const title = req.body.title as string | undefined;
    
    if (!plankList) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing plankList in request body.' });
      return;
    }
    
    const serviceResponse = this.bimService.visualizePlanks(plankList, title);
    
    if (serviceResponse.success && serviceResponse.responseObject) {
      // Set headers for SVG
      res.setHeader('Content-Type', 'image/svg+xml');
      
      // Send the SVG data
      res.send(serviceResponse.responseObject);
    } else {
      // Handle error
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: serviceResponse.message || 'Error visualizing planks.'
      });
    }
  }
  */

  /**
   * @description Retrieves global BIM rules.
   * @param _req Express request object (unused).
   * @param res Express response object.
   */
  /*
  public async getGlobalRules(_req: Request, res: Response): Promise<void> {
    const serviceResponse = this.bimService.getGlobalRules();
    handleServiceResponse(serviceResponse, res);
  }
  */

  /**
   * @description Retrieves a specific BIM model template.
   * @param req Express request object.
   * @param res Express response object.
   */
  /*
  public async getModelTemplate(req: Request, res: Response): Promise<void> {
    const { modelType } = req.params;
    if (!modelType) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing modelType in request params.' });
        return;
    }
    const serviceResponse = this.bimService.getModelTemplate(modelType);
    handleServiceResponse(serviceResponse, res);
  }
  */
}

// Export a singleton instance
export const bimController = new BimController();
