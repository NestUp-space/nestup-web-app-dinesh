/**
 * LiDAR Routes
 * API routes for LiDAR session management
 */

import express from 'express';
import { validateRequest } from '../../common/middleware/validateRequest';
import { isAuthenticated } from '../../middlewares/auth.middleware';
import {
  createSessionSchema,
  updateSessionSchema,
  getSessionSchema,
  deleteSessionSchema,
  listSessionsSchema,
} from '../validations/lidar.validation';
import {
  createSession,
  getSession,
  updateSession,
  deleteSession,
  listSessions,
  getSessionStatus,
} from '../controllers/lidar-session.controller';
import {
  initializeUpload,
  receiveChunk,
  completeUpload,
  getUploadStatus,
  abortUpload,
} from '../controllers/lidar-upload.controller';
import {
  triggerProcessing,
  getProcessingStatus,
  getLayout,
} from '../controllers/lidar-processing.controller';
import {
  getModuleTemplates,
  getModuleTemplate,
  placeModule,
  updateModule,
  deleteModule,
  getPlacedModules,
  generateBom,
  getBom,
} from '../controllers/lidar-module.controller';
import {
  uploadPointCloudDirect,
  uploadCSVDirect,
  getPointCloudData,
} from '../controllers/lidar-pointcloud.controller';
import {
  exportSessionJson,
  exportSessionExcel,
  exportBomExcel,
  exportSessionPdf,
} from '../controllers/lidar-export.controller';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// ============================================
// Session Management Routes
// ============================================

/**
 * @route   POST /api/lidar/sessions
 * @desc    Create a new LiDAR session
 * @access  Private
 */
router.post(
  '/sessions',
  validateRequest(createSessionSchema),
  createSession
);

/**
 * @route   GET /api/lidar/sessions
 * @desc    List all LiDAR sessions for the current user
 * @access  Private
 */
router.get(
  '/sessions',
  validateRequest(listSessionsSchema),
  listSessions
);

/**
 * @route   GET /api/lidar/sessions/:id
 * @desc    Get a single LiDAR session by ID
 * @access  Private
 */
router.get(
  '/sessions/:id',
  validateRequest(getSessionSchema),
  getSession
);

/**
 * @route   PUT /api/lidar/sessions/:id
 * @desc    Update a LiDAR session
 * @access  Private
 */
router.put(
  '/sessions/:id',
  validateRequest(updateSessionSchema),
  updateSession
);

/**
 * @route   DELETE /api/lidar/sessions/:id
 * @desc    Delete a LiDAR session
 * @access  Private
 */
router.delete(
  '/sessions/:id',
  validateRequest(deleteSessionSchema),
  deleteSession
);

/**
 * @route   GET /api/lidar/sessions/:id/status
 * @desc    Get session status (quick status check)
 * @access  Private
 */
router.get(
  '/sessions/:id/status',
  validateRequest(getSessionSchema),
  getSessionStatus
);

// ============================================
// Point Cloud Upload Routes
// ============================================

/**
 * @route   POST /api/lidar/sessions/:id/pointcloud/init
 * @desc    Initialize chunked upload for point cloud data
 * @access  Private
 */
router.post(
  '/sessions/:id/pointcloud/init',
  initializeUpload
);

/**
 * @route   PUT /api/lidar/sessions/:id/pointcloud/chunk/:chunkIndex
 * @desc    Upload a chunk of point cloud data
 * @access  Private
 * @headers X-Upload-Id: Upload ID from init
 * @headers X-Chunk-Checksum: Optional MD5 checksum of chunk
 * @body    Binary chunk data
 */
router.put(
  '/sessions/:id/pointcloud/chunk/:chunkIndex',
  receiveChunk
);

/**
 * @route   POST /api/lidar/sessions/:id/pointcloud/complete
 * @desc    Complete the chunked upload
 * @access  Private
 */
router.post(
  '/sessions/:id/pointcloud/complete',
  completeUpload
);

/**
 * @route   GET /api/lidar/sessions/:id/pointcloud/status
 * @desc    Get upload status for resume capability
 * @access  Private
 */
router.get(
  '/sessions/:id/pointcloud/status',
  getUploadStatus
);

/**
 * @route   DELETE /api/lidar/sessions/:id/pointcloud
 * @desc    Abort an in-progress upload
 * @access  Private
 * @query   uploadId: Upload ID to abort
 */
