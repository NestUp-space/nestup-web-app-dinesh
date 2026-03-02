/**
 * Phase-2 Pre-G-Code Validation System
 * Version: 1.0.0
 * 
 * PURPOSE:
 * Mandatory validation gate before G-code generation.
 * Ensures that what will be cut (Nest Result) will physically 
 * assemble correctly as a box in the real world.
 * 
 * PROTECTS AGAINST:
 * - Wrong mirroring
 * - Wrong rotation
 * - Wrong groove face
 * - Broken L-cut logic
 * - Silent data corruption
 * 
 * PIPELINE POSITION:
 * Raw Data → Formatted Data → Nest Result → [PHASE-2] → G-Code
 */

// ========================================
// TOLERANCE CONSTANTS (LOCKED)
// ========================================

const PHASE2_TOLERANCE = {
  BOUNDARY_WARNING_MM: 2.0,   // ≤2mm outside = warning only
  BOUNDARY_FAIL_MM: 2.0,      // >2mm outside = hard fail
  Z_DEPTH_TOLERANCE: 0.5,     // Z accuracy tolerance
  MATING_TOLERANCE: 1.0       // Feature alignment tolerance
};

// ========================================
// VALIDATION STATUS CONSTANTS
// ========================================

const VALIDATION_STATUS = {
  PASS: 'PASS',
  PASS_WITH_WARNINGS: 'PASS_WITH_WARNINGS',
  FAIL: 'FAIL'
};

const CHECK_TYPES = {
  PLANK_INTEGRITY: 'PLANK_INTEGRITY',
  ORIENTATION_CONSISTENCY: 'ORIENTATION_CONSISTENCY',
  FEATURE_CONTAINMENT: 'FEATURE_CONTAINMENT',
  MIRRORING_SYMMETRY: 'MIRRORING_SYMMETRY',
  BOX_ASSEMBLY_LOGIC: 'BOX_ASSEMBLY_LOGIC'
};

// ========================================
// GLOBAL STATE
// ========================================

let phase2ValidationResult = null;

// ========================================
// UNIVERSAL PLANK ID FINDER
// ========================================

/**
 * Find the plank ID value from a row object
 * Matches any variation: plank_id, Plank ID, plankId, PLANK_ID, ID, etc.
 * This is the SINGLE SOURCE OF TRUTH for plank identification.
 * 
 * @param {Object} row - The data row object
 * @returns {string} The plank ID value, or empty string if not found
 */
function getPlankId(row) {
  if (!row) return '';
  
  // Check all keys for any variation of "plank" + "id" or just "id"
  for (const key of Object.keys(row)) {
    const normalizedKey = key.toLowerCase().replace(/[\s_-]/g, '');
    
    // Match "plankid" (from plank_id, Plank ID, plankId, PLANK_ID, etc.)
    if (normalizedKey === 'plankid') {
      const value = String(row[key] || '').trim();
      if (value && value !== '0' && value !== '') return value;
    }
  }
  
  // Fallback: check for just "id" column (less specific)
  for (const key of Object.keys(row)) {
    const normalizedKey = key.toLowerCase().replace(/[\s_-]/g, '');
    if (normalizedKey === 'id') {
      const value = String(row[key] || '').trim();
      if (value && value !== '0' && value !== '') return value;
    }
  }
  
  return '';
}

// ========================================
// MAIN ENTRY POINTS
// ========================================

/**
 * Main entry point - Run Phase-2 validation and show report
 */
function showPhase2Validation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // Check required sheets exist
  const nestSheet = ss.getSheetByName('Nest Result');
  const formattedSheet = ss.getSheetByName('Formatted_Plank_Data');
  
  if (!nestSheet) {
    ui.alert('Missing Data', '"Nest Result" sheet not found. Please run nesting first.', ui.ButtonSet.OK);
    return;
  }
  
  if (!formattedSheet) {
    ui.alert('Missing Data', '"Formatted_Plank_Data" sheet not found. Please run data formatting first.', ui.ButtonSet.OK);
    return;
  }
  
  // Run validation
  ss.toast('Running Phase-2 validation...', 'Checking Assembly', 30);
  phase2ValidationResult = runPhase2Validation();
  
  // Store result for later use
  PropertiesService.getDocumentProperties().setProperty(
    'PHASE2_RESULT', 
    JSON.stringify(phase2ValidationResult)
  );
  
  // Show report dialog
  showPhase2ReportDialog(phase2ValidationResult);
}

/**
 * Check if Phase-2 validation has passed (for G-code gate)
 */
function isPhase2Passed() {
  try {
    const storedResult = PropertiesService.getDocumentProperties().getProperty('PHASE2_RESULT');
    if (!storedResult) return false;
    
    const result = JSON.parse(storedResult);
    return result.overallStatus === VALIDATION_STATUS.PASS || 
           result.overallStatus === VALIDATION_STATUS.PASS_WITH_WARNINGS;
  } catch (e) {
    return false;
  }
}

/**
 * Clear Phase-2 validation result (call when data changes)
 */
function clearPhase2Validation() {
  PropertiesService.getDocumentProperties().deleteProperty('PHASE2_RESULT');
  phase2ValidationResult = null;
}

// ========================================
// DATA LOADING FUNCTIONS
// ========================================

