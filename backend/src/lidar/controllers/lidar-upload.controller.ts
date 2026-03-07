/**
 * LiDAR Upload Controller
 * Handles HTTP requests for chunked file uploads
 */

import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { lidarUploadService } from '../services/lidar-upload.service';
import { lidarSessionService } from '../services/lidar-session.service';
import { CustomRequest } from '../../middlewares/auth.middleware';
import { InitUploadInput } from '../validations/lidar.validation';

/**
 * Initialize chunked upload
 * POST /api/lidar/sessions/:id/pointcloud/init
 */
export const initializeUpload = async (
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

    const data: InitUploadInput = req.body;

    const result = await lidarUploadService.initializeUpload(sessionId, data);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Upload initialized',
      data: result,
    });
  } catch (error) {
    console.error('Error initializing upload:', error);
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
 * Receive a chunk
 * PUT /api/lidar/sessions/:id/pointcloud/chunk/:chunkIndex
 */
export const receiveChunk = async (
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
    const chunkIndex = parseInt(req.params.chunkIndex, 10);

    // Verify session ownership
    const isOwner = await lidarSessionService.verifyOwnership(sessionId, userId);
    if (!isOwner) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this session',
      });
      return;
    }

    // Get upload ID from header or query
    const uploadId = req.headers['x-upload-id'] as string || req.query.uploadId as string;
    if (!uploadId) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Upload ID required (X-Upload-Id header or uploadId query param)',
      });
      return;
    }

    // Get chunk checksum from header
    const chunkChecksum = req.headers['x-chunk-checksum'] as string | undefined;

    // Get raw body as buffer
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const chunkData = Buffer.concat(chunks);

    if (chunkData.length === 0) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No chunk data received',
      });
      return;
    }

    const result = await lidarUploadService.receiveChunk(
      sessionId,
      uploadId,
      chunkIndex,
      chunkData,
      chunkChecksum
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error receiving chunk:', error);
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
 * Complete upload
 * POST /api/lidar/sessions/:id/pointcloud/complete
 */
export const completeUpload = async (
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

    const { uploadId, totalChunks, checksum } = req.body;

    if (!uploadId || !totalChunks || !checksum) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'uploadId, totalChunks, and checksum are required',
      });
      return;
    }

    const result = await lidarUploadService.completeUpload(
      sessionId,
      uploadId,
      totalChunks,
      checksum
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Upload completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error completing upload:', error);
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
 * Get upload status
 * GET /api/lidar/sessions/:id/pointcloud/status
 */
export const getUploadStatus = async (
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

    const result = await lidarUploadService.getUploadStatus(sessionId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error getting upload status:', error);
    if (error instanceof Error) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * Abort upload
 * DELETE /api/lidar/sessions/:id/pointcloud
 */
export const abortUpload = async (
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

    const uploadId = req.query.uploadId as string;
    if (!uploadId) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'uploadId query parameter required',
      });
      return;
    }

    await lidarUploadService.abortUpload(sessionId, uploadId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Upload aborted',
    });
  } catch (error) {
    console.error('Error aborting upload:', error);
    next(error);
  }
};