router.delete(
  '/sessions/:id/pointcloud',
  abortUpload
);

/**
 * @route   POST /api/lidar/sessions/:id/pointcloud/direct
 * @desc    Upload point cloud data directly (for smaller datasets)
 * @access  Private
 */
router.post(
  '/sessions/:id/pointcloud/direct',
  uploadPointCloudDirect
);

/**
 * @route   POST /api/lidar/sessions/:id/pointcloud/csv
 * @desc    Upload CSV content directly
 * @access  Private
 */
router.post(
  '/sessions/:id/pointcloud/csv',
  uploadCSVDirect
);

/**
 * @route   GET /api/lidar/sessions/:id/pointcloud/data
 * @desc    Get point cloud data for a session
 * @access  Private
 */
router.get(
  '/sessions/:id/pointcloud/data',
  getPointCloudData
);

// ============================================
// Processing Routes
// ============================================

/**
 * @route   POST /api/lidar/sessions/:id/process
 * @desc    Trigger processing for a session
 * @access  Private
 */
router.post(
  '/sessions/:id/process',
  triggerProcessing
);

/**
 * @route   GET /api/lidar/sessions/:id/process/status
 * @desc    Get processing status
 * @access  Private
 */
router.get(
  '/sessions/:id/process/status',
  getProcessingStatus
);

/**
 * @route   GET /api/lidar/sessions/:id/layout
 * @desc    Get layout data (floor plan, walls, dimensions)
 * @access  Private
 */
router.get(
  '/sessions/:id/layout',
  getLayout
);

// ============================================
// Module Template Routes
// ============================================

/**
 * @route   GET /api/lidar/modules/templates
 * @desc    Get all module templates
 * @access  Private
 */
router.get(
  '/modules/templates',
  getModuleTemplates
);

/**
 * @route   GET /api/lidar/modules/templates/:templateId
 * @desc    Get a single module template
 * @access  Private
 */
router.get(
  '/modules/templates/:templateId',
  getModuleTemplate
);

// ============================================
// Module Placement Routes
// ============================================

/**
 * @route   GET /api/lidar/sessions/:id/modules
 * @desc    Get all placed modules for a session
 * @access  Private
 */
router.get(
  '/sessions/:id/modules',
  getPlacedModules
);

/**
 * @route   POST /api/lidar/sessions/:id/modules
 * @desc    Place a module in a session
 * @access  Private
 */
router.post(
  '/sessions/:id/modules',
  placeModule
);

/**
 * @route   PUT /api/lidar/sessions/:id/modules/:moduleId
 * @desc    Update a placed module
 * @access  Private
 */
router.put(
  '/sessions/:id/modules/:moduleId',
  updateModule
);

/**
 * @route   DELETE /api/lidar/sessions/:id/modules/:moduleId
 * @desc    Delete a placed module
 * @access  Private
 */
router.delete(
  '/sessions/:id/modules/:moduleId',
  deleteModule
);

// ============================================
// BOM Routes
// ============================================

/**
 * @route   GET /api/lidar/sessions/:id/bom
 * @desc    Get BOM for a session
 * @access  Private
 */
router.get(
  '/sessions/:id/bom',
  getBom
);

/**
 * @route   POST /api/lidar/sessions/:id/bom/generate
 * @desc    Generate BOM for a session
 * @access  Private
 */
router.post(
  '/sessions/:id/bom/generate',
  generateBom
);

// ============================================
// Export Routes
// ============================================

/**
 * @route   GET /api/lidar/sessions/:id/export/json
 * @desc    Export session data as JSON
 * @access  Private
 */
router.get(
  '/sessions/:id/export/json',
  exportSessionJson
);

/**
 * @route   GET /api/lidar/sessions/:id/export/excel
 * @desc    Export session data as Excel file
 * @access  Private
 */
router.get(
  '/sessions/:id/export/excel',
  exportSessionExcel
);

/**
 * @route   GET /api/lidar/sessions/:id/export/pdf
 * @desc    Export session report as PDF (returns HTML)
 * @access  Private
 */
router.get(
  '/sessions/:id/export/pdf',
  exportSessionPdf
);

/**
 * @route   GET /api/lidar/sessions/:id/bom/export/excel
 * @desc    Export BOM as Excel file
 * @access  Private
 */
router.get(
  '/sessions/:id/bom/export/excel',
  exportBomExcel
);

export default router;
