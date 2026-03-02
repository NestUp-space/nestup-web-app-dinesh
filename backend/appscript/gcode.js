/**
 * CNC G-code Generator (GRBL-Based)
 * Version: 13.1.0 - ADDED T1 Narrow Groove Support
 * Description: 
 * - Generates G-code sorted by Material folders.
 * - INTEGRATED L-cuts and Gola profiles into perimeter cutting (NO SEPARATE PASSES)
 * - Single continuous tool path = No plank movement = No damage
 * - T1 Cuts Smallest Parts First.
 * - Serpentine slot cutting pattern (fewer plunge marks)
 * - NEW: Grooves with width < 10mm use T1 (8mm bit) instead of T2
 * 
 * V13.1 CHANGES:
 * ═══════════════════════════════════════════════════════════════════════
 * - Grooves with width < 10mm now cut with T1 (8mm diameter)
 * - Grooves with width >= 10mm continue to use T2 (10mm diameter)
 * - T1 groove cutting uses same serpentine logic as T2 (no offset)
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * @typedef {Object} Plank
 * @property {string} id
 * @property {string} name
 * @property {string} material
 * @property {number} thickness
 * @property {string} sheet
 * @property {number} x
 * @property {number} y
 * @property {number} placedWidth
 * @property {number} placedHeight
 * @property {boolean} rotated
 * @property {Object} features
 */

// ========================================
// GLOBAL VARIABLES
// ========================================

let generatedFiles = [];
let driveFolder = null;

// CRITICAL CONSTANT: Master Folder ID from the provided link
const MASTER_FOLDER_ID = '1Nm09d0EQTXwtBI8rz2lLE0Iwb9J8gQyy';

// G-Code State Tracking
let current_tool_ID = null;
let current_sheet_ID = null;

// ========================================
// MACHINE CONSTANTS
// ========================================

const Z_SAFE = 26.0;
const MIN_COORDINATE_VALUE = 0.0000;
const Z_THROUGH_CUT_FINAL_HEIGHT = -0.01;
const SPINDLE_SPEED = 18000;
const CUTTING_FEED_RATE = 12000;
const PLUNGE_FEED_RATE = 6000.0;
const BIT_RADIUS = 4;
const TOOL_DIAMETER_T1 = 8;
const TOOL_DIAMETER_T2 = 10;

// TOOL DEPTHS (distance DOWN from top of material)
const FIXED_DEPTHS = {
  T4: 16, // VB Main
  T5: 14, // Hinge Hole
  T6: 11, // VB Double
};

// Edge detection threshold (how close to boundary = "on edge")
// Note: This includes points BEYOND the edge (up to BIT_RADIUS) because
// L-cuts and Gola profiles cut OUT of the plank, so exit points may be outside
const EDGE_THRESHOLD = BIT_RADIUS + 2.0; // 6mm tolerance

// ========================================
// MAIN FUNCTION
// ========================================

/**
 * MAIN FUNCTION - Complete CNC G-code generation with Drive upload
 * 
 * NOTE: This function now includes a Phase-2 validation gate.
 * G-code will only be generated if Phase-2 validation has passed.
 * Use 'Check Assembly (Pre-G-Code)' menu item to run validation first.
 */
function generateGCodeFiles() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();

    // Phase-2 validation gate removed — G-code generates directly

    const nestSheet = ss.getSheetByName('Nest Result');

    if (!nestSheet) {
      throw new Error('❌ "Nest Result" sheet not found. Please check the sheet name.');
    }

    // Process data
    const data = getNestData(nestSheet);
    const sheets = groupBySheet(data);

    if (Object.keys(sheets).length === 0) {
      throw new Error('❌ No valid data found in the sheet.');
    }

    // Generate G-code
    generatedFiles = [];
    const gcodeResults = generateGCodeForSheets(sheets);

    // Create files in Drive
    const ncFiles = createNCFilesInDrive(gcodeResults);

    // Create ZIP folder
    const zipUrl = zipAndUploadFiles(ncFiles);

    // Show download links
    showDownloadLinksPopup(ncFiles, zipUrl);

  } catch (error) {
    handleError(error);
  }
}

// ========================================
// DATA PROCESSING FUNCTIONS
// ========================================

/**
 * Extracts and processes nest data from sheet
 */
function getNestData(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());

  // Column mappings
  const columnMappings = {
    plankId: 'Plank ID',
    plankName: 'Plank Name',
    material: 'Material',
    thickness: 'Thickness',
    sheet: 'Sheet',
    x: 'X',
    y: 'Y',
    placedWidth: 'Placed Width',
    placedHeight: 'Placed Height',
    rotated: 'Rotated'
  };

  // Get column indices
  const colIndices = {};
  Object.keys(columnMappings).forEach(key => {
    colIndices[key] = headers.indexOf(columnMappings[key]);
  });

  // Validate required columns
  const requiredColumns = ['plankId', 'plankName', 'material', 'thickness', 'sheet', 'x', 'y', 'placedWidth', 'placedHeight', 'rotated'];
  const missingColumns = requiredColumns.filter(key => colIndices[key] === -1);
  if (missingColumns.length > 0) {
    const missingNames = missingColumns.map(key => columnMappings[key]);
    throw new Error(`Missing required columns: ${missingNames.join(', ')}`);
  }

  // Process rows
  return data.slice(1).map((row, index) => {
    try {
      const plankX = parseFloat(row[colIndices.x]) || 0;
      const plankY = parseFloat(row[colIndices.y]) || 0;
      const plank = {
        id: String(row[colIndices.plankId]) || `PLANK_${index + 1}`,
        name: String(row[colIndices.plankName]) || 'N/A',
        material: String(row[colIndices.material]) || 'N/A',
        thickness: parseFloat(row[colIndices.thickness]) || 0,
        sheet: String(row[colIndices.sheet]).trim(),
        x: plankX,
        y: plankY,
        placedWidth: parseFloat(row[colIndices.placedWidth]) || 0,
        placedHeight: parseFloat(row[colIndices.placedHeight]) || 0,
        rotated: String(row[colIndices.rotated]).toLowerCase() === 'yes' || String(row[colIndices.rotated]).toLowerCase() === 'si',
        features: extractFeatures(row, headers)
      };

      // Nest Result stores L-cut/Gola in PLANK-LOCAL; convert to sheet space for cutting
      // V13.1: Added logging to trace coordinate transformation for debugging
      if (plank.features.l_cuts && plank.features.l_cuts.length > 0) {
        plank.features.l_cuts = plank.features.l_cuts.map((f, idx) => {
          Logger.log('[L-cut→Sheet] Plank ' + plank.id + ' (' + plank.name + ') rotated=' + plank.rotated +
            ' | L-cut #' + (idx + 1) + ' local: start=(' + f.start.x.toFixed(1) + ',' + f.start.y.toFixed(1) + ')' +
            ' center=(' + f.center.x.toFixed(1) + ',' + f.center.y.toFixed(1) + ')' +
            ' end=(' + f.end.x.toFixed(1) + ',' + f.end.y.toFixed(1) + ')' +
            ' | plankPos=(' + plankX.toFixed(1) + ',' + plankY.toFixed(1) + ')' +
            ' placed=(' + plank.placedWidth.toFixed(1) + 'x' + plank.placedHeight.toFixed(1) + ')');
          return {
            start: { x: f.start.x + plankX, y: f.start.y + plankY },
            center: { x: f.center.x + plankX, y: f.center.y + plankY },
            end: { x: f.end.x + plankX, y: f.end.y + plankY }
          };
        });
      }
      if (plank.features.gola_profiles && plank.features.gola_profiles.length > 0) {
        plank.features.gola_profiles = plank.features.gola_profiles.map((f, idx) => {
          Logger.log('[Gola→Sheet] Plank ' + plank.id + ' (' + plank.name + ') rotated=' + plank.rotated +
            ' | Gola #' + (idx + 1) + ' local: start=(' + f.start.x.toFixed(1) + ',' + f.start.y.toFixed(1) + ')' +
            ' center=(' + f.center.x.toFixed(1) + ',' + f.center.y.toFixed(1) + ')' +
            ' end=(' + f.end.x.toFixed(1) + ',' + f.end.y.toFixed(1) + ')' +
            ' | plankPos=(' + plankX.toFixed(1) + ',' + plankY.toFixed(1) + ')' +
            ' placed=(' + plank.placedWidth.toFixed(1) + 'x' + plank.placedHeight.toFixed(1) + ')');
          return {
            start: { x: f.start.x + plankX, y: f.start.y + plankY },
            center: { x: f.center.x + plankX, y: f.center.y + plankY },
            end: { x: f.end.x + plankX, y: f.end.y + plankY }
          };
        });
      }

      return plank;

    } catch (e) {
      Logger.log(`Error processing row ${index + 2}: ${e}`);
      return null;
    }
  }).filter(p => p && isValidPlank(p));
}

