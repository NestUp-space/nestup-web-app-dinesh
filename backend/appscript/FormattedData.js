/**
 * @OnlyCurrentDoc
 *
 * Formatted Data Generator with L-Cut and Gola Profile Support
 * Version: v9.0 (L-Cut & Gola Triplet Integration)
 *
 * FEATURES:
 * 1. FACE ORIENTATION: Maps faces (XYZ -> XY).
 * 2. MIRRORING: Mirrors X coordinates for Right, Bottom, and Doors.
 * 3. EDGE BINDING: 
 *    - Holes: Offset X and Y.
 *    - Slots: Offset X only (Y is NOT offset).
 *    - L-Cuts/Gola: Offset X and Y (same as holes).
 * 4. OVERSIZE CHECK: Warns if planks exceed sheet size.
 * 5. L-CUT TRIPLETS: Detects and processes L-cut points (start, center, end).
 * 6. GOLA PROFILE TRIPLETS: Detects and processes Gola profile points.
 * 
 * L-CUTS AND GOLA PROFILES FOLLOW ALL THE SAME RULES AS OTHER OPERATIONS:
 * - Face orientation mapping: YES
 * - Edge binding offset: YES
 * - Mirroring for Right/Bottom/Door: YES
 */


// =================================================================
// ===================      UI & DIALOGS      ===================
// =================================================================

/**
 * Builds and shows the EB dialog. Also validates oversized planks.
 */
function showEdgeBindingDialog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName('raw data') || ss.getActiveSheet();

  if (validateOversizedPlanks(rawSheet)) {
    return;
  }

  const rawValues = rawSheet.getDataRange().getValues();
  if (rawValues.length < 2) {
    SpreadsheetApp.getUi().alert("Raw data sheet is empty.");
    return;
  }

  const header = rawValues[0].map(h => String(h).trim());
  const matIdx = findColumnIndex(header, 'material');
  if (matIdx === -1) {
    SpreadsheetApp.getUi().alert("Could not find 'material' column.");
    return;
  }

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
    LenX: findColumnIndex(header, 'LenX'),
    LenY: findColumnIndex(header, 'LenY'),
    LenZ: findColumnIndex(header, 'LenZ'),
    entity_name: findColumnIndex(header, 'entity_name'),
    unit_location: findColumnIndex(header, 'Unit_location')
  };

  sheet.getDataRange().setBackground(null);

  const oversizedRanges = [];
  const oversizedDetails = [];
  let count = 0;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const rowObj = {
      entity_name: safeCell(row, idx.entity_name),
      unit_location: safeCell(row, idx.unit_location)
    };
    if (detectLevel(rowObj) !== 2) continue;

    const lx = parseFloatSafe(safeCell(row, idx.LenX));
    const ly = parseFloatSafe(safeCell(row, idx.LenY));
    const lz = parseFloatSafe(safeCell(row, idx.LenZ));
    const dims = [lx, ly, lz].sort((a, b) => a - b);

    const middle = dims[1];
    const largest = dims[2];

    const fitsOrientation1 = (largest <= SHEET_A && middle <= SHEET_B);
    const fitsOrientation2 = (largest <= SHEET_B && middle <= SHEET_A);

    if (!(fitsOrientation1 || fitsOrientation2)) {
      oversizedRanges.push(`A${r+1}:${sheet.getLastColumn()}${r+1}`);
      const name = safeCell(row, idx.entity_name) || `(row ${r+1})`;
      oversizedDetails.push(`${name} — sizes: ${dims[2]} x ${dims[1]} (row ${r+1})`);
      count++;
    }
  }

  if (count > 0) {
    sheet.getRangeList(oversizedRanges).setBackground('#FFCCCC');
    SpreadsheetApp.getUi().alert('⚠️ OVERSIZED PLANKS DETECTED!\n\nFound ' + count + ' planks too large.\nHighlighted in RED.');
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

  const newLength = initialLength - (2 * offset);
  const newWidth = initialWidth - (2 * offset);

  return { newLength, newWidth, offset };
}

function findColumnIndex(headerRow, targetName) {
  if (!Array.isArray(headerRow) || headerRow.length === 0) return -1;
  const normalizedTarget = String(targetName).toLowerCase().replace(/[\s_]/g, '');
  for (let i = 0; i < headerRow.length; i++) {
    const normalizedHeader = String(headerRow[i] || '').toLowerCase().replace(/[\s_]/g, '');
    if (normalizedHeader === normalizedTarget) return i;
  }
  return -1;
}

function detectLevel(obj) {
  const unitLocation = (obj.unit_location || '').toLowerCase();
  const entName = (obj.entity_name || '').toLowerCase();
  if (/north|south|east|west/.test(unitLocation)) return 1;
  if (/hole|groove|vb|screw|hinge|profile|slot|l_cut|lcut|l_cutting|lcutting|gola/.test(entName)) return 3;
  return 2;
}

