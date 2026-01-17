/**
 * LiDAR Module Types
 * Type definitions for LiDAR session management and processing
 */

import { LidarSessionStatus, ScanFormat, UploadStatus, ProcessingStatus, FeatureType, ModuleCategory } from '@prisma/client';

// ============================================
// Session Types
// ============================================

export interface LidarSessionCreate {
  userId: number;
  projectId?: number;
  name?: string;
  deviceId?: string;
  location?: LocationData;
  metadata?: Record<string, unknown>;
}

export interface LidarSessionUpdate {
  name?: string;
  status?: LidarSessionStatus;
  metadata?: Record<string, unknown>;
}

export interface LocationData {
  lat: number;
  lng: number;
}

export interface LidarSessionResponse {
  id: string;
  userId: number;
  projectId: number | null;
  name: string | null;
  status: LidarSessionStatus;
  deviceId: string | null;
  location: LocationData | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  scanData?: ScanDataResponse | null;
  processedData?: ProcessedDataResponse | null;
  wallCount?: number;
  moduleCount?: number;
}

export interface LidarSessionListResponse {
  sessions: LidarSessionResponse[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================
// Scan Data Types
// ============================================

export interface ScanDataResponse {
  id: string;
  fileUrl: string | null;
  fileSize: bigint | null;
  pointCount: number | null;
  scanFormat: ScanFormat;
  uploadStatus: UploadStatus;
  chunksReceived: number;
  totalChunks: number | null;
}

export interface ChunkUploadInit {
  fileName: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
  checksum: string;
  scanFormat?: ScanFormat;
}

export interface ChunkUploadResponse {
  uploadId: string;
  sessionId: string;
  totalChunks: number;
}

export interface ChunkReceiveResponse {
  chunkIndex: number;
  received: boolean;
  chunksRemaining: number;
}

export interface UploadStatusResponse {
  sessionId: string;
  uploadStatus: UploadStatus;
  chunksReceived: number;
  totalChunks: number | null;
  nextChunk: number;
}

// ============================================
// Processed Data Types
// ============================================

export interface ProcessedDataResponse {
  id: string;
  floorPlanJson: FloorPlanData | null;
  roomDimensions: RoomDimensions | null;
  wallCount: number | null;
  processingStatus: ProcessingStatus;
  processingTimeMs: number | null;
  errorMessage: string | null;
}

export interface FloorPlanData {
  boundary: [number, number][];
  area: number;
  walls: FloorPlanWall[];
  dimensions: {
    width: number;
    depth: number;
  };
}

export interface FloorPlanWall {
  id: string;
  start: [number, number];
  end: [number, number];
  length: number;
  features?: WallFeature[];
}

export interface WallFeature {
  type: FeatureType;
  position: [number, number];
  dimensions: [number, number];
}

export interface RoomDimensions {
  width: number;
  depth: number;
  height: number;
  area: number;
}

// ============================================
// Wall Types
// ============================================

export interface WallData {
  wallIndex: number;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  length: number;
  height?: number;
  normalVector?: { x: number; y: number };
  boundaryPoints?: { x: number; y: number }[];
}

export interface WallResponse extends WallData {
  id: string;
  sessionId: string;
  createdAt: Date;
  features?: FeatureResponse[];
}

// ============================================
// Feature Types
// ============================================

export interface FeatureData {
  featureType: FeatureType;
  wallId?: string;
  position: { x: number; y: number; z: number };
  dimensions: { width: number; height: number; depth: number };
  metadata?: Record<string, unknown>;
}

export interface FeatureResponse extends FeatureData {
  id: string;
  sessionId: string;
  createdAt: Date;
}

// ============================================
// Module Types
// ============================================

export interface ModuleTemplateResponse {
  id: string;
  name: string;
  category: ModuleCategory;
  description: string | null;
  thumbnailUrl: string | null;
  modelUrl: string | null;
  defaultDimensions: ModuleDimensions;
  constraints: ModuleConstraints;
  parameters: Record<string, unknown>;
  placementRules: PlacementRules;
  isActive: boolean;
}

export interface ModuleDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ModuleConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minDepth: number;
  maxDepth: number;
}

export interface PlacementRules {
  allowedSurfaces: string[];
  minHeightFromFloor?: number;
  maxHeightFromFloor?: number;
}

export interface PlaceModuleInput {
  templateId: string;
  wallId?: string;
  position: { x: number; y: number; z: number };
  dimensions: ModuleDimensions;
  rotation?: number;
  parameters?: Record<string, unknown>;
}

export interface PlacedModuleResponse {
  id: string;
  sessionId: string;
  templateId: string;
  wallId: string | null;
  position: { x: number; y: number; z: number };
  dimensions: ModuleDimensions;
  rotation: number;
  parameters: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  template?: ModuleTemplateResponse;
}

// ============================================
// BOM Types
// ============================================

export interface BomMaterial {
  category: string;
  specification: string;
  quantity: number;
  unit: string;
  dimensions?: string;
}

export interface BomCutItem {
  moduleId: string;
  part: string;
  quantity: number;
  dimensions: ModuleDimensions & { thickness: number };
  material: string;
  edgeBanding?: string[];
}

export interface BomHardware {
  item: string;
  specification: string;
  quantity: number;
  unit: string;
}

export interface BomSummary {
  totalModules: number;
  totalAreaSqm: number;
  totalPlywoodSheets: number;
  totalHardwareItems: number;
}

export interface SessionBomResponse {
  id: string;
  sessionId: string;
  materials: BomMaterial[];
  cutList: BomCutItem[];
  hardware: BomHardware[];
  summary: BomSummary;
  generatedAt: Date;
}

// ============================================
// Processing Types
// ============================================

export interface ProcessingJobData {
  sessionId: string;
  scanDataId: string;
  fileUrl: string;
  scanFormat: ScanFormat;
}

export interface ProcessingResult {
  success: boolean;
  walls: WallData[];
  features: FeatureData[];
  floorPlan: FloorPlanData;
  roomDimensions: RoomDimensions;
  processingTimeMs: number;
  error?: string;
}

// ============================================
// 2D Scan Data Types (CSV Format)
// ============================================

export interface ScanPoint2D {
  scanSeq: number;
  pointIdx: number;
  angleRad: number;
  rangeM: number;
  intensity: number;
  x: number;
  y: number;
}

export interface ParsedScanData {
  points: ScanPoint2D[];
  scanCount: number;
  pointCount: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

// ============================================
// Query Types
// ============================================

export interface SessionListQuery {
  status?: LidarSessionStatus;
  userId?: number;
  projectId?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}