/**
 * Extracts feature coordinates and geometry from row data
 * Supports: screws, hinges, vb_main, vb_double, slots, l_cuts (triplet), gola_profiles (triplet)
 */
function extractFeatures(row, headers) {
  const features = {
    screws: [],
    hinges: [],
    vb_main: [],
    vb_double: [],
    slots: [],
    l_cuts: [],
    gola_profiles: []
  };

  const pointPrefixes = ['screw_', 'hing_', 'vb_main_', 'vb_double_'];

  const groovePrefixes = [
    { prefix: 'slot_', type: 'slot' },
    { prefix: 'profile_', type: 'profile' },
    { prefix: 'groove_', type: 'slot' }
  ];

  // Scan for max L-cut triplet index
  let maxLCutIndex = 0;
  headers.forEach(header => {
    const lCutMatch = header.match(/^L_cut_(\d+)_start_X$/);
    if (lCutMatch) {
      const idx = parseInt(lCutMatch[1]);
      if (idx > maxLCutIndex) maxLCutIndex = idx;
    }
  });

  // Scan for max Gola profile triplet index
  let maxGolaProfileIndex = 0;
  headers.forEach(header => {
    const golaMatch = header.match(/^Gola_profile_(\d+)_start_X$/);
    if (golaMatch) {
      const idx = parseInt(golaMatch[1]);
      if (idx > maxGolaProfileIndex) maxGolaProfileIndex = idx;
    }
  });

  headers.forEach((header, index) => {
    const value = row[index];
    if (value === null || value === '') return;

    // --- 1. Point Features (T3, T4, T5, T6) ---
    pointPrefixes.forEach(prefix => {
      if (header.startsWith(prefix) && header.endsWith('_X')) {
        const featureType = getFeatureTypeFromPrefix(prefix);
        const yHeader = header.replace('_X', '_Y');
        const yIndex = headers.indexOf(yHeader);

        if (yIndex !== -1) {
          const xVal = parseFloat(value);
          const yVal = parseFloat(row[yIndex]);

          if (!isNaN(xVal) && !isNaN(yVal)) {
            features[featureType].push({ x: xVal, y: yVal });
          }
        }
      }
    });

    // --- 2. Slot/Profile Groove Features (T2 or T1 based on width) ---
    groovePrefixes.forEach(grooveDef => {
      const prefix = grooveDef.prefix;

      if (header.startsWith(prefix) && header.endsWith('_X')) {
        const parts = header.split('_');
        const featureNumber = parts.length > 1 ? parts[1] : '';

        const yHeader = `${prefix}${featureNumber}_Y`;
        const lengthHeader = `${prefix}${featureNumber}_length`;
        const widthHeader = `${prefix}${featureNumber}_width`;
        const depthHeader = `${prefix}${featureNumber}_Z`;

        const yIndex = headers.indexOf(yHeader);
        const lengthIndex = headers.indexOf(lengthHeader);
        const widthIndex = headers.indexOf(widthHeader);
        const depthIndex = headers.indexOf(depthHeader);

        if (yIndex !== -1 && lengthIndex !== -1 && widthIndex !== -1 && depthIndex !== -1) {
          const xVal = parseFloat(value);
          const yVal = parseFloat(row[yIndex]);
          const lengthVal = parseFloat(row[lengthIndex]);
          const widthVal = parseFloat(row[widthIndex]);
          const depthVal = parseFloat(row[depthIndex]);

          if (!isNaN(xVal) && !isNaN(yVal) && !isNaN(lengthVal) && !isNaN(widthVal) && !isNaN(depthVal) && widthVal > 0) {
            features.slots.push({
              type: grooveDef.type,
              x: xVal, y: yVal,
              length: lengthVal, width: widthVal, depth: depthVal
            });
          }
        }
      }
    });
  });

  // --- 3. L-Cut Triplets (start/center/end format) ---
  for (let i = 1; i <= maxLCutIndex; i++) {
    const startXIdx = headers.indexOf(`L_cut_${i}_start_X`);
    const startYIdx = headers.indexOf(`L_cut_${i}_start_Y`);
    const centerXIdx = headers.indexOf(`L_cut_${i}_center_X`);
    const centerYIdx = headers.indexOf(`L_cut_${i}_center_Y`);
    const endXIdx = headers.indexOf(`L_cut_${i}_end_X`);
    const endYIdx = headers.indexOf(`L_cut_${i}_end_Y`);

    if (startXIdx === -1 || startYIdx === -1 || centerXIdx === -1 ||
      centerYIdx === -1 || endXIdx === -1 || endYIdx === -1) continue;

    const startX = parseFloat(row[startXIdx]);
    const startY = parseFloat(row[startYIdx]);
    const centerX = parseFloat(row[centerXIdx]);
    const centerY = parseFloat(row[centerYIdx]);
    const endX = parseFloat(row[endXIdx]);
    const endY = parseFloat(row[endYIdx]);

    if (isNaN(startX) || isNaN(startY) || isNaN(centerX) ||
      isNaN(centerY) || isNaN(endX) || isNaN(endY)) continue;

    if (startX === 0 && startY === 0 && centerX === 0 &&
      centerY === 0 && endX === 0 && endY === 0) continue;

    features.l_cuts.push({
      start: { x: startX, y: startY },
      center: { x: centerX, y: centerY },
      end: { x: endX, y: endY }
    });
  }

  // --- 4. Gola Profile Triplets (start/center/end format) ---
  for (let i = 1; i <= maxGolaProfileIndex; i++) {
    const startXIdx = headers.indexOf(`Gola_profile_${i}_start_X`);
    const startYIdx = headers.indexOf(`Gola_profile_${i}_start_Y`);
    const centerXIdx = headers.indexOf(`Gola_profile_${i}_center_X`);
    const centerYIdx = headers.indexOf(`Gola_profile_${i}_center_Y`);
    const endXIdx = headers.indexOf(`Gola_profile_${i}_end_X`);
    const endYIdx = headers.indexOf(`Gola_profile_${i}_end_Y`);

    if (startXIdx === -1 || startYIdx === -1 || centerXIdx === -1 ||
      centerYIdx === -1 || endXIdx === -1 || endYIdx === -1) continue;

    const startX = parseFloat(row[startXIdx]);
    const startY = parseFloat(row[startYIdx]);
    const centerX = parseFloat(row[centerXIdx]);
    const centerY = parseFloat(row[centerYIdx]);
    const endX = parseFloat(row[endXIdx]);
    const endY = parseFloat(row[endYIdx]);

    if (isNaN(startX) || isNaN(startY) || isNaN(centerX) ||
      isNaN(centerY) || isNaN(endX) || isNaN(endY)) continue;

    if (startX === 0 && startY === 0 && centerX === 0 &&
      centerY === 0 && endX === 0 && endY === 0) continue;

    features.gola_profiles.push({
      start: { x: startX, y: startY },
      center: { x: centerX, y: centerY },
      end: { x: endX, y: endY }
    });
  }

  return features;
}

/**
 * Maps feature prefix to feature type
 */
function getFeatureTypeFromPrefix(prefix) {
  const mapping = {
    'screw_': 'screws',
    'hing_': 'hinges',
    'slot_': 'slots',
    'vb_main_': 'vb_main',
    'vb_double_': 'vb_double',
  };
  return mapping[prefix] || 'screws';
}

/**
 * Validates plank data integrity
 */
function isValidPlank(plank) {
  return plank.sheet &&
    plank.thickness > 0 &&
    !isNaN(plank.x) && !isNaN(plank.y) &&
    !isNaN(plank.placedWidth) && !isNaN(plank.placedHeight) &&
    plank.placedWidth > 0 && plank.placedHeight > 0;
}

