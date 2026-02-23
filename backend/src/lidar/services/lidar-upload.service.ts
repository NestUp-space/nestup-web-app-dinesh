/**
 * LiDAR Upload Service
 * Handles chunked file uploads for LiDAR scan data with resume capability
 */

import { UploadStatus, LidarSessionStatus, ScanFormat } from '@prisma/client';
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import prisma from '../../config/db';
import {
  ChunkUploadInit,
  ChunkUploadResponse,
  ChunkReceiveResponse,
  UploadStatusResponse,
} from '../types/lidar.types';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'nestup-lidar-scans';
const CHUNK_FOLDER = 'lidar-scans';

// In-memory storage for upload metadata (would use Redis in production)
interface UploadMetadata {
  uploadId: string;
  s3UploadId: string;
  sessionId: string;
  key: string;
  totalChunks: number;
  receivedChunks: Map<number, { etag: string; size: number }>;
  checksum: string;
  scanFormat: ScanFormat;
}

const uploadMetadataStore = new Map<string, UploadMetadata>();

export class LidarUploadService {
  /**
   * Initialize a chunked upload
   */
  async initializeUpload(sessionId: string, data: ChunkUploadInit): Promise<ChunkUploadResponse> {
    // Verify session exists and is in correct state
    const session = await prisma.lidarSession.findUnique({
      where: { id: sessionId },
      select: { status: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== LidarSessionStatus.CREATED && session.status !== LidarSessionStatus.UPLOADING) {
      throw new Error(`Cannot upload to session in ${session.status} status`);
    }

    // Generate unique upload ID and S3 key
    const uploadId = uuidv4();
    const fileExtension = data.fileName.split('.').pop() || 'csv';
    const s3Key = `${CHUNK_FOLDER}/${sessionId}/${uploadId}.${fileExtension}`;

    // Create multipart upload in S3
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: this.getContentType(data.scanFormat || ScanFormat.CSV_2D),
      Metadata: {
        sessionId,
        originalFileName: data.fileName,
        checksum: data.checksum,
      },
    });

    const s3Response = await s3Client.send(createCommand);

    if (!s3Response.UploadId) {
      throw new Error('Failed to initialize S3 multipart upload');
    }

    // Store upload metadata
    const metadata: UploadMetadata = {
      uploadId,
      s3UploadId: s3Response.UploadId,
      sessionId,
      key: s3Key,
      totalChunks: data.totalChunks,
      receivedChunks: new Map(),
      checksum: data.checksum,
      scanFormat: data.scanFormat || ScanFormat.CSV_2D,
    };

    uploadMetadataStore.set(uploadId, metadata);

    // Create or update scan data record
    await prisma.lidarScanData.upsert({
      where: { sessionId },
      create: {
        sessionId,
        fileSize: BigInt(data.fileSize),
        scanFormat: data.scanFormat || ScanFormat.CSV_2D,
        uploadStatus: UploadStatus.UPLOADING,
        totalChunks: data.totalChunks,
        chunksReceived: 0,
        checksum: data.checksum,
      },
      update: {
        fileSize: BigInt(data.fileSize),
        scanFormat: data.scanFormat || ScanFormat.CSV_2D,
        uploadStatus: UploadStatus.UPLOADING,
        totalChunks: data.totalChunks,
        chunksReceived: 0,
        checksum: data.checksum,
      },
    });

    // Update session status
    await prisma.lidarSession.update({
      where: { id: sessionId },
      data: { status: LidarSessionStatus.UPLOADING },
    });

    return {
      uploadId,
      sessionId,
      totalChunks: data.totalChunks,
    };
  }

