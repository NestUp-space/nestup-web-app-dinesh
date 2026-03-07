/**
 * Scan Processing Service
 * Handles 2D LiDAR scan data processing including wall detection and floor plan generation
 * MVP implementation using TypeScript (no Python/Redis required)
 */

import { ProcessingStatus, LidarSessionStatus } from '@prisma/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import prisma from '../../config/db';
import {
  ScanPoint2D,
  ParsedScanData,
  WallData,
  FloorPlanData,
  RoomDimensions,
} from '../types/lidar.types';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Processing job queue (in-memory for MVP, would use Bull+Redis in production)
interface ProcessingJob {
  sessionId: string;
  fileUrl: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

const processingJobs = new Map<string, ProcessingJob>();

export class ScanProcessingService {
  /**
   * Queue a session for processing
   */
  async queueProcessing(sessionId: string): Promise<{ jobId: string; status: string }> {
    // Get scan data
    const scanData = await prisma.lidarScanData.findUnique({
      where: { sessionId },
    });

    if (!scanData || !scanData.fileUrl) {
      throw new Error('No scan data found for session');
    }

    // Create job
    const job: ProcessingJob = {
      sessionId,
      fileUrl: scanData.fileUrl,
      status: 'queued',
    };

    processingJobs.set(sessionId, job);

    // Update session status
    await prisma.lidarSession.update({
      where: { id: sessionId },
      data: { status: LidarSessionStatus.PROCESSING },
    });

    await prisma.lidarProcessedData.upsert({
      where: { sessionId },
      create: {
        sessionId,
        processingStatus: ProcessingStatus.QUEUED,
      },
      update: {
        processingStatus: ProcessingStatus.QUEUED,
        errorMessage: null,
      },
    });

    // Start processing asynchronously
    this.processSession(sessionId).catch((error) => {
      console.error(`Processing failed for session ${sessionId}:`, error);
    });

    return {
      jobId: sessionId,
      status: 'queued',
    };
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(sessionId: string): Promise<{
    status: ProcessingStatus;
    progress?: number;
    currentStep?: string;
    error?: string;
  }> {
    const processedData = await prisma.lidarProcessedData.findUnique({
      where: { sessionId },
    });

    if (!processedData) {
      return { status: ProcessingStatus.PENDING };
    }

    const job = processingJobs.get(sessionId);

    return {
      status: processedData.processingStatus,
      error: processedData.errorMessage || undefined,
      currentStep: job?.status === 'processing' ? 'wall_detection' : undefined,
    };
  }

  /**
   * Process a session (main processing logic)
   */
  private async processSession(sessionId: string): Promise<void> {
    const job = processingJobs.get(sessionId);
    if (!job) return;

    const startTime = Date.now();
    job.status = 'processing';
    job.startTime = new Date();

    try {
      // Update status
      await prisma.lidarProcessedData.update({
        where: { sessionId },
        data: { processingStatus: ProcessingStatus.PROCESSING },
      });

      // Fetch and parse scan data
      const scanData = await this.fetchScanData(job.fileUrl);
      
      // Detect walls
      const walls = this.detectWalls(scanData);

      // Generate floor plan
      const floorPlan = this.generateFloorPlan(walls, scanData.bounds);

      // Calculate room dimensions
      const roomDimensions = this.calculateRoomDimensions(walls, scanData.bounds);

      // Store walls in database
      for (let i = 0; i < walls.length; i++) {
        await prisma.lidarWall.create({
          data: {
            sessionId,
            wallIndex: i,
            startPoint: walls[i].startPoint as any,
            endPoint: walls[i].endPoint as any,
            length: walls[i].length,
            height: walls[i].height || 2800, // Default 2.8m height
            normalVector: walls[i].normalVector as any,
          },
        });
      }

      // Update processed data
      const processingTime = Date.now() - startTime;

      await prisma.lidarProcessedData.update({
        where: { sessionId },
        data: {
          floorPlanJson: floorPlan as any,
          roomDimensions: roomDimensions as any,
          wallCount: walls.length,
          processingStatus: ProcessingStatus.COMPLETED,
          processingTimeMs: processingTime,
        },
      });

      // Update session status
      await prisma.lidarSession.update({
        where: { id: sessionId },
        data: { status: LidarSessionStatus.PROCESSED },
      });

      job.status = 'completed';
      job.endTime = new Date();

    } catch (error) {
      console.error(`Processing error for session ${sessionId}:`, error);

      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';

      await prisma.lidarProcessedData.update({
        where: { sessionId },
        data: {
          processingStatus: ProcessingStatus.FAILED,
          errorMessage: job.error,
        },
      });

      await prisma.lidarSession.update({
        where: { id: sessionId },
        data: { status: LidarSessionStatus.FAILED },
      });
    }
  }

  /**
   * Fetch and parse scan data from S3
   */
  private async fetchScanData(fileUrl: string): Promise<ParsedScanData> {
    // For local development or if URL is already a direct URL
    let csvContent: string;

    if (fileUrl.startsWith('s3://') || fileUrl.includes('.s3.')) {
      // Parse S3 URL
      const urlParts = new URL(fileUrl);
      const bucket = urlParts.host.split('.')[0];
      const key = urlParts.pathname.slice(1);

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await s3Client.send(command);
      csvContent = await response.Body?.transformToString() || '';
    } else {
      // Assume it's an HTTPS URL
      const response = await fetch(fileUrl);
      csvContent = await response.text();
    }

    return this.parseCSV(csvContent);
  }

  /**
   * Parse CSV scan data
   */
  private parseCSV(csvContent: string): ParsedScanData {
    const lines = csvContent.trim().split('\n');
    const points: ScanPoint2D[] = [];
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
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

      // Convert to millimeters
      point.x *= 1000;
      point.y *= 1000;

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
   * Detect walls from 2D scan points using RANSAC-like line fitting
   */
  private detectWalls(scanData: ParsedScanData): WallData[] {
    const points = scanData.points;
    const walls: WallData[] = [];
    const usedPoints = new Set<number>();

    // Parameters for wall detection
    const minWallLength = 500; // Minimum wall length in mm
    // const maxDistanceToLine = 50; // Max distance for a point to be considered on a line (for future RANSAC)
    const minPointsForWall = 20; // Minimum points to form a wall

    // Group points by angle sectors (for initial clustering)
    const sectorSize = Math.PI / 36; // 5 degree sectors
    const sectors = new Map<number, ScanPoint2D[]>();

    for (const point of points) {
      const sector = Math.floor(point.angleRad / sectorSize);
      if (!sectors.has(sector)) {
        sectors.set(sector, []);
      }
      sectors.get(sector)!.push(point);
    }

    // Find continuous segments that could be walls
    let wallIndex = 0;
    const sortedSectors = Array.from(sectors.keys()).sort((a, b) => a - b);

    for (const sector of sortedSectors) {
      const sectorPoints = sectors.get(sector)!;
      if (sectorPoints.length < minPointsForWall) continue;

      // Sort points by range
      sectorPoints.sort((a, b) => a.rangeM - b.rangeM);

      // Try to fit a line to distant points (wall candidates)
      const wallCandidates = sectorPoints.filter(p => {
        const idx = points.indexOf(p);
        return !usedPoints.has(idx) && p.rangeM > 0.5; // More than 0.5m away
      });

      if (wallCandidates.length < minPointsForWall) continue;

      // Simple line fitting using first and last points
      const start = wallCandidates[0];
      const end = wallCandidates[wallCandidates.length - 1];

      const length = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );

      if (length >= minWallLength) {
        // Calculate normal vector
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const normalLength = Math.sqrt(dx * dx + dy * dy);

        walls.push({
          wallIndex,
          startPoint: { x: start.x, y: start.y },
          endPoint: { x: end.x, y: end.y },
          length,
          normalVector: {
            x: -dy / normalLength,
            y: dx / normalLength,
          },
        });

        wallIndex++;

        // Mark points as used
        for (const p of wallCandidates) {
          usedPoints.add(points.indexOf(p));
        }
      }
    }

    // Merge nearby parallel walls
    return this.mergeNearbyWalls(walls);
  }

  /**
   * Merge nearby parallel walls
   */
  private mergeNearbyWalls(walls: WallData[]): WallData[] {
    const mergeThreshold = 100; // mm
    const angleThreshold = 0.1; // radians (~5.7 degrees)

    const merged: WallData[] = [];
    const used = new Set<number>();

    for (let i = 0; i < walls.length; i++) {
      if (used.has(i)) continue;

      const wall1 = walls[i];
      const angle1 = Math.atan2(
        wall1.endPoint.y - wall1.startPoint.y,
        wall1.endPoint.x - wall1.startPoint.x
      );

      // Find walls to merge
      const toMerge = [wall1];

      for (let j = i + 1; j < walls.length; j++) {
        if (used.has(j)) continue;

        const wall2 = walls[j];
        const angle2 = Math.atan2(
          wall2.endPoint.y - wall2.startPoint.y,
          wall2.endPoint.x - wall2.startPoint.x
        );

        // Check if parallel
        const angleDiff = Math.abs(angle1 - angle2);
        if (angleDiff > angleThreshold && Math.abs(angleDiff - Math.PI) > angleThreshold) {
          continue;
        }

        // Check distance between wall endpoints
        const dist = this.pointToLineDistance(
          wall2.startPoint,
          wall1.startPoint,
          wall1.endPoint
        );

        if (dist < mergeThreshold) {
          toMerge.push(wall2);
          used.add(j);
        }
      }

      // Merge walls - find bounding box of all points
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

      for (const w of toMerge) {
        minX = Math.min(minX, w.startPoint.x, w.endPoint.x);
        maxX = Math.max(maxX, w.startPoint.x, w.endPoint.x);
        minY = Math.min(minY, w.startPoint.y, w.endPoint.y);
        maxY = Math.max(maxY, w.startPoint.y, w.endPoint.y);
      }

      merged.push({
        wallIndex: merged.length,
        startPoint: { x: minX, y: minY },
        endPoint: { x: maxX, y: maxY },
        length: Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2)),
        normalVector: wall1.normalVector,
      });

      used.add(i);
    }

