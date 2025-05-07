import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BimService } from '../services/bim.service';
import { handleServiceResponse } from '../../common/utils/httpHandlers'; // Assuming this utility exists

// TODO: Add input validation using Zod or similar

export class BimController {
  private bimService: BimService;

  constructor() {
    this.bimService = new BimService();
  }

  /**
   * @description Processes site measurements.
   * @param req Express request object.
   * @param res Express response object.
   */
  public processSiteMeasurements = async (req: Request, res: Response): Promise<void> => {
    // TODO: Validate req.body
    const measurements = req.body;
    const serviceResponse = this.bimService.processSiteMeasurements(measurements);
    handleServiceResponse(serviceResponse, res);
  };

  /**
   * @description Initiates 3D design creation.
   * @param req Express request object.
   * @param res Express response object.
   */
  public create3DDesign = async (req: Request, res: Response): Promise<void> => {
    // TODO: Validate req.body
    const modelData = req.body;
    const serviceResponse = this.bimService.create3DDesign(modelData);
    handleServiceResponse(serviceResponse, res);
  };

  /**
   * @description Generates a plank list.
   * @param req Express request object.
   * @param res Express response object.
   */
  public createPlankList = async (req: Request, res: Response): Promise<void> => {
    // TODO: Validate req.body and req.params
    const { modelType } = req.params;
    const inputs = req.body;
    const serviceResponse = this.bimService.createPlankList(modelType, inputs);
    handleServiceResponse(serviceResponse, res);
  };

  /**
   * @description Generates a cut list.
   * @param req Express request object.
   * @param res Express response object.
   */
  public generateCutList = async (req: Request, res: Response): Promise<void> => {
    // TODO: Validate req.body
    const plankList = req.body.plankList; // Assuming plankList is passed in body
    if (!plankList) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing plankList in request body.' });
      return;
    }
    const serviceResponse = this.bimService.generateCutList(plankList);
    handleServiceResponse(serviceResponse, res);
  };

  /**
   * @description Generates G-code.
   * @param req Express request object.
   * @param res Express response object.
   */
  public generateGCode = async (req: Request, res: Response): Promise<void> => {
    // TODO: Validate req.body
    const cutList = req.body.cutList; // Assuming cutList is passed in body
    if (!cutList) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing cutList in request body.' });
      return;
    }
    const serviceResponse = this.bimService.generateGCode(cutList);
    handleServiceResponse(serviceResponse, res);
  };

  /**
   * @description Retrieves global BIM rules.
   * @param _req Express request object (unused).
   * @param res Express response object.
   */
  public getGlobalRules = async (_req: Request, res: Response): Promise<void> => {
    const serviceResponse = this.bimService.getGlobalRules();
    handleServiceResponse(serviceResponse, res);
  };

  /**
   * @description Retrieves a specific BIM model template.
   * @param req Express request object.
   * @param res Express response object.
   */
  public getModelTemplate = async (req: Request, res: Response): Promise<void> => {
    const { modelType } = req.params;
    if (!modelType) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Missing modelType in request params.' });
        return;
    }
    const serviceResponse = this.bimService.getModelTemplate(modelType);
    handleServiceResponse(serviceResponse, res);
  };
}