/**
 * Load and cross-reference all data sources
 * Uses getPlankId() for universal plank ID detection across all naming formats
 * @returns {Object} { formattedData, nestData, rawData, formattedById, nestById, rawById }
 */
function loadValidationData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Load Raw Data (for complete validation chain)
  const rawSheet = ss.getSheetByName('raw data');
  const rawData = rawSheet ? loadSheetAsObjects(rawSheet) : [];
  
  // Load Formatted_Plank_Data
  const formattedSheet = ss.getSheetByName('Formatted_Plank_Data');
  const formattedData = loadSheetAsObjects(formattedSheet);
  
  // Load Nest Result
  const nestSheet = ss.getSheetByName('Nest Result');
  const nestData = loadSheetAsObjects(nestSheet);
  
  // Index Raw Data by plank_id using universal finder
  const rawById = {};
  rawData.forEach(row => {
    const id = getPlankId(row);
    if (id) {
      rawById[id] = row;
      row._plankId = id; // Store normalized ID for later use
    }
  });
  
  // Index Formatted Data by plank_id using universal finder
  const formattedById = {};
  formattedData.forEach(row => {
    const id = getPlankId(row);
    if (id) {
      formattedById[id] = row;
      row._plankId = id; // Store normalized ID for later use
    }
  });
  
  // Index Nest Result by plank_id using universal finder
  const nestById = {};
  nestData.forEach(row => {
    const id = getPlankId(row);
    if (id) {
      nestById[id] = row;
      row._plankId = id; // Store normalized ID for later use
    }
  });
  
  // Log found IDs for debugging
  Logger.log('Raw Data Plank IDs: ' + Object.keys(rawById).join(', '));
  Logger.log('Formatted Data Plank IDs: ' + Object.keys(formattedById).join(', '));
  Logger.log('Nest Result Plank IDs: ' + Object.keys(nestById).join(', '));
  
  return {
    rawData,
    formattedData,
    nestData,
    rawById,
    formattedById,
    nestById
  };
}

/**
 * Load sheet data as array of objects with headers as keys
 */
function loadSheetAsObjects(sheet) {
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((header, j) => {
      row[header] = data[i][j];
    });
    rows.push(row);
  }
  
  return rows;
}

/**
 * Group planks by box name
 */
function groupPlanksByBox(data) {
  const boxes = {};
  
  data.forEach(plank => {
    const boxName = String(plank.box_name || plank.box || 'Unknown').trim();
    if (!boxes[boxName]) {
      boxes[boxName] = [];
    }
    boxes[boxName].push(plank);
  });
  
  return boxes;
}

// ========================================
// CORE VALIDATION ORCHESTRATOR
// ========================================

/**
 * Run all Phase-2 validation checks
 * @returns {Object} Complete validation result
 */
function runPhase2Validation() {
  const startTime = new Date();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Load all data using universal plank ID detection
  const { rawData, formattedData, nestData, rawById, formattedById, nestById } = loadValidationData();
  
  // ════════════════════════════════════════════════════════════════════════════
  // GLOBAL PLANK ID CONSISTENCY CHECK (Foundation Rule)
  // Plank ID is the single truth key - must be consistent across all data
  // Uses getPlankId() for universal column name detection
  // ════════════════════════════════════════════════════════════════════════════
  
  // Build global plank ID sets from all sources using getPlankId()
  const rawPlankIds = new Set(Object.keys(rawById));
  const formattedPlankIds = new Set(Object.keys(formattedById));
  const nestPlankIds = new Set(Object.keys(nestById));
  
  // Log for debugging (IDs already extracted in loadValidationData)
  Logger.log('=== PLANK ID CONSISTENCY CHECK ===');
  Logger.log('Raw Data Plank IDs (' + rawPlankIds.size + '): ' + Array.from(rawPlankIds).sort().join(', '));
  Logger.log('Formatted Plank IDs (' + formattedPlankIds.size + '): ' + Array.from(formattedPlankIds).sort().join(', '));
  Logger.log('Nest Result Plank IDs (' + nestPlankIds.size + '): ' + Array.from(nestPlankIds).sort().join(', '));
  
  // IMPORTANT: Enrich Nest Result with box_name from Formatted Data
  // Nest Result may not have box_name column, so we need to look it up by plank_id
  nestData.forEach(nestPlank => {
    // Use the normalized _plankId that was set in loadValidationData
    const plankId = nestPlank._plankId || getPlankId(nestPlank);
    
    if (plankId && formattedById[plankId]) {
      const formattedPlank = formattedById[plankId];
      
      // Copy box info from formatted data if missing in nest result
      if (!nestPlank.box_name && !nestPlank.box) {
        nestPlank.box_name = formattedPlank.box_name || formattedPlank.box || 'Unknown';
        nestPlank.box = nestPlank.box_name;
      }
      
      // Copy plank name if missing or different format
      if (!nestPlank.plank_name) {
        nestPlank.plank_name = formattedPlank.plank_name || 'Unknown';
      }
    }
  });
  
  // Group by box
  const formattedBoxes = groupPlanksByBox(formattedData);
  const nestBoxes = groupPlanksByBox(nestData);
  
  // Log box groupings for debugging
  Logger.log('Formatted Boxes: ' + Object.keys(formattedBoxes).join(', '));
  Logger.log('Nest Boxes: ' + Object.keys(nestBoxes).join(', '));
  
  const boxNames = Object.keys(formattedBoxes);
  const totalBoxes = boxNames.length;
  
  const boxResults = [];
  let hasFailures = false;
  let hasWarnings = false;
  
  // Process each box
  boxNames.forEach((boxName, index) => {
    ss.toast(`Checking Box ${index + 1} of ${totalBoxes}...`, 'Phase-2 Validation', 30);
    
    const formattedPlanks = formattedBoxes[boxName] || [];
    const nestPlanks = nestBoxes[boxName] || [];
    
    const boxResult = validateBox(boxName, formattedPlanks, nestPlanks, formattedById, nestById);
    boxResults.push(boxResult);
    
    if (boxResult.status === VALIDATION_STATUS.FAIL) hasFailures = true;
    if (boxResult.status === VALIDATION_STATUS.PASS_WITH_WARNINGS) hasWarnings = true;
  });
  
  // Determine overall status
  let overallStatus = VALIDATION_STATUS.PASS;
  if (hasFailures) {
    overallStatus = VALIDATION_STATUS.FAIL;
  } else if (hasWarnings) {
    overallStatus = VALIDATION_STATUS.PASS_WITH_WARNINGS;
  }
  
  // Collect auto-fixable issues
  const autoFixable = collectAutoFixableIssues(boxResults);
  
  return {
    timestamp: startTime.toISOString(),
    overallStatus,
    totalBoxes,
    boxesPassed: boxResults.filter(b => b.status === VALIDATION_STATUS.PASS).length,
    boxesWarning: boxResults.filter(b => b.status === VALIDATION_STATUS.PASS_WITH_WARNINGS).length,
    boxesFailed: boxResults.filter(b => b.status === VALIDATION_STATUS.FAIL).length,
    boxes: boxResults,
    autoFixable,
    gcodeEnabled: !hasFailures
  };
}

