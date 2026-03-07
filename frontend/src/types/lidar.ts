/**
 * LiDAR Module Types
 * Type definitions for LiDAR session management and visualization
 */

// ============================================
// Session Types
// ============================================

export type LidarSessionStatus =
  | 'CREATED'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'DESIGNING'
  | 'COMPLETED'
  | 'FAILED';

export type ProcessingStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type UploadStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'FAILED';

export type FeatureType =
  | 'WINDOW'
  | 'DOOR'
  | 'PROTRUSION'
  | 'RECESS'
  | 'COLUMN'
  | 'SWITCHBOARD'
  | 'OTHER';

export type ModuleCategory =
  | 'STORAGE'
  | 'KITCHEN'
  | 'WARDROBE'
  | 'BATHROOM'
  | 'LIVING'
  | 'OFFICE'
  | 'CUSTOM';

export interface LocationData {
  lat: number;
  lng: number;
}

export interface LidarSession {
  id: string;
  userId: number;
  projectId: number | null;
  name: string | null;
  status: LidarSessionStatus;
  deviceId: string | null;
  location: LocationData | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  scanData?: ScanDataResponse | null;
  processedData?: ProcessedDataResponse | null;
  wallCount?: number;
  moduleCount?: number;
}

export interface ScanDataResponse {
  id: string;
  fileUrl: string | null;
  fileSize: number | null;
  pointCount: number | null;
  scanFormat: string;
  uploadStatus: UploadStatus;
  chunksReceived: number;
  totalChunks: number | null;
}

export interface ProcessedDataResponse {
  id: string;
  floorPlanJson: FloorPlanData | null;
  roomDimensions: RoomDimensions | null;
  wallCount: number | null;
  processingStatus: ProcessingStatus;
  processingTimeMs: number | null;
  errorMessage: string | null;
}

// ============================================
// Floor Plan Types
// ============================================

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

export interface Wall {
  id: string;
  wallIndex: number;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  length: number;
  height: number;
  normalVector?: { x: number; y: number };
  features?: Feature[];
}

export interface Feature {
  id: string;
  type: FeatureType;
  position: { x: number; y: number; z: number };
  dimensions: { width: number; height: number; depth: number };
}

// ============================================
// Module Types
// ============================================

export interface ModuleTemplate {
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

export interface PlacedModule {
  id: string;
  sessionId: string;
  templateId: string;
  wallId: string | null;
  position: { x: number; y: number; z: number };
  dimensions: ModuleDimensions;
  rotation: number;
  parameters: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  template?: ModuleTemplate;
}

// ============================================
// Viewer State Types
// ============================================

export type ViewMode = 'perspective' | 'top' | 'front' | 'right';

export type EditMode = 'view' | 'select' | 'place' | 'move';

export interface RoomViewerState {
  sessionId: string | null;
  walls: Wall[];
  placedModules: PlacedModule[];
  selectedWallId: string | null;
  selectedModuleId: string | null;
  editMode: EditMode;
  viewMode: ViewMode;
  showGrid: boolean;
  showDimensions: boolean;
  roomDimensions: RoomDimensions | null;
  floorPlan: FloorPlanData | null;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface SessionListResponse {
  sessions: LidarSession[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface LayoutResponse {
  floorPlan: FloorPlanData | null;
  roomDimensions: RoomDimensions | null;
  walls: Wall[];
}

// ============================================
// Upload Types
// ============================================

export interface UploadInitResponse {
  uploadId: string;
  sessionId: string;
  totalChunks: number;
}

export interface UploadProgressState {
  uploadId: string | null;
  totalChunks: number;
  uploadedChunks: number;
  currentChunk: number;
  progress: number;
  status: 'idle' | 'uploading' | 'completed' | 'error';
  error?: string;
}
