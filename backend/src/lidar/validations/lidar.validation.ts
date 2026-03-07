/**
 * LiDAR Validation Schemas
 * Zod schemas for validating LiDAR API requests
 */

import { z } from 'zod';
import { LidarSessionStatus, ScanFormat, FeatureType, ModuleCategory } from '@prisma/client';

// ============================================
// Common Schemas
// ============================================

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional().default(0),
});

const position2DSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const dimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
});

// ============================================
// Session Schemas
// ============================================

export const createSessionSchema = z.object({
  body: z.object({
    projectId: z.number().int().positive().optional(),
    name: z.string().min(1).max(200).optional(),
    deviceId: z.string().max(100).optional(),
    location: locationSchema.optional(),
    metadata: z.record(z.unknown()).optional().default({}),
  }),
});

export const updateSessionSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    status: z.nativeEnum(LidarSessionStatus).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export const getSessionSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const deleteSessionSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const listSessionsSchema = z.object({
  query: z.object({
    status: z.nativeEnum(LidarSessionStatus).optional(),
    projectId: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('20'),
    offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional().default('0'),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

// ============================================
// Upload Schemas
// ============================================

export const initUploadSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    fileName: z.string().min(1).max(255),
    fileSize: z.number().int().positive().max(100 * 1024 * 1024), // Max 100MB
    chunkSize: z.number().int().positive().max(2 * 1024 * 1024).default(1024 * 1024), // Max 2MB chunks, default 1MB
    totalChunks: z.number().int().positive(),
    checksum: z.string().length(32), // MD5 hash
    scanFormat: z.nativeEnum(ScanFormat).optional().default('CSV_2D'),
  }),
});

export const uploadChunkSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    chunkIndex: z.string().transform(Number).pipe(z.number().int().min(0)),
  }),
});

export const completeUploadSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    totalChunks: z.number().int().positive(),
    checksum: z.string().length(32),
  }),
});

export const getUploadStatusSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

// ============================================
// Processing Schemas
// ============================================

export const triggerProcessingSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    options: z.object({
      noiseRemoval: z.boolean().optional().default(true),
      wallDetection: z.boolean().optional().default(true),
      floorPlanGeneration: z.boolean().optional().default(true),
    }).optional().default({}),
  }),
});

export const getProcessingStatusSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

// ============================================
// Layout Schemas
// ============================================

export const getLayoutSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

// ============================================
// Wall Schemas
// ============================================

export const createWallSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    wallIndex: z.number().int().min(0),
    startPoint: position2DSchema,
    endPoint: position2DSchema,
    length: z.number().positive(),
    height: z.number().positive().optional(),
    normalVector: position2DSchema.optional(),
    boundaryPoints: z.array(position2DSchema).optional(),
  }),
});

export const updateWallSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    wallId: z.string().cuid(),
  }),
  body: z.object({
    startPoint: position2DSchema.optional(),
    endPoint: position2DSchema.optional(),
    length: z.number().positive().optional(),
    height: z.number().positive().optional(),
    normalVector: position2DSchema.optional(),
    boundaryPoints: z.array(position2DSchema).optional(),
  }),
});

// ============================================
// Feature Schemas
// ============================================

export const createFeatureSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    wallId: z.string().cuid().optional(),
    featureType: z.nativeEnum(FeatureType),
    position: positionSchema,
    dimensions: dimensionsSchema,
    metadata: z.record(z.unknown()).optional().default({}),
  }),
});

// ============================================
// Module Schemas
// ============================================

export const listModuleTemplatesSchema = z.object({
  query: z.object({
    category: z.nativeEnum(ModuleCategory).optional(),
    isActive: z.string().transform(val => val === 'true').optional(),
  }),
});

export const placeModuleSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    templateId: z.string().cuid(),
    wallId: z.string().cuid().optional(),
    position: positionSchema,
    dimensions: dimensionsSchema,
    rotation: z.number().min(0).max(360).optional().default(0),
    parameters: z.record(z.unknown()).optional().default({}),
  }),
});

export const updateModuleSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    moduleId: z.string().cuid(),
  }),
  body: z.object({
    wallId: z.string().cuid().optional(),
    position: positionSchema.optional(),
    dimensions: dimensionsSchema.optional(),
    rotation: z.number().min(0).max(360).optional(),
    parameters: z.record(z.unknown()).optional(),
  }),
});

export const deleteModuleSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    moduleId: z.string().cuid(),
  }),
});

// ============================================
// BOM Schemas
// ============================================

export const generateBomSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const getBomSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

// ============================================
// Export Schemas
// ============================================

export const exportPdfSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    include: z.array(z.enum(['floor_plan', '3d_views', 'bom', 'dimensions'])).optional().default(['floor_plan', 'dimensions']),
  }),
});

export const getExportSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    jobId: z.string().cuid(),
  }),
});

// ============================================
// Type Exports
// ============================================

export type CreateSessionInput = z.infer<typeof createSessionSchema>['body'];
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>['body'];
export type ListSessionsQuery = z.infer<typeof listSessionsSchema>['query'];
export type InitUploadInput = z.infer<typeof initUploadSchema>['body'];
export type PlaceModuleInput = z.infer<typeof placeModuleSchema>['body'];
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>['body'];