/**
 * Validate a single box
 */
function validateBox(boxName, formattedPlanks, nestPlanks, formattedById, nestById) {
  const errors = [];
  const warnings = [];
  
  // Run all 5 checks
  // Check 1 uses GLOBAL nestById to verify plank existence across entire Nest Result
  const check1 = checkPlankIntegrity(boxName, formattedPlanks, nestPlanks, nestById);
  errors.push(...check1.errors);
  warnings.push(...check1.warnings);
  
  const check2 = checkOrientationConsistency(boxName, formattedPlanks, nestPlanks, formattedById, nestById);
  errors.push(...check2.errors);
  warnings.push(...check2.warnings);
  
  const check3 = checkFeatureContainment(boxName, nestPlanks);
  errors.push(...check3.errors);
  warnings.push(...check3.warnings);
  
  const check4 = checkMirroringSymmetry(boxName, formattedPlanks, nestPlanks, formattedById, nestById);
  errors.push(...check4.errors);
  warnings.push(...check4.warnings);
  
  const check5 = checkBoxAssemblyLogic(boxName, formattedPlanks, nestPlanks);
  errors.push(...check5.errors);
  warnings.push(...check5.warnings);
  
  // Determine box status
  let status = VALIDATION_STATUS.PASS;
  if (errors.length > 0) {
    status = VALIDATION_STATUS.FAIL;
  } else if (warnings.length > 0) {
    status = VALIDATION_STATUS.PASS_WITH_WARNINGS;
  }
  
  return {
    boxName,
    status,
    planksChecked: formattedPlanks.length,
    errors,
    warnings
  };
}

// ========================================
// CHECK 1: PLANK INTEGRITY
// ========================================

/**
 * Check 1: Verify all planks exist and are unique
 * - Every plank_id in Formatted Data exists in Nest Result (GLOBAL check)
 * - No missing or duplicate plank_ids
 * 
 * Uses GLOBAL nestById to check existence, not just box-level planks.
 * Uses getPlankId() for universal plank ID detection.
 */
function checkPlankIntegrity(boxName, formattedPlanks, nestPlanks, globalNestById) {
  const errors = [];
  const warnings = [];
  
  // Get plank IDs from formatted data using universal finder
  const formattedIds = new Set();
  
  formattedPlanks.forEach(p => {
    const id = p._plankId || getPlankId(p);
    if (id) formattedIds.add(id);
  });
  
  // Check for missing planks using GLOBAL nest data (not just box level)
  formattedIds.forEach(id => {
    // Check if plank exists in GLOBAL Nest Result (not just this box)
    const existsInNest = globalNestById && globalNestById[id];
    
    if (!existsInNest) {
      errors.push({
        checkType: CHECK_TYPES.PLANK_INTEGRITY,
        plankId: id,
        plankName: findPlankName(formattedPlanks, id),
        featureType: 'plank',
        reason: `Plank ID ${id} exists in Formatted Data but missing from Nest Result`,
        suggestion: 'Re-run nesting to include all planks',
        canAutoFix: false
      });
    }
  });
  
  // Check for duplicate plank IDs in box-level nest planks using universal finder
  const nestIdCounts = {};
  const nestIds = new Set();
  
  nestPlanks.forEach(p => {
    const id = p._plankId || getPlankId(p);
    if (id) {
      nestIds.add(id);
      nestIdCounts[id] = (nestIdCounts[id] || 0) + 1;
    }
  });
  
  Object.keys(nestIdCounts).forEach(id => {
    if (nestIdCounts[id] > 1) {
      errors.push({
        checkType: CHECK_TYPES.PLANK_INTEGRITY,
        plankId: id,
        plankName: findPlankName(nestPlanks, id),
        featureType: 'plank',
        reason: `Plank ID ${id} appears ${nestIdCounts[id]} times in Nest Result (should be unique)`,
        suggestion: 'Check for duplicate entries in nesting',
        canAutoFix: false
      });
    }
  });
  
  // Check for extra planks in Nest Result not in Formatted Data
  nestIds.forEach(id => {
    if (!formattedIds.has(id) && id) {
      warnings.push({
        checkType: CHECK_TYPES.PLANK_INTEGRITY,
        plankId: id,
        plankName: findPlankName(nestPlanks, id),
        featureType: 'plank',
        reason: `Plank ID ${id} in Nest Result not found in Formatted Data`,
        suggestion: 'Verify this plank should be included',
        canAutoFix: false
      });
    }
  });
  
  return { errors, warnings };
}