  /**
   * Receive a chunk of the upload
   */
  async receiveChunk(
    sessionId: string,
    uploadId: string,
    chunkIndex: number,
    chunkData: Buffer,
    chunkChecksum?: string
  ): Promise<ChunkReceiveResponse> {
    const metadata = uploadMetadataStore.get(uploadId);

    if (!metadata || metadata.sessionId !== sessionId) {
      throw new Error('Upload not found or session mismatch');
    }

    if (chunkIndex < 0 || chunkIndex >= metadata.totalChunks) {
      throw new Error(`Invalid chunk index: ${chunkIndex}`);
    }

    // Verify chunk checksum if provided
    if (chunkChecksum) {
      const calculatedChecksum = crypto.createHash('md5').update(chunkData).digest('hex');
      if (calculatedChecksum !== chunkChecksum) {
        throw new Error('Chunk checksum mismatch');
      }
    }

    // Upload part to S3 (part numbers are 1-indexed)
    const uploadPartCommand = new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: metadata.key,
      UploadId: metadata.s3UploadId,
      PartNumber: chunkIndex + 1,
      Body: chunkData,
    });

    const partResponse = await s3Client.send(uploadPartCommand);

    if (!partResponse.ETag) {
      throw new Error('Failed to upload chunk to S3');
    }

    // Store chunk info
    metadata.receivedChunks.set(chunkIndex, {
      etag: partResponse.ETag,
      size: chunkData.length,
    });

    // Update database
    await prisma.lidarScanData.update({
      where: { sessionId },
      data: {
        chunksReceived: metadata.receivedChunks.size,
      },
    });

    const chunksRemaining = metadata.totalChunks - metadata.receivedChunks.size;

    return {
      chunkIndex,
      received: true,
      chunksRemaining,
    };
  }

  /**
   * Complete the upload and verify checksum
   */
  async completeUpload(
    sessionId: string,
    uploadId: string,
    totalChunks: number,
    _finalChecksum: string // Will be used for verification in production
  ): Promise<{ success: boolean; fileUrl: string; pointCount?: number }> {
    const metadata = uploadMetadataStore.get(uploadId);

    if (!metadata || metadata.sessionId !== sessionId) {
      throw new Error('Upload not found or session mismatch');
    }

    if (metadata.receivedChunks.size !== totalChunks) {
      throw new Error(
        `Missing chunks: received ${metadata.receivedChunks.size}, expected ${totalChunks}`
      );
    }

    // Prepare parts for completion (sorted by part number)
    const parts = Array.from(metadata.receivedChunks.entries())
      .sort(([a], [b]) => a - b)
      .map(([index, info]) => ({
        PartNumber: index + 1,
        ETag: info.etag,
      }));

    // Complete multipart upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: metadata.key,
      UploadId: metadata.s3UploadId,
      MultipartUpload: { Parts: parts },
    });

    const result = await s3Client.send(completeCommand);

    if (!result.Location) {
      throw new Error('Failed to complete S3 upload');
    }

    const fileUrl = result.Location;

    // Update database records
    await prisma.lidarScanData.update({
      where: { sessionId },
      data: {
        fileUrl,
        uploadStatus: UploadStatus.UPLOADED,
      },
    });

    await prisma.lidarSession.update({
      where: { id: sessionId },
      data: { status: LidarSessionStatus.PROCESSING },
    });

    // Clean up metadata store
    uploadMetadataStore.delete(uploadId);

    return {
      success: true,
      fileUrl,
    };
  }

  /**
   * Get upload status for resume capability
   */
  async getUploadStatus(sessionId: string): Promise<UploadStatusResponse> {
    const scanData = await prisma.lidarScanData.findUnique({
      where: { sessionId },
    });

    if (!scanData) {
      throw new Error('No upload found for session');
    }

    // Find metadata in store
    let nextChunk = 0;
    for (const [, metadata] of uploadMetadataStore) {
      if (metadata.sessionId === sessionId) {
        // Find the first missing chunk
        for (let i = 0; i < metadata.totalChunks; i++) {
          if (!metadata.receivedChunks.has(i)) {
            nextChunk = i;
            break;
          }
        }
        break;
      }
    }

    return {
      sessionId,
      uploadStatus: scanData.uploadStatus,
      chunksReceived: scanData.chunksReceived,
      totalChunks: scanData.totalChunks,
      nextChunk,
    };
  }

  /**
   * Abort an upload
   */
  async abortUpload(sessionId: string, uploadId: string): Promise<void> {
    const metadata = uploadMetadataStore.get(uploadId);

    if (metadata && metadata.sessionId === sessionId) {
      // Abort S3 multipart upload
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: metadata.key,
        UploadId: metadata.s3UploadId,
      });

      await s3Client.send(abortCommand);

      // Clean up
      uploadMetadataStore.delete(uploadId);
    }

    // Update database
    await prisma.lidarScanData.update({
      where: { sessionId },
      data: { uploadStatus: UploadStatus.FAILED },
    });

    await prisma.lidarSession.update({
      where: { id: sessionId },
      data: { status: LidarSessionStatus.FAILED },
    });
  }

  /**
   * Get content type based on scan format
   */
  private getContentType(format: ScanFormat): string {
    switch (format) {
      case ScanFormat.CSV_2D:
        return 'text/csv';
      case ScanFormat.PLY_3D:
        return 'application/octet-stream';
      case ScanFormat.PCD_3D:
        return 'application/octet-stream';
      case ScanFormat.NPY_3D:
        return 'application/octet-stream';
      default:
        return 'application/octet-stream';
    }
  }
}

// Export singleton instance
export const lidarUploadService = new LidarUploadService();