/**
 * Groups planks by Material AND Thickness
 */
function groupBySheet(nestData) {
  const grouped = nestData.reduce((acc, plank) => {
    const cleanMaterial = plank.material.trim().replace(/\s*\(.*?\)/, '').trim();
    const folderName = cleanMaterial.replace(/\s+/g, '_');
    const thicknessKey = `${Math.round(plank.thickness)}MM`;
    const uniqueGroupKey = `${folderName}_${thicknessKey}`;

    if (!acc[uniqueGroupKey]) {
      acc[uniqueGroupKey] = {
        folderName: folderName,
        sheets: {}
      };
    }

    if (!acc[uniqueGroupKey].sheets[plank.sheet]) {
      acc[uniqueGroupKey].sheets[plank.sheet] = [];
    }
    acc[uniqueGroupKey].sheets[plank.sheet].push(plank);
    return acc;
  }, {});

  const finalSheets = {};

  Object.keys(grouped).sort().forEach(groupKey => {
    const groupData = grouped[groupKey];
    let sheetIndex = 1;

    const originalSheetNames = Object.keys(groupData.sheets).sort((a, b) => parseInt(a) - parseInt(b));

    originalSheetNames.forEach(origName => {
      const newSheetName = `${groupKey}_Sheet_${sheetIndex}`;

      finalSheets[newSheetName] = {
        materialFolder: groupData.folderName,
        planks: groupData.sheets[origName]
      };

      sheetIndex++;
    });
  });

  return finalSheets;
}

// ========================================
// G-CODE GENERATION FUNCTIONS
// ========================================

/**
 * Resets G-code state trackers
 */
function resetGCodeState(sheetName) {
  current_tool_ID = null;
  current_sheet_ID = sheetName;
}

/**
 * Generates G-code for all sheets
 */
function generateGCodeForSheets(sheetsMap) {
  const results = [];

  Object.keys(sheetsMap).sort().forEach(uniqueSheetName => {
    try {
      const sheetData = sheetsMap[uniqueSheetName];
      const gcode = generateGCodeForSheet(sheetData.planks, uniqueSheetName);
      const fileName = `${uniqueSheetName}.nc`;

      const thicknessVal = sheetData.planks.length > 0 ? Math.round(sheetData.planks[0].thickness) : 0;

      results.push({
        sheetName: uniqueSheetName,
        fileName: fileName,
        materialFolder: sheetData.materialFolder,
        thickness: thicknessVal,
        content: gcode,
        plankCount: sheetData.planks.length
      });
    } catch (error) {
      Logger.log(`Error generating G-code for sheet ${uniqueSheetName}: ${error}`);
    }
  });

  return results;
}

/**
 * Filters out G-code comments
 */
function removeComments(gcodeArray) {
  return gcodeArray.filter(line =>
    !line.trim().startsWith('(') || !line.trim().endsWith(')')
  );
}

/**
 * Generates complete G-code for a single sheet
 */
function generateGCodeForSheet(planks, sheetName) {
  let gcode = [];
  resetGCodeState(sheetName);

  // Header
  gcode.push('G300');

  // Tool processing
  gcode.push(...processTool('T3', 'Screw Holes', planks, (plank) => Z_THROUGH_CUT_FINAL_HEIGHT));
  gcode.push(...processTool('T5', 'Hinge Holes', planks, (plank) => plank.thickness - FIXED_DEPTHS.T5));
  gcode.push(...processTool('T4', 'VB Main', planks, (plank) => plank.thickness - FIXED_DEPTHS.T4));
  gcode.push(...processTool('T6', 'VB Double', planks, (plank) => plank.thickness - FIXED_DEPTHS.T6));
  
  // T2: Only grooves with width >= 10mm
  gcode.push(...processSlotTool('T2', 'Slot/Profile Grooves (>=10mm)', planks, TOOL_DIAMETER_T2));

  // Sort Planks for T1: Smallest Area First
  const sortedPlanksForT1 = [...planks].sort((a, b) => {
    const areaA = a.placedWidth * a.placedHeight;
    const areaB = b.placedWidth * b.placedHeight;
    return areaA - areaB;
  });

  // T1: Narrow grooves (width < 10mm) + Perimeter cutting
  gcode.push(...processToolT1(sortedPlanksForT1));

  // Footer
  gcode.push('G301');
  gcode.push('M30');

  gcode = removeComments(gcode);

  return gcode.join('\n');
}

/**
 * Helper function to output tool start sequence
 */
function outputToolStart(toolNumber, planks) {
  const gcode = [];
  if (planks.length > 0 && current_tool_ID !== toolNumber) {
    gcode.push(`T${toolNumber.slice(1)}`);
    gcode.push(`G43 H${toolNumber.slice(1)}`);
    gcode.push(`M03 S${SPINDLE_SPEED}`);
    gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
    current_tool_ID = toolNumber;
  }
  return gcode;
}

/**
 * Processes tool operations (T3-T6)
 */