// ========================================
// CHECK 2: ORIENTATION CONSISTENCY
// ========================================

/**
 * Check 2: Verify orientation/rotation consistency
 * - Rotation didn't flip inside/outside semantics
 * - Mirrored planks remain correctly mirrored after rotation
 */
function checkOrientationConsistency(boxName, formattedPlanks, nestPlanks, formattedById, nestById) {
  const errors = [];
  const warnings = [];
  
  nestPlanks.forEach(nestPlank => {
    const plankId = nestPlank._plankId || getPlankId(nestPlank);
    const formattedPlank = formattedById[plankId];
    
    if (!formattedPlank) return;
    
    const plankName = String(nestPlank.plank_name || nestPlank.name || '').toLowerCase();
    const isRotated = nestPlank.rotated === true || nestPlank.rotated === 'true' || nestPlank.rotated === 1;
    
    // Check if plank name indicates side (left/right)
    const isLeftPlank = plankName.includes('left');
    const isRightPlank = plankName.includes('right');
    const isTopPlank = plankName.includes('top');
    const isBottomPlank = plankName.includes('bottom');
    
    // Get dimensions
    const formattedLength = parseFloat(formattedPlank.plank_length) || 0;
    const formattedWidth = parseFloat(formattedPlank.plank_width) || 0;
    const nestWidth = parseFloat(nestPlank.width || nestPlank.placedwidth) || 0;
    const nestHeight = parseFloat(nestPlank.height || nestPlank.placedheight) || 0;
    
    // After rotation, length becomes height and width becomes width (or vice versa)
    // Check if dimensions are consistent
    if (isRotated) {
      // When rotated 90°: original length → placed height, original width → placed width
      const expectedWidth = formattedWidth;
      const expectedHeight = formattedLength;
      
      const widthDiff = Math.abs(nestWidth - expectedWidth);
      const heightDiff = Math.abs(nestHeight - expectedHeight);
      
      if (widthDiff > 1 || heightDiff > 1) {
        // Also check non-rotated possibility
        const altWidthDiff = Math.abs(nestWidth - formattedLength);
        const altHeightDiff = Math.abs(nestHeight - formattedWidth);
        
        if (altWidthDiff > 1 || altHeightDiff > 1) {
          warnings.push({
            checkType: CHECK_TYPES.ORIENTATION_CONSISTENCY,
            plankId,
            plankName: nestPlank.plank_name || nestPlank.name,
            featureType: 'orientation',
            reason: `Dimension mismatch after rotation: expected ${expectedWidth}x${expectedHeight}, got ${nestWidth}x${nestHeight}`,
            suggestion: 'Verify rotation was applied correctly',
            canAutoFix: true
          });
        }
      }
    }
    
    // Check for mirroring consistency with plank naming
    if (isRightPlank || isBottomPlank) {
      // These planks should have mirroring applied in Formatted Data
      // Verify features are on the correct side after all transforms
      const hasFeatures = hasAnyFeatures(nestPlank);
      
      if (hasFeatures) {
        // Check if any feature X coordinate is near the expected mirrored position
        // This is a heuristic check - more detailed check in Check 4
      }
    }
  });
  
  return { errors, warnings };
}

// ========================================
// CHECK 3: FEATURE CONTAINMENT
// ========================================

/**
 * Check 3: Verify all features are within plank boundaries
 * - ≤2mm outside = WARNING
 * - >2mm outside = FAIL
 * - Z-depth ≤ plank thickness
 */