function detectOperationType(entName) {
  const nameStr = (entName || '').toLowerCase();
  if (/vb main|vb_main|vbm|main_vb/.test(nameStr)) return 'vb_main';
  if (/vb double|vb_double|vbd|double_vb/.test(nameStr)) return 'vb_double';
  if (/hinge|hing/.test(nameStr)) return 'hing';
  if (/screw|bolt|pta/.test(nameStr)) return 'screw';
  if (/profile/.test(nameStr) && !/gola/.test(nameStr)) return 'profile';
  if (/slot/.test(nameStr)) return 'slot';
  if (/groove/.test(nameStr)) return 'groove';
  // L-cut detection - now returns specific triplet type
  if (/l_cut_start|lcut_start|l_cutting_start/.test(nameStr)) return 'l_cut_start';
  if (/l_cut_center|lcut_center|l_cutting_center/.test(nameStr)) return 'l_cut_center';
  if (/l_cut_end|lcut_end|l_cutting_end/.test(nameStr)) return 'l_cut_end';
  if (/l_cut|lcut|l_cutting|lcutting|l_groove/.test(nameStr)) return 'l_cut'; // Generic L-cut (will be auto-sequenced)
  // Gola profile detection
  if (/gola_start|gola_profile_start/.test(nameStr)) return 'gola_start';
  if (/gola_center|gola_profile_center/.test(nameStr)) return 'gola_center';
  if (/gola_end|gola_profile_end/.test(nameStr)) return 'gola_end';
  if (/gola|gola_profile/.test(nameStr)) return 'gola'; // Generic Gola (will be auto-sequenced)
  // Incut (internal cut) - 4 points per rectangle; must be before generic 'hole'
  if (/incut_hole|incut|internal.?cut/.test(nameStr)) return 'incut';
  if (/hole|drilled|bore/.test(nameStr)) return 'hole';
  return 'hole';
}

/**
 * Checks if an operation type is an L-cut related type
 */
function isLCutType(opType) {
  return ['l_cut', 'l_cut_start', 'l_cut_center', 'l_cut_end'].includes(opType);
}

/**
 * Checks if an operation type is a Gola profile related type
 */
function isGolaType(opType) {
  return ['gola', 'gola_start', 'gola_center', 'gola_end'].includes(opType);
}

