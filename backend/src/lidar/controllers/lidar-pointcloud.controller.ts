/**
 * LiDAR Point Cloud Controller
 * Handles HTTP requests for point cloud data operations
 */

import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { lidarPointCloudService } from '../services/lidar-pointcloud.service';
import { lidarSessionService } from '../services/lidar-session.service';
import { CustomRequest } from '../../middlewares/auth.middleware';

/**
 * Upload point cloud data directly (for smaller datasets)
 * POST /api/lidar/sessions/:id/pointcloud/direct
 */
export const uploadPointCloudDirect = async (
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

    const { points, format, metadata } = req.body;

    if (!points || !Array.isArray(points)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Points array is required',
      });
      return;
    }

    const result = await lidarPointCloudService.storePointCloud(sessionId, {
      points,
      format,
      metadata,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Point cloud data stored successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error uploading point cloud:', error);
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
 * Upload CSV content directly
 * POST /api/lidar/sessions/:id/pointcloud/csv
 */
export const uploadCSVDirect = async (
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

    const { csvContent } = req.body;

    if (!csvContent || typeof csvContent !== 'string') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'CSV content is required',
      });
      return;
    }

    // Parse CSV
    const parsedData = lidarPointCloudService.parseCSV(csvContent);

    // Store point cloud
    const result = await lidarPointCloudService.storePointCloud(sessionId, {
      points: parsedData.points,
      metadata: {
        scanCount: parsedData.scanCount,
        bounds: parsedData.bounds,
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'CSV data parsed and stored successfully',
      data: {
        ...result,
        scanCount: parsedData.scanCount,
        bounds: parsedData.bounds,
      },
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);
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
 * Get point cloud data for a session
 * GET /api/lidar/sessions/:id/pointcloud/data
 */
export const getPointCloudData = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;
    const userId = req.user?.id;

    // Verify session access
    const session = await lidarSessionService.getSession(sessionId, userId || undefined);
    if (!session) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Session not found',
      });
      return;
    }

    const data = await lidarPointCloudService.getPointCloud(sessionId);

    if (!data) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'No point cloud data found for this session',
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error getting point cloud data:', error);
    next(error);
  }
};