function processTool(toolNumber, operationName, planks, depthCalculator) {
  const gcode = [];
  let hasOperations = false;
  const featureType = getFeatureType(operationName);

  planks.forEach(plank => {
    const features = plank.features[featureType];
    if (features && features.length > 0) {

      if (!hasOperations) {
        gcode.push(...outputToolStart(toolNumber, planks));
        hasOperations = true;
      }

      const Z_APPROACH = plank.thickness;

      features.forEach(feature => {
        const finalX = Math.max(feature.x, MIN_COORDINATE_VALUE);
        const finalY = Math.max(feature.y, MIN_COORDINATE_VALUE);
        const finalDepth = depthCalculator(plank);

        gcode.push(`G00 X${finalX.toFixed(4)} Y${finalY.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
        gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);
        gcode.push(`G01 Z${finalDepth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
        gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
      });
    }
  });

  if (hasOperations) {
    gcode.push('M05');
  }

  return gcode;
}

/**
 * Maps operation name to feature type
 */
function getFeatureType(operationName) {
  const mapping = {
    'Screw Holes': 'screws',
    'Hinge Holes': 'hinges',
    'Slot/Profile Grooves': 'slots',
    'Slot/Profile Grooves (>=10mm)': 'slots',
    'VB Main': 'vb_main',
    'VB Double': 'vb_double'
  };
  return mapping[operationName] || 'screws';
}

// ========================================
// T2 SLOT/GROOVE LOGIC (Serpentine Pattern)
// ========================================

/**
 * Calculates number of lateral passes based on tool diameter
 */
function getLateralPaths(slotWidth, toolDiameter) {
  const D = toolDiameter;
  const W = slotWidth;
  let offsets = [];

  if (W <= D + 0.01) {
    offsets.push(0);
  } else if (W <= 20.0) {
    const O = (W - D) / 2.0;
    offsets.push(-O, O);
  } else if (W <= 30.0) {
    const O = (W - D) / 2.0;
    offsets.push(-O, 0, O);
  } else {
    const O = (30.0 - D) / 2.0;
    offsets.push(-O, 0, O);
  }

  return { numPasses: offsets.length, offsets: offsets };
}

/**
 * Processes Slot Tool (T2) - Only for grooves with width >= 10mm
 */
function processSlotTool(toolNumber, operationName, planks, toolDiameter) {
  const gcode = [];
  let hasOperations = false;

  planks.forEach(plank => {
    if (plank.features.slots && plank.features.slots.length > 0) {
      // Filter: Only grooves with width >= 10mm for T2
      const wideGrooves = plank.features.slots.filter(slot => slot.width >= TOOL_DIAMETER_T2);

      if (wideGrooves.length > 0) {
        if (!hasOperations) {
          gcode.push(...outputToolStart(toolNumber, planks));
          hasOperations = true;
        }

        const Z_APPROACH = plank.thickness;

        wideGrooves.forEach(slot => {
          gcode.push(...generateSlotGCode(plank, slot, Z_APPROACH, toolDiameter));
        });
      }
    }
  });

  if (hasOperations) {
    gcode.push('M05');
  }

  return gcode;
}

/**
 * Generates G-code for a single slot/groove using serpentine pattern
 * Now accepts toolDiameter parameter for T1 or T2 use
 */
function generateSlotGCode(plank, slot, Z_APPROACH, toolDiameter) {
  const gcode = [];

  const W = slot.width;
  const Length = slot.length;
  const plankThickness = plank.thickness;
  let Xs_center, Ys_center, Xe_center, Ye_center;

  if (plank.rotated) {
    Xs_center = slot.x;
    Ys_center = slot.y + (W / 2.0);
    Xe_center = Xs_center + Length;
    Ye_center = Ys_center;
  } else {
    Xs_center = slot.x + (W / 2.0);
    Ys_center = slot.y;
    Xe_center = Xs_center;
    Ye_center = Ys_center + Length;
  }

  const finalCutZ = Math.max(plankThickness - slot.depth, Z_THROUGH_CUT_FINAL_HEIGHT);
  const { offsets } = getLateralPaths(slot.width, toolDiameter);

  const paths = offsets.map((offset) => {
    let Xs_path, Ys_path, Xe_path, Ye_path;

    if (plank.rotated) {
      Xs_path = Xs_center;
      Ys_path = Ys_center + offset;
      Xe_path = Xe_center;
      Ye_path = Ye_center + offset;
    } else {
      Xs_path = Xs_center + offset;
      Ys_path = Ys_center;
      Xe_path = Xe_center + offset;
      Ye_path = Ye_center;
    }

    return {
      Xs: Math.max(Xs_path, MIN_COORDINATE_VALUE),
      Ys: Math.max(Ys_path, MIN_COORDINATE_VALUE),
      Xe: Math.max(Xe_path, MIN_COORDINATE_VALUE),
      Ye: Math.max(Ye_path, MIN_COORDINATE_VALUE)
    };
  });

  if (paths.length === 0) {
    return gcode;
  }

  gcode.push(`G00 X${paths[0].Xs.toFixed(4)} Y${paths[0].Ys.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
  gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);
  gcode.push(`G01 Z${finalCutZ.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);

  paths.forEach((path, index) => {
    const isEvenPass = (index % 2 === 0);

    if (isEvenPass) {
      gcode.push(`G01 X${path.Xe.toFixed(4)} Y${path.Ye.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
    } else {
      gcode.push(`G01 X${path.Xs.toFixed(4)} Y${path.Ys.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
    }

    if (index < paths.length - 1) {
      const nextPath = paths[index + 1];
      if (isEvenPass) {
        gcode.push(`G01 X${nextPath.Xe.toFixed(4)} Y${nextPath.Ye.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
      } else {
        gcode.push(`G01 X${nextPath.Xs.toFixed(4)} Y${nextPath.Ys.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
      }
    }
  });

  gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);

  return gcode;
}

// ========================================
// T1 INTEGRATED PROFILE CUTTING LOGIC
// ========================================

/**
 * Gets pass depths based on thickness
 */
function getProfilePassDepths(thickness) {
  const passFinalDepth = Z_THROUGH_CUT_FINAL_HEIGHT;
  if (thickness > 12) {
    const pass1Depth = thickness / 2.0;
    return [pass1Depth, passFinalDepth];
  } else {
    return [passFinalDepth];
  }
}

/**
 * V13.1 EDGE DETECTION: Determines which edge a point belongs to
 * Returns array of edge names: 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'
 * 
 * V13.1 FIX: When a point matches multiple edges (near a plank corner),
 * prefer the CLOSEST edge to avoid misclassification on rotated/mirrored planks.
 * Also logs edge detection details for debugging L-cut/Gola offset issues.
 */
function getEdgeForPoint(point, plank) {
  const plankLeft = plank.x;
  const plankRight = plank.x + plank.placedWidth;
  const plankBottom = plank.y;
  const plankTop = plank.y + plank.placedHeight;

  // Calculate distance from each edge
  const distLeft = Math.abs(point.x - plankLeft);
  const distRight = Math.abs(point.x - plankRight);
  const distBottom = Math.abs(point.y - plankBottom);
  const distTop = Math.abs(point.y - plankTop);

  const candidates = [];

  if (distLeft <= EDGE_THRESHOLD) {
    candidates.push({ edge: 'LEFT', dist: distLeft });
  }
  if (distRight <= EDGE_THRESHOLD) {
    candidates.push({ edge: 'RIGHT', dist: distRight });
  }
  if (distBottom <= EDGE_THRESHOLD) {
    candidates.push({ edge: 'BOTTOM', dist: distBottom });
  }
  if (distTop <= EDGE_THRESHOLD) {
    candidates.push({ edge: 'TOP', dist: distTop });
  }

  // Sort by distance (closest first) so the most accurate edge is preferred
  candidates.sort((a, b) => a.dist - b.dist);

  const edges = candidates.map(c => c.edge);

  return edges;
}

/**
 * Get sort position for a point along an edge
 */
function getSortPosition(point, edge, plank) {
  switch (edge) {
    case 'LEFT':
    case 'RIGHT':
      return point.y;
    case 'TOP':
    case 'BOTTOM':
      return point.x;
    default:
      return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// V13 AXIS-ALIGNED OFFSET SYSTEM (REPLACES V12 BISECTOR/PERPENDICULAR)
// ═══════════════════════════════════════════════════════════════════════════════
//
// L-cuts and Gola profiles are ALWAYS axis-aligned (horizontal + vertical).
// The notch is cut from a CORNER of the plank where two edges meet.
// The tool center offset direction is TOWARD that corner (away from material).
//
// The corner is identified by the entry and exit edges:
//   Entry=LEFT,  Exit=TOP    → notch at Top-Left      → X-R, Y+R
//   Entry=TOP,   Exit=RIGHT  → notch at Top-Right     → X+R, Y+R
//   Entry=RIGHT, Exit=BOTTOM → notch at Bottom-Right  → X+R, Y-R
//   Entry=BOTTOM,Exit=LEFT   → notch at Bottom-Left   → X-R, Y-R
//
// For ENTRY points on an edge: one axis goes to compensated perimeter,
//   the other axis gets the feature offset direction.
// For CENTER point (inside corner): both axes get offset by ±R.
// For EXIT points on an edge: same as entry but for exit edge.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * V13: Maps an edge to its outward offset direction
 * LEFT  → push X negative (outward from plank)
 * RIGHT → push X positive
 * TOP   → push Y positive
 * BOTTOM → push Y negative
 */
var EDGE_OFFSET_DIRECTION = {
  'LEFT': { x: -1, y: 0 },
  'RIGHT': { x: +1, y: 0 },
  'TOP': { x: 0, y: +1 },
  'BOTTOM': { x: 0, y: -1 }
};

/**
 * V13: Get the ±R offset direction for center point based on entry/exit edges.
 * The center point is the inside corner of the L-notch.
 * It needs ±R on BOTH axes, directed toward the plank corner being cut.
 *
 * @param {string} entryEdge - 'LEFT', 'RIGHT', 'TOP', or 'BOTTOM'
 * @param {string} exitEdge - 'LEFT', 'RIGHT', 'TOP', or 'BOTTOM'
 * @returns {Object} {xDir: ±1, yDir: ±1} - multiply by R for offset
 */
function getCenterOffsetDirection(entryEdge, exitEdge) {
  var xDir = 0;
  var yDir = 0;

  var edges = [entryEdge, exitEdge];

  for (var i = 0; i < edges.length; i++) {
    var edge = edges[i];
    if (edge === 'LEFT') xDir = -1;
    if (edge === 'RIGHT') xDir = +1;
    if (edge === 'TOP') yDir = +1;
    if (edge === 'BOTTOM') yDir = -1;
  }

  // Safety: if somehow both edges are on same axis, fall back
  if (xDir === 0) xDir = (entryEdge === 'TOP' || entryEdge === 'BOTTOM') ?
    (exitEdge === 'RIGHT' ? +1 : -1) : -1;
  if (yDir === 0) yDir = (entryEdge === 'LEFT' || entryEdge === 'RIGHT') ?
    (exitEdge === 'TOP' ? +1 : -1) : -1;

  return { xDir: xDir, yDir: yDir };
}

/**
 * V13: Compute compensated ENTRY point.
 * Entry is ON an edge → push that axis to compensated perimeter (edge ± R).
 * The perpendicular axis gets the feature offset (toward notch corner).
 *
 * @param {Object} entryPoint - {x, y} in sheet coordinates
 * @param {string} entryEdge - which edge the entry is on
 * @param {Object} offsetDir - {xDir, yDir} from getCenterOffsetDirection()
 * @param {Object} plank - plank with x, y, placedWidth, placedHeight
 * @param {number} R - BIT_RADIUS
 * @returns {Object} {x, y} compensated tool center position
 */
function getCompensatedEntry(entryPoint, entryEdge, offsetDir, plank, R) {
  var x, y;

  if (entryEdge === 'LEFT') {
    x = plank.x - R;                           // Push to LEFT perimeter
    y = entryPoint.y + offsetDir.yDir * R;      // Feature offset on Y
  } else if (entryEdge === 'RIGHT') {
    x = plank.x + plank.placedWidth + R;        // Push to RIGHT perimeter
    y = entryPoint.y + offsetDir.yDir * R;      // Feature offset on Y
  } else if (entryEdge === 'TOP') {
    x = entryPoint.x + offsetDir.xDir * R;      // Feature offset on X
    y = plank.y + plank.placedHeight + R;        // Push to TOP perimeter
  } else if (entryEdge === 'BOTTOM') {
    x = entryPoint.x + offsetDir.xDir * R;      // Feature offset on X
    y = plank.y - R;                             // Push to BOTTOM perimeter
  } else {
    // Fallback: just offset both axes
    x = entryPoint.x + offsetDir.xDir * R;
    y = entryPoint.y + offsetDir.yDir * R;
  }

  return {
    x: Math.max(x, MIN_COORDINATE_VALUE),
    y: Math.max(y, MIN_COORDINATE_VALUE)
  };
}

/**
 * V13: Compute compensated CENTER point (inside corner of L-notch).
 * Offset by ±R on BOTH axes, directed toward the plank corner.
 *
 * @param {Object} centerPoint - {x, y} in sheet coordinates
 * @param {Object} offsetDir - {xDir, yDir} from getCenterOffsetDirection()
 * @param {number} R - BIT_RADIUS
 * @returns {Object} {x, y} compensated tool center position
 */
function getCompensatedCenter(centerPoint, offsetDir, R) {
  return {
    x: Math.max(centerPoint.x + offsetDir.xDir * R, MIN_COORDINATE_VALUE),
    y: Math.max(centerPoint.y + offsetDir.yDir * R, MIN_COORDINATE_VALUE)
  };
}

/**
 * V13: Compute compensated EXIT point.
 * Same logic as entry but for the exit edge.
 *
 * @param {Object} exitPoint - {x, y} in sheet coordinates
 * @param {string} exitEdge - which edge the exit is on
 * @param {Object} offsetDir - {xDir, yDir} from getCenterOffsetDirection()
 * @param {Object} plank - plank with x, y, placedWidth, placedHeight
 * @param {number} R - BIT_RADIUS
 * @returns {Object} {x, y} compensated tool center position
 */
function getCompensatedExit(exitPoint, exitEdge, offsetDir, plank, R) {
  var x, y;

  if (exitEdge === 'LEFT') {
    x = plank.x - R;                           // Push to LEFT perimeter
    y = exitPoint.y + offsetDir.yDir * R;       // Feature offset on Y
  } else if (exitEdge === 'RIGHT') {
    x = plank.x + plank.placedWidth + R;        // Push to RIGHT perimeter
    y = exitPoint.y + offsetDir.yDir * R;       // Feature offset on Y
  } else if (exitEdge === 'TOP') {
    x = exitPoint.x + offsetDir.xDir * R;       // Feature offset on X
    y = plank.y + plank.placedHeight + R;        // Push to TOP perimeter
  } else if (exitEdge === 'BOTTOM') {
    x = exitPoint.x + offsetDir.xDir * R;       // Feature offset on X
    y = plank.y - R;                             // Push to BOTTOM perimeter
  } else {
    x = exitPoint.x + offsetDir.xDir * R;
    y = exitPoint.y + offsetDir.yDir * R;
  }

  return {
    x: Math.max(x, MIN_COORDINATE_VALUE),
    y: Math.max(y, MIN_COORDINATE_VALUE)
  };
}

/**
 * V13.1 EDGE FEATURE GROUPS: Builds edge feature groups - assigns each L-cut/Gola to an edge
 * 
 * CCW Traversal Order: LEFT(up) → TOP(right) → RIGHT(down) → BOTTOM(left)
 * 
 * V13.1 FIX: Added comprehensive logging and validation for edge/offset
 * direction to diagnose the +10mm L-cut error on RIGHT (mirrored) planks.
 * Also validates that the offset direction pushes the tool AWAY from 
 * material (toward the notch corner, not into the plank).
 */
function buildEdgeFeatureGroups(plank) {
  const edgeGroups = {
    LEFT: [],
    TOP: [],
    RIGHT: [],
    BOTTOM: []
  };

  // Combine all features (L-cuts and Gola profiles)
  const allFeatures = [
    ...plank.features.l_cuts.map(f => ({ ...f, type: 'l_cut' })),
    ...plank.features.gola_profiles.map(f => ({ ...f, type: 'gola' }))
  ];

  const plankLeft = plank.x;
  const plankRight = plank.x + plank.placedWidth;
  const plankBottom = plank.y;
  const plankTop = plank.y + plank.placedHeight;

  allFeatures.forEach(feature => {
    const startEdges = getEdgeForPoint(feature.start, plank);
    const endEdges = getEdgeForPoint(feature.end, plank);

    // V13.1: Log edge detection for debugging
    Logger.log('[EdgeDetect] Plank ' + plank.id + ' (' + plank.name + ') rotated=' + plank.rotated +
      ' | start=(' + feature.start.x.toFixed(1) + ',' + feature.start.y.toFixed(1) + ') edges=[' + startEdges.join(',') + ']' +
      ' | end=(' + feature.end.x.toFixed(1) + ',' + feature.end.y.toFixed(1) + ') edges=[' + endEdges.join(',') + ']' +
      ' | plank bounds: L=' + plankLeft.toFixed(1) + ' R=' + plankRight.toFixed(1) +
      ' B=' + plankBottom.toFixed(1) + ' T=' + plankTop.toFixed(1));

    if (startEdges.length === 0 && endEdges.length === 0) {
      Logger.log('WARNING: L-cut/Gola has no edge points for plank ' + plank.id +
        '. Start=(' + feature.start.x.toFixed(1) + ',' + feature.start.y.toFixed(1) +
        ') End=(' + feature.end.x.toFixed(1) + ',' + feature.end.y.toFixed(1) +
        '). PlankBounds: [' + plankLeft.toFixed(1) + ',' + plankBottom.toFixed(1) +
        '] to [' + plankRight.toFixed(1) + ',' + plankTop.toFixed(1) + ']');
      return;
    }

    // Determine which point is the "entry" (first encountered in CCW traversal)
    var entryPoint, exitPoint, entryEdge, exitEdge;

    if (startEdges.length > 0 && endEdges.length > 0) {
      // Both points on edges - determine CCW order
      const edgeOrder = ['LEFT', 'TOP', 'RIGHT', 'BOTTOM'];

      let startEdgeIndex = 999, endEdgeIndex = 999;
      var startEdgeName = '', endEdgeName = '';
      for (let i = 0; i < edgeOrder.length; i++) {
        if (startEdges.includes(edgeOrder[i]) && i < startEdgeIndex) {
          startEdgeIndex = i;
          startEdgeName = edgeOrder[i];
        }
        if (endEdges.includes(edgeOrder[i]) && i < endEdgeIndex) {
          endEdgeIndex = i;
          endEdgeName = edgeOrder[i];
        }
      }

      // CRITICAL: Handle Bottom-Left Corner (wrap-around in CCW loop)
      const hasLeft = startEdges.includes('LEFT') || endEdges.includes('LEFT');
      const hasBottom = startEdges.includes('BOTTOM') || endEdges.includes('BOTTOM');

      if (hasLeft && hasBottom) {
        // In CCW loop, BOTTOM comes BEFORE LEFT
        if (startEdges.includes('BOTTOM')) {
          entryPoint = feature.start;
          exitPoint = feature.end;
          entryEdge = 'BOTTOM';
          exitEdge = 'LEFT';
        } else {
          entryPoint = feature.end;
          exitPoint = feature.start;
          entryEdge = 'BOTTOM';
          exitEdge = 'LEFT';
        }
      } else if (startEdgeIndex <= endEdgeIndex) {
        entryPoint = feature.start;
        exitPoint = feature.end;
        entryEdge = startEdgeName;
        exitEdge = endEdgeName;
      } else {
        entryPoint = feature.end;
        exitPoint = feature.start;
        entryEdge = endEdgeName;
        exitEdge = startEdgeName;
      }
    } else if (startEdges.length > 0) {
      entryPoint = feature.start;
      exitPoint = feature.end;
      entryEdge = startEdges[0];
      exitEdge = startEdges[0]; // fallback
    } else {
      entryPoint = feature.end;
      exitPoint = feature.start;
      entryEdge = endEdges[0];
      exitEdge = endEdges[0]; // fallback
    }

    // V13: Compute the offset direction based on entry/exit edges
    const offsetDir = getCenterOffsetDirection(entryEdge, exitEdge);

    // ════════════════════════════════════════════════════════════════════════
    // V13.1 VALIDATION: Verify offset direction pushes tool AWAY from plank
    // The compensated center should be FURTHER from the plank center than
    // the raw center. If not, the offset is pushing INTO the material.
    // ════════════════════════════════════════════════════════════════════════
    const plankCenterX = (plankLeft + plankRight) / 2;
    const plankCenterY = (plankBottom + plankTop) / 2;

    const rawDistFromCenter = Math.sqrt(
      Math.pow(feature.center.x - plankCenterX, 2) +
      Math.pow(feature.center.y - plankCenterY, 2)
    );
    const compCenterX = feature.center.x + offsetDir.xDir * BIT_RADIUS;
    const compCenterY = feature.center.y + offsetDir.yDir * BIT_RADIUS;
    const compDistFromCenter = Math.sqrt(
      Math.pow(compCenterX - plankCenterX, 2) +
      Math.pow(compCenterY - plankCenterY, 2)
    );

    if (compDistFromCenter < rawDistFromCenter) {
      // Offset is pushing TOWARD plank center (INTO material) — this is wrong!
      Logger.log('WARNING: Offset direction may be WRONG for plank ' + plank.id +
        ' (' + plank.name + ') ' + feature.type +
        ' | entryEdge=' + entryEdge + ' exitEdge=' + exitEdge +
        ' | offsetDir=(' + offsetDir.xDir + ',' + offsetDir.yDir + ')' +
        ' | Center moved TOWARD plank center (raw dist=' + rawDistFromCenter.toFixed(2) +
        ', comp dist=' + compDistFromCenter.toFixed(2) + ')' +
        ' | This will cut ~' + (2 * BIT_RADIUS) + 'mm too much!');
    }

    // V13.1: Log the final assignment
    Logger.log('[FeatureAssign] Plank ' + plank.id + ' ' + feature.type +
      ': entry=' + entryEdge + ' exit=' + exitEdge +
      ' offsetDir=(' + offsetDir.xDir + ',' + offsetDir.yDir + ')' +
      ' center=(' + feature.center.x.toFixed(1) + ',' + feature.center.y.toFixed(1) + ')' +
      ' compCenter=(' + compCenterX.toFixed(1) + ',' + compCenterY.toFixed(1) + ')');

    const processedFeature = {
      triplet: feature,
      entryPoint: entryPoint,
      center: feature.center,
      exitPoint: exitPoint,
      entryEdge: entryEdge,
      exitEdge: exitEdge,
      offsetDir: offsetDir,
      type: feature.type,
      sortPosition: getSortPosition(entryPoint, entryEdge, plank)
    };

    edgeGroups[entryEdge].push(processedFeature);
  });

  // Sort features along each edge in CCW direction
  edgeGroups.LEFT.sort((a, b) => a.sortPosition - b.sortPosition);   // Y Ascending
  edgeGroups.TOP.sort((a, b) => a.sortPosition - b.sortPosition);    // X Ascending
  edgeGroups.RIGHT.sort((a, b) => b.sortPosition - a.sortPosition);  // Y Descending
  edgeGroups.BOTTOM.sort((a, b) => b.sortPosition - a.sortPosition); // X Descending

  return edgeGroups;
}

/**
 * Generates G-code for a simple rectangular plank (no L-cuts or Golas)
 */
function generateT1_Rectangle(plank) {
  const gcode = [];
  const R = BIT_RADIUS;

  const width = plank.placedWidth;
  const height = plank.placedHeight;

  const P1 = { x: Math.max(plank.x - R, MIN_COORDINATE_VALUE), y: Math.max(plank.y - R, MIN_COORDINATE_VALUE) };
  const P2 = { x: Math.max(plank.x + width + R, MIN_COORDINATE_VALUE), y: Math.max(plank.y - R, MIN_COORDINATE_VALUE) };
  const P3 = { x: Math.max(plank.x + width + R, MIN_COORDINATE_VALUE), y: Math.max(plank.y + height + R, MIN_COORDINATE_VALUE) };
  const P4 = { x: Math.max(plank.x - R, MIN_COORDINATE_VALUE), y: Math.max(plank.y + height + R, MIN_COORDINATE_VALUE) };

  const passes = getProfilePassDepths(plank.thickness);
  const Z_APPROACH = plank.thickness;

  gcode.push(`G00 X${P1.x.toFixed(4)} Y${P1.y.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
  gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);

  passes.forEach(depth => {
    gcode.push(`G01 Z${depth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${P4.x.toFixed(4)} Y${P4.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${P3.x.toFixed(4)} Y${P3.y.toFixed(4)}`);
    gcode.push(`G01 X${P2.x.toFixed(4)} Y${P2.y.toFixed(4)}`);
    gcode.push(`G01 X${P1.x.toFixed(4)} Y${P1.y.toFixed(4)}`);
  });

  gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  return gcode;
}

/**
 * V13 INTEGRATED T1: Main integrated L-cut/Gola cutting function
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * COMPLETELY REWRITTEN for V13 — uses axis-aligned offset system.
 *
 * KEY CHANGES from V12:
 * 1. NO more offsetPointForToolCenter() / offsetCenterPointForToolCenter()
 * 2. NO more step-in / step-out moves (entry/exit ARE on compensated perimeter)
 * 3. Uses getCompensatedEntry/Center/Exit() with axis-aligned ±R offsets
 * 4. 3 G-code points per feature instead of 5 (entry → center → exit)
 *
 * Path: P1 → [features on LEFT] → P4 → [features on TOP] → P3 → 
 *       [features on RIGHT] → P2 → [features on BOTTOM] → P1
 * ═══════════════════════════════════════════════════════════════════════════════
 */
function generateT1_Integrated(plank) {
  const gcode = [];
  const R = BIT_RADIUS;

  const width = plank.placedWidth;
  const height = plank.placedHeight;

  // Corner points with bit radius compensation (CCW: P1→P4→P3→P2→P1)
  const P1 = { x: Math.max(plank.x - R, MIN_COORDINATE_VALUE), y: Math.max(plank.y - R, MIN_COORDINATE_VALUE) };
  const P2 = { x: Math.max(plank.x + width + R, MIN_COORDINATE_VALUE), y: Math.max(plank.y - R, MIN_COORDINATE_VALUE) };
  const P3 = { x: Math.max(plank.x + width + R, MIN_COORDINATE_VALUE), y: Math.max(plank.y + height + R, MIN_COORDINATE_VALUE) };
  const P4 = { x: Math.max(plank.x - R, MIN_COORDINATE_VALUE), y: Math.max(plank.y + height + R, MIN_COORDINATE_VALUE) };

  const passes = getProfilePassDepths(plank.thickness);
  const Z_APPROACH = plank.thickness;

  // Build edge feature groups
  const edgeGroupsOriginal = buildEdgeFeatureGroups(plank);

  // Move to start position (P1)
  gcode.push(`G00 X${P1.x.toFixed(4)} Y${P1.y.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
  gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);

  // Define traversal sequence - CCW ORDER
  const edgeSequence = [
    { key: 'LEFT', endCorner: P4, nextKey: 'TOP' },
    { key: 'TOP', endCorner: P3, nextKey: 'RIGHT' },
    { key: 'RIGHT', endCorner: P2, nextKey: 'BOTTOM' },
    { key: 'BOTTOM', endCorner: P1, nextKey: 'LEFT' }
  ];

  // Cut each depth pass
  passes.forEach(depth => {
    gcode.push(`G01 Z${depth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);

    // Clone groups for this pass (features are consumed)
    const currentPassGroups = {
      LEFT: [...edgeGroupsOriginal.LEFT],
      TOP: [...edgeGroupsOriginal.TOP],
      RIGHT: [...edgeGroupsOriginal.RIGHT],
      BOTTOM: [...edgeGroupsOriginal.BOTTOM]
    };

    // Traverse each edge
    for (let i = 0; i < edgeSequence.length; i++) {
      const edge = edgeSequence[i];
      const features = currentPassGroups[edge.key];
      let skipCorner = false;

      // Process features on this edge
      while (features.length > 0) {
        const feature = features.shift(); // CONSUME feature

        // ════════════════════════════════════════════════════════════════
        // V13 AXIS-ALIGNED OFFSET: 3 points per feature, no step-in/out
        //
        // Entry: ON the perimeter (edge ± R), with feature offset on other axis
        // Center: ±R on BOTH axes (toward the notch corner)
        // Exit: ON the perimeter (edge ± R), with feature offset on other axis
        //
        // The compensated entry/exit points ARE on the perimeter path,
        // so NO separate step-in or step-out moves are needed.
        // ════════════════════════════════════════════════════════════════

        // ════════════════════════════════════════════════════════════════
        // V13.1 FIX: Compute compensation INLINE to guarantee feature-axis
        // offset is always applied. The getCompensated* functions are called
        // first, then verified — if the feature-axis offset is missing
        // (due to deployment issues), the inline computation corrects it.
        // ════════════════════════════════════════════════════════════════
        const compEntry = getCompensatedEntry(
          feature.entryPoint, feature.entryEdge, feature.offsetDir, plank, R
        );
        const compCenter = getCompensatedCenter(
          feature.center, feature.offsetDir, R
        );
        const compExit = getCompensatedExit(
          feature.exitPoint, feature.exitEdge, feature.offsetDir, plank, R
        );

        // --- VERIFY & CORRECT ENTRY ---
        // Entry is on an edge: perimeter axis = edge ± R, feature axis = point ± offsetDir * R
        if (feature.entryEdge === 'LEFT' || feature.entryEdge === 'RIGHT') {
          const expectedY = feature.entryPoint.y + feature.offsetDir.yDir * R;
          if (Math.abs(compEntry.y - expectedY) > 0.01) {
            compEntry.y = Math.max(expectedY, MIN_COORDINATE_VALUE);
          }
        } else if (feature.entryEdge === 'TOP' || feature.entryEdge === 'BOTTOM') {
          const expectedX = feature.entryPoint.x + feature.offsetDir.xDir * R;
          if (Math.abs(compEntry.x - expectedX) > 0.01) {
            compEntry.x = Math.max(expectedX, MIN_COORDINATE_VALUE);
          }
        }

        // --- VERIFY & CORRECT CENTER ---
        // Center point gets ±R on BOTH axes
        const expectedCenterX = feature.center.x + feature.offsetDir.xDir * R;
        const expectedCenterY = feature.center.y + feature.offsetDir.yDir * R;
        if (Math.abs(compCenter.x - expectedCenterX) > 0.01) {
          compCenter.x = Math.max(expectedCenterX, MIN_COORDINATE_VALUE);
        }
        if (Math.abs(compCenter.y - expectedCenterY) > 0.01) {
          compCenter.y = Math.max(expectedCenterY, MIN_COORDINATE_VALUE);
        }

        // --- VERIFY & CORRECT EXIT ---
        // Exit is on an edge: perimeter axis = edge ± R, feature axis = point ± offsetDir * R
        if (feature.exitEdge === 'LEFT' || feature.exitEdge === 'RIGHT') {
          const expectedY = feature.exitPoint.y + feature.offsetDir.yDir * R;
          if (Math.abs(compExit.y - expectedY) > 0.01) {
            compExit.y = Math.max(expectedY, MIN_COORDINATE_VALUE);
          }
        } else if (feature.exitEdge === 'TOP' || feature.exitEdge === 'BOTTOM') {
          const expectedX = feature.exitPoint.x + feature.offsetDir.xDir * R;
          if (Math.abs(compExit.x - expectedX) > 0.01) {
            compExit.x = Math.max(expectedX, MIN_COORDINATE_VALUE);
          }
        }

        // V13.1 DIAGNOSTIC: Log raw vs final compensated coordinates
        Logger.log('[GCodeComp] Plank ' + plank.id + ' (' + plank.name + ') ' + feature.type +
          ' | entryEdge=' + feature.entryEdge + ' exitEdge=' + feature.exitEdge +
          ' offsetDir={xDir:' + feature.offsetDir.xDir + ',yDir:' + feature.offsetDir.yDir + '} R=' + R +
          ' | raw entry=(' + feature.entryPoint.x.toFixed(1) + ',' + feature.entryPoint.y.toFixed(1) + ')' +
          ' FINAL entry=(' + compEntry.x.toFixed(1) + ',' + compEntry.y.toFixed(1) + ')' +
          ' | raw center=(' + feature.center.x.toFixed(1) + ',' + feature.center.y.toFixed(1) + ')' +
          ' FINAL center=(' + compCenter.x.toFixed(1) + ',' + compCenter.y.toFixed(1) + ')' +
          ' | raw exit=(' + feature.exitPoint.x.toFixed(1) + ',' + feature.exitPoint.y.toFixed(1) + ')' +
          ' FINAL exit=(' + compExit.x.toFixed(1) + ',' + compExit.y.toFixed(1) + ')');

        // Cut: Entry → Center → Exit (3 clean moves, no extra steps)
        gcode.push(`G01 X${compEntry.x.toFixed(4)} Y${compEntry.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
        gcode.push(`G01 X${compCenter.x.toFixed(4)} Y${compCenter.y.toFixed(4)}`);
        gcode.push(`G01 X${compExit.x.toFixed(4)} Y${compExit.y.toFixed(4)}`);

        // Check if feature exits onto the NEXT edge (corner feature)
        if (feature.exitEdge === edge.nextKey) {
          skipCorner = true;
          break; // Continue from exit point on next edge
        }
      }

      // If no corner feature, travel to the physical corner
      if (!skipCorner) {
        gcode.push(`G01 X${edge.endCorner.x.toFixed(4)} Y${edge.endCorner.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
      }
    }
  });

  gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  return gcode;
}

/**
 * Processes T1 - Narrow Grooves (width < 10mm) + Cutting Profile
 * 
 * V13.1: Now handles narrow grooves BEFORE perimeter cutting
 * Narrow grooves use same serpentine logic as T2, but with T1 (8mm) diameter
 */
function processToolT1(planks) {
  const gcode = [];
  const toolNumber = 'T1';

  if (planks.length === 0) return gcode;

  gcode.push(...outputToolStart(toolNumber, planks));

  // FIRST: Cut all narrow grooves (width < 10mm) using T1
  planks.forEach(plank => {
    if (plank.features.slots && plank.features.slots.length > 0) {
      // Filter: Only grooves with width < 10mm for T1
      const narrowGrooves = plank.features.slots.filter(slot => slot.width < TOOL_DIAMETER_T2);

      if (narrowGrooves.length > 0) {
        const Z_APPROACH = plank.thickness;

        narrowGrooves.forEach(slot => {
          // Use same serpentine logic as T2, but with T1 diameter (8mm)
          gcode.push(...generateSlotGCode(plank, slot, Z_APPROACH, TOOL_DIAMETER_T1));
        });
      }
    }
  });

  // SECOND: Cut all perimeters (existing logic)
  planks.forEach(plank => {
    const hasLCut = plank.features.l_cuts && plank.features.l_cuts.length > 0;
    const hasGolaProfile = plank.features.gola_profiles && plank.features.gola_profiles.length > 0;

    if (hasLCut || hasGolaProfile) {
      gcode.push(...generateT1_Integrated(plank));
    } else {
      gcode.push(...generateT1_Rectangle(plank));
    }
  });

  gcode.push('M05');
  return gcode;
}

// ========================================
// GOOGLE DRIVE INTEGRATION
// ========================================

/**
 * Creates NC files in Google Drive
 */
function createNCFilesInDrive(gcodeResults) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const projectName = ss.getName().trim().replace(/[/\\?%*:|"<>]/g, '_');

    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
    const mainFolderName = `${projectName}_G_CODES_${timestamp}`;

    let masterFolder;
    try {
      masterFolder = DriveApp.getFolderById(MASTER_FOLDER_ID);
    } catch (e) {
      throw new Error(`Master Folder ID invalid.`);
    }

    driveFolder = masterFolder.createFolder(mainFolderName);

    const materialFolders = {};
    const thicknessFolders = {};
    const ncFiles = [];

    gcodeResults.forEach(result => {
      const materialName = result.materialFolder;
      const thicknessName = `${result.thickness}MM`;

      let matFolder;
      if (materialFolders[materialName]) {
        matFolder = materialFolders[materialName];
      } else {
        matFolder = driveFolder.createFolder(materialName);
        materialFolders[materialName] = matFolder;
      }

      const thickKey = `${materialName}_${thicknessName}`;
      let targetFolder;
      if (thicknessFolders[thickKey]) {
        targetFolder = thicknessFolders[thickKey];
      } else {
        targetFolder = matFolder.createFolder(thicknessName);
        thicknessFolders[thickKey] = targetFolder;
      }

      const blob = Utilities.newBlob(result.content, 'text/plain', result.fileName);
      const file = targetFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      ncFiles.push({
        name: result.fileName,
        url: file.getUrl(),
        sheet: result.sheetName,
        planks: result.plankCount
      });
    });



    createSummaryFile(ncFiles);

    // --- DUAL STORAGE: Also Save to Project Specific Folder ---
    try {
      const gCodesFolder = getProjectSubfolder('G_CODES');

      gcodeResults.forEach(result => {
        // Create sub-folders inside Project > G_Codes if needed (Material > Thickness)
        // OR just dump flat files if preferred. User said: "in that G code folder I need to transfer these files"
        // Let's mirror the Material/Thickness structure for cleanliness.

        let targetFolder = gCodesFolder;

        // 1. Material Folder
        const matFolders = targetFolder.getFoldersByName(result.materialFolder);
        if (matFolders.hasNext()) {
          targetFolder = matFolders.next();
        } else {
          targetFolder = targetFolder.createFolder(result.materialFolder);
        }

        // 2. Thickness Folder
        const thickName = `${result.thickness}MM`;
        const thickFolders = targetFolder.getFoldersByName(thickName);
        if (thickFolders.hasNext()) {
          targetFolder = thickFolders.next();
        } else {
          targetFolder = targetFolder.createFolder(thickName);
        }

        // 3. Create File
        const blob = Utilities.newBlob(result.content, 'text/plain', result.fileName);
        targetFolder.createFile(blob);
      });

      // Also copy the SUMMARY file
      const summaryBlob = Utilities.newBlob(createSummaryString(ncFiles), 'text/plain', 'GENERATION_SUMMARY.txt');
      gCodesFolder.createFile(summaryBlob);

    } catch (e) {
      Logger.log('Error saving G-Codes to Project Folder: ' + e.message);
      // We do NOT throw here, so the main process still succeeds (Dual Storage is secondary success)
    }

    return ncFiles;

  } catch (error) {
    throw new Error(`Failed to create Drive files: ${error.message}`);
  }
}

/**
 * Creates ZIP folder with all NC files
 */
function zipAndUploadFiles(ncFiles) {
  try {
    if (!driveFolder) {
      throw new Error('Drive folder not created');
    }

    const zipFolder = driveFolder.createFolder('ALL_NC_FILES_FLAT');

    ncFiles.forEach(ncFile => {
      const originalFile = DriveApp.getFileById(getFileIdFromUrl(ncFile.url));
      originalFile.makeCopy(ncFile.name, zipFolder);
    });

    const instructions = `
CNC G-CODE FILES - DOWNLOAD INSTRUCTIONS
=========================================

Folder Structure Created:
1. Main Folder: Project Name
2. Subfolders: Sorted by Material (e.g., Pink, Black)

To download EVERYTHING at once:
1. Open the "ALL_NC_FILES_FLAT" folder
2. Select All -> Download

Generated: ${new Date().toLocaleString()}
    `.trim();

    const instructionsBlob = Utilities.newBlob(instructions, 'text/plain', 'READ_ME.txt');
    driveFolder.createFile(instructionsBlob);

    return zipFolder.getUrl();

  } catch (error) {
    throw new Error(`Failed to create ZIP proxy: ${error.message}`);
  }
}

/**
 * Extracts file ID from Drive URL
 */
function getFileIdFromUrl(url) {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

/**
 * Creates summary file with generation details
 */
function createSummaryFile(ncFiles) {
  const header = `CNC G-CODE GENERATION SUMMARY\n=========================================\n`;
  const generationDetails = `Generated: ${new Date().toLocaleString()}\n`;
  const fileList = ncFiles.map(file =>
    `- ${file.name} (Sheet: ${file.sheet}, Planks: ${file.planks})`
  );

  const summary = [
    header,
    generationDetails,
    'FILES GENERATED:',
    ...fileList,
    '',
    `Total Files: ${ncFiles.length}`,
    `Drive Folder: ${driveFolder.getUrl()}`
  ].join('\n');

  const blob = Utilities.newBlob(summary, 'text/plain', 'GENERATION_SUMMARY.txt');
  driveFolder.createFile(blob);
}

/**
 * Helper: Creates summary string (reused for dual storage)
 */
function createSummaryString(ncFiles) {
  const header = `CNC G-CODE GENERATION SUMMARY\n=========================================\n`;
  const generationDetails = `Generated: ${new Date().toLocaleString()}\n`;
  const fileList = ncFiles.map(file =>
    `- ${file.name} (Sheet: ${file.sheet}, Planks: ${file.planks})`
  );

  return [
    header,
    generationDetails,
    'FILES GENERATED:',
    ...fileList,
    '',
    `Total Files: ${ncFiles.length}`
  ].join('\n');
}

// ========================================
// USER INTERFACE
// ========================================

/**
 * Shows popup with download links
 */
function showDownloadLinksPopup(ncFiles, zipUrl) {
  const ui = SpreadsheetApp.getUi();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px;">
        <h1 style="margin: 0; font-size: 24px;">CNC G-code Generation Complete!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">v13.1.0 - Added T1 Narrow Groove Support</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #4a148c; margin-bottom: 10px;">DOWNLOAD FOLDER</h3>
        <a href="${driveFolder.getUrl()}" target="_blank" style="display: inline-block; background: #4a148c; color: white; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-bottom: 15px;">
          Open Project Folder
        </a>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #2e7d32; margin-bottom: 10px;">FILES GENERATED</h3>
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px; padding: 10px;">
          ${ncFiles.map(file => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #f0f0f0;">
              <span style="font-weight: bold;">${file.name}</span>
              <a href="${file.url}" target="_blank" style="background: #2e7d32; color: white; padding: 6px 12px; border-radius: 3px; text-decoration: none; font-size: 12px;">
                View
              </a>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <button onclick="google.script.host.close()" style="background: #757575; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Close Window
        </button>
      </div>
    </div>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(650)
    .setHeight(600);

  ui.showModalDialog(htmlOutput, 'Download Your CNC G-code Files');
}

// ========================================
// ERROR HANDLING
// ========================================

/**
 * Handles errors with user-friendly messages
 */
function handleError(error) {
  Logger.log(`ERROR: ${error.stack}`);

  const ui = SpreadsheetApp.getUi();
  let message = error.message;

  if (error.message.includes('not found')) {
    message = 'Please make sure the sheet is named exactly "Nest Result".';
  } else if (error.message.includes('Missing columns')) {
    message = 'Please check that your sheet has all required columns.';
  } else if (error.message.includes('Drive')) {
    message = 'Google Drive error. Please check your Drive storage and permissions.';
  }

  const htmlError = `
    <div style="font-family: Arial, sans-serif; padding: 30px; text-align: center; color: #d32f2f;">
      <h1 style="font-size: 48px; margin: 0;">Error</h1>
      <h2 style="margin: 20px 0;">Generation Failed</h2>
      <p style="background: #ffebee; padding: 15px; border-radius: 5px; border-left: 4px solid #d32f2f;">
        ${message}
      </p>
      <button onclick="google.script.host.close()" style="background: #d32f2f; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">
        Close
      </button>
    </div>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(htmlError)
    .setWidth(500)
    .setHeight(300);

  ui.showModalDialog(htmlOutput, 'Error');
}