/**
 * SiteVisitBox Controller
 * Handles HTTP requests for site visit box configurations
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CreateSiteVisitBoxDto, UpdateSiteVisitBoxDto } from '../bim/types/bim.types'; // Updated import path
// import { formatCutListAsCsv } from '../bim/reference/CreateCutlist';
import { siteVisitBoxService } from '../services/siteVisitBox.service';
import { handleServiceResponse } from '../common/utils/httpHandlers';

export class SiteVisitBoxController {
  /**
   * @description Create a new site visit box configuration
   * @param req Express request object
   * @param res Express response object
   */
  public createBox = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      if (isNaN(taskId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid task ID',
        });
        return;
      }

      const boxData: CreateSiteVisitBoxDto = req.body;
      const serviceResponse = await siteVisitBoxService.createSiteVisitBox(taskId, boxData);
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error('Error in createBox controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error creating site visit box',
      });
    }
  };

  /**
   * @description Get all site visit boxes for a task
   * @param req Express request object
   * @param res Express response object
   */
  public getBoxesByTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      if (isNaN(taskId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid task ID',
        });
        return;
      }

      const serviceResponse = await siteVisitBoxService.getBoxesByTask(taskId);
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error('Error in getBoxesByTask controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error retrieving site visit boxes',
      });
    }
  };

  /**
   * @description Get a site visit box by ID
   * @param req Express request object
   * @param res Express response object
   */
  public getBoxById = async (req: Request, res: Response): Promise<void> => {
    try {
      const boxId = parseInt(req.params.boxId, 10);
      if (isNaN(boxId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid box ID',
        });
        return;
      }

      const serviceResponse = await siteVisitBoxService.getBoxById(boxId);
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error('Error in getBoxById controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error retrieving site visit box',
      });
    }
  };

  /**
   * @description Update a site visit box
   * @param req Express request object
   * @param res Express response object
   */
  public updateBox = async (req: Request, res: Response): Promise<void> => {
    try {
      const boxId = parseInt(req.params.boxId, 10);
      if (isNaN(boxId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid box ID',
        });
        return;
      }

      const boxData: UpdateSiteVisitBoxDto = req.body;
      const serviceResponse = await siteVisitBoxService.updateBox(boxId, boxData);
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error('Error in updateBox controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating site visit box',
      });
    }
  };

  /**
   * @description Delete a site visit box
   * @param req Express request object
   * @param res Express response object
   */
  public deleteBox = async (req: Request, res: Response): Promise<void> => {
    try {
      const boxId = parseInt(req.params.boxId, 10);
      if (isNaN(boxId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid box ID',
        });
        return;
      }

      const serviceResponse = await siteVisitBoxService.deleteBox(boxId);
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error('Error in deleteBox controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error deleting site visit box',
      });
    }
  };

  /**
   * @description Reorder site visit boxes in a task
   * @param req Express request object
   * @param res Express response object
   */
  public reorderBoxes = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      if (isNaN(taskId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid task ID',
        });
        return;
      }

      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'orderedIds must be an array of box IDs',
        });
        return;
      }

      const serviceResponse = await siteVisitBoxService.reorderBoxes(taskId, orderedIds);
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error('Error in reorderBoxes controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error reordering site visit boxes',
      });
    }
  };

  /**
   * @description Generate a combined plank list from all boxes in a task
   * @param req Express request object
   * @param res Express response object
   */
  public generatePlankList = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      if (isNaN(taskId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid task ID',
        });
        return;
      }

      const serviceResponse = await siteVisitBoxService.generateCombinedPlankList(taskId);
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error('Error in generatePlankList controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error generating plank list',
      });
    }
  };

  /**
   * @description Download a combined plank list as CSV
   * @param req Express request object
   * @param res Express response object
   */
  public downloadPlankListCsv = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      if (isNaN(taskId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid task ID',
        });
        return;
      }

      const plankListResponse = await siteVisitBoxService.generateCombinedPlankList(taskId);
      if (!plankListResponse.success || !plankListResponse.responseObject) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: plankListResponse.message || 'Error generating plank list',
        });
        return;
      }

      // Convert plank list to CSV
      const planks = plankListResponse.responseObject;
      const headers = ['plankId', 'name', 'width', 'height', 'materialCode', 'grainDirection', 'boxId', 'boxModelType'];
      
      let csv = headers.join(',') + '\n';
      
      for (const plank of planks) {
        const row = [
          plank.plankId || '',
          plank.name || '',
          plank.width || '',
          plank.height || '',
          plank.materialCode || '',
          plank.grainDirection || '',
          plank.boxId || '',
          plank.boxModelType || '',
        ].map(value => `"${value}"`).join(',');
        
        csv += row + '\n';
      }

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="planklist.csv"');
      
      // Send the CSV data
      res.send(csv);
    } catch (error) {
      console.error('Error in downloadPlankListCsv controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error downloading plank list CSV',
      });
    }
  };
}

// Export a singleton instance
export const siteVisitBoxController = new SiteVisitBoxController();
