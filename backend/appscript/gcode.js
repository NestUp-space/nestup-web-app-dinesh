/**
* CNC G-code Generator (GRBL-Based)
* Version: 13.3.0 - U-cut tool offset; internal rect edge-binding (EB Value)
* Description: 
* - Generates G-code sorted by Material folders.
* - INTEGRATED L-cuts and Gola profiles into perimeter cutting (NO SEPARATE PASSES)
* - Single continuous tool path = No plank movement = No damage
* - T1 cut order: when sheet has >15 planks, use position-based order (Y then X) to reduce damage; otherwise small-to-big (smallest area first).
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

var generatedFiles = [];
var driveFolder = null;

// CRITICAL CONSTANT: Master Folder ID from the provided link
const MASTER_FOLDER_ID = '1Nm09d0EQTXwtBI8rz2lLE0Iwb9J8gQyy';

// G-Code State Tracking
var current_tool_ID = null;
var current_sheet_ID = null;

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

// T1 cut order: when planks per sheet > this value, use position-based order (Y then X); else small-to-big by area
const PLANK_COUNT_USE_POSITION_ORDER = 15;

// Diagnostic toggle for tracing incut compensation math.
// false = normal operation, true = verbose Logger output.
const INCUT_DEBUG = false;

function logIncutDebug(stage, payload) {
 if (!INCUT_DEBUG) return;
 try {
   Logger.log('[INCUT_DEBUG][' + stage + '] ' + JSON.stringify(payload));
 } catch (e) {
   Logger.log('[INCUT_DEBUG][' + stage + '] (log serialization error)');
 }
}

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

   // Run incut dimensional validation on all planks and show results
   const validationResult = validateIncutDimensions(sheets);
   showIncutValidationDialog(validationResult);

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
   rotated: 'Rotated',
   ebValue: 'EB Value',
   originalWidth: 'Original Width',
   originalHeight: 'Original Height',
   roomName: 'Room Name',
   boxModel: 'Box Model',
   cutOrder: 'Cut Order'
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
       ebValue: (colIndices.ebValue >= 0 && row[colIndices.ebValue] !== '' && row[colIndices.ebValue] != null) ? (parseFloat(row[colIndices.ebValue]) || 1) : 1,
       roomName: (colIndices.roomName >= 0 && row[colIndices.roomName] != null) ? String(row[colIndices.roomName] || '').trim() : '',
       boxModel: (colIndices.boxModel >= 0 && row[colIndices.boxModel] != null) ? String(row[colIndices.boxModel] || '').trim() : '',
       originalWidth: (colIndices.originalWidth >= 0 && row[colIndices.originalWidth] !== '' && row[colIndices.originalWidth] != null) ? (parseFloat(row[colIndices.originalWidth]) || 0) : 0,
       originalHeight: (colIndices.originalHeight >= 0 && row[colIndices.originalHeight] !== '' && row[colIndices.originalHeight] != null) ? (parseFloat(row[colIndices.originalHeight]) || 0) : 0,
       cutOrder: (colIndices.cutOrder >= 0 && row[colIndices.cutOrder] !== '' && row[colIndices.cutOrder] != null) ? (parseInt(row[colIndices.cutOrder], 10) || null) : null,
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
     if (plank.features.incut_cuts && plank.features.incut_cuts.length > 0) {
       const TOL = 2;
       const inPlankBounds = (p) =>
         p.x >= (plankX - TOL) && p.x <= (plankX + plank.placedWidth + TOL) &&
         p.y >= (plankY - TOL) && p.y <= (plankY + plank.placedHeight + TOL);

       plank.features.incut_cuts = plank.features.incut_cuts.map((f, idx) => {
         const pts = (f.points && f.points.length) ? f.points : [f.point1, f.point2];
         const alreadyAbsolute = pts.every(p => inPlankBounds(p));

         const normalize = (p) => alreadyAbsolute
           ? { x: p.x, y: p.y }
           : { x: p.x + plankX, y: p.y + plankY };

         const sheetPts = pts.map(normalize);

         const allOutside = sheetPts.some(p => !inPlankBounds(p));
         if (allOutside) {
           Logger.log('[INCUT-WARN] Plank ' + plank.id + ' incut #' + (idx + 1) +
             ': point(s) outside plank bounds after normalization. Points=' +
             JSON.stringify(sheetPts.map(p => '(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')')) +
             ' Bounds=[' + plankX.toFixed(1) + '..' + (plankX + plank.placedWidth).toFixed(1) +
             ', ' + plankY.toFixed(1) + '..' + (plankY + plank.placedHeight).toFixed(1) + ']');
         }

         return {
           point1: sheetPts[0],
           point2: sheetPts[sheetPts.length - 1],
           points: sheetPts,
           cutType: f.cutType || 'LINE'
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
* Supports: screws, hinges, vb_main, vb_double, slots, l_cuts (triplet), gola_profiles (triplet), incut_cuts (2 points)
*/
function extractFeatures(row, headers) {
 const features = {
   screws: [],
   hinges: [],
   vb_main: [],
   vb_double: [],
   slots: [],
   l_cuts: [],
   gola_profiles: [],
   incut_cuts: []
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

 // Scan for max Incut (inclined) cut index - 2 points per cut
 let maxIncutIndex = 0;
 headers.forEach(header => {
   const incutMatch = header.match(/^Incut_cut_(\d+)_point1_X$/);
   if (incutMatch) {
     const idx = parseInt(incutMatch[1]);
     if (idx > maxIncutIndex) maxIncutIndex = idx;
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

 // --- 5. Incut cuts - 2 to 4 points per cut ---
 for (let i = 1; i <= maxIncutIndex; i++) {
   const p1XIdx = headers.indexOf(`Incut_cut_${i}_point1_X`);
   const p1YIdx = headers.indexOf(`Incut_cut_${i}_point1_Y`);
   const p2XIdx = headers.indexOf(`Incut_cut_${i}_point2_X`);
   const p2YIdx = headers.indexOf(`Incut_cut_${i}_point2_Y`);
   const p3XIdx = headers.indexOf(`Incut_cut_${i}_point3_X`);
   const p3YIdx = headers.indexOf(`Incut_cut_${i}_point3_Y`);
   const p4XIdx = headers.indexOf(`Incut_cut_${i}_point4_X`);
   const p4YIdx = headers.indexOf(`Incut_cut_${i}_point4_Y`);

   if (p1XIdx === -1 || p1YIdx === -1 || p2XIdx === -1 || p2YIdx === -1) continue;

   const p1X = parseFloat(row[p1XIdx]);
   const p1Y = parseFloat(row[p1YIdx]);
   const p2X = parseFloat(row[p2XIdx]);
   const p2Y = parseFloat(row[p2YIdx]);

   if (isNaN(p1X) || isNaN(p1Y) || isNaN(p2X) || isNaN(p2Y)) continue;
   if (p1X === 0 && p1Y === 0 && p2X === 0 && p2Y === 0) continue;

   const points = [{ x: p1X, y: p1Y }, { x: p2X, y: p2Y }];
   if (p3XIdx !== -1 && p3YIdx !== -1) {
     const p3X = parseFloat(row[p3XIdx]);
     const p3Y = parseFloat(row[p3YIdx]);
     if (!isNaN(p3X) && !isNaN(p3Y) && !(p3X === 0 && p3Y === 0)) points.push({ x: p3X, y: p3Y });
   }
   if (p4XIdx !== -1 && p4YIdx !== -1) {
     const p4X = parseFloat(row[p4XIdx]);
     const p4Y = parseFloat(row[p4YIdx]);
     if (!isNaN(p4X) && !isNaN(p4Y) && !(p4X === 0 && p4Y === 0)) points.push({ x: p4X, y: p4Y });
   }

   const cutType = detectIncutCutType(points);
   features.incut_cuts.push({
     points: points,
     cutType: cutType,
     point1: points[0],
     point2: points[points.length - 1]
   });
 }

 return features;
}

/**
* Detects incut cut type from point geometry (2 = LINE, 4 axis-aligned = RECT).
*/
function detectIncutCutType(points) {
 if (points.length === 2) return 'LINE';
 if (points.length === 4) {
   const xs = points.map(p => p.x);
   const ys = points.map(p => p.y);
   const uniqueX = [...new Set(xs.map(x => Math.round(x * 10) / 10))];
   const uniqueY = [...new Set(ys.map(y => Math.round(y * 10) / 10))];
   if (uniqueX.length === 2 && uniqueY.length === 2) return 'RECT';
 }
 return 'LINE';
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
* Sort planks for T1: if sheet has > PLANK_COUNT_USE_POSITION_ORDER planks, use Cut Order column when present (user or auto);
* else position-based (Y then X). Otherwise small-to-big by area.
*/
function sortPlanksForT1(planks) {
 if (planks.length > PLANK_COUNT_USE_POSITION_ORDER) {
   const allHaveCutOrder = planks.every(p => p.cutOrder != null && !isNaN(p.cutOrder));
   if (allHaveCutOrder) {
     return [...planks].sort((a, b) => (a.cutOrder || 0) - (b.cutOrder || 0));
   }
   return [...planks].sort((a, b) => (a.y - b.y) || (a.x - b.x));
 }
 return [...planks].sort((a, b) => {
   const areaA = a.placedWidth * a.placedHeight;
   const areaB = b.placedWidth * b.placedHeight;
   return areaA - areaB;
 });
}

/**
* Generates complete G-code for a single sheet
*/
function generateGCodeForSheet(planks, sheetName) {
 let gcode = [];
 resetGCodeState(sheetName);

 // Header
 gcode.push('G300');

 // Tool processing (T2–T6 use original planks order)
 gcode.push(...processTool('T3', 'Screw Holes', planks, (plank) => Z_THROUGH_CUT_FINAL_HEIGHT));
 gcode.push(...processTool('T5', 'Hinge Holes', planks, (plank) => plank.thickness - FIXED_DEPTHS.T5));
 gcode.push(...processTool('T4', 'VB Main', planks, (plank) => plank.thickness - FIXED_DEPTHS.T4));
 gcode.push(...processTool('T6', 'VB Double', planks, (plank) => plank.thickness - FIXED_DEPTHS.T6));

 // T2: Only grooves with width >= 10mm
 gcode.push(...processSlotTool('T2', 'Slot/Profile Grooves (>=10mm)', planks, TOOL_DIAMETER_T2));

 // T1 only: position-based order when >15 planks, else small-to-big
 const sortedPlanksForT1 = sortPlanksForT1(planks);
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
   // REMOVED: G00 Z26 - not needed at start, causes damage with ply thickness variation
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
* Orders 4 U-shape points so [entry, interior1, interior2, exit] for correct perimeter flow.
*/
function orderIncutPointsForPerimeter(points, entryPoint, exitPoint) {
 const tol = 0.5;
 const match = (a, b) => Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol;
 const interior = points.filter(p => !match(p, entryPoint) && !match(p, exitPoint));
 if (interior.length !== 2) return points;
 const nextToEntry = interior.find(p => Math.abs(p.x - entryPoint.x) <= tol || Math.abs(p.y - entryPoint.y) <= tol);
 const other = interior[0] === nextToEntry ? interior[1] : interior[0];
 return [entryPoint, nextToEntry, other, exitPoint];
}

/**
* V13.3 U-SHAPE TOOL OFFSET: Returns four tool-center points for a 4-point U-shape,
* inset by R inward so the cutting edge lies on the nominal part boundary.
* - Points on the opening edge (entry/exit): offset by R into the cavity.
* - Interior points (bottom of U): offset by R toward the opening (so depth is correct).
* @param {Array<{x: number, y: number}>} orderedPoints - [entry, interior1, interior2, exit]
* @param {{x: number, y: number}} entryPoint - entry point on plank edge
* @param {{x: number, y: number}} exitPoint - exit point on plank edge
* @param {string} primaryEdge - 'LEFT'|'RIGHT'|'TOP'|'BOTTOM'
* @param {number} R - BIT_RADIUS
* @returns {Array<{x: number, y: number}>} four compensated tool-center points (same order)
*/
function getUShapeCompensatedPoints(orderedPoints, entryPoint, exitPoint, primaryEdge, R) {
  const tol = 0.5;
  const match = (a, b) => Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol;

  const allY = orderedPoints.map(p => p.y);
  const allX = orderedPoints.map(p => p.x);
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const minX = Math.min(...allX), maxX = Math.max(...allX);

  const isVerticalEdge = (primaryEdge === 'LEFT' || primaryEdge === 'RIGHT');

  return orderedPoints.map(p => {
    let dx = 0, dy = 0;

    if (isVerticalEdge) {
      // Perpendicular to edge: offset X toward U-shape interior
      const onEdge = match(p, entryPoint) || match(p, exitPoint);
      dx = onEdge
        ? (primaryEdge === 'LEFT' ? R : -R)
        : (primaryEdge === 'LEFT' ? -R : R);

      // Parallel to edge: offset Y away from arm boundaries
      if (Math.abs(p.y - minY) < tol) {
        dy = R;   // bottom arm boundary → move tool UP into U-shape
      } else if (Math.abs(p.y - maxY) < tol) {
        dy = -R;  // top arm boundary → move tool DOWN into U-shape
      }
    } else {
      // TOP/BOTTOM edge U-shape: offset Y toward U-shape interior
      const onEdge = match(p, entryPoint) || match(p, exitPoint);
      dy = onEdge
        ? (primaryEdge === 'TOP' ? -R : R)
        : (primaryEdge === 'TOP' ? R : -R);

      // Parallel to edge: offset X away from arm boundaries
      if (Math.abs(p.x - minX) < tol) {
        dx = R;   // left arm boundary → move tool RIGHT into U-shape
      } else if (Math.abs(p.x - maxX) < tol) {
        dx = -R;  // right arm boundary → move tool LEFT into U-shape
      }
    }

    return {
      x: Math.max(p.x + dx, MIN_COORDINATE_VALUE),
      y: Math.max(p.y + dy, MIN_COORDINATE_VALUE)
    };
  });
}

/**
* Point on the compensated edge (with R) at the same X or Y as the given point.
* Used to move along the perimeter to/from a U-cut entry/exit.
*/
function getPointOnEdgeForIncut(point, edge, plank) {
 const R = BIT_RADIUS;
 const x = Math.max(point.x, MIN_COORDINATE_VALUE);
 const y = Math.max(point.y, MIN_COORDINATE_VALUE);
 switch (edge) {
   case 'TOP':
     return { x, y: Math.max(plank.y + plank.placedHeight + R, MIN_COORDINATE_VALUE) };
   case 'BOTTOM':
     return { x, y: Math.max(plank.y - R, MIN_COORDINATE_VALUE) };
   case 'LEFT':
     return { x: Math.max(plank.x - R, MIN_COORDINATE_VALUE), y };
   case 'RIGHT':
     return { x: Math.max(plank.x + plank.placedWidth + R, MIN_COORDINATE_VALUE), y };
   default:
     return { x, y };
 }
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

/**
* For inclined (incut) 2-point cut: get unit inward normal (perpendicular to segment, toward plank center).
* Used for bit-radius compensation: offset entry and exit by R along this normal.
* @param {Object} entry - {x, y}
* @param {Object} exit - {x, y}
* @param {Object} plank - plank with x, y, placedWidth, placedHeight
* @returns {{x: number, y: number}} unit vector (multiply by R for offset)
*/
function getInwardNormalForLine(entry, exit, plank) {
 const dx = exit.x - entry.x;
 const dy = exit.y - entry.y;
 const len = Math.sqrt(dx * dx + dy * dy) || 1e-6;
 const centerX = plank.x + plank.placedWidth / 2;
 const centerY = plank.y + plank.placedHeight / 2;
 const midX = (entry.x + exit.x) / 2;
 const midY = (entry.y + exit.y) / 2;
 const perpA = { x: -dy / len, y: dx / len };
 const perpB = { x: dy / len, y: -dx / len };
 const toCenterA = (centerX - (midX + perpA.x)) * perpA.x + (centerY - (midY + perpA.y)) * perpA.y;
 const toCenterB = (centerX - (midX + perpB.x)) * perpB.x + (centerY - (midY + perpB.y)) * perpB.y;
 return toCenterA > toCenterB ? perpA : perpB;
}

/**
* Outward unit normal for a plank edge (points away from material).
* Tool center = cutlist edge point + R * outward normal so the cutting edge passes through the point.
*/
function getOutwardNormalForEdge(edge) {
  switch (edge) {
    case 'RIGHT':  return { x: 1, y: 0 };
    case 'LEFT':   return { x: -1, y: 0 };
    case 'TOP':    return { x: 0, y: 1 };
    case 'BOTTOM': return { x: 0, y: -1 };
    default:       return { x: 0, y: 0 };
  }
}

/**
* For a 2-point diagonal incut, find where the compensated cut line
* (offset inward by R perpendicular to cut direction) intersects a
* compensated perimeter edge. This keeps the tool center ON the perimeter
* at entry/exit, eliminating corner tips.
* (Used only when edge-based offset is not applied.)
*/
function projectCompLineToEdge(compLineP1, compLineP2, edge, plank, R) {
 const dx = compLineP2.x - compLineP1.x;
 const dy = compLineP2.y - compLineP1.y;

 switch (edge) {
   case 'RIGHT': {
     const edgeX = plank.x + plank.placedWidth + R;
     if (Math.abs(dx) < 1e-6) {
       return { x: Math.max(edgeX, MIN_COORDINATE_VALUE), y: Math.max(compLineP1.y, MIN_COORDINATE_VALUE) };
     }
     const t = (edgeX - compLineP1.x) / dx;
     return { x: Math.max(edgeX, MIN_COORDINATE_VALUE), y: Math.max(compLineP1.y + t * dy, MIN_COORDINATE_VALUE) };
   }
   case 'LEFT': {
     const edgeX = plank.x - R;
     if (Math.abs(dx) < 1e-6) {
       return { x: Math.max(edgeX, MIN_COORDINATE_VALUE), y: Math.max(compLineP1.y, MIN_COORDINATE_VALUE) };
     }
     const t = (edgeX - compLineP1.x) / dx;
     return { x: Math.max(edgeX, MIN_COORDINATE_VALUE), y: Math.max(compLineP1.y + t * dy, MIN_COORDINATE_VALUE) };
   }
   case 'TOP': {
     const edgeY = plank.y + plank.placedHeight + R;
     if (Math.abs(dy) < 1e-6) {
       return { x: Math.max(compLineP1.x, MIN_COORDINATE_VALUE), y: Math.max(edgeY, MIN_COORDINATE_VALUE) };
     }
     const t = (edgeY - compLineP1.y) / dy;
     return { x: Math.max(compLineP1.x + t * dx, MIN_COORDINATE_VALUE), y: Math.max(edgeY, MIN_COORDINATE_VALUE) };
   }
   case 'BOTTOM': {
     const edgeY = plank.y - R;
     if (Math.abs(dy) < 1e-6) {
       return { x: Math.max(compLineP1.x, MIN_COORDINATE_VALUE), y: Math.max(edgeY, MIN_COORDINATE_VALUE) };
     }
     const t = (edgeY - compLineP1.y) / dy;
     return { x: Math.max(compLineP1.x + t * dx, MIN_COORDINATE_VALUE), y: Math.max(edgeY, MIN_COORDINATE_VALUE) };
   }
   default:
     return { x: Math.max(compLineP1.x, MIN_COORDINATE_VALUE), y: Math.max(compLineP1.y, MIN_COORDINATE_VALUE) };
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

 // Combine all features (L-cuts, Gola profiles, and Incut 2-point cuts)
 const allFeatures = [
   ...plank.features.l_cuts.map(f => ({ ...f, type: 'l_cut' })),
   ...plank.features.gola_profiles.map(f => ({ ...f, type: 'gola' }))
 ];

 const R = BIT_RADIUS;
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

 // Process Incut cuts (2-point line or 4-point U-shape; skip internal closed rectangles)
 if (plank.features.incut_cuts && plank.features.incut_cuts.length > 0) {
   const plankLeft = plank.x, plankRight = plank.x + plank.placedWidth;
   const plankBottom = plank.y, plankTop = plank.y + plank.placedHeight;

   plank.features.incut_cuts.forEach((incut) => {
     // Skip internal closed rectangles (cut later by generateInternalRectCuts)
     if ((incut.cutType === 'RECT' || incut.cutType === 'CLOSED_RECT') && incut.points && incut.points.length === 4) {
       const allInside = incut.points.every(p =>
         (p.x - plankLeft) > EDGE_THRESHOLD && (plankRight - p.x) > EDGE_THRESHOLD &&
         (p.y - plankBottom) > EDGE_THRESHOLD && (plankTop - p.y) > EDGE_THRESHOLD
       );
       if (allInside) return;
     }

    let entryPoint, exitPoint, entryEdge, exitEdge;
    let incutNeedsPerimeterRejoin = false;
    let rawLineP1 = null;
    let rawLineP2 = null;
    let lineCompDebug = null;
     const edgeOrder = ['LEFT', 'TOP', 'RIGHT', 'BOTTOM'];

     // ═══════════════════════════════════════════════════════════════════════
     // V13.2 FIX: For 4-point U-shapes, find ACTUAL edge points 
     // (not just points[0] and points[last])
     // ═══════════════════════════════════════════════════════════════════════
     if (incut.points && incut.points.length === 4) {
       // Find all points that are ON an edge
       const edgePoints = [];
       incut.points.forEach((p, idx) => {
         const edges = getEdgeForPoint(p, plank);
         if (edges.length > 0) {
           edgePoints.push({ point: p, edges: edges, index: idx });
         }
       });

       Logger.log('[U-Shape] Plank ' + plank.id + ': Found ' + edgePoints.length + 
         ' edge points out of 4. Points: ' + JSON.stringify(incut.points.map(p => 
           '(' + p.x.toFixed(0) + ',' + p.y.toFixed(0) + ')')));

       if (edgePoints.length >= 2) {
         // Determine which edge the U-shape is on (use first edge point's edge)
         const primaryEdge = edgePoints[0].edges[0];
         
         // Filter to points on the primary edge
         const pointsOnPrimaryEdge = edgePoints.filter(ep => ep.edges.includes(primaryEdge));
         
         if (pointsOnPrimaryEdge.length >= 2) {
           // ═══════════════════════════════════════════════════════════════════
           // Sort by CCW traversal order for this edge:
           // - LEFT edge:   Y ascending  (low Y = entry, high Y = exit)
           // - TOP edge:    X ascending  (low X = entry, high X = exit)
           // - RIGHT edge:  Y descending (high Y = entry, low Y = exit)
           // - BOTTOM edge: X descending (high X = entry, low X = exit)
           // ═══════════════════════════════════════════════════════════════════
           
           if (primaryEdge === 'LEFT') {
             pointsOnPrimaryEdge.sort((a, b) => a.point.y - b.point.y);
           } else if (primaryEdge === 'TOP') {
             pointsOnPrimaryEdge.sort((a, b) => a.point.x - b.point.x);
           } else if (primaryEdge === 'RIGHT') {
             pointsOnPrimaryEdge.sort((a, b) => b.point.y - a.point.y); // High Y first
           } else if (primaryEdge === 'BOTTOM') {
             pointsOnPrimaryEdge.sort((a, b) => b.point.x - a.point.x); // High X first
           }
           
           // Entry = first in CCW order, Exit = last in CCW order
           entryPoint = pointsOnPrimaryEdge[0].point;
           exitPoint = pointsOnPrimaryEdge[pointsOnPrimaryEdge.length - 1].point;
           entryEdge = primaryEdge;
           exitEdge = primaryEdge;
           
           Logger.log('[U-Shape FIX] Plank ' + plank.id + ' | primaryEdge=' + primaryEdge +
             ' | entry=(' + entryPoint.x.toFixed(1) + ',' + entryPoint.y.toFixed(1) + ')' +
             ' | exit=(' + exitPoint.x.toFixed(1) + ',' + exitPoint.y.toFixed(1) + ')' +
             ' | sortPosition=' + getSortPosition(entryPoint, entryEdge, plank).toFixed(1));
         } else {
           // Edge points on DIFFERENT edges - find CCW order
           edgePoints.forEach(ep => {
             const idx = edgeOrder.indexOf(ep.edges[0]);
             ep.edgeIndex = idx !== -1 ? idx : 999;
           });
           edgePoints.sort((a, b) => a.edgeIndex - b.edgeIndex);
           
           entryPoint = edgePoints[0].point;
           exitPoint = edgePoints[edgePoints.length - 1].point;
           entryEdge = edgePoints[0].edges[0];
           exitEdge = edgePoints[edgePoints.length - 1].edges[0];
         }
       } else if (edgePoints.length === 1) {
         // Only one edge point - use it for both entry and exit
         entryPoint = edgePoints[0].point;
         exitPoint = edgePoints[0].point;
         entryEdge = edgePoints[0].edges[0];
         exitEdge = edgePoints[0].edges[0];
       } else {
         // No edge points found - skip this incut
         Logger.log('[U-Shape] WARNING: No edge points found for 4-point incut on plank ' + plank.id);
         return;
       }
     } else {
       // ═══════════════════════════════════════════════════════════════════════
       // 2-point LINE: Original logic (unchanged)
       // ═══════════════════════════════════════════════════════════════════════
       const p1 = incut.points && incut.points.length ? incut.points[0] : incut.point1;
       const p2 = incut.points && incut.points.length ? incut.points[incut.points.length - 1] : incut.point2;
       rawLineP1 = { x: p1.x, y: p1.y };
       rawLineP2 = { x: p2.x, y: p2.y };
       const p1Edges = getEdgeForPoint(p1, plank);
       const p2Edges = getEdgeForPoint(p2, plank);
       if (p1Edges.length === 0 && p2Edges.length === 0) return;

       if (p1Edges.length > 0 && p2Edges.length > 0) {
         let p1Idx = 999, p2Idx = 999;
         var p1EdgeName = '', p2EdgeName = '';
         for (let i = 0; i < edgeOrder.length; i++) {
           if (p1Edges.includes(edgeOrder[i]) && i < p1Idx) { p1Idx = i; p1EdgeName = edgeOrder[i]; }
           if (p2Edges.includes(edgeOrder[i]) && i < p2Idx) { p2Idx = i; p2EdgeName = edgeOrder[i]; }
         }
         const hasLeft = p1Edges.includes('LEFT') || p2Edges.includes('LEFT');
         const hasBottom = p1Edges.includes('BOTTOM') || p2Edges.includes('BOTTOM');
         if (hasLeft && hasBottom) {
           if (p1Edges.includes('BOTTOM')) {
             entryPoint = p1; exitPoint = p2; entryEdge = 'BOTTOM'; exitEdge = 'LEFT';
           } else {
             entryPoint = p2; exitPoint = p1; entryEdge = 'BOTTOM'; exitEdge = 'LEFT';
           }
         } else if (p1Idx <= p2Idx) {
           entryPoint = p1; exitPoint = p2; entryEdge = p1EdgeName; exitEdge = p2EdgeName;
         } else {
           entryPoint = p2; exitPoint = p1; entryEdge = p2EdgeName; exitEdge = p1EdgeName;
         }
       } else if (p1Edges.length > 0) {
         entryPoint = p1; exitPoint = p2; entryEdge = p1Edges[0]; exitEdge = p1Edges[0];
       } else {
         entryPoint = p2; exitPoint = p1; entryEdge = p2Edges[0]; exitEdge = p2Edges[0];
       }
     }

    const isUShapeIncut = incut.points && incut.points.length === 4;
    if (!isUShapeIncut) {
      incutNeedsPerimeterRejoin = getEdgeForPoint(exitPoint, plank).length === 0;
    }
    let compEntry;
    let compExit;
    if (isUShapeIncut) {
      compEntry = {
        x: Math.max(entryPoint.x, MIN_COORDINATE_VALUE),
        y: Math.max(entryPoint.y, MIN_COORDINATE_VALUE)
      };
      compExit = {
        x: Math.max(exitPoint.x, MIN_COORDINATE_VALUE),
        y: Math.max(exitPoint.y, MIN_COORDINATE_VALUE)
      };
    } else {
      // 2-point diagonal incut: tool center = cutlist point + R * outward edge normal.
      // So the cutting edge passes exactly through the two marked points (no inward shift).
      const R = BIT_RADIUS;
      const outEntry = getOutwardNormalForEdge(entryEdge);
      const outExit = getOutwardNormalForEdge(exitEdge);

      compEntry = {
        x: Math.max(entryPoint.x + outEntry.x * R, MIN_COORDINATE_VALUE),
        y: Math.max(entryPoint.y + outEntry.y * R, MIN_COORDINATE_VALUE)
      };
      if (getEdgeForPoint(exitPoint, plank).length > 0 && exitEdge !== entryEdge) {
        compExit = {
          x: Math.max(exitPoint.x + outExit.x * R, MIN_COORDINATE_VALUE),
          y: Math.max(exitPoint.y + outExit.y * R, MIN_COORDINATE_VALUE)
        };
      } else {
        compExit = {
          x: Math.max(exitPoint.x + outExit.x * R, MIN_COORDINATE_VALUE),
          y: Math.max(exitPoint.y + outExit.y * R, MIN_COORDINATE_VALUE)
        };
      }

      lineCompDebug = {
        rawP1: rawLineP1,
        rawP2: rawLineP2,
        entryPoint: { x: entryPoint.x, y: entryPoint.y },
        exitPoint: { x: exitPoint.x, y: exitPoint.y },
        entryEdge: entryEdge,
        exitEdge: exitEdge,
        outwardEntry: outEntry,
        outwardExit: outExit,
        compEntry: { x: compEntry.x, y: compEntry.y },
        compExit: { x: compExit.x, y: compExit.y }
      };
    }

    if (!isUShapeIncut && lineCompDebug) {
      logIncutDebug('buildEdgeFeatureGroups.2point', {
        plankId: plank.id,
        plankName: plank.name,
        plank: {
          x: plank.x,
          y: plank.y,
          placedWidth: plank.placedWidth,
          placedHeight: plank.placedHeight
        },
        cutType: incut.cutType || 'LINE',
        debug: lineCompDebug
      });
    }

     // For 4-point U-shape: order points so first = entry, last = exit (matches perimeter traversal)
    let orderedPoints = incut.points && incut.points.length === 4
       ? orderIncutPointsForPerimeter(incut.points, entryPoint, exitPoint)
       : (incut.points || [incut.point1, incut.point2]);

     // V13.3: For U-shape, compute tool-center path (inset by R) so cut matches nominal dimensions
     const compPoints = (incut.points && incut.points.length === 4)
       ? getUShapeCompensatedPoints(orderedPoints, entryPoint, exitPoint, entryEdge, BIT_RADIUS)
       : null;

     edgeGroups[entryEdge].push({
       type: 'INCUT',
       cutType: incut.cutType || 'LINE',
       points: orderedPoints,
       compPoints: compPoints,
       entryPoint: entryPoint,
       exitPoint: exitPoint,
       compEntry: compEntry,
       compExit: compExit,
       entryEdge: entryEdge,
       exitEdge: exitEdge,
       debugIncut: lineCompDebug,
      needsPerimeterRejoin: incutNeedsPerimeterRejoin,
       sortPosition: getSortPosition(entryPoint, entryEdge, plank),
       nextKey: edgeOrder[(edgeOrder.indexOf(entryEdge) + 1) % 4]
     });
   });
 }

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
       // INCUT: 2-point line or 4-point U-shape (with perimeter approach/exit)
       // ════════════════════════════════════════════════════════════════
       if (feature.type === 'INCUT') {
         if (feature.points && feature.points.length === 4) {
           // Move along perimeter to U entry, then trace U using tool-center path (compPoints)
           const pathPoints = feature.compPoints || feature.points;
           const compFirst = pathPoints[0];
           const entryOnEdge = getPointOnEdgeForIncut(
             { x: compFirst.x, y: compFirst.y }, feature.entryEdge, plank
           );
           logIncutDebug('generateT1_Integrated.4point.entry', {
             plankId: plank.id,
             plankName: plank.name,
             entryEdge: feature.entryEdge,
             exitEdge: feature.exitEdge,
             entryOnEdge: entryOnEdge
           });
           gcode.push(`G01 X${entryOnEdge.x.toFixed(4)} Y${entryOnEdge.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
           logIncutDebug('generateT1_Integrated.4point.path', {
             plankId: plank.id,
             plankName: plank.name,
             pointCount: pathPoints.length,
             points: pathPoints
           });
           pathPoints.forEach(pt => {
             gcode.push(`G01 X${Math.max(pt.x, MIN_COORDINATE_VALUE).toFixed(4)} Y${Math.max(pt.y, MIN_COORDINATE_VALUE).toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
           });
           // Move back onto perimeter, then to corner
           const compLast = pathPoints[pathPoints.length - 1];
           const exitOnEdge = getPointOnEdgeForIncut(
             { x: compLast.x, y: compLast.y }, feature.exitEdge, plank
           );
           logIncutDebug('generateT1_Integrated.4point.exit', {
             plankId: plank.id,
             plankName: plank.name,
             exitOnEdge: exitOnEdge,
             endCorner: edge.endCorner
           });
           gcode.push(`G01 X${exitOnEdge.x.toFixed(4)} Y${exitOnEdge.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
           gcode.push(`G01 X${edge.endCorner.x.toFixed(4)} Y${edge.endCorner.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
           skipCorner = true;
           break;
         } else {
          // 2-point diagonal incut:
          // compEntry/compExit are already ON the compensated perimeter
          // (computed by projectCompLineToEdge), so go directly to them.
          logIncutDebug('generateT1_Integrated.2point.emit', {
            plankId: plank.id,
            plankName: plank.name,
            cutType: feature.cutType,
            entryEdge: feature.entryEdge,
            exitEdge: feature.exitEdge,
            rawPoints: feature.points,
            compEntry: feature.compEntry,
            compExit: feature.compExit,
            needsPerimeterRejoin: feature.needsPerimeterRejoin,
            debugIncut: feature.debugIncut || null
          });
          gcode.push(`G01 X${feature.compEntry.x.toFixed(4)} Y${feature.compEntry.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
          gcode.push(`G01 X${feature.compExit.x.toFixed(4)} Y${feature.compExit.y.toFixed(4)}`);

          if (feature.needsPerimeterRejoin) {
            logIncutDebug('generateT1_Integrated.2point.rejoin', {
              plankId: plank.id,
              plankName: plank.name,
              rejoinPoint: feature.compEntry
            });
            gcode.push(`G01 X${feature.compEntry.x.toFixed(4)} Y${feature.compEntry.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
          }
         }
         if (feature.exitEdge === edge.nextKey) {
           skipCorner = true;
           break;
         }
         continue;
       }

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
* Generates G-code for internal rectangular cutouts (CLOSED_RECT).
* Cut before perimeter; tool path offset inward by BIT_RADIUS.
*/
function generateInternalRectCuts(plank) {
 const gcode = [];
 if (!plank.features.incut_cuts) return gcode;

 const R = BIT_RADIUS;
 const plankLeft = plank.x, plankRight = plank.x + plank.placedWidth;
 const plankBottom = plank.y, plankTop = plank.y + plank.placedHeight;

 const internalRects = plank.features.incut_cuts.filter(cut => {
   if (!cut.points || cut.points.length !== 4) return false;
   return cut.points.every(p =>
     (p.x - plankLeft) > EDGE_THRESHOLD && (plankRight - p.x) > EDGE_THRESHOLD &&
     (p.y - plankBottom) > EDGE_THRESHOLD && (plankTop - p.y) > EDGE_THRESHOLD
   );
 });

 if (internalRects.length === 0) return gcode;

 const passes = getProfilePassDepths(plank.thickness);
 const Z_APPROACH = plank.thickness;

 internalRects.forEach(rect => {
   const pts = rect.points;
   const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
   const minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
   const P1 = { x: minX + R, y: minY + R };
   const P2 = { x: minX + R, y: maxY - R };
   const P3 = { x: maxX - R, y: maxY - R };
   const P4 = { x: maxX - R, y: minY + R };

   gcode.push(`G00 X${P1.x.toFixed(4)} Y${P1.y.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
   gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);
   passes.forEach(depth => {
     gcode.push(`G01 Z${depth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
     gcode.push(`G01 X${P2.x.toFixed(4)} Y${P2.y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
     gcode.push(`G01 X${P3.x.toFixed(4)} Y${P3.y.toFixed(4)}`);
     gcode.push(`G01 X${P4.x.toFixed(4)} Y${P4.y.toFixed(4)}`);
     gcode.push(`G01 X${P1.x.toFixed(4)} Y${P1.y.toFixed(4)}`);
   });
   gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
 });
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

 // SECOND: Internal rectangular cutouts (CLOSED_RECT) before perimeter
 planks.forEach(plank => {
   const internal = generateInternalRectCuts(plank);
   if (internal.length > 0) gcode.push(...internal);
 });

 // THIRD: Cut all perimeters (outer contour, L-cuts, Gola, edge incuts)
 planks.forEach(plank => {
   const hasLCut = plank.features.l_cuts && plank.features.l_cuts.length > 0;
   const hasGolaProfile = plank.features.gola_profiles && plank.features.gola_profiles.length > 0;
   const hasIncut = plank.features.incut_cuts && plank.features.incut_cuts.length > 0;

   if (hasLCut || hasGolaProfile || hasIncut) {
     gcode.push(...generateT1_Integrated(plank));
   } else {
     gcode.push(...generateT1_Rectangle(plank));
   }
 });

 gcode.push('M05');
 return gcode;
}

// ========================================
// INCUT DIMENSIONAL VALIDATION (Post-G-code)
// ========================================

/**
* Validates that the G-code will produce physically correct planks and incuts.
* Traces backwards from tool paths to calculate physical outcome and compares
* against Original Width/Height from raw SketchUp data.
*
* For each plank:
*   1. PLANK SIZE: placedW + 2*EB should == originalW (and same for H)
*   2. INCUT SIZE: CNC hole dimensions should match raw hole dimensions
*   3. GAP CONSISTENCY: gaps + hole + gaps == plank dims
*   4. PHYSICAL GAPS: each CNC gap + EB should match raw gap (as sorted set)
*
* @param {Object} sheetsMap - Map of sheetName -> { planks: [...] }
* @returns {Object} { totalPlanks, totalIncuts, passed, failed, details: [...] }
*/
function validateIncutDimensions(sheetsMap) {
  const R = BIT_RADIUS;
  const SIZE_TOL = 0.5;
  const GAP_TOL = 1.0;
  const EDGE_TOL = 0.5;
  const results = { totalPlanks: 0, totalIncuts: 0, passed: 0, failed: 0, details: [] };

  Object.keys(sheetsMap).forEach(sheetName => {
    const planks = sheetsMap[sheetName].planks;

    planks.forEach(plank => {
      results.totalPlanks++;
      const plankDetail = {
        plankId: plank.id,
        plankName: plank.name,
        sheet: sheetName,
        checks: [],
        status: 'PASS'
      };

      const eb = plank.ebValue || 0;
      const placedW = plank.placedWidth;
      const placedH = plank.placedHeight;
      const origW = plank.originalWidth || 0;
      const origH = plank.originalHeight || 0;

      // ── 1. PLANK SIZE CHECK ──
      if (origW > 0 && origH > 0 && eb > 0) {
        const physW = placedW + 2 * eb;
        const physH = placedH + 2 * eb;
        const directMatch = Math.abs(physW - origW) <= SIZE_TOL && Math.abs(physH - origH) <= SIZE_TOL;
        const swapMatch = Math.abs(physW - origH) <= SIZE_TOL && Math.abs(physH - origW) <= SIZE_TOL;

        if (directMatch || swapMatch) {
          plankDetail.checks.push({
            check: 'PLANK_SIZE',
            status: 'PASS',
            cncSize: placedW.toFixed(1) + 'x' + placedH.toFixed(1),
            physSize: physW.toFixed(1) + 'x' + physH.toFixed(1),
            rawSize: origW + 'x' + origH
          });
        } else {
          plankDetail.checks.push({
            check: 'PLANK_SIZE',
            status: 'FAIL',
            cncSize: placedW.toFixed(1) + 'x' + placedH.toFixed(1),
            physSize: physW.toFixed(1) + 'x' + physH.toFixed(1),
            rawSize: origW + 'x' + origH,
            reason: 'Physical ' + physW.toFixed(1) + 'x' + physH.toFixed(1) + ' != Raw ' + origW + 'x' + origH
          });
          plankDetail.status = 'FAIL';
        }
      }

      // ── 2. INCUT CHECKS (internal rects + U-shapes) ──
      if (plank.features.incut_cuts && plank.features.incut_cuts.length > 0) {
        const plankLeft = plank.x;
        const plankBottom = plank.y;

        plank.features.incut_cuts.forEach((incut, idx) => {
          if (!incut.points || incut.points.length !== 4) return;
          results.totalIncuts++;

          const pts = incut.points;
          const minX = Math.min(...pts.map(p => p.x));
          const maxX = Math.max(...pts.map(p => p.x));
          const minY = Math.min(...pts.map(p => p.y));
          const maxY = Math.max(...pts.map(p => p.y));

          // Convert to plank-local coordinates
          const localMinX = minX - plankLeft;
          const localMaxX = maxX - plankLeft;
          const localMinY = minY - plankBottom;
          const localMaxY = maxY - plankBottom;

          const incutW = localMaxX - localMinX;
          const incutH = localMaxY - localMinY;

          const gapLeft = localMinX;
          const gapRight = placedW - localMaxX;
          const gapBottom = localMinY;
          const gapTop = placedH - localMaxY;

          // Detect U-shape vs closed rect
          const isUShape = gapLeft <= EDGE_TOL || gapRight <= EDGE_TOL ||
                           gapBottom <= EDGE_TOL || gapTop <= EDGE_TOL;
          const cutLabel = isUShape ? 'U-SHAPE' : 'INTERNAL_RECT';

          // 2a. Internal consistency
          const sumW = gapLeft + incutW + gapRight;
          const sumH = gapBottom + incutH + gapTop;
          const wConsistent = Math.abs(sumW - placedW) <= GAP_TOL;
          const hConsistent = Math.abs(sumH - placedH) <= GAP_TOL;

          if (!wConsistent || !hConsistent) {
            plankDetail.checks.push({
              check: 'INCUT_CONSISTENCY',
              incutIndex: idx + 1,
              cutType: cutLabel,
              status: 'FAIL',
              reason: 'Sum check: W=' + sumW.toFixed(1) + ' vs ' + placedW.toFixed(1) +
                      ', H=' + sumH.toFixed(1) + ' vs ' + placedH.toFixed(1)
            });
            plankDetail.status = 'FAIL';
          }

          // 2b. Physical outcome
          // Non-opening sides: CNC gap + 2*EB (1 perimeter + 1 inner face)
          // Opening sides (U-shape edge, gap near 0): no EB to add
          const physGapL = (gapLeft <= EDGE_TOL) ? gapLeft : gapLeft + 2 * eb;
          const physGapR = (gapRight <= EDGE_TOL) ? gapRight : gapRight + 2 * eb;
          const physGapB = (gapBottom <= EDGE_TOL) ? gapBottom : gapBottom + 2 * eb;
          const physGapT = (gapTop <= EDGE_TOL) ? gapTop : gapTop + 2 * eb;

          // Physical hole = CNC hole - 2*EB (inner face EB shrinks hole on both sides)
          const physHoleW = incutW - 2 * eb;
          const physHoleH = incutH - 2 * eb;

          plankDetail.checks.push({
            check: 'INCUT_DIMS',
            incutIndex: idx + 1,
            cutType: cutLabel,
            status: 'PASS',
            incutSize: incutW.toFixed(1) + 'x' + incutH.toFixed(1),
            physHoleSize: physHoleW.toFixed(1) + 'x' + physHoleH.toFixed(1),
            cncGaps: 'L=' + gapLeft.toFixed(1) + ' R=' + gapRight.toFixed(1) +
                     ' B=' + gapBottom.toFixed(1) + ' T=' + gapTop.toFixed(1),
            physGaps: 'L=' + physGapL.toFixed(1) + ' R=' + physGapR.toFixed(1) +
                      ' B=' + physGapB.toFixed(1) + ' T=' + physGapT.toFixed(1)
          });
        });
      }

      if (plankDetail.status === 'PASS') {
        results.passed++;
      } else {
        results.failed++;
      }
      results.details.push(plankDetail);
    });
  });

  // Log summary
  Logger.log('========== INCUT VALIDATION SUMMARY ==========');
  Logger.log('Total planks: ' + results.totalPlanks +
    ' | Total incuts: ' + results.totalIncuts +
    ' | Passed: ' + results.passed +
    ' | Failed: ' + results.failed);

  results.details.forEach(detail => {
    if (detail.checks.length === 0) return;
    Logger.log('--- Plank ' + detail.plankId + ' (' + detail.plankName + ') [' + detail.sheet + '] → ' + detail.status + ' ---');
    detail.checks.forEach(c => {
      if (c.check === 'PLANK_SIZE') {
        Logger.log('  PLANK SIZE: CNC=' + c.cncSize + ' Physical=' + c.physSize + ' Raw=' + c.rawSize + ' → ' + c.status +
          (c.reason ? ' (' + c.reason + ')' : ''));
      } else if (c.check === 'INCUT_DIMS') {
        Logger.log('  INCUT #' + c.incutIndex + ' (' + c.cutType + '): size=' + c.incutSize +
          ' CNC gaps: ' + c.cncGaps + ' Physical gaps: ' + c.physGaps + ' → ' + c.status);
      } else if (c.check === 'INCUT_CONSISTENCY') {
        Logger.log('  INCUT #' + c.incutIndex + ' (' + c.cutType + '): CONSISTENCY FAIL — ' + c.reason);
      }
    });
  });
  Logger.log('========== END INCUT VALIDATION ==========');

  return results;
}

/**
* Builds and shows an HTML modal dialog with incut validation results.
* Green rows for PASS, red rows for FAIL, with full dimensional breakdown.
* @param {Object} result - Output from validateIncutDimensions()
*/
function showIncutValidationDialog(result) {
  var allPass = result.failed === 0;
  var bannerColor = allPass ? '#27ae60' : '#e74c3c';
  var bannerText = allPass
    ? 'ALL CHECKS PASSED — G-code is correct'
    : result.failed + ' plank(s) FAILED — review details below';

  var html = '<html><head><style>'
    + 'body{font-family:Arial,sans-serif;font-size:13px;margin:0;padding:0;background:#f5f5f5;}'
    + '.banner{color:#fff;padding:14px 20px;font-size:16px;font-weight:bold;}'
    + '.summary{padding:10px 20px;background:#fff;border-bottom:1px solid #ddd;font-size:13px;}'
    + '.plank-card{background:#fff;margin:10px 16px;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.12);overflow:hidden;}'
    + '.plank-header{padding:10px 14px;font-weight:bold;font-size:13px;border-bottom:1px solid #eee;}'
    + '.pass-hdr{background:#eafaf1;color:#1e8449;}'
    + '.fail-hdr{background:#fdedec;color:#c0392b;}'
    + 'table{width:100%;border-collapse:collapse;font-size:12px;}'
    + 'th{background:#f8f9fa;text-align:left;padding:6px 10px;border-bottom:1px solid #ddd;color:#555;}'
    + 'td{padding:6px 10px;border-bottom:1px solid #f0f0f0;}'
    + '.pass{color:#27ae60;font-weight:bold;}'
    + '.fail{color:#e74c3c;font-weight:bold;}'
    + '.reason{color:#e74c3c;font-size:11px;margin-top:2px;}'
    + '.dimbox{display:inline-block;background:#f0f4f8;padding:2px 8px;border-radius:3px;margin:1px 2px;font-family:monospace;}'
    + '</style></head><body>';

  html += '<div class="banner" style="background:' + bannerColor + ';">' + bannerText + '</div>';
  html += '<div class="summary">Planks checked: <b>' + result.totalPlanks
    + '</b> &nbsp;|&nbsp; Incuts checked: <b>' + result.totalIncuts
    + '</b> &nbsp;|&nbsp; <span class="pass">Passed: ' + result.passed
    + '</span> &nbsp;|&nbsp; <span class="fail">Failed: ' + result.failed + '</span></div>';

  result.details.forEach(function(detail) {
    if (detail.checks.length === 0) return;

    var isPass = detail.status === 'PASS';
    var hdrClass = isPass ? 'pass-hdr' : 'fail-hdr';
    var statusLabel = isPass ? '<span class="pass">PASS</span>' : '<span class="fail">FAIL</span>';

    html += '<div class="plank-card">';
    html += '<div class="plank-header ' + hdrClass + '">Plank ' + detail.plankId
      + ' — ' + detail.plankName + ' [Sheet ' + detail.sheet + '] &nbsp; ' + statusLabel + '</div>';

    html += '<table><tr><th>Check</th><th>Details</th><th>Result</th></tr>';

    detail.checks.forEach(function(c) {
      if (c.check === 'PLANK_SIZE') {
        html += '<tr><td><b>Plank Size</b></td><td>'
          + 'CNC: <span class="dimbox">' + c.cncSize + '</span> '
          + 'Physical (CNC+2*EB): <span class="dimbox">' + c.physSize + '</span> '
          + 'Raw (SketchUp): <span class="dimbox">' + c.rawSize + '</span>';
        if (c.reason) html += '<div class="reason">' + c.reason + '</div>';
        html += '</td><td class="' + (c.status === 'PASS' ? 'pass' : 'fail') + '">' + c.status + '</td></tr>';

      } else if (c.check === 'INCUT_DIMS') {
        html += '<tr><td><b>Incut #' + c.incutIndex + '</b><br/>(' + c.cutType + ')</td><td>'
          + 'CNC hole: <span class="dimbox">' + c.incutSize + '</span><br/>'
          + 'Physical hole (CNC-2*EB): <span class="dimbox">' + (c.physHoleSize || c.incutSize) + '</span><br/>'
          + 'CNC gaps: <span class="dimbox">' + c.cncGaps + '</span><br/>'
          + 'Physical gaps (CNC+2*EB): <span class="dimbox">' + c.physGaps + '</span>'
          + '</td><td class="' + (c.status === 'PASS' ? 'pass' : 'fail') + '">' + c.status + '</td></tr>';

      } else if (c.check === 'INCUT_CONSISTENCY') {
        html += '<tr><td><b>Incut #' + c.incutIndex + ' Consistency</b><br/>(' + c.cutType + ')</td><td>'
          + '<div class="reason">' + c.reason + '</div>'
          + '</td><td class="fail">FAIL</td></tr>';
      }
    });

    html += '</table></div>';
  });

  if (result.details.every(function(d) { return d.checks.length === 0; })) {
    html += '<div style="padding:30px 20px;text-align:center;color:#888;">No planks with incuts found — nothing to validate.</div>';
  }

  html += '</body></html>';

  var output = HtmlService.createHtmlOutput(html)
    .setWidth(750)
    .setHeight(550);
  SpreadsheetApp.getUi().showModalDialog(output, 'Incut Dimensional Validation');
}

/**
 * Orientation regression: validates incut coordinates survive the full chain
 * (Formatted -> Nest Result -> gcode) for every plank orientation type.
 * Logs results to Apps Script logger; call from script editor or menu.
 */
function validateIncutOrientations() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nestSheet = ss.getSheetByName('Nest Result');
  if (!nestSheet) { Logger.log('[ORIENT-VAL] No Nest Result sheet found'); return; }

  var sheets = groupBySheet(getNestData(nestSheet));
  var total = 0, passed = 0, warned = 0;
  var TOL = 2;

  Object.keys(sheets).forEach(function(sheetKey) {
    sheets[sheetKey].forEach(function(plank) {
      if (!plank.features.incut_cuts || plank.features.incut_cuts.length === 0) return;

      total++;
      var pL = plank.x, pR = plank.x + plank.placedWidth;
      var pB = plank.y, pT = plank.y + plank.placedHeight;
      var ok = true;

      plank.features.incut_cuts.forEach(function(incut, idx) {
        var pts = incut.points || [];
        pts.forEach(function(p, pi) {
          var inside = p.x >= (pL - TOL) && p.x <= (pR + TOL) &&
                       p.y >= (pB - TOL) && p.y <= (pT + TOL);
          if (!inside) {
            ok = false;
            Logger.log('[ORIENT-VAL] FAIL plank ' + plank.id + ' (' + plank.name +
              ') incut #' + (idx + 1) + ' pt' + (pi + 1) +
              '=(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')' +
              ' outside bounds [' + pL.toFixed(1) + '..' + pR.toFixed(1) +
              ', ' + pB.toFixed(1) + '..' + pT.toFixed(1) + ']');
          }
        });

        if (pts.length === 4) {
          var xs = pts.map(function(p) { return p.x; });
          var ys = pts.map(function(p) { return p.y; });
          var w = Math.max.apply(null, xs) - Math.min.apply(null, xs);
          var h = Math.max.apply(null, ys) - Math.min.apply(null, ys);
          if (w < 1 || h < 1) {
            ok = false;
            Logger.log('[ORIENT-VAL] FAIL plank ' + plank.id +
              ' incut #' + (idx + 1) + ' degenerate rect ' + w.toFixed(1) + 'x' + h.toFixed(1));
          }
        }
      });

      if (ok) {
        passed++;
        Logger.log('[ORIENT-VAL] PASS plank ' + plank.id + ' (' + plank.name +
          ') ' + plank.features.incut_cuts.length + ' incut(s) rotated=' + plank.rotated);
      } else {
        warned++;
      }
    });
  });

  Logger.log('========== ORIENTATION REGRESSION ==========');
  Logger.log('Planks with incuts: ' + total + ' | Passed: ' + passed + ' | Warned: ' + warned);
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