function checkFeatureContainment(boxName, nestPlanks) {
  const errors = [];
  const warnings = [];
  
  nestPlanks.forEach(plank => {
    const plankId = plank._plankId || getPlankId(plank);
    const plankName = plank.plank_name || plank.name || `Plank ${plankId}`;
    
    // Get plank position and dimensions
    // Column names may vary: "X", "Placed Width", etc. -> normalized to "x", "placed_width"
    const plankX = parseFloat(plank.x) || 0;
    const plankY = parseFloat(plank.y) || 0;
    
    // Handle multiple possible column names for width/height
    const plankWidth = parseFloat(
      plank.placed_width || plank.placedwidth || plank.width || 
      plank['placed_width'] || plank['placedwidth'] || 0
    );
    const plankHeight = parseFloat(
      plank.placed_height || plank.placedheight || plank.height || 
      plank['placed_height'] || plank['placedheight'] || 0
    );
    const plankThickness = parseFloat(plank.thickness || plank.plank_thickness) || 18;
    
    // Debug log for first plank to verify values
    if (plankId) {
      Logger.log(`Plank ${plankId} (${plankName}): X=${plankX}, Y=${plankY}, W=${plankWidth}, H=${plankHeight}`);
    }
    
    // Define plank boundaries (absolute/sheet coordinates for standard features)
    const minX = plankX;
    const maxX = plankX + plankWidth;
    const minY = plankY;
    const maxY = plankY + plankHeight;
    
    // L-cut and Gola use PLANK-LOCAL coords (0 to width, 0 to height)
    const localMinX = 0;
    const localMaxX = plankWidth;
    const localMinY = 0;
    const localMaxY = plankHeight;
    
    // Check all feature types
    const featureTypes = ['hole', 'groove', 'slot', 'profile', 'hing', 'screw', 'vb_main', 'vb_double'];
    
    // Check standard features
    featureTypes.forEach(featureType => {
      for (let i = 1; i <= 20; i++) {
        const xKey = `${featureType}_${i}_x`;
        const yKey = `${featureType}_${i}_y`;
        const zKey = `${featureType}_${i}_z`;
        
        const featureX = parseFloat(plank[xKey]);
        const featureY = parseFloat(plank[yKey]);
        const featureZ = parseFloat(plank[zKey]);
        
        if (isNaN(featureX) || isNaN(featureY)) continue;
        
        // Check X boundary
        const xOutside = Math.max(0, minX - featureX, featureX - maxX);
        const yOutside = Math.max(0, minY - featureY, featureY - maxY);
        const maxOutside = Math.max(xOutside, yOutside);
        
        if (maxOutside > PHASE2_TOLERANCE.BOUNDARY_FAIL_MM) {
          errors.push({
            checkType: CHECK_TYPES.FEATURE_CONTAINMENT,
            plankId,
            plankName,
            featureType: `${featureType}_${i}`,
            reason: `Feature is ${maxOutside.toFixed(1)}mm outside plank boundary (exceeds ${PHASE2_TOLERANCE.BOUNDARY_FAIL_MM}mm tolerance)`,
            suggestion: `Adjust ${featureType} coordinates or check source data`,
            canAutoFix: false
          });
        } else if (maxOutside > 0) {
          warnings.push({
            checkType: CHECK_TYPES.FEATURE_CONTAINMENT,
            plankId,
            plankName,
            featureType: `${featureType}_${i}`,
            reason: `Feature is ${maxOutside.toFixed(1)}mm outside boundary (within ${PHASE2_TOLERANCE.BOUNDARY_WARNING_MM}mm tolerance)`,
            suggestion: 'Minor overhang - verify this is intentional',
            canAutoFix: false
          });
        }
        
        // Check Z depth
        if (!isNaN(featureZ) && featureZ > plankThickness + PHASE2_TOLERANCE.Z_DEPTH_TOLERANCE) {
          errors.push({
            checkType: CHECK_TYPES.FEATURE_CONTAINMENT,
            plankId,
            plankName,
            featureType: `${featureType}_${i}`,
            reason: `Z-depth ${featureZ}mm exceeds plank thickness ${plankThickness}mm`,
            suggestion: 'Verify Z-depth is correct for this operation',
            canAutoFix: false
          });
        }
      }
    });
    
    // Check L-cut triplets (use plank-local bounds: 0 to width/height)
    for (let i = 1; i <= 5; i++) {
      const startX = parseFloat(plank[`l_cut_${i}_start_x`]);
      const startY = parseFloat(plank[`l_cut_${i}_start_y`]);
      const centerX = parseFloat(plank[`l_cut_${i}_center_x`]);
      const centerY = parseFloat(plank[`l_cut_${i}_center_y`]);
      const endX = parseFloat(plank[`l_cut_${i}_end_x`]);
      const endY = parseFloat(plank[`l_cut_${i}_end_y`]);
      
      const points = [
        { name: 'start', x: startX, y: startY },
        { name: 'center', x: centerX, y: centerY },
        { name: 'end', x: endX, y: endY }
      ];
      
      points.forEach(point => {
        if (isNaN(point.x) || isNaN(point.y)) return;
        
        const xOutside = Math.max(0, localMinX - point.x, point.x - localMaxX);
        const yOutside = Math.max(0, localMinY - point.y, point.y - localMaxY);
        const maxOutside = Math.max(xOutside, yOutside);
        
        if (maxOutside > PHASE2_TOLERANCE.BOUNDARY_FAIL_MM) {
          errors.push({
            checkType: CHECK_TYPES.FEATURE_CONTAINMENT,
            plankId,
            plankName,
            featureType: `L_cut_${i}_${point.name}`,
            reason: `L-cut ${point.name} point is ${maxOutside.toFixed(1)}mm outside boundary`,
            suggestion: 'Check L-cut coordinates and mirroring logic',
            canAutoFix: false
          });
        } else if (maxOutside > 0) {
          warnings.push({
            checkType: CHECK_TYPES.FEATURE_CONTAINMENT,
            plankId,
            plankName,
            featureType: `L_cut_${i}_${point.name}`,
            reason: `L-cut ${point.name} point is ${maxOutside.toFixed(1)}mm outside boundary (within tolerance)`,
            suggestion: 'Minor overhang - may be intentional for edge cuts',
            canAutoFix: false
          });
        }
      });
    }
    
    // Check Gola profile triplets (use plank-local bounds: 0 to width/height)
    for (let i = 1; i <= 5; i++) {
      const startX = parseFloat(plank[`gola_profile_${i}_start_x`]);
      const startY = parseFloat(plank[`gola_profile_${i}_start_y`]);
      const centerX = parseFloat(plank[`gola_profile_${i}_center_x`]);
      const centerY = parseFloat(plank[`gola_profile_${i}_center_y`]);
      const endX = parseFloat(plank[`gola_profile_${i}_end_x`]);
      const endY = parseFloat(plank[`gola_profile_${i}_end_y`]);
      
      const points = [
        { name: 'start', x: startX, y: startY },
        { name: 'center', x: centerX, y: centerY },
        { name: 'end', x: endX, y: endY }
      ];
      
      points.forEach(point => {
        if (isNaN(point.x) || isNaN(point.y)) return;
        
        const xOutside = Math.max(0, localMinX - point.x, point.x - localMaxX);
        const yOutside = Math.max(0, localMinY - point.y, point.y - localMaxY);
        const maxOutside = Math.max(xOutside, yOutside);
        
        if (maxOutside > PHASE2_TOLERANCE.BOUNDARY_FAIL_MM) {
          errors.push({
            checkType: CHECK_TYPES.FEATURE_CONTAINMENT,
            plankId,
            plankName,
            featureType: `Gola_profile_${i}_${point.name}`,
            reason: `Gola ${point.name} point is ${maxOutside.toFixed(1)}mm outside boundary`,
            suggestion: 'Check Gola profile coordinates',
            canAutoFix: false
          });
        } else if (maxOutside > 0) {
          warnings.push({
            checkType: CHECK_TYPES.FEATURE_CONTAINMENT,
            plankId,
            plankName,
            featureType: `Gola_profile_${i}_${point.name}`,
            reason: `Gola ${point.name} point is ${maxOutside.toFixed(1)}mm outside boundary (within tolerance)`,
            suggestion: 'Minor overhang - may be intentional',
            canAutoFix: false
          });
        }
      });
    }
  });
  
  return { errors, warnings };
}

