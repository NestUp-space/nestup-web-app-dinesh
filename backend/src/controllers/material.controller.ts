/**
 * Material Controller
 * Handles HTTP requests for project materials
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { materialService } from '../services/material.service';
import { handleServiceResponse } from '../common/utils/httpHandlers'; // Assuming this utility exists
import { CreateMaterialDto, UpdateMaterialDto } from '../bim/types/bim.types';

export class MaterialController {
  /**
   * @description Create a new material for a project
   * @param req Express request object
   * @param res Express response object
   */
  public createMaterial = async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      if (isNaN(projectId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid project ID',
        });
        return;
      }

      const materialData: CreateMaterialDto = req.body;
      const serviceResponse = await materialService.createMaterial(projectId, materialData);
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error('Error in createMaterial controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error creating material',
      });
    }
  };

  /**
   * @description Get all materials for a project
   * @param req Express request object
   * @param res Express response object
   */
  public getMaterialsByProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      if (isNaN(projectId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid project ID',
        });
        return;
      }

      const serviceResponse = await materialService.getMaterialsByProject(projectId);
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error('Error in getMaterialsByProject controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error retrieving materials',
      });
    }
  };

  /**
   * @description Get a material by ID
   * @param req Express request object
   * @param res Express response object
   */
  public getMaterialById = async (req: Request, res: Response): Promise<void> => {
    try {
      const materialId = parseInt(req.params.materialId, 10);
      if (isNaN(materialId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid material ID',
        });
        return;
      }

      const serviceResponse = await materialService.getMaterialById(materialId);
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error('Error in getMaterialById controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error retrieving material',
      });
    }
  };

  /**
   * @description Update a material
   * @param req Express request object
   * @param res Express response object
   */
  public updateMaterial = async (req: Request, res: Response): Promise<void> => {
    try {
      const materialId = parseInt(req.params.materialId, 10);
      if (isNaN(materialId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid material ID',
        });
        return;
      }

      const materialData: UpdateMaterialDto = req.body;
      const serviceResponse = await materialService.updateMaterial(materialId, materialData);
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error('Error in updateMaterial controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating material',
      });
    }
  };

  /**
   * @description Delete a material
   * @param req Express request object
   * @param res Express response object
   */
  public deleteMaterial = async (req: Request, res: Response): Promise<void> => {
    try {
      const materialId = parseInt(req.params.materialId, 10);
      if (isNaN(materialId)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Invalid material ID',
        });
        return;
      }

      const serviceResponse = await materialService.deleteMaterial(materialId);
      handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error('Error in deleteMaterial controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error deleting material',
      });
    }
  };
}

// Export a singleton instance
export const materialController = new MaterialController();
