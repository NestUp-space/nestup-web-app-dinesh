/**
 * LiDAR Point Cloud Service
 * Handles direct point cloud data storage and retrieval
 */

import { PrismaClient, UploadStatus, LidarSessionStatus, ScanFormat, Prisma } from '@prisma/client';
import { ScanPoint2D, ParsedScanData } from '../types/lidar.types';

const prisma = new PrismaClient();

export interface PointCloudUploadData {
  points: ScanPoint2D[];
  format?: ScanFormat;
  metadata?: {
    scanCount?: number;
    minRange?: number;
    maxRange?: number;
    bounds?: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    };
  };
}

export class LidarPointCloudService {
  /**
   * Store point cloud data directly in database (for smaller datasets)
   * For larger datasets, use chunked upload to S3
   */
  async storePointCloud(
    sessionId: string,
    data: PointCloudUploadData
  ): Promise<{ pointCount: number; stored: boolean }> {
    // Verify session exists
    const session = await prisma.lidarSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Calculate statistics
    const pointCount = data.points.length;
    const bounds = data.metadata?.bounds || this.calculateBounds(data.points);

    // Store raw points as JSON in scan data
    // Note: For production, this should be stored in S3 for large datasets
    await prisma.lidarScanData.upsert({
      where: { sessionId },
      create: {
        sessionId,
        pointCount,
        scanFormat: data.format || ScanFormat.CSV_2D,
        uploadStatus: UploadStatus.UPLOADED,
        chunksReceived: 1,
        totalChunks: 1,
        rawData: {
          points: data.points.slice(0, 100000), // Limit stored points
          metadata: {
            totalPoints: pointCount,
            ...data.metadata,
            bounds,
          },
        } as unknown as Prisma.InputJsonValue,
      },
      update: {
        pointCount,
        scanFormat: data.format || ScanFormat.CSV_2D,
        uploadStatus: UploadStatus.UPLOADED,
        rawData: {
          points: data.points.slice(0, 100000),
          metadata: {
            totalPoints: pointCount,
            ...data.metadata,
            bounds,
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });

    // Update session status
    await prisma.lidarSession.update({
      where: { id: sessionId },
      data: { status: LidarSessionStatus.UPLOADING },
    });

    return {
      pointCount,
      stored: true,
    };
  }

  /**
   * Get point cloud data for a session
   */
  async getPointCloud(sessionId: string): Promise<{
    points: ScanPoint2D[];
    metadata: Record<string, unknown>;
  } | null> {
    const scanData = await prisma.lidarScanData.findUnique({
      where: { sessionId },
    });

    if (!scanData || !scanData.rawData) {
      return null;
    }

    const rawData = scanData.rawData as unknown as { points: ScanPoint2D[]; metadata: Record<string, unknown> };

    return {
      points: rawData.points || [],
      metadata: rawData.metadata || {},
    };
  }

  /**
   * Parse CSV content into points
   */
  parseCSV(csvContent: string): ParsedScanData {
    const lines = csvContent.trim().split('\n');
    const points: ScanPoint2D[] = [];

    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    const scanSeqs = new Set<number>();

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 7) continue;

      const point: ScanPoint2D = {
        scanSeq: parseInt(parts[0], 10),
        pointIdx: parseInt(parts[1], 10),
        angleRad: parseFloat(parts[2]),
        rangeM: parseFloat(parts[3]),
        intensity: parseInt(parts[4], 10),
        x: parseFloat(parts[5]),
        y: parseFloat(parts[6]),
      };

      points.push(point);
      scanSeqs.add(point.scanSeq);

      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    return {
      points,
      scanCount: scanSeqs.size,
      pointCount: points.length,
      bounds: { minX, maxX, minY, maxY },
    };
  }

  /**
   * Calculate bounds from points
   */
  private calculateBounds(points: ScanPoint2D[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    return { minX, maxX, minY, maxY };
  }
}

// Export singleton instance
export const lidarPointCloudService = new LidarPointCloudService();
