/**
 * CNC Coordinate Transform Module
 * Version: 2.1.0 - SIMPLIFIED FOR STABILITY
 */

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

var CNC_VALIDATION = {
  MIN_COORDINATE: 0.0,
  MAX_SHEET_WIDTH: 2500,
  MAX_SHEET_HEIGHT: 3000,
  MIN_PLANK_SIZE: 1.0,
  MAX_PLANK_SIZE: 2450,
  TOLERANCE: 0.001
};

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function validateNumber(value, name) {
  if (value === undefined || value === null) {
    throw new Error('CNC VALIDATION ERROR: ' + name + ' is undefined or null');
  }
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('CNC VALIDATION ERROR: ' + name + ' is not a valid number (got: ' + value + ')');
  }
  if (!isFinite(value)) {
    throw new Error('CNC VALIDATION ERROR: ' + name + ' is infinite');
  }
}

function validateCoordinate(value, name) {
  validateNumber(value, name);
  if (value < -CNC_VALIDATION.MAX_SHEET_WIDTH) {
    throw new Error('CNC VALIDATION ERROR: ' + name + ' is too negative (' + value + ')');
  }
  if (value > CNC_VALIDATION.MAX_SHEET_HEIGHT * 2) {
    throw new Error('CNC VALIDATION ERROR: ' + name + ' exceeds maximum bounds (' + value + ')');
  }
}

function validatePlankDimensions(width, height, plankId) {
  validateNumber(width, 'Plank ' + plankId + ' width');
  validateNumber(height, 'Plank ' + plankId + ' height');
  
  if (width <= 0) {
    throw new Error('CNC VALIDATION ERROR: Plank ' + plankId + ' has zero or negative width (' + width + ')');
  }
  if (height <= 0) {
    throw new Error('CNC VALIDATION ERROR: Plank ' + plankId + ' has zero or negative height (' + height + ')');
  }
}

function validatePlacedRect(placedRect, plankId) {
  if (!placedRect || typeof placedRect !== 'object') {
    throw new Error('CNC VALIDATION ERROR: Plank ' + plankId + ' has invalid placedRect');
  }
  
  validateCoordinate(placedRect.x, 'Plank ' + plankId + ' sheet X position');
  validateCoordinate(placedRect.y, 'Plank ' + plankId + ' sheet Y position');
  validatePlankDimensions(placedRect.width, placedRect.height, plankId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE TRANSFORM FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AUTHORITATIVE TRANSFORM: Plank-local → Sheet coordinates
 * 
 * ROTATION MATH (90° CLOCKWISE):
 * - Not rotated: Xsheet = plankX + Xlocal,  Ysheet = plankY + Ylocal
 * - Rotated:     Xsheet = plankX + Ylocal,  Ysheet = plankY + (plankWidth - Xlocal)
 */
function transformLocalToSheet(localX, localY, isRotated, placedRect, originalDims, plankId) {
  plankId = plankId || 'unknown';
  
  // Validation
  validateNumber(localX, 'Plank ' + plankId + ' local X');
  validateNumber(localY, 'Plank ' + plankId + ' local Y');
  validatePlacedRect(placedRect, plankId);
  
  if (!originalDims || typeof originalDims !== 'object') {
    throw new Error('CNC VALIDATION ERROR: Plank ' + plankId + ' has invalid originalDims');
  }
  
  var sheetX, sheetY;
  
  if (!isRotated) {
    // NOT ROTATED: Direct mapping
    sheetX = placedRect.x + localX;
    sheetY = placedRect.y + localY;
  } else {
    // ROTATED 90° CLOCKWISE
    var originalWidth = originalDims.width;
    sheetX = placedRect.x + localY;
    sheetY = placedRect.y + (originalWidth - localX);
  }
  
  // Validate output
  validateCoordinate(sheetX, 'Plank ' + plankId + ' computed sheet X');
  validateCoordinate(sheetY, 'Plank ' + plankId + ' computed sheet Y');
  
  return { x: sheetX, y: sheetY };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function cleanCoordinate(num, decimals) {
  decimals = decimals || 4;
  if (typeof num !== 'number' || isNaN(num)) return 0;
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function formatGCodeCoordinate(coord, decimals) {
  decimals = decimals || 4;
  return cleanCoordinate(coord, decimals).toFixed(decimals);
}

function getOriginalDimensions(placedWidth, placedHeight, isRotated) {
  if (isRotated) {
    return { width: placedHeight, height: placedWidth };
  }
  return { width: placedWidth, height: placedHeight };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLANK VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

function validatePlankForCNC(plank) {
  var id = plank.id || plank.name || 'unknown';
  
  validateNumber(plank.x, 'Plank ' + id + ' X position');
  validateNumber(plank.y, 'Plank ' + id + ' Y position');
  validatePlankDimensions(plank.placedWidth, plank.placedHeight, id);
  validateNumber(plank.thickness, 'Plank ' + id + ' thickness');
  
  if (plank.thickness <= 0) {
    throw new Error('CNC VALIDATION ERROR: Plank ' + id + ' has invalid thickness (' + plank.thickness + ')');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAMESPACE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

var CNCTransform = {
  validateNumber: validateNumber,
  validateCoordinate: validateCoordinate,
  validatePlankDimensions: validatePlankDimensions,
  validatePlacedRect: validatePlacedRect,
  validatePlankForCNC: validatePlankForCNC,
  transformLocalToSheet: transformLocalToSheet,
  cleanCoordinate: cleanCoordinate,
  formatGCodeCoordinate: formatGCodeCoordinate,
  getOriginalDimensions: getOriginalDimensions,
  VALIDATION: CNC_VALIDATION
};