function findMaxOperationCounts(rawValues, idx) {
  const plankOpCounter = {};
  const plankLCutCounter = {};
  const plankGolaCounter = {};
  const plankIncutCounter = {};
  let currentBox = null;
  let currentPlank = null;
  
  for (let r = 1; r < rawValues.length; r++) {
    const row = rawValues[r];
    const rowData = parseRowData(row, idx);
    const level = detectLevel(rowData);
    if (level === 1) {
      currentBox = { box_name: rowData.entity_name };
      currentPlank = null;
    } else if (level === 2) {
      currentPlank = { key: makePlankKey(currentBox, rowData.entity_name) };
    } else if (level === 3 && currentPlank) {
      const opType = detectOperationType(rowData.entity_name);
      const plankKey = currentPlank.key;
      
      if (isLCutType(opType)) {
        // Count L-cut points (3 points = 1 triplet)
        if (!plankLCutCounter[plankKey]) plankLCutCounter[plankKey] = 0;
        plankLCutCounter[plankKey]++;
      } else if (isGolaType(opType)) {
        // Count Gola points (3 points = 1 triplet)
        if (!plankGolaCounter[plankKey]) plankGolaCounter[plankKey] = 0;
        plankGolaCounter[plankKey]++;
      } else if (opType === 'incut') {
        // Count incut points (4 points = 1 rectangle)
        if (!plankIncutCounter[plankKey]) plankIncutCounter[plankKey] = 0;
        plankIncutCounter[plankKey]++;
      } else if (opType !== 'other') {
        if (!plankOpCounter[plankKey]) plankOpCounter[plankKey] = {};
        plankOpCounter[plankKey][opType] = (plankOpCounter[plankKey][opType] || 0) + 1;
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
  
  // Calculate max L-cut triplets (3 points per triplet)
  let maxLCutTriplets = 0;
  for (const plankKey in plankLCutCounter) {
    const tripletCount = Math.ceil(plankLCutCounter[plankKey] / 3);
    if (tripletCount > maxLCutTriplets) maxLCutTriplets = tripletCount;
  }
  maxCounts['l_cut_triplet'] = maxLCutTriplets;
  
  // Calculate max Gola triplets (3 points per triplet)
  let maxGolaTriplets = 0;
  for (const plankKey in plankGolaCounter) {
    const tripletCount = Math.ceil(plankGolaCounter[plankKey] / 3);
    if (tripletCount > maxGolaTriplets) maxGolaTriplets = tripletCount;
  }
  maxCounts['gola_triplet'] = maxGolaTriplets;
  
  // Calculate max incut rectangles (4 points per rectangle)
  let maxIncutRects = 0;
  for (const plankKey in plankIncutCounter) {
    const rectCount = Math.ceil(plankIncutCounter[plankKey] / 4);
    if (rectCount > maxIncutRects) maxIncutRects = rectCount;
  }
  maxCounts['incut_rect'] = maxIncutRects;
  
  return maxCounts;
}

function isTruePlank(plankName) {
  const name = (plankName || '').toLowerCase();
  const keywords = /plank|skirting|dummy|door|shelf|tandem|draw/;
  return keywords.test(name);
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
 * Maps faces AND applies Mirroring for Right/Bottom/Doors.
 * Used for standard operations (holes, grooves, slots).
 * @param {string} plankName - Name of component to check for mirroring
 * @param {number} finalPlankWidth - The NET width (after EB) for mirror calculation
 */
function transformCoordinates(rowData, currentBox, plankName, plankType, opType, plankThickness, plankOffset, finalPlankWidth) {
  const { X: rawX, Y: rawY, Z: rawZ, LenX, LenY, LenZ } = rowData;

  let rawFaceX, rawFaceY, rawFaceDimL, rawFaceDimW;
  let startZ;

  // 1. DETERMINE MAPPING (Face Orientation)
  if (plankType === 'horizontal') {
    rawFaceX = rawY;
    rawFaceY = rawX;
    rawFaceDimL = LenX;
    rawFaceDimW = LenY;
    startZ = LenZ;
  } else if (plankType === 'vertical') {
    rawFaceX = rawY;
    rawFaceY = rawZ;
    rawFaceDimL = LenZ;
    rawFaceDimW = LenY;
    startZ = LenX;
  } else {
    rawFaceX = rawX;
    rawFaceY = rawZ;
    rawFaceDimL = LenX;
    rawFaceDimW = LenZ;
    startZ = LenY;
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

  const grooveTokens = ['groove', 'slot', 'profile', 'l_groove'];

  if (grooveTokens.includes(opType)) {
    // GROOVES: startY adds offset back (Y is NOT offset for slots)
    startX = rawFaceX; 
    startY = rawFaceY + offset; // <--- SLOT Y IS NOT OFFSET
    startZ_out = startZ;
    transformedX = rawFaceDimL;
    transformedY = rawFaceDimW;
    finalZ = startZ_out;
  } else {
    // HOLES
    transformedX = rawFaceX;
    transformedY = rawFaceY;
    switch (opType) {
      case 'hing': finalZ = 14; break;
      case 'vb_main': finalZ = 16; break;
      case 'vb_double': finalZ = 11; break;
      default: finalZ = plankThickness || 0; break;
    }
  }

  // =========================================================
  // ===================  MIRRORING LOGIC  ===================
  // =========================================================
  // Rule: If Right, Bottom, or Door -> Final X = Width(after EB) - Current X

  const pName = (plankName || '').toLowerCase();
  const shouldMirror = (
    pName.includes('right') ||
    pName.includes('bottom') ||
    pName.includes('door')
  );

  if (shouldMirror) {
    // If it is a groove, we mirror the startX
    if (startX !== null) {
      startX = finalPlankWidth - startX;
    }
    // If it is a hole/hardware, we mirror the transformedX
    else {
      transformedX = finalPlankWidth - transformedX;
    }
  }

  return { transformedX, transformedY, finalZ, startX, startY, startZ: startZ_out };
}

/**
 * Transform a single point (X, Y) for L-cut or Gola triplet.
 * Applies: Face orientation mapping, Edge-aware EB offset, Mirroring.
 * 
 * V13.1 FIX: Edge-aware EB offset for L-cut/Gola points.
 * ════════════════════════════════════════════════════════════════════════
 * PROBLEM: Blind EB subtraction (rawFaceX -= offset) shifts ALL points
 *   uniformly. For edge points (start/end of L-cuts/Golas that sit ON
 *   the plank edge), this causes them to overshoot the EB'd boundary.
 *   The L-cut/Gola notch depth (distance from edge to center) ends up
 *   ~1mm short per axis, giving -2mm total error on Gola height.
 * 
 * FIX: Detect if a coordinate is ON a plank edge (within tolerance).
 *   - Edge at origin (X≈0 or Y≈0): snap to 0
 *   - Edge at far side (X≈rawWidth or Y≈rawHeight): snap to finalDim
 *   - Interior points: standard EB subtraction (rawCoord - offset)
 *   This preserves feature dimensions while maintaining correct
 *   positioning in the EB-adjusted coordinate frame.
 * ════════════════════════════════════════════════════════════════════════
 * 
 * @param {Object} rowData - Raw SketchUp row data with X, Y, Z
 * @param {string} plankType - 'horizontal', 'vertical', 'face', or 'auto'
 * @param {number} plankOffset - Edge binding offset value
 * @param {number} finalPlankWidth - EB-adjusted plank width (X axis)
 * @param {boolean} shouldMirror - Whether to mirror X for Right/Bottom/Door
 * @param {number} finalPlankHeight - EB-adjusted plank height (Y axis)
 */
function transformTripletPoint(rowData, plankType, plankOffset, finalPlankWidth, shouldMirror, finalPlankHeight) {
  const { X: rawX, Y: rawY, Z: rawZ } = rowData;

  let rawFaceX, rawFaceY;

  // 1. FACE ORIENTATION MAPPING (same as holes/grooves)
  if (plankType === 'horizontal') {
    rawFaceX = rawY;
    rawFaceY = rawX;
  } else if (plankType === 'vertical') {
    rawFaceX = rawY;
    rawFaceY = rawZ;
  } else {
    // 'face' or 'auto'
    rawFaceX = rawX;
    rawFaceY = rawZ;
  }

  // Save pre-EB face coordinates for diagnostic logging
  var origFaceX = rawFaceX;
  var origFaceY = rawFaceY;
  var xBranch = 'none';
  var yBranch = 'none';

  // Normalize offset
  let offset = Number(plankOffset);
  if (isNaN(offset) || offset < 0) offset = 0;

  // 2. EDGE BINDING OFFSET — Edge-aware for L-cut/Gola feature points
  if (offset > 0) {
    // Reconstruct raw plank dimensions (before EB was applied)
    const rawWidth = finalPlankWidth + 2 * offset;
    const rawHeight = (finalPlankHeight !== undefined && finalPlankHeight > 0)
      ? finalPlankHeight + 2 * offset
      : 0;

    // Tolerance for detecting if a coordinate is "on" a plank edge.
    // L-cut/Gola start/end points are designed to be AT the plank edge,
    // so their raw coordinates should be very close to 0 or rawDimension.
    const SNAP_TOL = offset + 1.5;

    // --- X axis ---
    if (rawFaceX <= SNAP_TOL) {
      xBranch = 'snap0';
      rawFaceX = 0;
    } else if (rawWidth > 0 && rawFaceX >= rawWidth - SNAP_TOL) {
      xBranch = 'snapFar(' + rawWidth + '-' + SNAP_TOL + '=' + (rawWidth - SNAP_TOL) + ')';
      rawFaceX = finalPlankWidth;
    } else {
      // V13.2 FIX: Nearest-edge-aware subtraction.
      // Standard `coord -= offset` preserves distance from the NEAR edge (0),
      // but shrinks distance from the FAR edge by `offset`.
      // For coordinates closer to the far edge, use `coord -= 2*offset`
      // which preserves the distance from the far edge instead.
      if (rawWidth > 0 && rawFaceX >= rawWidth / 2) {
        xBranch = 'subtractFar';
        rawFaceX = rawFaceX - 2 * offset; // preserve distance from far edge
      } else {
        xBranch = 'subtractNear';
        rawFaceX -= offset; // preserve distance from near edge
      }
    }

    // --- Y axis ---
    if (rawFaceY <= SNAP_TOL) {
      yBranch = 'snap0';
      rawFaceY = 0;
    } else if (rawHeight > 0 && rawFaceY >= rawHeight - SNAP_TOL) {
      yBranch = 'snapFar(' + rawHeight + '-' + SNAP_TOL + '=' + (rawHeight - SNAP_TOL) + ')';
      rawFaceY = finalPlankHeight;
    } else {
      if (rawHeight > 0 && rawFaceY >= rawHeight / 2) {
        yBranch = 'subtractFar';
        rawFaceY = rawFaceY - 2 * offset; // preserve distance from far edge
      } else {
        yBranch = 'subtractNear';
        rawFaceY -= offset; // preserve distance from near edge
      }
    }

    // V13.1 DIAGNOSTIC: Log EB edge-snapping details for L-cut/Gola points
    Logger.log('[TripletEB] type=' + plankType + ' offset=' + offset +
      ' finalW=' + finalPlankWidth + ' finalH=' + finalPlankHeight +
      ' | rawXYZ=(' + rawX + ',' + rawY + ',' + rawZ + ')' +
      ' | face PRE-EB=(' + origFaceX + ',' + origFaceY + ')' +
      ' rawW=' + rawWidth + ' rawH=' + rawHeight + ' SNAP=' + SNAP_TOL +
      ' | xBranch=' + xBranch + ' yBranch=' + yBranch +
      ' | face POST-EB=(' + rawFaceX + ',' + rawFaceY + ')' +
      ' mirror=' + shouldMirror);
  } else {
    // V13.1 DIAGNOSTIC: Log when EB is skipped entirely
    Logger.log('[TripletEB] SKIPPED (offset=0) type=' + plankType +
      ' plankOffset=' + plankOffset + ' finalW=' + finalPlankWidth + ' finalH=' + finalPlankHeight +
      ' | rawXYZ=(' + rawX + ',' + rawY + ',' + rawZ + ')' +
      ' | face=(' + origFaceX + ',' + origFaceY + ')' +
      ' mirror=' + shouldMirror);
  }

  // V13.1 FAILSAFE: Clamp coordinates to EB-adjusted plank dimensions.
  // If the edge-snapping above didn't fire (e.g., offset mismatch or tolerance issue),
  // this ensures no coordinate exceeds the final plank boundary.
  if (finalPlankWidth > 0 && rawFaceX > finalPlankWidth) {
    Logger.log('[TripletFix] X clamped: ' + rawFaceX + ' → ' + finalPlankWidth);
    rawFaceX = finalPlankWidth;
  }
  if (rawFaceX < 0) {
    Logger.log('[TripletFix] X negative clamped: ' + rawFaceX + ' → 0');
    rawFaceX = 0;
  }
  if (finalPlankHeight !== undefined && finalPlankHeight > 0 && rawFaceY > finalPlankHeight) {
    Logger.log('[TripletFix] Y clamped: ' + rawFaceY + ' → ' + finalPlankHeight);
    rawFaceY = finalPlankHeight;
  }
  if (rawFaceY < 0) {
    Logger.log('[TripletFix] Y negative clamped: ' + rawFaceY + ' → 0');
    rawFaceY = 0;
  }

  // 3. MIRRORING (if Right/Bottom/Door plank) - SAME AS OTHER OPERATIONS
  if (shouldMirror) {
    rawFaceX = finalPlankWidth - rawFaceX;
  }

  return { x: rawFaceX, y: rawFaceY };
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

function makePlankKey(boxObj, plankName) {
  const boxPart = boxObj && boxObj.box_name ? boxObj.box_name : '(no_box)';
  return `${boxPart}||${plankName}`;
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
    const idx = {
      entity_name:   findColumnIndex(header, 'entity_name'), unit_location: findColumnIndex(header, 'Unit_location'),
      material:      findColumnIndex(header, 'material'),    LenX: findColumnIndex(header, 'LenX'),
      LenY:          findColumnIndex(header, 'LenY'),        LenZ: findColumnIndex(header, 'LenZ'),
      X:             findColumnIndex(header, 'X'),           Y: findColumnIndex(header, 'Y'),
      Z:             findColumnIndex(header, 'Z'),           room_name: findColumnIndex(header, 'Room_name')
    };
    const requiredCols = ['entity_name', 'unit_location', 'material', 'LenX', 'LenY', 'LenZ', 'X', 'Y', 'Z'];
    const missing = requiredCols.filter(col => idx[col] === -1);
    if (missing.length > 0) throw new Error('Missing required columns: ' + missing.join(', ') + '.');

    showToast('Pre-scanning for operations...', 'In Progress', 10);
    const maxOpCounts = findMaxOperationCounts(rawValues, idx);

    const hardwareColumns = extractHardwareColumns(header);
    const hardwareHeader = hardwareColumns.map(hc => hc.material);
    const baseHeader = ['room_name', 'box_orientation', 'box_name', 'plank_name', 'plank_id', 'plank_length', 'plank_width', 'plank_thickness', 'plank_material', 'EB_Value'];
    
    // Standard operation types (excluding L-cuts and Golas which are handled separately)
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
    
    // Add L-cut triplet headers
    const maxLCutTriplets = maxOpCounts['l_cut_triplet'] || 0;
    for (let i = 1; i <= maxLCutTriplets; i++) {
      dynamicOpHeader.push(
        `L_cut_${i}_start_X`, `L_cut_${i}_start_Y`,
        `L_cut_${i}_center_X`, `L_cut_${i}_center_Y`,
        `L_cut_${i}_end_X`, `L_cut_${i}_end_Y`
      );
    }
    
    // Add Gola profile triplet headers
    const maxGolaTriplets = maxOpCounts['gola_triplet'] || 0;
    for (let i = 1; i <= maxGolaTriplets; i++) {
      dynamicOpHeader.push(
        `Gola_profile_${i}_start_X`, `Gola_profile_${i}_start_Y`,
        `Gola_profile_${i}_center_X`, `Gola_profile_${i}_center_Y`,
        `Gola_profile_${i}_end_X`, `Gola_profile_${i}_end_Y`
      );
    }
    
    // Add Incut cut headers (4 points per rectangle)
    const maxIncutRects = maxOpCounts['incut_rect'] || 0;
    for (let i = 1; i <= maxIncutRects; i++) {
      dynamicOpHeader.push(
        `Incut_cut_${i}_point1_X`, `Incut_cut_${i}_point1_Y`,
        `Incut_cut_${i}_point2_X`, `Incut_cut_${i}_point2_Y`,
        `Incut_cut_${i}_point3_X`, `Incut_cut_${i}_point3_Y`,
        `Incut_cut_${i}_point4_X`, `Incut_cut_${i}_point4_Y`
      );
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
    const plankLCutPoints = {}; // Store L-cut points for grouping into triplets
    const plankGolaPoints = {}; // Store Gola points for grouping into triplets
    const plankIncutPoints = {}; // Store incut points for grouping into 4-point rectangles
    let outRowPtr = 2;
    let plankIdCounter = 1;

    for (let r = 1; r < rawValues.length; r++) {
      const row = rawValues[r];
      const rowData = parseRowData(row, idx);
      const level = detectLevel(rowData);

      if (level === 1) {
        currentBox = {
          box_name: rowData.entity_name || `Box_${r + 1}`,
          orientation: getBoxOrientation(rowData.unit_location),
          room_name: rowData.room_name || ''
        };
        currentPlank = null;
        continue;
      }

      if (level === 2) {
        if (!currentBox) continue;
        const plank_name = rowData.entity_name || `Component_${r + 1}`;
        const plankType = getPlankType(plank_name);
        const dims = calculateTransformedDimensions(rowData, currentBox.orientation, plankType);
        
        const plankKey = makePlankKey(currentBox, plank_name);
        plankThicknessMap[plankKey] = dims.thickness;
        
        const materialRaw = rowData.material || '';
        const edgeBinding = applyEdgeBindingWithSettings(
          plank_name, 
          materialRaw, 
          dims.length, 
          dims.width, 
          dims.thickness,
          ebSettings
        );
        
        plankOffsetMap[plankKey] = edgeBinding.offset;

        let currentPlankId = '';
        if (isTruePlank(plank_name)) {
          currentPlankId = plankIdCounter++;
        }
        
        const finalMaterial = materialRaw ? `${materialRaw} (${currentBox.room_name})` : currentBox.room_name;

        let outRow = Array(outHeader.length).fill('');
        const baseRowData = [
          currentBox.room_name, currentBox.orientation, currentBox.box_name,
          plank_name, currentPlankId, 
          edgeBinding.newLength, 
          edgeBinding.newWidth, 
          dims.thickness,
          finalMaterial,
          edgeBinding.offset
        ];
        outRow.splice(0, baseRowData.length, ...baseRowData);

        hardwareColumns.forEach(hc => {
          const hardwareColIdx = findColumnIndex(header, hc.originalName);
          if (hardwareColIdx !== -1) {
            const colIndex = outHeaderMap[hc.material];
            if (colIndex) outRow[colIndex - 1] = safeCell(row, hardwareColIdx) || '0';
          }
        });

        outSheet.getRange(outRowPtr, 1, 1, outRow.length).setValues([outRow]);
        plankRowMap[plankKey] = outRowPtr;
        
        // Initialize L-cut, Gola, and Incut point arrays for this plank
        plankLCutPoints[plankKey] = [];
        plankGolaPoints[plankKey] = [];
        plankIncutPoints[plankKey] = [];
        
        // Save plank details including FINAL dimensions for Mirroring and edge-aware EB logic
        currentPlank = { 
          name: plank_name, 
          key: plankKey, 
          type: plankType,
          finalWidth: edgeBinding.newWidth,
          finalHeight: edgeBinding.newLength
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
        
        // Determine if this plank should be mirrored
        const pName = (currentPlank.name || '').toLowerCase();
        const shouldMirror = (
          pName.includes('right') ||
          pName.includes('bottom') ||
          pName.includes('door')
        );
        
        // Handle L-cut points
        if (isLCutType(opType)) {
          const transformedPoint = transformTripletPoint(
            rowData, currentPlank.type, plankOffset, currentPlank.finalWidth, shouldMirror, currentPlank.finalHeight
          );
          plankLCutPoints[plankKey].push({
            x: transformedPoint.x,
            y: transformedPoint.y,
            type: opType, // 'l_cut_start', 'l_cut_center', 'l_cut_end', or 'l_cut'
            rawOrder: plankLCutPoints[plankKey].length
          });
          continue;
        }
        
        // Handle Gola points
        if (isGolaType(opType)) {
          const transformedPoint = transformTripletPoint(
            rowData, currentPlank.type, plankOffset, currentPlank.finalWidth, shouldMirror, currentPlank.finalHeight
          );
          plankGolaPoints[plankKey].push({
            x: transformedPoint.x,
            y: transformedPoint.y,
            type: opType, // 'gola_start', 'gola_center', 'gola_end', or 'gola'
            rawOrder: plankGolaPoints[plankKey].length
          });
          continue;
        }
        
        // Handle Incut points (4 points per rectangle) - same face mapping as L-cuts/Gola
        if (opType === 'incut') {
          const transformedPoint = transformTripletPoint(
            rowData, currentPlank.type, plankOffset, currentPlank.finalWidth, shouldMirror, currentPlank.finalHeight
          );
          plankIncutPoints[plankKey].push({ x: transformedPoint.x, y: transformedPoint.y });
          continue;
        }
        
        // Handle standard operations
        if (!plankOpsCounters[plankKey]) plankOpsCounters[plankKey] = {};
        const opCounter = (plankOpsCounters[plankKey][opType] || 0) + 1;
        plankOpsCounters[plankKey][opType] = opCounter;
        
        // Pass currentPlank.finalWidth for mirror calculation
        const { transformedX, transformedY, finalZ, startX, startY, startZ } = transformCoordinates(
            rowData, currentBox, currentPlank.name, currentPlank.type, opType, 
            plankThicknessMap[plankKey], plankOffset, currentPlank.finalWidth 
        );

        const plankRowIndex = plankRowMap[plankKey];
        if (!plankRowIndex) continue;

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
    
    // =========================================================
    // =======  PROCESS L-CUT AND GOLA TRIPLETS  ===============
    // =========================================================
    // Group L-cut points into triplets and write to sheet
    
    showToast('Processing L-cuts and Gola profiles...', 'In Progress', 20);
    
    for (const plankKey in plankLCutPoints) {
      const points = plankLCutPoints[plankKey];
      if (points.length === 0) continue;
      
      const plankRowIndex = plankRowMap[plankKey];
      if (!plankRowIndex) continue;
      
      // Group points into triplets
      const triplets = groupPointsIntoTriplets(points);
      
      // Write each triplet to the sheet
      triplets.forEach((triplet, index) => {
        const tripletNum = index + 1;
        
        const startXCol = outHeaderMap[`L_cut_${tripletNum}_start_X`];
        const startYCol = outHeaderMap[`L_cut_${tripletNum}_start_Y`];
        const centerXCol = outHeaderMap[`L_cut_${tripletNum}_center_X`];
        const centerYCol = outHeaderMap[`L_cut_${tripletNum}_center_Y`];
        const endXCol = outHeaderMap[`L_cut_${tripletNum}_end_X`];
        const endYCol = outHeaderMap[`L_cut_${tripletNum}_end_Y`];
        
        if (startXCol && triplet.start) {
          outSheet.getRange(plankRowIndex, startXCol).setValue(formatCoordinate(triplet.start.x));
          outSheet.getRange(plankRowIndex, startYCol).setValue(formatCoordinate(triplet.start.y));
        }
        if (centerXCol && triplet.center) {
          outSheet.getRange(plankRowIndex, centerXCol).setValue(formatCoordinate(triplet.center.x));
          outSheet.getRange(plankRowIndex, centerYCol).setValue(formatCoordinate(triplet.center.y));
        }
        if (endXCol && triplet.end) {
          outSheet.getRange(plankRowIndex, endXCol).setValue(formatCoordinate(triplet.end.x));
          outSheet.getRange(plankRowIndex, endYCol).setValue(formatCoordinate(triplet.end.y));
        }
      });
    }
    
    // Group Gola points into triplets and write to sheet
    for (const plankKey in plankGolaPoints) {
      const points = plankGolaPoints[plankKey];
      if (points.length === 0) continue;
      
      const plankRowIndex = plankRowMap[plankKey];
      if (!plankRowIndex) continue;
      
      // Group points into triplets
      const triplets = groupPointsIntoTriplets(points);
      
      // Write each triplet to the sheet
      triplets.forEach((triplet, index) => {
        const tripletNum = index + 1;
        
        const startXCol = outHeaderMap[`Gola_profile_${tripletNum}_start_X`];
        const startYCol = outHeaderMap[`Gola_profile_${tripletNum}_start_Y`];
        const centerXCol = outHeaderMap[`Gola_profile_${tripletNum}_center_X`];
        const centerYCol = outHeaderMap[`Gola_profile_${tripletNum}_center_Y`];
        const endXCol = outHeaderMap[`Gola_profile_${tripletNum}_end_X`];
        const endYCol = outHeaderMap[`Gola_profile_${tripletNum}_end_Y`];
        
        if (startXCol && triplet.start) {
          outSheet.getRange(plankRowIndex, startXCol).setValue(formatCoordinate(triplet.start.x));
          outSheet.getRange(plankRowIndex, startYCol).setValue(formatCoordinate(triplet.start.y));
        }
        if (centerXCol && triplet.center) {
          outSheet.getRange(plankRowIndex, centerXCol).setValue(formatCoordinate(triplet.center.x));
          outSheet.getRange(plankRowIndex, centerYCol).setValue(formatCoordinate(triplet.center.y));
        }
        if (endXCol && triplet.end) {
          outSheet.getRange(plankRowIndex, endXCol).setValue(formatCoordinate(triplet.end.x));
          outSheet.getRange(plankRowIndex, endYCol).setValue(formatCoordinate(triplet.end.y));
        }
      });
    }
    
    // Group Incut points into 4-point rectangles and write to sheet
    for (const plankKey in plankIncutPoints) {
      const points = plankIncutPoints[plankKey];
      if (points.length === 0) continue;
      
      const plankRowIndex = plankRowMap[plankKey];
      if (!plankRowIndex) continue;
      
      // Group consecutive points in chunks of 4 (preserve raw order)
      for (let idx = 0; idx < points.length; idx += 4) {
        const chunk = points.slice(idx, idx + 4);
        if (chunk.length !== 4) continue; // Only write full rectangles
        const rectNum = (idx / 4) + 1;
        
        const p1XCol = outHeaderMap[`Incut_cut_${rectNum}_point1_X`];
        const p1YCol = outHeaderMap[`Incut_cut_${rectNum}_point1_Y`];
        const p2XCol = outHeaderMap[`Incut_cut_${rectNum}_point2_X`];
        const p2YCol = outHeaderMap[`Incut_cut_${rectNum}_point2_Y`];
        const p3XCol = outHeaderMap[`Incut_cut_${rectNum}_point3_X`];
        const p3YCol = outHeaderMap[`Incut_cut_${rectNum}_point3_Y`];
        const p4XCol = outHeaderMap[`Incut_cut_${rectNum}_point4_X`];
        const p4YCol = outHeaderMap[`Incut_cut_${rectNum}_point4_Y`];
        
        if (p1XCol) outSheet.getRange(plankRowIndex, p1XCol).setValue(formatCoordinate(chunk[0].x));
        if (p1YCol) outSheet.getRange(plankRowIndex, p1YCol).setValue(formatCoordinate(chunk[0].y));
        if (p2XCol) outSheet.getRange(plankRowIndex, p2XCol).setValue(formatCoordinate(chunk[1].x));
        if (p2YCol) outSheet.getRange(plankRowIndex, p2YCol).setValue(formatCoordinate(chunk[1].y));
        if (p3XCol) outSheet.getRange(plankRowIndex, p3XCol).setValue(formatCoordinate(chunk[2].x));
        if (p3YCol) outSheet.getRange(plankRowIndex, p3YCol).setValue(formatCoordinate(chunk[2].y));
        if (p4XCol) outSheet.getRange(plankRowIndex, p4XCol).setValue(formatCoordinate(chunk[3].x));
        if (p4YCol) outSheet.getRange(plankRowIndex, p4YCol).setValue(formatCoordinate(chunk[3].y));
      }
    }

    formatOutputSheet(outSheet, outHeader.length);
    showToast('Formatting complete with L-cuts, Gola profiles and Incuts!', 'Success', 5);

  } catch (e) {
    Logger.log(e);
    showAlert('An error occurred: ' + e.message);
  }
}

/**
 * Groups points into triplets (start, center, end).
 * If points have explicit types (l_cut_start, l_cut_center, l_cut_end), uses those.
 * Otherwise, groups every 3 points in order.
 */
function groupPointsIntoTriplets(points) {
  const triplets = [];
  
  // Check if points have explicit types
  const hasExplicitTypes = points.some(p => 
    p.type.includes('_start') || p.type.includes('_center') || p.type.includes('_end')
  );
  
  if (hasExplicitTypes) {
    // Group by explicit types
    const starts = points.filter(p => p.type.includes('_start'));
    const centers = points.filter(p => p.type.includes('_center'));
    const ends = points.filter(p => p.type.includes('_end'));
    
    const maxTriplets = Math.max(starts.length, centers.length, ends.length);
    
    for (let i = 0; i < maxTriplets; i++) {
      triplets.push({
        start: starts[i] ? { x: starts[i].x, y: starts[i].y } : null,
        center: centers[i] ? { x: centers[i].x, y: centers[i].y } : null,
        end: ends[i] ? { x: ends[i].x, y: ends[i].y } : null
      });
    }
  } else {
    // Group every 3 points in order (rawOrder)
    points.sort((a, b) => a.rawOrder - b.rawOrder);
    
    for (let i = 0; i < points.length; i += 3) {
      const triplet = {
        start: points[i] ? { x: points[i].x, y: points[i].y } : null,
        center: points[i + 1] ? { x: points[i + 1].x, y: points[i + 1].y } : null,
        end: points[i + 2] ? { x: points[i + 2].x, y: points[i + 2].y } : null
      };
      triplets.push(triplet);
    }
  }
  
  return triplets;
}
