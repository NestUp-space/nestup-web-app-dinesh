/**
 * LiDAR Session Service
 * Handles business logic for LiDAR session management
 */

import { LidarSessionStatus, Prisma } from '@prisma/client';
import prisma from '../../config/db';
import {
  LidarSessionCreate,
  LidarSessionUpdate,
  LidarSessionResponse,
  LidarSessionListResponse,
  SessionListQuery,
  ScanDataResponse,
  ProcessedDataResponse,
} from '../types/lidar.types';

export class LidarSessionService {
  /**
   * Create a new LiDAR session
   */
  async createSession(userId: number, data: Omit<LidarSessionCreate, 'userId'>): Promise<LidarSessionResponse> {
    const session = await prisma.lidarSession.create({
      data: {
        userId,
        projectId: data.projectId,
        name: data.name,
        deviceId: data.deviceId,
        location: data.location ? (data.location as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        metadata: (data.metadata || {}) as unknown as Prisma.InputJsonValue,
        status: LidarSessionStatus.CREATED,
      },
      include: {
        scanData: true,
        processedData: true,
        _count: {
          select: {
            walls: true,
            placedModules: true,
          },
        },
      },
    });

    return this.mapToResponse(session);
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string, userId?: number): Promise<LidarSessionResponse | null> {
    const whereClause: Prisma.LidarSessionWhereInput = { id: sessionId };
    if (userId) {
      whereClause.userId = userId;
    }

    const session = await prisma.lidarSession.findFirst({
      where: whereClause,
      include: {
        scanData: true,
        processedData: true,
        _count: {
          select: {
            walls: true,
            placedModules: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    return this.mapToResponse(session);
  }

  /**
   * Update a session
   */
  async updateSession(
    sessionId: string,
    userId: number,
    data: LidarSessionUpdate
  ): Promise<LidarSessionResponse | null> {
    // Check ownership
    const existing = await prisma.lidarSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!existing) {
      return null;
    }

    const session = await prisma.lidarSession.update({
      where: { id: sessionId },
      data: {
        name: data.name,
        status: data.status,
        metadata: data.metadata as unknown as Prisma.InputJsonValue,
      },
      include: {
        scanData: true,
        processedData: true,
        _count: {
          select: {
            walls: true,
            placedModules: true,
          },
        },
      },
    });

    return this.mapToResponse(session);
  }

  /**
   * Delete a session (soft delete by setting status to FAILED, or hard delete)
   */
  async deleteSession(sessionId: string, userId: number): Promise<boolean> {
    // Check ownership
    const existing = await prisma.lidarSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!existing) {
      return false;
    }

    // Hard delete - cascades will handle related records
    await prisma.lidarSession.delete({
      where: { id: sessionId },
    });

    return true;
  }

  /**
   * List sessions with pagination and filtering
   */
  async listSessions(userId: number, query: SessionListQuery): Promise<LidarSessionListResponse> {
    const {
      status,
      projectId,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const whereClause: Prisma.LidarSessionWhereInput = {
      userId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const [sessions, total] = await Promise.all([
      prisma.lidarSession.findMany({
        where: whereClause,
        include: {
          scanData: true,
          processedData: true,
          _count: {
            select: {
              walls: true,
              placedModules: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: offset,
        take: limit,
      }),
      prisma.lidarSession.count({ where: whereClause }),
    ]);

    return {
      sessions: sessions.map((s) => this.mapToResponse(s)),
      total,
      limit,
      offset,
    };
  }

  /**
   * Update session status
   */
  async updateStatus(sessionId: string, status: LidarSessionStatus): Promise<void> {
    await prisma.lidarSession.update({
      where: { id: sessionId },
      data: { status },
    });
  }

  /**
   * Check if session exists and belongs to user
   */
  async verifyOwnership(sessionId: string, userId: number): Promise<boolean> {
    const session = await prisma.lidarSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });
    return !!session;
  }

  /**
   * Get session status
   */
  async getSessionStatus(sessionId: string): Promise<LidarSessionStatus | null> {
    const session = await prisma.lidarSession.findUnique({
      where: { id: sessionId },
      select: { status: true },
    });
    return session?.status || null;
  }

  /**
   * Map Prisma model to response type
   */
  private mapToResponse(session: any): LidarSessionResponse {
    const response: LidarSessionResponse = {
      id: session.id,
      userId: session.userId,
      projectId: session.projectId,
      name: session.name,
      status: session.status,
      deviceId: session.deviceId,
      location: session.location as { lat: number; lng: number } | null,
      metadata: (session.metadata as Record<string, unknown>) || {},
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      wallCount: session._count?.walls || 0,
      moduleCount: session._count?.placedModules || 0,
    };

    if (session.scanData) {
      response.scanData = this.mapScanDataToResponse(session.scanData);
    }

    if (session.processedData) {
      response.processedData = this.mapProcessedDataToResponse(session.processedData);
    }

    return response;
  }

  private mapScanDataToResponse(scanData: any): ScanDataResponse {
    return {
      id: scanData.id,
      fileUrl: scanData.fileUrl,
      fileSize: scanData.fileSize,
      pointCount: scanData.pointCount,
      scanFormat: scanData.scanFormat,
      uploadStatus: scanData.uploadStatus,
      chunksReceived: scanData.chunksReceived,
      totalChunks: scanData.totalChunks,
    };
  }

  private mapProcessedDataToResponse(processedData: any): ProcessedDataResponse {
    return {
      id: processedData.id,
      floorPlanJson: processedData.floorPlanJson,
      roomDimensions: processedData.roomDimensions,
      wallCount: processedData.wallCount,
      processingStatus: processedData.processingStatus,
      processingTimeMs: processedData.processingTimeMs,
      errorMessage: processedData.errorMessage,
    };
  }
}

// Export singleton instance
export const lidarSessionService = new LidarSessionService();