    return merged;
  }

  /**
   * Calculate point to line distance
   */
  private pointToLineDistance(
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Generate floor plan from detected walls
   */
  private generateFloorPlan(
    walls: WallData[],
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): FloorPlanData {
    // Create boundary polygon from walls
    const boundary: [number, number][] = [];

    // Sort walls to form a connected boundary
    const sortedWalls = this.sortWallsForBoundary(walls);

    for (const wall of sortedWalls) {
      boundary.push([wall.startPoint.x, wall.startPoint.y]);
    }

    // Close the polygon if not closed
    if (boundary.length > 0) {
      const first = boundary[0];
      const last = boundary[boundary.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        boundary.push([...first]);
      }
    }

    // Calculate area using shoelace formula
    const area = this.calculatePolygonArea(boundary);

    return {
      boundary,
      area,
      walls: walls.map((w) => ({
        id: `wall_${w.wallIndex}`,
        start: [w.startPoint.x, w.startPoint.y] as [number, number],
        end: [w.endPoint.x, w.endPoint.y] as [number, number],
        length: w.length,
      })),
      dimensions: {
        width: bounds.maxX - bounds.minX,
        depth: bounds.maxY - bounds.minY,
      },
    };
  }

  /**
   * Sort walls to form a connected boundary
   */
  private sortWallsForBoundary(walls: WallData[]): WallData[] {
    if (walls.length === 0) return [];

    const sorted: WallData[] = [walls[0]];
    const remaining = new Set(walls.slice(1));

    while (remaining.size > 0) {
      const lastWall = sorted[sorted.length - 1];
      let closest: WallData | null = null;
      let closestDist = Infinity;

      for (const wall of remaining) {
        // Check distance from last wall's end to this wall's start
        const dist1 = Math.sqrt(
          Math.pow(lastWall.endPoint.x - wall.startPoint.x, 2) +
            Math.pow(lastWall.endPoint.y - wall.startPoint.y, 2)
        );

        const dist2 = Math.sqrt(
          Math.pow(lastWall.endPoint.x - wall.endPoint.x, 2) +
            Math.pow(lastWall.endPoint.y - wall.endPoint.y, 2)
        );

        const minDist = Math.min(dist1, dist2);
        if (minDist < closestDist) {
          closestDist = minDist;
          closest = wall;
        }
      }

      if (closest) {
        sorted.push(closest);
        remaining.delete(closest);
      } else {
        break;
      }
    }

    return sorted;
  }

  /**
   * Calculate polygon area using shoelace formula
   */
  private calculatePolygonArea(vertices: [number, number][]): number {
    let area = 0;
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += vertices[i][0] * vertices[j][1];
      area -= vertices[j][0] * vertices[i][1];
    }

    return Math.abs(area) / 2 / 1000000; // Convert mm² to m²
  }

  /**
   * Calculate room dimensions
   */
  private calculateRoomDimensions(
    _walls: WallData[], // May be used for more accurate perimeter calculation in future
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): RoomDimensions {
    const width = bounds.maxX - bounds.minX;
    const depth = bounds.maxY - bounds.minY;
    const height = 2800; // Default room height in mm
    const area = (width * depth) / 1000000; // m²

    return {
      width,
      depth,
      height,
      area,
    };
  }
}

// Export singleton instance
export const scanProcessingService = new ScanProcessingService();
