/**
 * LiDAR Session Controller
 * Handles HTTP requests for LiDAR session management
 */

import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { lidarSessionService } from '../services/lidar-session.service';
import { CreateSessionInput, UpdateSessionInput, ListSessionsQuery } from '../validations/lidar.validation';
import { LidarSessionStatus } from '@prisma/client';
import { CustomRequest } from '../../middlewares/auth.middleware';

/**
 * Create a new LiDAR session
 * POST /api/lidar/sessions
 */
export const createSession = async (
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

    const data: CreateSessionInput = req.body;

    const session = await lidarSessionService.createSession(userId, data);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'LiDAR session created successfully',
      data: session,
    });
  } catch (error) {
    console.error('Error creating LiDAR session:', error);
    next(error);
  }
};

/**
 * Get a single LiDAR session by ID
 * GET /api/lidar/sessions/:id
 */
export const getSession = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessionId = req.params.id;

    const session = await lidarSessionService.getSession(sessionId, userId);

    if (!session) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'LiDAR session not found',
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error getting LiDAR session:', error);
    next(error);
  }
};

/**
 * Update a LiDAR session
 * PUT /api/lidar/sessions/:id
 */
export const updateSession = async (
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
    const data: UpdateSessionInput = req.body;

    const session = await lidarSessionService.updateSession(sessionId, userId, data);

    if (!session) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'LiDAR session not found or access denied',
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'LiDAR session updated successfully',
      data: session,
    });
  } catch (error) {
    console.error('Error updating LiDAR session:', error);
    next(error);
  }
};

/**
 * Delete a LiDAR session
 * DELETE /api/lidar/sessions/:id
 */
export const deleteSession = async (
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

    const deleted = await lidarSessionService.deleteSession(sessionId, userId);

    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'LiDAR session not found or access denied',
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'LiDAR session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting LiDAR session:', error);
    next(error);
  }
};

/**
 * List LiDAR sessions with pagination and filtering
 * GET /api/lidar/sessions
 */
export const listSessions = async (
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

    // Parse query parameters
    const query: ListSessionsQuery = {
      status: req.query.status as LidarSessionStatus | undefined,
      projectId: req.query.projectId ? Number(req.query.projectId) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      offset: req.query.offset ? Number(req.query.offset) : 0,
      sortBy: (req.query.sortBy as 'createdAt' | 'updatedAt' | 'name') || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await lidarSessionService.listSessions(userId, query);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result.sessions,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    console.error('Error listing LiDAR sessions:', error);
    next(error);
  }
};

/**
 * Get session status
 * GET /api/lidar/sessions/:id/status
 */
export const getSessionStatus = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;
    const status = await lidarSessionService.getSessionStatus(sessionId);

    if (!status) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'LiDAR session not found',
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: { status },
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    next(error);
  }
};
