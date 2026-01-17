/**
 * LiDAR Processing Controller
 * Handles HTTP requests for scan processing operations
 */

import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { scanProcessingService } from '../services/scan-processing.service';
import { lidarSessionService } from '../services/lidar-session.service';
import { CustomRequest } from '../../middlewares/auth.middleware';

/**
 * Trigger processing for a session
 * POST /api/lidar/sessions/:id/process
 */
export const triggerProcessing = async (
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

    const result = await scanProcessingService.queueProcessing(sessionId);

    res.status(StatusCodes.ACCEPTED).json({
      success: true,
      message: 'Processing queued',
      data: {
        jobId: result.jobId,
        status: result.status,
        estimatedTimeSeconds: 180, // 3 minutes estimate
      },
    });
  } catch (error) {
    console.error('Error triggering processing:', error);
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
 * Get processing status
 * GET /api/lidar/sessions/:id/process/status
 */
export const getProcessingStatus = async (
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

    const result = await scanProcessingService.getProcessingStatus(sessionId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error getting processing status:', error);
    next(error);
  }
};

/**
 * Get layout data (floor plan, walls, dimensions)
 * GET /api/lidar/sessions/:id/layout
 */
export const getLayout = async (
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

    if (!session.processedData) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Session has not been processed yet',
      });
      return;
    }

    // Get walls from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const walls = await prisma.lidarWall.findMany({
      where: { sessionId },
      orderBy: { wallIndex: 'asc' },
      include: {
        features: true,
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        floorPlan: session.processedData.floorPlanJson,
        roomDimensions: session.processedData.roomDimensions,
        walls: walls.map((w) => ({
          id: w.id,
          wallIndex: w.wallIndex,
          startPoint: w.startPoint,
          endPoint: w.endPoint,
          length: w.length,
          height: w.height,
          features: w.features.map((f) => ({
            id: f.id,
            type: f.featureType,
            position: f.position,
            dimensions: f.dimensions,
          })),
        })),
      },
    });
  } catch (error) {
    console.error('Error getting layout:', error);
    next(error);
  }
};