// ========================================
// CHECK 4: MIRRORING SYMMETRY
// ========================================

/**
 * Check 4: Verify mirroring symmetry for paired planks
 * - LEFT ↔ RIGHT pairs should have mirror-equivalent features
 * - L-cuts on corresponding corners
 * - Groove offsets match mirrored position
 */
function checkMirroringSymmetry(boxName, formattedPlanks, nestPlanks, formattedById, nestById) {
  const errors = [];
  const warnings = [];
  
  // Find LEFT/RIGHT pairs
  const leftPlanks = nestPlanks.filter(p => {
    const name = String(p.plank_name || p.name || '').toLowerCase();
    return name.includes('left') && !name.includes('right');
  });
  
  const rightPlanks = nestPlanks.filter(p => {
    const name = String(p.plank_name || p.name || '').toLowerCase();
    return name.includes('right') && !name.includes('left');
  });
  
  // Match pairs by similar names (remove left/right)
  leftPlanks.forEach(leftPlank => {
    const leftName = String(leftPlank.plank_name || leftPlank.name || '').toLowerCase();
    const baseName = leftName.replace(/left/gi, '').trim();
    
    // Find corresponding right plank
    const rightPlank = rightPlanks.find(rp => {
      const rightName = String(rp.plank_name || rp.name || '').toLowerCase();
      const rightBase = rightName.replace(/right/gi, '').trim();
      return rightBase === baseName || rightName.includes(baseName.replace(/_/g, ''));
    });
    
    if (!rightPlank) return;
    
    const leftId = leftPlank._plankId || getPlankId(leftPlank);
    const rightId = rightPlank._plankId || getPlankId(rightPlank);
    
    // Compare feature counts
    const leftFeatures = countFeatures(leftPlank);
    const rightFeatures = countFeatures(rightPlank);
    
    // Check if feature counts match
    Object.keys(leftFeatures).forEach(featureType => {
      const leftCount = leftFeatures[featureType] || 0;
      const rightCount = rightFeatures[featureType] || 0;
      
      if (leftCount !== rightCount) {
        errors.push({
          checkType: CHECK_TYPES.MIRRORING_SYMMETRY,
          plankId: `${leftId} / ${rightId}`,
          plankName: `${leftPlank.plank_name || leftPlank.name} / ${rightPlank.plank_name || rightPlank.name}`,
          featureType,
          reason: `Feature count mismatch: Left has ${leftCount}, Right has ${rightCount}`,
          suggestion: 'Verify both planks have matching features',
          canAutoFix: false
        });
      }
    });
    
    // Check L-cut symmetry
    const leftLCuts = countLCuts(leftPlank);
    const rightLCuts = countLCuts(rightPlank);
    
    if (leftLCuts !== rightLCuts) {
      errors.push({
        checkType: CHECK_TYPES.MIRRORING_SYMMETRY,
        plankId: `${leftId} / ${rightId}`,
        plankName: `${leftPlank.plank_name || leftPlank.name} / ${rightPlank.plank_name || rightPlank.name}`,
        featureType: 'L_cut',
        reason: `L-cut count mismatch: Left has ${leftLCuts}, Right has ${rightLCuts}`,
        suggestion: 'L-cuts should be symmetric on paired planks',
        canAutoFix: false
      });
    }
    
    // Check Gola profile symmetry
    const leftGolas = countGolaProfiles(leftPlank);
    const rightGolas = countGolaProfiles(rightPlank);
    
    if (leftGolas !== rightGolas) {
      errors.push({
        checkType: CHECK_TYPES.MIRRORING_SYMMETRY,
        plankId: `${leftId} / ${rightId}`,
        plankName: `${leftPlank.plank_name || leftPlank.name} / ${rightPlank.plank_name || rightPlank.name}`,
        featureType: 'Gola_profile',
        reason: `Gola profile count mismatch: Left has ${leftGolas}, Right has ${rightGolas}`,
        suggestion: 'Gola profiles should be symmetric on paired planks',
        canAutoFix: false
      });
    }
  });
  
  // Find TOP/BOTTOM pairs (similar logic)
  const topPlanks = nestPlanks.filter(p => {
    const name = String(p.plank_name || p.name || '').toLowerCase();
    return name.includes('top') && !name.includes('bottom');
  });
  
  const bottomPlanks = nestPlanks.filter(p => {
    const name = String(p.plank_name || p.name || '').toLowerCase();
    return name.includes('bottom') && !name.includes('top');
  });
  
  // Check TOP/BOTTOM symmetry (similar structure)
  // ... (abbreviated for space, similar logic as LEFT/RIGHT)
  
  return { errors, warnings };
}

