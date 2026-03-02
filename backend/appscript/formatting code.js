/**
 * @OnlyCurrentDoc
 *
 * Formatted Data Generator
 * Version: v8.10 (Level 0 Wall Exclusion)
 *
 * CRITICAL UPDATE:
 * - Level 0 (architectural walls) are now detected and EXCLUDED from formatted data
 * - Walls like "MBR wall", "Kitchen wall", "CBR wall" will NOT get plank_id
 * - Furniture with "wall" in name (e.g., "Wall mount cabinet") are still processed normally
 * - Oversized planks still show as red warning (unchanged behavior)
 */

// =================================================================
// ===================      UI & DIALOGS      ===================
// =================================================================

function showEdgeBindingDialog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName('raw data') || ss.getActiveSheet();

  // Run validation first.
  if (validateOversizedPlanks(rawSheet)) {
    return;
  }

  const rawValues = rawSheet.getDataRange().getValues();
  if (rawValues.length < 2) {
    SpreadsheetApp.getUi().alert("Raw data sheet is empty.");
    return;
  }

  const header = rawValues[0].map(h => String(h).trim());
  const matIdx = findColumnIndexFormatted(header, 'material');

  const materialSet = new Set();
  for (let i = 1; i < rawValues.length; i++) {
    const mat = String(rawValues[i][matIdx] || '').trim();
    if (mat) materialSet.add(mat);
  }
  const materials = Array.from(materialSet).sort();

  const escapeHtml = (unsafe) => {
    const s = String(unsafe || '');
    return s.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
  };

  let htmlString = `
  <html>
    <head>
      <base target="_top">
      <style>
        body { font-family: Arial, sans-serif; padding: 12px; font-size: 13px; color: #222; }
        .row { display:flex; align-items:center; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee; }
        .label { flex:1; margin-right:8px; word-break:break-word; }
        .select-wrap { width:130px; }
        select { padding:6px; width:100%; }
        button { margin-top:12px; width:100%; padding:10px; background:#1976D2; color:#fff; border:none; cursor:pointer; font-weight:bold; }
        button:disabled { background:#999; cursor:not-allowed; }
        h3 { margin:0 0 8px 0; font-size:16px; color:#0b486b; }
        .note { font-size:11px; color:#555; margin-bottom:8px; }
      </style>
    </head>
    <body>
      <h3>Edge Binding Settings</h3>
      <div class="note">Choose EB thickness per material. Applied equally to all 4 sides.</div>
      <form id="ebForm">
  `;

  materials.forEach(mat => {
    const isInner = String(mat).toLowerCase().includes('inner');
    const defaultVal = isInner ? '1' : '2';
    const safeName = escapeHtml(mat);
    htmlString += `
      <div class="row">
        <div class="label">${safeName}</div>
        <div class="select-wrap">
          <select name="${safeName}">
            <option value="0">None (0 mm)</option>
            <option value="0.5">0.5 mm</option>
            <option value="0.8">0.8 mm</option>
            <option value="1" ${defaultVal === '1' ? 'selected' : ''}>1.0 mm</option>
            <option value="1.3" ${defaultVal === '1.3' ? 'selected' : ''}>1.3 mm</option>
            <option value="2" ${defaultVal === '2' ? 'selected' : ''}>2.0 mm</option>
          </select>
        </div>
      </div>
    `;
  });

  htmlString += `
        <button type="button" id="procBtn" onclick="submitForm()">Process Data</button>
        </form>
        <script>
          function submitForm() {
            var form = document.getElementById('ebForm');
            var selects = form.querySelectorAll('select');
            var data = {};
            selects.forEach(function(s) { data[s.name] = s.value; });
            var btn = document.getElementById('procBtn');
            btn.disabled = true;
            btn.innerText = 'Processing...';
            google.script.run
              .withSuccessHandler(function() { google.script.host.close(); })
              .withFailureHandler(function(err) { alert('Error: ' + (err.message || err)); btn.disabled=false; btn.innerText='Try Again'; })
              .processSketchUpData(data);
          }
        </script>
      </body>
    </html>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(htmlString).setWidth(480).setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Edge Binding Settings');
}

function processSketchUpData(ebSettings) {
  try {
    PropertiesService.getDocumentProperties().setProperty('NESTUP_EB_SETTINGS', JSON.stringify(ebSettings || {}));
    formatSketchUpData(ebSettings || null);
  } catch (e) {
    throw new Error('processSketchUpData failed: ' + e.message);
  }
}

// =================================================================
// ===================    VALIDATION & HELPERS    ===================
// =================================================================

function validateOversizedPlanks(sheet) {
  const SHEET_A = 2421;
  const SHEET_B = 1200;
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return false;

  const header = data[0].map(h => String(h).trim());
  const idx = {
    LenX: findColumnIndexFormatted(header, 'LenX'),
    LenY: findColumnIndexFormatted(header, 'LenY'),
    LenZ: findColumnIndexFormatted(header, 'LenZ'),
    entity_name: findColumnIndexFormatted(header, 'entity_name'),
    unit_location: findColumnIndexFormatted(header, 'Unit_location'),
    material: findColumnIndexFormatted(header, 'material')
  };

  // Helper: Convert column index to Letter
  const colName = (n) => {
    let s = "";
    while(n >= 0) {
      s = String.fromCharCode(n % 26 + 65) + s;
      n = Math.floor(n / 26) - 1;
    }
    return s;
  };

  const letName = (idx.entity_name > -1) ? colName(idx.entity_name) : null;
  const letMat  = (idx.material > -1) ? colName(idx.material) : null;
  const letX    = (idx.LenX > -1) ? colName(idx.LenX) : null;
  const letY    = (idx.LenY > -1) ? colName(idx.LenY) : null;
  const letZ    = (idx.LenZ > -1) ? colName(idx.LenZ) : null;

  sheet.getDataRange().setBackground(null);

  const oversizedRanges = [];
  let count = 0;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const rowObj = {
      entity_name: safeCell(row, idx.entity_name),
      unit_location: safeCell(row, idx.unit_location)
    };

    // 1. STRICT LEVEL CHECK
    // If it's Level 0, 1, 3, 100, undefined, null, or 'garbage' -> SKIP.
    // We ONLY process Level 2.
    const level = detectLevel(rowObj);
    if (level !== 2) {
        continue; 
    }

    const lx = parseFloatSafe(safeCell(row, idx.LenX));
    const ly = parseFloatSafe(safeCell(row, idx.LenY));
    const lz = parseFloatSafe(safeCell(row, idx.LenZ));
    const dims = [lx, ly, lz].sort((a, b) => a - b);
    
    // 2. Thickness Guard (Safety Net)
    // Even if it was identified as Level 2, if it's thicker than 50mm,
    // it's likely a mislabeled Box or assembly. Ignore it.
    if (dims[0] > 50) continue;

    const middle = dims[1];
    const largest = dims[2];

    const fitsOrientation1 = (largest <= SHEET_A && middle <= SHEET_B);
    const fitsOrientation2 = (largest <= SHEET_B && middle <= SHEET_A);

    if (!(fitsOrientation1 || fitsOrientation2)) {
      const rowNum = r + 1;
      if (letName) oversizedRanges.push(`${letName}${rowNum}`);
      if (letMat)  oversizedRanges.push(`${letMat}${rowNum}`);
      if (letX)    oversizedRanges.push(`${letX}${rowNum}`);
      if (letY)    oversizedRanges.push(`${letY}${rowNum}`);
      if (letZ)    oversizedRanges.push(`${letZ}${rowNum}`);
      count++;
    }
  }

  if (count > 0) {
    sheet.getRangeList(oversizedRanges).setBackground('#FFCCCC');
    SpreadsheetApp.getUi().alert('⚠️ OVERSIZED PLANKS DETECTED!\n\nFound ' + count + ' oversized items.\nStrictly checked Level 2 only.\n(Ignored Levels 0, 1, 3, 100, etc.)');
    return true;
  }
  return false;
}

function applyEdgeBindingWithSettings(plankName, plankMaterial, initialLength, initialWidth, plankThickness, ebSettings) {
  const name = String(plankName || '').toLowerCase();
  const material = String(plankMaterial || '').trim();

  const escapeHtml = (unsafe) => {
    const s = String(unsafe || '');
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };

  let settings = ebSettings;
  if (!settings) {
    try {
      const raw = PropertiesService.getDocumentProperties().getProperty('NESTUP_EB_SETTINGS') || '{}';
      settings = JSON.parse(raw || '{}');
    } catch (e) {
      settings = {};
    }
  }

  const materialKey = escapeHtml(material);
  let offset = 0;

  if (plankThickness < 14) return { newLength: initialLength, newWidth: initialWidth, offset: 0 };

  if (/\bback\b|back plank|back_panel|back panel/.test(name)) {
    return { newLength: initialLength, newWidth: initialWidth, offset: 0 };
  }

  if (settings && settings.hasOwnProperty(materialKey)) {
    offset = parseFloat(settings[materialKey]);
    if (isNaN(offset) || offset < 0) offset = 0;
  } else {
    offset = 2; // default
  }

  return { 
    newLength: initialLength - (2 * offset), 
    newWidth: initialWidth - (2 * offset), 
    offset 
  };
}

function findColumnIndexFormatted(headerRow, targetName) {
  if (!Array.isArray(headerRow) || headerRow.length === 0) return -1;
  const normalizedTarget = String(targetName).toLowerCase().replace(/[\s_]/g, '');
  for (let i = 0; i < headerRow.length; i++) {
    const normalizedHeader = String(headerRow[i] || '').toLowerCase().replace(/[\s_]/g, '');
    if (normalizedHeader === normalizedTarget) return i;
  }
  return -1;
}

// Ensures a column exists in raw sheet; returns 0-based index
function ensureColumn0(sheet, headerRow, colName) {
  let idx0 = findColumnIndexFormatted(headerRow, colName);
  if (idx0 !== -1) return idx0;

  idx0 = headerRow.length;
  sheet.getRange(1, idx0 + 1).setValue(colName);
  headerRow.push(colName);
  return idx0;
}

/**
 * Detects the level of a row based on entity_name and unit_location.
 * 
 * Level 0: Architectural walls (e.g., "MBR wall", "Kitchen wall", "CBR wall")
 *          - NOT furniture items like "Wall mount cabinet", "Wall shelf"
 * Level 1: Boxes (unit_location contains north/south/east/west)
 * Level 2: Planks (default for everything else)
 * Level 3: Operations (holes, grooves, hinges, L-cuts, etc.)
 */
function detectLevel(obj) {
  const unitLocation = (obj.unit_location || '').toLowerCase();
  const entName = (obj.entity_name || '').toLowerCase();
  
  // Level 1: Boxes (directional location)
  if (/north|south|east|west/.test(unitLocation)) return 1;
  
  // Level 3: Operations (holes, grooves, hardware, L-cuts, Gola profiles, etc.)
  if (/hole|groove|vb|screw|hinge|profile|slot|l_cutting|lcutting|l_cut_start|l_cut_center|l_cut_centre|l_cut_end|lcut_start|lcut_center|lcut_centre|lcut_end|gola_profile_start|gola_profile_center|gola_profile_centre|gola_profile_end|gola_start|gola_center|gola_centre|gola_end/.test(entName)) return 3;
  
  // Level 0: Architectural walls
  // Check if entity name contains "wall" in furniture context (these are SAFE, not Level 0)
  const isFurnitureWithWall = /wall\s*(mount|mounted|cabinet|unit|shelf|hung|panel|hanging|storage|rack)/i.test(entName);
  
  // If it has "wall" but NOT in furniture context → Level 0 (Architectural wall)
  if (!isFurnitureWithWall && /\bwall\b/i.test(entName)) {
    return 0;
  }
  
  // Default: Level 2 (Planks)
  return 2;
}

function detectOperationType(entName) {
  const nameStr = (entName || '').toLowerCase();
  // VB Main variations: vb_main, vbmain, vbmin, vb main, vbm, main_vb, mainvb
  if (/vb_?main|vbmin|vb min|vbm|main_?vb/.test(nameStr)) return 'vb_main';
  // VB Double variations: vb_double, vbdouble, vbd, double_vb, doublevb
  if (/vb_?double|vbd|double_?vb/.test(nameStr)) return 'vb_double';
  if (/hinge|hing/.test(nameStr)) return 'hing';
  if (/screw|bolt|pta/.test(nameStr)) return 'screw';
  
  // Gola profile triplet subtypes - MUST be checked BEFORE generic /profile/ pattern
  if (/gola_profile_start|golaprofile_start|gola_start/.test(nameStr)) return 'gola_profile_start';
  if (/gola_profile_center|golaprofile_center|gola_center/.test(nameStr)) return 'gola_profile_center';
  if (/gola_profile_end|golaprofile_end|gola_end/.test(nameStr)) return 'gola_profile_end';
  
  // Generic profile/slot/groove (after Gola check)
  if (/profile/.test(nameStr)) return 'profile';
  if (/slot/.test(nameStr)) return 'slot';
  if (/groove/.test(nameStr)) return 'groove';
  
  // L-cut triplet subtypes (new architecture)
  // Support both American (center) and British (centre) spellings
  if (/l_cut_start|lcut_start/.test(nameStr)) return 'l_cut_start';
  if (/l_cut_center|l_cut_centre|lcut_center|lcut_centre/.test(nameStr)) return 'l_cut_center';
  if (/l_cut_end|lcut_end/.test(nameStr)) return 'l_cut_end';
  // Legacy L-cut fallback
  if (/l_cutting|lcutting|l_groove/.test(nameStr)) return 'l_cutting_legacy';
  if (/hole|drilled|bore/.test(nameStr)) return 'hole';
  return 'hole';
}

function findMaxOperationCounts(rawValues, idx) {
  const plankOpCounter = {};
  // Track L-cut triplet components per plank
  const plankLCutTripletCounter = {};
  // Track Gola profile triplet components per plank
  const plankGolaProfileCounter = {};
  let currentBox = null;
  let currentPlank = null;
  for (let r = 1; r < rawValues.length; r++) {
    const row = rawValues[r];
    const rowData = parseRowData(row, idx);
    const level = detectLevel(rowData);
    
    // Skip Level 0 (walls)
    if (level === 0) continue;
    
    if (level === 1) {
      currentBox = { box_name: rowData.entity_name };
      currentPlank = null;
    } else if (level === 2) {
      // Pass sheet row index (r + 1) to guarantee unique key per plank
      currentPlank = { key: makePlankKey(currentBox, rowData.entity_name, r + 1) };
    } else if (level === 3 && currentPlank) {
      const opType = detectOperationType(rowData.entity_name);
      if (opType !== 'other') {
        const plankKey = currentPlank.key;
        if (!plankOpCounter[plankKey]) plankOpCounter[plankKey] = {};
        
        // Track L-cut triplet components separately
        if (opType === 'l_cut_start' || opType === 'l_cut_center' || opType === 'l_cut_end') {
          if (!plankLCutTripletCounter[plankKey]) {
            plankLCutTripletCounter[plankKey] = { starts: 0, centers: 0, ends: 0 };
          }
          if (opType === 'l_cut_start') plankLCutTripletCounter[plankKey].starts++;
          else if (opType === 'l_cut_center') plankLCutTripletCounter[plankKey].centers++;
          else if (opType === 'l_cut_end') plankLCutTripletCounter[plankKey].ends++;
        } 
        // Track Gola profile triplet components separately
        else if (opType === 'gola_profile_start' || opType === 'gola_profile_center' || opType === 'gola_profile_end') {
          if (!plankGolaProfileCounter[plankKey]) {
            plankGolaProfileCounter[plankKey] = { starts: 0, centers: 0, ends: 0 };
          }
          if (opType === 'gola_profile_start') plankGolaProfileCounter[plankKey].starts++;
          else if (opType === 'gola_profile_center') plankGolaProfileCounter[plankKey].centers++;
          else if (opType === 'gola_profile_end') plankGolaProfileCounter[plankKey].ends++;
        } else {
          plankOpCounter[plankKey][opType] = (plankOpCounter[plankKey][opType] || 0) + 1;
        }
      }
    }
  }
  const maxCounts = {};
  for (const plankKey in plankOpCounter) {
    for (const opType in plankOpCounter[plankKey]) {
      const count = plankOpCounter[plankKey][opType];
      if (!maxCounts[opType] || count > maxCounts[opType]) {
        maxCounts[opType] = count;
      }
    }
  }
  
  // Calculate max L-cut triplets: min(starts, centers, ends) per plank, then max across planks
  let maxLCutTriplets = 0;
  for (const plankKey in plankLCutTripletCounter) {
    const tripletData = plankLCutTripletCounter[plankKey];
    const completeTriplets = Math.min(tripletData.starts, tripletData.centers, tripletData.ends);
    if (completeTriplets > maxLCutTriplets) {
      maxLCutTriplets = completeTriplets;
    }
  }
  maxCounts.l_cut = maxLCutTriplets;
  
  // Calculate max Gola profile triplets: min(starts, centers, ends) per plank, then max across planks
  let maxGolaProfileTriplets = 0;
  for (const plankKey in plankGolaProfileCounter) {
    const tripletData = plankGolaProfileCounter[plankKey];
    const completeTriplets = Math.min(tripletData.starts, tripletData.centers, tripletData.ends);
    if (completeTriplets > maxGolaProfileTriplets) {
      maxGolaProfileTriplets = completeTriplets;
    }
  }
  maxCounts.gola_profile = maxGolaProfileTriplets;
  
  return maxCounts;
}

function getPlankType(plankName) {
  const name = (plankName || '').toLowerCase();
  if (/left|right|vertical|maindummy|middle/.test(name)) return 'vertical';
  if (/door|back|skirting|drawfacia|drawfront|drawback|drawdummy|draw|dummy|tandemback/.test(name)) return 'face';
  if (/top|bottom|shelf|tandembottom/.test(name)) return 'horizontal';
  return 'auto';
}

function calculateTransformedDimensions(rowData, orientation, plankType) {
  const { LenX, LenY, LenZ } = rowData;
  if (orientation === 'EW' || orientation === 'NS') {
    if (plankType === 'horizontal') return { length: LenX, width: LenY, thickness: LenZ };
    if (plankType === 'vertical') return { length: LenZ, width: LenY, thickness: LenX };
    if (plankType === 'face') return { length: LenZ, width: LenX, thickness: LenY };
  }
  const dims = [LenX, LenY, LenZ].sort((a, b) => a - b);
  return { thickness: dims[0], width: dims[1], length: dims[2] };
}

// =================================================================
// ===================    TRANSFORM COORDINATES   ==================
// =================================================================

/**
 * PURE AXIS FLATTENING for L-cuts and Gola cuts.
 * 
 * L-cuts and Gola cuts are ordered triplets (start → center → end) that define
 * a directional CNC path. They must NOT receive:
 *   - EB offset
 *   - Mirroring
 *   - Clamping
 *   - Independent rotation
 * 
 * The ONLY transformation applied here is 3D→2D axis flattening based on plank type.
 * All other transforms happen ONCE during sheet placement in Cutlist.js.
 * 
 * @param {Object} rowData - Raw coordinate data from SketchUp
 * @param {string} plankType - 'horizontal', 'vertical', or 'auto'
 * @returns {Object} - { faceX, faceY } in plank-local 2D coordinates
 */
function flattenLCutCoordinates(rowData, plankType) {
  const { X: rawX, Y: rawY, Z: rawZ } = rowData;
  
  let faceX, faceY;
  
  if (plankType === 'horizontal') {
    // Horizontal planks: Face is X × Y plane, thickness along Z
    // Face X = SketchUp Y, Face Y = SketchUp X
    faceX = rawY;
    faceY = rawX;
  } else if (plankType === 'vertical') {
    // Vertical planks: Face is Y × Z plane, thickness along X
    // Face X = SketchUp Y, Face Y = SketchUp Z
    faceX = rawY;
    faceY = rawZ;
  } else {
    // Default (auto/face): Face is X × Y plane
    // Face X = SketchUp X, Face Y = SketchUp Y
    faceX = rawX;
    faceY = rawY;
  }
  
  return { faceX, faceY };
}

function transformCoordinates(rowData, currentBox, plankName, plankType, opType, plankThickness, plankOffset, finalPlankWidth) {
  const { X: rawX, Y: rawY, Z: rawZ, LenX, LenY, LenZ } = rowData;

  let rawFaceX, rawFaceY, rawFaceDimL, rawFaceDimW;
  let startZ;

  // 1. DETERMINE MAPPING
  // L-cut and Gola profile boundary points define the plank's notch shape on the 2D face.
  // The key difference: L-cuts/Gola profiles use actual surface coordinates, not depth.
  const lCutOpTypes = ['l_cut_start', 'l_cut_center', 'l_cut_end'];
  const golaProfileOpTypes = ['gola_profile_start', 'gola_profile_center', 'gola_profile_end'];
  const isLCut = lCutOpTypes.includes(opType) || golaProfileOpTypes.includes(opType);
  
  if (plankType === 'horizontal') {
    // Horizontal planks: Face is X × Y, thickness along Z
    // Mapping: Face X corresponds to raw Y (along width), Face Y to raw X (along length)
    rawFaceX = rawY;
    rawFaceY = rawX;
    rawFaceDimL = LenX;
    rawFaceDimW = LenY;
    startZ = LenZ;
  } else if (plankType === 'vertical') {
    // Vertical planks: Face is Y (width) × Z (height), thickness along X
    // Face X = SketchUp Y, Face Y = SketchUp Z (for both L-cuts and features)
    rawFaceX = rawY;
    rawFaceY = rawZ;  // Always use Z for vertical plank face Y coordinate
    rawFaceDimL = LenZ;
    rawFaceDimW = LenY;
    startZ = LenX;
  } else {
    // Default (auto): Face is X × Y (for L-cuts) or X × Z (for features)
    // L-cuts use actual surface Y, features use depth Z
    rawFaceX = rawX;
    rawFaceY = isLCut ? rawY : rawZ;
    rawFaceDimL = LenX;
    rawFaceDimW = isLCut ? LenY : LenZ;
    startZ = isLCut ? LenZ : LenY;
  }

  // Normalize offset
  let offset = Number(plankOffset);
  if (isNaN(offset) || offset < 0) offset = 0;

  // 2. APPLY EDGE BINDING OFFSET (GLOBAL)
  if (offset > 0) {
    rawFaceX -= offset;
    rawFaceY -= offset;
  }

  // 3. CALCULATE OUTPUT COORDINATES
  let transformedX, transformedY, finalZ;
  let startX = null, startY = null, startZ_out = null;

  const grooveTokens = ['groove', 'slot', 'profile', 'l_groove', 'l_cutting'];

  if (grooveTokens.includes(opType)) {
    startX = rawFaceX; 
    startY = rawFaceY + offset; 
    startZ_out = startZ;
    transformedX = rawFaceDimL;
    transformedY = rawFaceDimW;
    finalZ = startZ_out;
  } else {
    transformedX = rawFaceX;
    transformedY = rawFaceY;
    switch (opType) {
      case 'hing': finalZ = 14; break;
      case 'vb_main': finalZ = 16; break;
      case 'vb_double': finalZ = 11; break;
      default: finalZ = plankThickness || 0; break;
    }
  }

  const pName = (plankName || '').toLowerCase();
  const shouldMirror = (
    pName.includes('right') ||
    pName.includes('bottom') ||
    pName.includes('door')
  );

  if (shouldMirror) {
    if (startX !== null) {
      startX = finalPlankWidth - startX;
    } else {
      transformedX = finalPlankWidth - transformedX;
    }
  }

  return { transformedX, transformedY, finalZ, startX, startY, startZ: startZ_out };
}

// =================================================================
// ===================    PARSING & FORMATTING    =================
// =================================================================

function parseRowData(row, idx) {
  return {
    entity_name:   safeCell(row, idx.entity_name),
    unit_location: safeCell(row, idx.unit_location),
    material:      safeCell(row, idx.material),
    LenX:          parseFloatSafe(safeCell(row, idx.LenX)),
    LenY:          parseFloatSafe(safeCell(row, idx.LenY)),
    LenZ:          parseFloatSafe(safeCell(row, idx.LenZ)),
    X:             parseFloatSafe(safeCell(row, idx.X)),
    Y:             parseFloatSafe(safeCell(row, idx.Y)),
    Z:             parseFloatSafe(safeCell(row, idx.Z)),
    room_name:     safeCell(row, idx.room_name)
  };
}

function getBoxOrientation(unitLocation) {
  const lower = (unitLocation || '').toLowerCase();
  if (lower.includes('north') || lower.includes('south')) return 'NS';
  if (lower.includes('east') || lower.includes('west')) return 'EW';
  return 'N/A';
}

function extractHardwareColumns(headers) {
  const hardwareColumns = [];
  headers.forEach((header) => {
    const h = String(header || '').trim();
    if (h.includes('_q')) {
      const mat = h.split('_q').filter(p => p.trim()).pop() || `hw_${hardwareColumns.length+1}`;
      hardwareColumns.push({ originalName: h, material: mat.replace(/[^a-zA-Z0-9_]/g, '_') });
    }
  });
  return hardwareColumns;
}

function makePlankKey(boxObj, plankName, rowIndex) {
  // Use row index to guarantee uniqueness - each plank is on a unique row
  // Box names may repeat across different locations, so we can't rely on them alone
  const boxName = boxObj && boxObj.box_name ? boxObj.box_name : '(no_box)';
  return `${boxName}||${plankName}||row${rowIndex}`;
}

function safeCell(row, i) { return (i === -1) ? '' : (row[i] || ''); }
function parseFloatSafe(v) { const n = parseFloat(String(v).replace(/[^0-9eE.\-]/g, '')); return isNaN(n) ? 0 : n; }
function formatCoordinate(value) { if (typeof value !== 'number' || isNaN(value)) return ''; return `${Math.round(value * 10) / 10}`; }
function showToast(m, t, s) { SpreadsheetApp.getActiveSpreadsheet().toast(m, t || 'Status', s || 3); }
function showAlert(m) { SpreadsheetApp.getUi().alert(m); }

function formatOutputSheet(sheet, numColumns) {
  if (numColumns > 0) {
    sheet.autoResizeColumns(1, Math.min(8, numColumns));
    sheet.getRange(1, 1, sheet.getMaxRows(), numColumns).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP).setVerticalAlignment('top');
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, numColumns).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
    }
  }
}

// ---------------------- MAIN PROCESSOR ----------------------

function formatSketchUpData(ebSettings) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rawSheet = ss.getSheetByName('raw data') || ss.getActiveSheet();
    const outName = 'Formatted_Plank_Data';
    let outSheet = ss.getSheetByName(outName);

    if (outSheet) { outSheet.clear(); } else { outSheet = ss.insertSheet(outName); }

    showToast('Reading raw data...', 'In Progress', 5);
    const rawValues = rawSheet.getDataRange().getValues();
    if (rawValues.length < 2) throw new Error(`Raw data sheet "${rawSheet.getName()}" is empty.`);

    const header = rawValues[0].map(h => String(h).trim());

    // --- SETUP FOR ID WRITEBACK ---
    const plankIdIdx0 = ensureColumn0(rawSheet, header, 'plank_id');
    const plankIdCol1 = plankIdIdx0 + 1;

    const idx = {
      entity_name:   findColumnIndexFormatted(header, 'entity_name'), 
      unit_location: findColumnIndexFormatted(header, 'Unit_location'),
      material:      findColumnIndexFormatted(header, 'material'),    
      LenX:          findColumnIndexFormatted(header, 'LenX'),
      LenY:          findColumnIndexFormatted(header, 'LenY'),        
      LenZ:          findColumnIndexFormatted(header, 'LenZ'),
      X:             findColumnIndexFormatted(header, 'X'),           
      Y:             findColumnIndexFormatted(header, 'Y'),
      Z:             findColumnIndexFormatted(header, 'Z'),           
      room_name:     findColumnIndexFormatted(header, 'Room_name'),
      box_type:      findColumnIndexFormatted(header, 'Box_Type'),  
      box_model:     findColumnIndexFormatted(header, 'Box_Model')  
    };

    const requiredCols = ['entity_name', 'unit_location', 'material', 'LenX', 'LenY', 'LenZ', 'X', 'Y', 'Z'];
    const missing = requiredCols.filter(col => idx[col] === -1);
    if (missing.length > 0) throw new Error('Missing required columns: ' + missing.join(', ') + '.');

    showToast('Pre-scanning for operations...', 'In Progress', 10);
    const maxOpCounts = findMaxOperationCounts(rawValues, idx);

    const hardwareColumns = extractHardwareColumns(header);
    const hardwareHeader = hardwareColumns.map(hc => hc.material);
    
    const baseHeader = [
      'room_name', 
      'box_type', 
      'box_model', 
      'box_orientation', 
      'box_name', 
      'plank_name', 
      'plank_id', 
      'plank_length', 
      'plank_width', 
      'plank_thickness', 
      'plank_material', 
      'EB_Value'
    ];
    
    // Standard operation types (excluding L-cut which uses triplet architecture)
    const operationTypes = ['hing', 'screw', 'vb_main', 'vb_double', 'profile', 'slot', 'groove', 'hole'];
    let dynamicOpHeader = [];
    
    operationTypes.forEach(opType => {
      const maxCount = maxOpCounts[opType] || 0;
      for (let i = 1; i <= maxCount; i++) {
        const baseName = `${opType}_${i}`;
        if (['profile','slot','groove'].includes(opType)) {
          dynamicOpHeader.push(`${baseName}_X`, `${baseName}_Y`, `${baseName}_Z`, `${baseName}_length`, `${baseName}_width`);
        } else {
          dynamicOpHeader.push(`${baseName}_X`, `${baseName}_Y`, `${baseName}_Z`);
        }
      }
    });
    
    // Add L-cut triplet headers (new architecture)
    // For each L-cut triplet: start(X,Y), center(X,Y), end(X,Y)
    const maxLCutCount = maxOpCounts.l_cut || 0;
    for (let i = 1; i <= maxLCutCount; i++) {
      dynamicOpHeader.push(
        `L_cut_${i}_start_X`, `L_cut_${i}_start_Y`,
        `L_cut_${i}_center_X`, `L_cut_${i}_center_Y`,
        `L_cut_${i}_end_X`, `L_cut_${i}_end_Y`
      );
    }
    
    // Add Gola profile triplet headers
    // For each Gola profile triplet: start(X,Y), center(X,Y), end(X,Y)
    const maxGolaProfileCount = maxOpCounts.gola_profile || 0;
    for (let i = 1; i <= maxGolaProfileCount; i++) {
      dynamicOpHeader.push(
        `Gola_profile_${i}_start_X`, `Gola_profile_${i}_start_Y`,
        `Gola_profile_${i}_center_X`, `Gola_profile_${i}_center_Y`,
        `Gola_profile_${i}_end_X`, `Gola_profile_${i}_end_Y`
      );
    }
    
    // Also add legacy l_cutting columns for backward compatibility
    const maxLegacyLCut = maxOpCounts.l_cutting_legacy || 0;
    for (let i = 1; i <= maxLegacyLCut; i++) {
      dynamicOpHeader.push(`l_cutting_${i}_X`, `l_cutting_${i}_Y`, `l_cutting_${i}_Z`);
    }
    
    const outHeader = baseHeader.concat(dynamicOpHeader, hardwareHeader, ['notes']);
    const outHeaderMap = outHeader.reduce((acc, h, i) => { acc[h] = i + 1; return acc; }, {});

    outSheet.getRange(1, 1, 1, outHeader.length).setValues([outHeader]).setFontWeight('bold');
    outSheet.setFrozenRows(1);

    showToast('Processing all components...', 'In Progress', 15);
    let currentBox = null;
    let currentPlank = null;
    const plankRowMap = {};
    const plankOpsCounters = {};
    const plankThicknessMap = {};
    const plankOffsetMap = {};
    let outRowPtr = 2;
    
    // L-cut triplet collector: stores {starts: [{x,y}], centers: [{x,y}], ends: [{x,y}]} per plank
    const plankLCutCollector = {};
    
    // Gola profile triplet collector: stores {starts: [{x,y}], centers: [{x,y}], ends: [{x,y}]} per plank
    const plankGolaProfileCollector = {};

    // --- ID GENERATION STATE ---
    const rawPlankIdCol = rawSheet.getRange(2, plankIdCol1, rawValues.length - 1, 1).getValues();
    let lastSequentialId = null;
    
    // Track Level 0 (walls) for logging
    let level0Count = 0;

    for (let r = 1; r < rawValues.length; r++) {
      const row = rawValues[r];
      const rowData = parseRowData(row, idx);
      const level = detectLevel(rowData);

      // ============================================================
      // LEVEL 0: Architectural walls - SKIP completely
      // ============================================================
      if (level === 0) {
        level0Count++;
        // Don't assign plank_id to walls - leave empty or clear existing
        rawPlankIdCol[r - 1][0] = '';
        continue; // Skip to next row - wall won't appear in formatted data
      }

      if (level === 1) {
        currentBox = {
          box_name: rowData.entity_name || `Box_${r + 1}`,
          orientation: getBoxOrientation(rowData.unit_location),
          room_name: rowData.room_name || '',
          box_type: safeCell(row, idx.box_type), 
          box_model: safeCell(row, idx.box_model)
        };
        currentPlank = null;
        continue;
      }

      if (level === 2) {
        if (!currentBox) continue;
        const plank_name = rowData.entity_name || `Component_${r + 1}`;
        const plankType = getPlankType(plank_name);
        const dims = calculateTransformedDimensions(rowData, currentBox.orientation, plankType);
        
        // Pass row index (r) to guarantee unique key per plank
        const plankKey = makePlankKey(currentBox, plank_name, r + 1);
        plankThicknessMap[plankKey] = dims.thickness;
        
        const materialRaw = rowData.material || '';
        const edgeBinding = applyEdgeBindingWithSettings(
          plank_name, materialRaw, dims.length, dims.width, dims.thickness, ebSettings
        );
        
        plankOffsetMap[plankKey] = edgeBinding.offset;

        // ==========================================================
        // SEQUENTIAL plank_id 
        // ==========================================================
        const existingRawIdStr = String(row[plankIdIdx0] || '').trim();
        const existingRawIdNum = parseInt(existingRawIdStr, 10);

        let currentPlankIdNum;
        if (lastSequentialId === null) {
          currentPlankIdNum = (!isNaN(existingRawIdNum) && existingRawIdNum > 0) ? existingRawIdNum : 1;
        } else {
          currentPlankIdNum = lastSequentialId + 1;
        }

        lastSequentialId = currentPlankIdNum;
        const currentPlankId = String(currentPlankIdNum);

        rawPlankIdCol[r - 1][0] = currentPlankId;
        // ==========================================================
        
        const finalMaterial = materialRaw ? `${materialRaw} (${currentBox.room_name})` : currentBox.room_name;

        let outRow = Array(outHeader.length).fill('');
        
        const baseRowData = [
          currentBox.room_name, 
          currentBox.box_type, 
          currentBox.box_model,
          currentBox.orientation, 
          currentBox.box_name,
          plank_name, 
          currentPlankId, 
          edgeBinding.newLength, 
          edgeBinding.newWidth, 
          dims.thickness,
          finalMaterial,
          edgeBinding.offset
        ];
        
        outRow.splice(0, baseRowData.length, ...baseRowData);

        hardwareColumns.forEach(hc => {
          const hardwareColIdx = findColumnIndexFormatted(header, hc.originalName);
          if (hardwareColIdx !== -1) {
            const colIndex = outHeaderMap[hc.material];
            if (colIndex) outRow[colIndex - 1] = safeCell(row, hardwareColIdx) || '0';
          }
        });

        outSheet.getRange(outRowPtr, 1, 1, outRow.length).setValues([outRow]);
        plankRowMap[plankKey] = outRowPtr;
        
        currentPlank = { 
          name: plank_name, 
          key: plankKey, 
          type: plankType,
          finalWidth: edgeBinding.newWidth,
          finalLength: edgeBinding.newLength
        };
        outRowPtr++;
        continue;
      }

      if (level === 3) {
        if (!currentPlank || !currentBox) continue;
        const opType = detectOperationType(rowData.entity_name);
        if (opType === 'other') continue;

        const plankKey = currentPlank.key;
        const plankOffset = plankOffsetMap[plankKey] || 0;
        const plankRowIndex = plankRowMap[plankKey];
        if (!plankRowIndex) continue;
        
        // Handle L-cut triplet types (new architecture)
        // L-cuts are ordered triplets that define a directional CNC path.
        // Axis flattening only here. EB overshoot correction applied when writing triplets.
        // The single placement transform happens in Cutlist.js during sheet placement.
        if (opType === 'l_cut_start' || opType === 'l_cut_center' || opType === 'l_cut_end') {
          // Initialize collector for this plank
          if (!plankLCutCollector[plankKey]) {
            plankLCutCollector[plankKey] = { 
              starts: [], 
              centers: [], 
              ends: [], 
              rowIndex: plankRowIndex,
              finalWidth: currentPlank.finalWidth,
              finalLength: currentPlank.finalLength,
              ebOffset: plankOffset,
              plankName: currentPlank.name
            };
          }
          
          // PURE AXIS FLATTENING ONLY - EB correction applied later per-triplet
          const { faceX, faceY } = flattenLCutCoordinates(rowData, currentPlank.type);
          
          const point = { x: faceX, y: faceY };
          if (opType === 'l_cut_start') plankLCutCollector[plankKey].starts.push(point);
          else if (opType === 'l_cut_center') plankLCutCollector[plankKey].centers.push(point);
          else if (opType === 'l_cut_end') plankLCutCollector[plankKey].ends.push(point);
          
          continue; // Skip normal processing, will be written as triplets later
        }
        
        // Handle Gola profile triplet types (identical rules to L-cuts)
        // Gola profiles are ordered triplets that define a directional CNC path.
        // Axis flattening only here. EB overshoot correction applied when writing triplets.
        // The single placement transform happens in Cutlist.js during sheet placement.
        if (opType === 'gola_profile_start' || opType === 'gola_profile_center' || opType === 'gola_profile_end') {
          // Initialize collector for this plank
          if (!plankGolaProfileCollector[plankKey]) {
            plankGolaProfileCollector[plankKey] = { 
              starts: [], 
              centers: [], 
              ends: [], 
              rowIndex: plankRowIndex,
              finalWidth: currentPlank.finalWidth,
              finalLength: currentPlank.finalLength,
              ebOffset: plankOffset,
              plankName: currentPlank.name
            };
          }
          
          // PURE AXIS FLATTENING ONLY - EB correction applied later per-triplet
          const { faceX, faceY } = flattenLCutCoordinates(rowData, currentPlank.type);
          
          const point = { x: faceX, y: faceY };
          if (opType === 'gola_profile_start') plankGolaProfileCollector[plankKey].starts.push(point);
          else if (opType === 'gola_profile_center') plankGolaProfileCollector[plankKey].centers.push(point);
          else if (opType === 'gola_profile_end') plankGolaProfileCollector[plankKey].ends.push(point);
          
          continue; // Skip normal processing, will be written as triplets later
        }
        
        // Handle legacy l_cutting_legacy
        if (opType === 'l_cutting_legacy') {
          if (!plankOpsCounters[plankKey]) plankOpsCounters[plankKey] = {};
          const opCounter = (plankOpsCounters[plankKey]['l_cutting'] || 0) + 1;
          plankOpsCounters[plankKey]['l_cutting'] = opCounter;
          
          const { transformedX, transformedY, finalZ } = transformCoordinates(
            rowData, currentBox, currentPlank.name, currentPlank.type, opType,
            plankThicknessMap[plankKey], plankOffset, currentPlank.finalWidth
          );
          
          const baseColName = `l_cutting_${opCounter}`;
          const colX = outHeaderMap[`${baseColName}_X`];
          const colY = outHeaderMap[`${baseColName}_Y`];
          const colZ = outHeaderMap[`${baseColName}_Z`];
          
          if (colX) outSheet.getRange(plankRowIndex, colX).setValue(formatCoordinate(transformedX));
          if (colY) outSheet.getRange(plankRowIndex, colY).setValue(formatCoordinate(transformedY));
          if (colZ) outSheet.getRange(plankRowIndex, colZ).setValue(formatCoordinate(finalZ));
          
          // Log warning for legacy format
          Logger.log('Warning: Legacy L-cut detected for plank "' + currentPlank.name + '"; please re-export using triplet format.');
          continue;
        }

        if (!plankOpsCounters[plankKey]) plankOpsCounters[plankKey] = {};
        const opCounter = (plankOpsCounters[plankKey][opType] || 0) + 1;
        plankOpsCounters[plankKey][opType] = opCounter;
        
        const { transformedX, transformedY, finalZ, startX, startY, startZ } = transformCoordinates(
            rowData, currentBox, currentPlank.name, currentPlank.type, opType, 
            plankThicknessMap[plankKey], plankOffset, currentPlank.finalWidth 
        );

        const baseColName = `${opType}_${opCounter}`;
        
        if (['profile','slot','groove'].includes(opType)) {
          const colX = outHeaderMap[`${baseColName}_X`];
          const colY = outHeaderMap[`${baseColName}_Y`];
          const colZ = outHeaderMap[`${baseColName}_Z`];
          const colL = outHeaderMap[`${baseColName}_length`];
          const colW = outHeaderMap[`${baseColName}_width`];
          
          if (colX) outSheet.getRange(plankRowIndex, colX).setValue(formatCoordinate(startX));
          if (colY) outSheet.getRange(plankRowIndex, colY).setValue(formatCoordinate(startY));
          if (colZ) outSheet.getRange(plankRowIndex, colZ).setValue(formatCoordinate(startZ));
          if (colL) outSheet.getRange(plankRowIndex, colL).setValue(formatCoordinate(transformedX));
          if (colW) outSheet.getRange(plankRowIndex, colW).setValue(formatCoordinate(transformedY));
        } else {
          const colX = outHeaderMap[`${baseColName}_X`];
          const colY = outHeaderMap[`${baseColName}_Y`];
          const colZ = outHeaderMap[`${baseColName}_Z`];

          if (colX) outSheet.getRange(plankRowIndex, colX).setValue(formatCoordinate(transformedX));
          if (colY) outSheet.getRange(plankRowIndex, colY).setValue(formatCoordinate(transformedY));
          if (colZ) outSheet.getRange(plankRowIndex, colZ).setValue(formatCoordinate(finalZ));
        }
      }
    }
    
    // Write L-cut triplets to output sheet
    for (const plankKey in plankLCutCollector) {
      const collector = plankLCutCollector[plankKey];
      const { starts, centers, ends, rowIndex, finalWidth, finalLength, ebOffset, plankName } = collector;
      
      const numTriplets = Math.min(starts.length, centers.length, ends.length);
      
      // Log warning if incomplete triplets
      if (starts.length !== centers.length || centers.length !== ends.length) {
        Logger.log('Warning: Incomplete L-cut triplets for plank "' + plankKey + '": starts=' + starts.length + ', centers=' + centers.length + ', ends=' + ends.length);
      }
      
      // Write each complete triplet
      for (let i = 0; i < numTriplets; i++) {
        const tripletIndex = i + 1;
        
        const colStartX = outHeaderMap[`L_cut_${tripletIndex}_start_X`];
        const colStartY = outHeaderMap[`L_cut_${tripletIndex}_start_Y`];
        const colCenterX = outHeaderMap[`L_cut_${tripletIndex}_center_X`];
        const colCenterY = outHeaderMap[`L_cut_${tripletIndex}_center_Y`];
        const colEndX = outHeaderMap[`L_cut_${tripletIndex}_end_X`];
        const colEndY = outHeaderMap[`L_cut_${tripletIndex}_end_Y`];
        
        const pName = String(plankName || '').toLowerCase();
        const shouldMirror = pName.includes('right') || pName.includes('bottom');
        let start = { x: starts[i].x, y: starts[i].y };
        let center = { x: centers[i].x, y: centers[i].y };
        let end = { x: ends[i].x, y: ends[i].y };
        
        // V13.2 FIX: EB overshoot correction.
        // Raw SketchUp coordinates can extend into the EB margin (beyond the
        // EB-adjusted plank dimension). The CNC outline uses EB dimensions, so
        // any overshoot would be clipped, shrinking the feature.
        // Fix: if any triplet point exceeds the EB dimension on an axis,
        // shift ALL three points by the overshoot. This preserves relative
        // distances (feature dimensions) while aligning with the EB boundary.
        if (ebOffset > 0) {
          const maxX = Math.max(start.x, center.x, end.x);
          const maxY = Math.max(start.y, center.y, end.y);
          const overshootX = (typeof finalWidth === 'number' && finalWidth > 0 && maxX > finalWidth)
            ? maxX - finalWidth : 0;
          const overshootY = (typeof finalLength === 'number' && finalLength > 0 && maxY > finalLength)
            ? maxY - finalLength : 0;
          if (overshootX > 0) {
            start.x -= overshootX; center.x -= overshootX; end.x -= overshootX;
          }
          if (overshootY > 0) {
            start.y -= overshootY; center.y -= overshootY; end.y -= overshootY;
          }
        }
        
        if (shouldMirror && typeof finalWidth === 'number') {
          start.x = finalWidth - start.x;
          center.x = finalWidth - center.x;
          end.x = finalWidth - end.x;
          
          const tmp = start;
          start = end;
          end = tmp;
        }
        
        if (colStartX) outSheet.getRange(rowIndex, colStartX).setValue(formatCoordinate(start.x));
        if (colStartY) outSheet.getRange(rowIndex, colStartY).setValue(formatCoordinate(start.y));
        if (colCenterX) outSheet.getRange(rowIndex, colCenterX).setValue(formatCoordinate(center.x));
        if (colCenterY) outSheet.getRange(rowIndex, colCenterY).setValue(formatCoordinate(center.y));
        if (colEndX) outSheet.getRange(rowIndex, colEndX).setValue(formatCoordinate(end.x));
        if (colEndY) outSheet.getRange(rowIndex, colEndY).setValue(formatCoordinate(end.y));
      }
    }
    
    // Write Gola profile triplets to output sheet
    for (const plankKey in plankGolaProfileCollector) {
      const collector = plankGolaProfileCollector[plankKey];
      const { starts, centers, ends, rowIndex, finalWidth, finalLength, ebOffset, plankName } = collector;
      
      const numTriplets = Math.min(starts.length, centers.length, ends.length);
      
      // Log warning if incomplete triplets
      if (starts.length !== centers.length || centers.length !== ends.length) {
        Logger.log('Warning: Incomplete Gola profile triplets for plank "' + plankKey + '": starts=' + starts.length + ', centers=' + centers.length + ', ends=' + ends.length);
      }
      
      // Write each complete triplet
      for (let i = 0; i < numTriplets; i++) {
        const tripletIndex = i + 1;
        
        const colStartX = outHeaderMap[`Gola_profile_${tripletIndex}_start_X`];
        const colStartY = outHeaderMap[`Gola_profile_${tripletIndex}_start_Y`];
        const colCenterX = outHeaderMap[`Gola_profile_${tripletIndex}_center_X`];
        const colCenterY = outHeaderMap[`Gola_profile_${tripletIndex}_center_Y`];
        const colEndX = outHeaderMap[`Gola_profile_${tripletIndex}_end_X`];
        const colEndY = outHeaderMap[`Gola_profile_${tripletIndex}_end_Y`];
        
        const pName = String(plankName || '').toLowerCase();
        const shouldMirror = pName.includes('right') || pName.includes('bottom');
        let start = { x: starts[i].x, y: starts[i].y };
        let center = { x: centers[i].x, y: centers[i].y };
        let end = { x: ends[i].x, y: ends[i].y };
        
        // V13.2 FIX: EB overshoot correction (same logic as L-cuts above).
        if (ebOffset > 0) {
          const maxX = Math.max(start.x, center.x, end.x);
          const maxY = Math.max(start.y, center.y, end.y);
          const overshootX = (typeof finalWidth === 'number' && finalWidth > 0 && maxX > finalWidth)
            ? maxX - finalWidth : 0;
          const overshootY = (typeof finalLength === 'number' && finalLength > 0 && maxY > finalLength)
            ? maxY - finalLength : 0;
          if (overshootX > 0) {
            start.x -= overshootX; center.x -= overshootX; end.x -= overshootX;
          }
          if (overshootY > 0) {
            start.y -= overshootY; center.y -= overshootY; end.y -= overshootY;
          }
        }
        
        if (shouldMirror && typeof finalWidth === 'number') {
          start.x = finalWidth - start.x;
          center.x = finalWidth - center.x;
          end.x = finalWidth - end.x;
          
          const tmp = start;
          start = end;
          end = tmp;
        }
        
        if (colStartX) outSheet.getRange(rowIndex, colStartX).setValue(formatCoordinate(start.x));
        if (colStartY) outSheet.getRange(rowIndex, colStartY).setValue(formatCoordinate(start.y));
        if (colCenterX) outSheet.getRange(rowIndex, colCenterX).setValue(formatCoordinate(center.x));
        if (colCenterY) outSheet.getRange(rowIndex, colCenterY).setValue(formatCoordinate(center.y));
        if (colEndX) outSheet.getRange(rowIndex, colEndX).setValue(formatCoordinate(end.x));
        if (colEndY) outSheet.getRange(rowIndex, colEndY).setValue(formatCoordinate(end.y));
      }
    }

    rawSheet.getRange(2, plankIdCol1, rawPlankIdCol.length, 1).setValues(rawPlankIdCol);

    formatOutputSheet(outSheet, outHeader.length);
    
    // Show success message with Level 0 count if any walls were skipped
    let successMessage = 'Formatting complete! (Sequential IDs synced)';
    if (level0Count > 0) {
      successMessage += '\n\nSkipped ' + level0Count + ' wall element(s) (Level 0).';
    }
    showToast(successMessage, 'Success', 5);

  } catch (e) {
    Logger.log(e);
    showAlert('An error occurred: ' + e.message);
  }
}