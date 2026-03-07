/**
 * LiDAR Module Controller
 * Handles HTTP requests for module templates, placement, and BOM
 */

import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { lidarModuleService } from '../services/lidar-module.service';
import { lidarBomService } from '../services/lidar-bom.service';
import { lidarSessionService } from '../services/lidar-session.service';
import { CustomRequest } from '../../middlewares/auth.middleware';
import { PlaceModuleInput, UpdateModuleInput } from '../validations/lidar.validation';
import { ModuleCategory } from '@prisma/client';

// ============================================
// Module Templates
// ============================================

/**
 * Get all module templates
 * GET /api/lidar/modules/templates
 */
export const getModuleTemplates = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const category = req.query.category as ModuleCategory | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const templates = await lidarModuleService.getModuleTemplates({ category, isActive });

    res.status(StatusCodes.OK).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error getting module templates:', error);
    next(error);
  }
};

/**
 * Get a single module template
 * GET /api/lidar/modules/templates/:templateId
 */
export const getModuleTemplate = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const templateId = req.params.templateId;
    const template = await lidarModuleService.getModuleTemplate(templateId);

    if (!template) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Module template not found',
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error getting module template:', error);
    next(error);
  }
};

// ============================================
// Module Placement
// ============================================

/**
 * Place a module in a session
 * POST /api/lidar/sessions/:id/modules
 */
export const placeModule = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const sessionId = req.params.id;

    // Verify session ownership
    const isOwner = await lidarSessionService.verifyOwnership(sessionId, userId);
    if (!isOwner) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this session',
      });
      return;
    }

    const data: PlaceModuleInput = req.body;

    const module = await lidarModuleService.placeModule(sessionId, data);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Module placed successfully',
      data: module,
    });
  } catch (error) {
    console.error('Error placing module:', error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * Update a placed module
 * PUT /api/lidar/sessions/:id/modules/:moduleId
 */
export const updateModule = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const sessionId = req.params.id;
    const moduleId = req.params.moduleId;

    // Verify session ownership
    const isOwner = await lidarSessionService.verifyOwnership(sessionId, userId);
    if (!isOwner) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this session',
      });
      return;
    }

    const data: UpdateModuleInput = req.body;

    const module = await lidarModuleService.updatePlacedModule(sessionId, moduleId, data);

    if (!module) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Module not found',
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Module updated successfully',
      data: module,
    });
  } catch (error) {
    console.error('Error updating module:', error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * Delete a placed module
 * DELETE /api/lidar/sessions/:id/modules/:moduleId
 */
export const deleteModule = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const sessionId = req.params.id;
    const moduleId = req.params.moduleId;

    // Verify session ownership
    const isOwner = await lidarSessionService.verifyOwnership(sessionId, userId);
    if (!isOwner) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this session',
      });
      return;
    }

    const deleted = await lidarModuleService.deletePlacedModule(sessionId, moduleId);

    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Module not found',
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Module deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting module:', error);
    next(error);
  }
};

/**
 * Get all placed modules for a session
 * GET /api/lidar/sessions/:id/modules
 */
export const getPlacedModules = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessionId = req.params.id;

    // Verify session access
    const session = await lidarSessionService.getSession(sessionId, userId || undefined);
    if (!session) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Session not found',
      });
      return;
    }

    const modules = await lidarModuleService.getPlacedModules(sessionId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: modules,
    });
  } catch (error) {
    console.error('Error getting placed modules:', error);
    next(error);
  }
};

// ============================================
// BOM Generation
// ============================================

/**
 * Generate BOM for a session
 * POST /api/lidar/sessions/:id/bom/generate
 */
export const generateBom = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const sessionId = req.params.id;

    // Verify session ownership
    const isOwner = await lidarSessionService.verifyOwnership(sessionId, userId);
    if (!isOwner) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this session',
      });
      return;
    }

    const bom = await lidarBomService.generateBom(sessionId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'BOM generated successfully',
      data: bom,
    });
  } catch (error) {
    console.error('Error generating BOM:', error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * Get BOM for a session
 * GET /api/lidar/sessions/:id/bom
 */
export const getBom = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessionId = req.params.id;

    // Verify session access
    const session = await lidarSessionService.getSession(sessionId, userId || undefined);
    if (!session) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Session not found',
      });
      return;
    }

    const bom = await lidarBomService.getBom(sessionId);

    if (!bom) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'BOM not yet generated for this session',
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: bom,
    });
  } catch (error) {
    console.error('Error getting BOM:', error);
    next(error);
  }
};