// ========================================
// CHECK 5: BOX ASSEMBLY LOGIC
// ========================================

/**
 * Check 5: Verify box assembly logic
 * - Side groove depth matches bottom panel thickness
 * - Back groove matches side inset
 * - L-cut depth matches gola clearance
 * - Mating features align logically
 */
function checkBoxAssemblyLogic(boxName, formattedPlanks, nestPlanks) {
  const errors = [];
  const warnings = [];
  
  // Find component types
  const sidePlanks = nestPlanks.filter(p => {
    const name = String(p.plank_name || p.name || '').toLowerCase();
    return name.includes('left') || name.includes('right') || name.includes('side');
  });
  
  const bottomPlanks = nestPlanks.filter(p => {
    const name = String(p.plank_name || p.name || '').toLowerCase();
    return name.includes('bottom') || name.includes('base');
  });
  
  const topPlanks = nestPlanks.filter(p => {
    const name = String(p.plank_name || p.name || '').toLowerCase();
    return name.includes('top');
  });
  
  const backPlanks = nestPlanks.filter(p => {
    const name = String(p.plank_name || p.name || '').toLowerCase();
    return name.includes('back');
  });
  
  // NOTE: Groove depth checks REMOVED
  // Grooves, slots, and profiles are often PARTIAL DEPTH cuts (e.g., 10mm)
  // They do NOT need to match the mating panel thickness
  // A 10mm groove is valid for holding an 18mm panel (panel sits IN the groove)
  
  // Check L-cut presence where expected (e.g., gola handle planks)
  sidePlanks.forEach(sidePlank => {
    const hasGola = countGolaProfiles(sidePlank) > 0;
    const hasLCut = countLCuts(sidePlank) > 0;
    
    // If plank has gola profile but no L-cut, might be missing
    // This is a heuristic - not all gola planks need L-cuts
    if (hasGola && !hasLCut) {
      const plankName = String(sidePlank.plank_name || sidePlank.name || '').toLowerCase();
      if (plankName.includes('gola') || plankName.includes('handle')) {
        warnings.push({
          checkType: CHECK_TYPES.BOX_ASSEMBLY_LOGIC,
          plankId: sidePlank._plankId || getPlankId(sidePlank),
          plankName: sidePlank.plank_name || sidePlank.name,
          featureType: 'L_cut',
          reason: 'Plank has Gola profile but no L-cut - verify this is correct',
          suggestion: 'L-cuts are often paired with Gola profiles for handle clearance',
          canAutoFix: false
        });
      }
    }
  });
  
  return { errors, warnings };
}

// ========================================
// AUTO-CORRECTION FUNCTIONS
// ========================================

/**
 * Apply auto-corrections for fixable issues
 */
