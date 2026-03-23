/**
 * Visualiser Routes
 * API routes for the visualiser feature (design generation pipeline, catalog, import)
 */

import express from 'express';
import multer from 'multer';
import { validateRequest } from '../../common/middleware/validateRequest';
import { isAuthenticated } from '../../middlewares/auth.middleware';
import {
  generateSchema,
  nestSchema,
  gcodeSchema,
  getCatalogSchema,
} from '../validations/visualiser.validation';
import { generate } from '../controllers/generation.controller';
import { nest } from '../controllers/nesting.controller';
import { generateGCode } from '../controllers/gcode.controller';
import { getCatalog } from '../controllers/catalog.controller';
import { importRawData } from '../controllers/import.controller';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(isAuthenticated);

// ============================================
// Catalog Routes
// ============================================

/**
 * @route   GET /api/visualiser/catalog
 * @desc    Fetch catalog models, plywood options, and laminates
 * @access  Private
 * @query   fresh=true  Bypass cache and re-fetch from Google Sheets
 */
router.get(
  '/catalog',
  validateRequest(getCatalogSchema),
  getCatalog
);

// ============================================
// Import Routes
// ============================================

/**
 * @route   POST /api/visualiser/import
 * @desc    Parse a CSV or Excel file into raw pipeline values
 * @access  Private
 * @body    multipart/form-data — field: rawData (CSV or Excel file)
 */
router.post(
  '/import',
  upload.single('rawData'),
  importRawData
);

// ============================================
// Generation Routes
// ============================================

/**
 * @route   POST /api/visualiser/generate
 * @desc    Run the full file generation pipeline (nesting, reports, QA)
 * @access  Private
 */
router.post(
  '/generate',
  validateRequest(generateSchema),
  generate
);

// ============================================
// Nesting Routes
// ============================================

/**
 * @route   POST /api/visualiser/nest
 * @desc    Run nesting algorithm against a plank list
 * @access  Private
 */
router.post(
  '/nest',
  validateRequest(nestSchema),
  nest
);

// ============================================
// G-Code Routes
// ============================================

/**
 * @route   POST /api/visualiser/gcode
 * @desc    Generate CNC G-code and return a base64-encoded ZIP
 * @access  Private
 */
router.post(
  '/gcode',
  validateRequest(gcodeSchema),
  generateGCode
);

export default router;