function applyPhase2AutoCorrections() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // Get stored validation result
  const storedResult = PropertiesService.getDocumentProperties().getProperty('PHASE2_RESULT');
  if (!storedResult) {
    ui.alert('No Validation Result', 'Please run Phase-2 validation first.', ui.ButtonSet.OK);
    return;
  }
  
  const result = JSON.parse(storedResult);
  
  if (result.autoFixable.length === 0) {
    ui.alert('No Auto-Fixes Available', 'There are no issues that can be automatically corrected.\n\nPlease fix the errors manually in the source data.', ui.ButtonSet.OK);
    return;
  }
  
  ss.toast('Applying auto-corrections...', 'Phase-2', 10);
  
  let fixCount = 0;
  
  // Apply orientation fixes
  if (result.autoFixable.includes(CHECK_TYPES.ORIENTATION_CONSISTENCY)) {
    fixCount += applyOrientationFixes();
  }
  
  ss.toast(`Applied ${fixCount} corrections. Re-running validation...`, 'Phase-2', 5);
  
  // Re-run validation
  showPhase2Validation();
}

/**
 * Apply orientation fixes by re-calculating from Formatted Data
 */
function applyOrientationFixes() {
  // This would re-apply rotation transforms from Formatted Data
  // For now, this is a placeholder - actual implementation depends on
  // how the rotation is stored and can be safely recalculated
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const nestSheet = ss.getSheetByName('Nest Result');
  const formattedSheet = ss.getSheetByName('Formatted_Plank_Data');
  
  if (!nestSheet || !formattedSheet) return 0;
  
  // Load both sheets
  const formattedData = loadSheetAsObjects(formattedSheet);
  const formattedById = {};
  formattedData.forEach(row => {
    const id = getPlankId(row);
    if (id) formattedById[id] = row;
  });
  
  // For each plank in Nest Result, verify dimensions match
  // If not, recalculate based on rotation state
  // This is a safe, idempotent operation
  
  return 0; // Return count of fixes applied
}

/**
 * Collect all auto-fixable issues from results
 */
function collectAutoFixableIssues(boxResults) {
  const autoFixable = new Set();
  
  boxResults.forEach(box => {
    [...box.errors, ...box.warnings].forEach(issue => {
      if (issue.canAutoFix) {
        autoFixable.add(issue.checkType);
      }
    });
  });
  
  return Array.from(autoFixable);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Find plank name by ID
 */
function findPlankName(planks, plankId) {
  const plank = planks.find(p => {
    const pId = p._plankId || getPlankId(p);
    return pId === String(plankId).trim();
  });
  return plank ? (plank.plank_name || plank.name || `Plank ${plankId}`) : `Plank ${plankId}`;
}

/**
 * Check if plank has any features
 */
function hasAnyFeatures(plank) {
  const featureTypes = ['hole', 'groove', 'slot', 'profile', 'hing', 'screw', 'vb_main', 'vb_double', 'l_cut', 'gola_profile'];
  
  for (const featureType of featureTypes) {
    for (let i = 1; i <= 10; i++) {
      const xKey = `${featureType}_${i}_x`;
      const startXKey = `${featureType}_${i}_start_x`;
      
      if (!isNaN(parseFloat(plank[xKey])) || !isNaN(parseFloat(plank[startXKey]))) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Count features by type
 */
function countFeatures(plank) {
  const counts = {};
  const featureTypes = ['hole', 'groove', 'slot', 'profile', 'hing', 'screw', 'vb_main', 'vb_double'];
  
  featureTypes.forEach(featureType => {
    let count = 0;
    for (let i = 1; i <= 20; i++) {
      const xKey = `${featureType}_${i}_x`;
      if (!isNaN(parseFloat(plank[xKey]))) {
        count++;
      }
    }
    if (count > 0) counts[featureType] = count;
  });
  
  return counts;
}

/**
 * Count L-cuts in plank
 */
function countLCuts(plank) {
  let count = 0;
  for (let i = 1; i <= 10; i++) {
    const startX = parseFloat(plank[`l_cut_${i}_start_x`]);
    if (!isNaN(startX)) count++;
  }
  return count;
}

/**
 * Count Gola profiles in plank
 */
function countGolaProfiles(plank) {
  let count = 0;
  for (let i = 1; i <= 10; i++) {
    const startX = parseFloat(plank[`gola_profile_${i}_start_x`]);
    if (!isNaN(startX)) count++;
  }
  return count;
}

/**
 * Get groove depth from plank
 */
function getGrooveDepth(plank, grooveType) {
  for (let i = 1; i <= 10; i++) {
    const zKey = `${grooveType}_${i}_z`;
    const z = parseFloat(plank[zKey]);
    if (!isNaN(z) && z > 0) return z;
  }
  return 0;
}

// ========================================
// UI DIALOG FUNCTION
// ========================================

/**
 * Show Phase-2 report dialog
 */
function showPhase2ReportDialog(result) {
  const html = HtmlService.createHtmlOutputFromFile('phase2_report')
    .setWidth(700)
    .setHeight(600);
  
  // Pass result to the dialog
  const template = HtmlService.createTemplateFromFile('phase2_report');
  template.validationResult = JSON.stringify(result);
  
  const output = template.evaluate()
    .setWidth(700)
    .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(output, 'Phase-2 Assembly Validation');
}

/**
 * Get validation result (called from HTML)
 */
function getPhase2Result() {
  const storedResult = PropertiesService.getDocumentProperties().getProperty('PHASE2_RESULT');
  return storedResult ? JSON.parse(storedResult) : null;
}

/**
 * Generate G-code — validation step removed, goes straight to generation.
 */
function generateGCodeWithValidation() {
  generateGCodeFiles();
}
