/**
 * @OnlyCurrentDoc
 *
 * Formatted Data Generator
 * Version: v8.12 (Level Column Reader + Level 0 HARD STOP)
 *
 * CRITICAL UPDATE:
 * - Now READS the "Level" column directly from raw data (Column B)
 * - Level 0 rows are HARD STOPPED:
 *   1. NEVER appear in Formatted_Plank_Data
 *   2. NEVER receive plank_id (cleared if exists)
 *   3. Do NOT affect sequential ID numbering (no gaps)
 * - Only Level 2 (planks) receive plank_ids
 * - Fallback to pattern detection if Level column is missing
 *
 * SYNC: When plank_id is edited in Formatted_Plank_Data, the raw data sheet's
 * last column (plank_id) is updated. Match by box_name + plank_name. No new IDs generated.
 */

// =================================================================
// ===================  SYNC CONFIG (column names as-is)  ============
// =================================================================

const SYNC_FORMATTED_SHEET = 'Formatted_Plank_Data';
const SYNC_RAW_SHEET = 'raw data';
const SYNC_COL_ROOM_NAME = 'room_name';
const SYNC_COL_BOX_NAME = 'box_name';
const SYNC_COL_BOX_MODEL = 'box_model';
const SYNC_COL_PLANK_NAME = 'plank_name';
const SYNC_COL_PLANK_ID = 'plank_id';
const SYNC_RAW_ENTITY_NAME = 'Entity Name';
const SYNC_RAW_LEVEL = 'Level';
const SYNC_RAW_ROOM = 'Room_Name';
const SYNC_RAW_BOX_MODEL = 'Box_Model';

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
  const levelIdx = findColumnIndexFormatted(header, 'Level');

  const materialSet = new Set();
  for (let i = 1; i < rawValues.length; i++) {
    // Skip Level 0 rows when collecting materials
    if (levelIdx !== -1) {
      const levelVal = getLevelFromColumn(rawValues[i], levelIdx);
      if (levelVal === 0) continue;
    }
    
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

/**
 * PRIMARY: Read Level directly from the "Level" column in raw data.
 * Returns the level as a number (0, 1, 2, 3) or null if column doesn't exist/invalid.
 */
function getLevelFromColumn(row, levelIdx) {
  if (levelIdx === -1 || levelIdx === null || levelIdx === undefined) return null;
  const levelVal = String(row[levelIdx] || '').trim();
  const levelNum = parseFloat(levelVal);
  if (isNaN(levelNum)) return null;
  return levelNum;
}

/**
 * FALLBACK: Pattern-based level detection when Level column is missing.
 * Only used as backup.
 */
function detectLevelFallback(obj) {
  const unitLocation = (obj.unit_location || '').toLowerCase();
  const entName = (obj.entity_name || '').toLowerCase();
  
  // Level 1: Boxes (directional location)
  if (/north|south|east|west/.test(unitLocation)) return 1;
  
  // Level 3: Operations
  if (/hole|groove|vb|screw|hinge|profile|slot|l_cutting|lcutting|l_cut_start|l_cut_center|l_cut_centre|l_cut_end|lcut_start|lcut_center|lcut_centre|lcut_end|gola_profile_start|gola_profile_center|gola_profile_centre|gola_profile_end|gola_start|gola_center|gola_centre|gola_end|incut_hole|incut_cut|inclined_cut|inplank_hole|internal_cut|internal.?cut/.test(entName)) return 3;
  
  // Level 0: Architectural walls (pattern fallback)
  const isFurnitureWithWall = /wall\s*(mount|mounted|cabinet|unit|shelf|hung|panel|hanging|storage|rack)/i.test(entName);
  if (!isFurnitureWithWall && /\bwall\b/i.test(entName)) {
    return 0;
  }
  
  // Default: Level 2 (Planks)
  return 2;
}

/**
 * COMBINED: Get level from column first, fallback to pattern detection.
 */
function getRowLevel(row, idx) {
  // First try reading from Level column
  const levelFromColumn = getLevelFromColumn(row, idx.Level);
  if (levelFromColumn !== null) {
    return levelFromColumn;
  }
  
  // Fallback to pattern detection
  const rowObj = {
    entity_name: safeCell(row, idx.entity_name),
    unit_location: safeCell(row, idx.unit_location)
  };
  return detectLevelFallback(rowObj);
}

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
    material: findColumnIndexFormatted(header, 'material'),
    Level: findColumnIndexFormatted(header, 'Level')
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
  let level0SkipCount = 0;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    
    // Get level from column or fallback
    const level = getRowLevel(row, idx);
    
    // HARD STOP: Level 0 - skip entirely
    if (level === 0) {
      level0SkipCount++;
      continue;
    }
    
    // Only process Level 2 (planks) for oversized check
    if (level !== 2) {
      continue; 
    }

    const lx = parseFloatSafe(safeCell(row, idx.LenX));
    const ly = parseFloatSafe(safeCell(row, idx.LenY));
    const lz = parseFloatSafe(safeCell(row, idx.LenZ));
    const dims = [lx, ly, lz].sort((a, b) => a - b);
    
    // Thickness Guard
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
    let msg = '⚠️ OVERSIZED PLANKS DETECTED!\n\nFound ' + count + ' oversized items.\nStrictly checked Level 2 only.';
    if (level0SkipCount > 0) {
      msg += '\n(Skipped ' + level0SkipCount + ' Level 0 rows)';
    }
    SpreadsheetApp.getUi().alert(msg);
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

// ---------- Sync helpers: key = (room_name, box_name, plank_name, box_model, occurrence) ----------
function getFormattedSyncColumnIndices(headers) {
  const h = headers.map(function (x) { return String(x || '').trim(); });
  const room_name = h.indexOf(SYNC_COL_ROOM_NAME);
  const box_name = h.indexOf(SYNC_COL_BOX_NAME);
  const box_model = h.indexOf(SYNC_COL_BOX_MODEL);
  const plank_name = h.indexOf(SYNC_COL_PLANK_NAME);
  const plank_id = h.indexOf(SYNC_COL_PLANK_ID);
  if (room_name === -1 || box_name === -1 || plank_name === -1 || plank_id === -1) return null;
  return { room_name: room_name, box_name: box_name, box_model: box_model, plank_name: plank_name, plank_id: plank_id };
}

function getRawPlankRowsForSync(rawValues) {
  if (!rawValues || rawValues.length < 2) return [];
  const headers = rawValues[0].map(function (h) { return String(h).trim(); });
  const colEntity = headers.indexOf(SYNC_RAW_ENTITY_NAME);
  const colLevel = headers.indexOf(SYNC_RAW_LEVEL);
  const colRoom = headers.indexOf(SYNC_RAW_ROOM);
  const colBoxModel = headers.indexOf(SYNC_RAW_BOX_MODEL);
  if (colEntity === -1 || colLevel === -1) return [];
  const result = [];
  let currentBox = '';
  let currentRoom = '';
  let currentBoxModel = '';
  for (let i = 1; i < rawValues.length; i++) {
    const level = rawValues[i][colLevel];
    const entityName = String(rawValues[i][colEntity] != null ? rawValues[i][colEntity] : '').trim();
    if (Number(level) === 1) {
      currentBox = entityName;
      currentRoom = colRoom >= 0 ? String(rawValues[i][colRoom] != null ? rawValues[i][colRoom] : '').trim() : '';
      currentBoxModel = colBoxModel >= 0 ? String(rawValues[i][colBoxModel] != null ? rawValues[i][colBoxModel] : '').trim() : '';
    } else if (Number(level) === 2) {
      result.push({ sheetRow: i + 1, room: currentRoom, box_name: currentBox, box_model: currentBoxModel, plank_name: entityName });
    }
  }
  return result;
}

function makeSyncKey(room, boxName, plankName, boxModel, occurrence) {
  return (room || '') + '\t' + (boxName || '') + '\t' + (plankName || '') + '\t' + (boxModel != null ? boxModel : '') + '\t' + occurrence;
}

function findRawRowForPlankSync(ss, roomName, boxName, plankName, boxModel, occurrence) {
  const rawSheet = ss.getSheetByName(SYNC_RAW_SHEET);
  if (!rawSheet) return null;
  const rawValues = rawSheet.getDataRange().getValues();
  const planks = getRawPlankRowsForSync(rawValues);
  let count = 0;
  for (let k = 0; k < planks.length; k++) {
    const p = planks[k];
    if ((p.room || '') === (roomName || '') && p.box_name === boxName && p.plank_name === plankName && (p.box_model || '') === (boxModel || '')) {
      count++;
      if (count === occurrence) return p.sheetRow;
    }
  }
  return null;
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

function detectOperationType(entName) {
  const nameStr = (entName || '').toLowerCase();
  // VB Main variations
  if (/vb_?main|vbmin|vb min|vbm|main_?vb/.test(nameStr)) return 'vb_main';
  // VB Double variations
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
  
  // L-cut triplet subtypes
  if (/l_cut_start|lcut_start/.test(nameStr)) return 'l_cut_start';
  if (/l_cut_center|l_cut_centre|lcut_center|lcut_centre/.test(nameStr)) return 'l_cut_center';
  if (/l_cut_end|lcut_end/.test(nameStr)) return 'l_cut_end';
  // Legacy L-cut fallback
  if (/l_cutting|lcutting|l_groove/.test(nameStr)) return 'l_cutting_legacy';
  // Incut / inplank hole (2-point line or 4-point rectangle, auto-detected from geometry)
  // Compatible with face, vertical, and horizontal planks via flattenIncutCoordinates(plankType)
  if (/inplank_hole|inplank_cut|incut_hole|incut_cut|inclined_cut|internal.?cut|internal_cut/.test(nameStr)) return 'incut_hole';
  if (/hole|drilled|bore/.test(nameStr)) return 'hole';
  return 'hole';
}

function findMaxOperationCounts(rawValues, idx) {
  const plankOpCounter = {};
  const plankLCutTripletCounter = {};
  const plankGolaProfileCounter = {};
  const plankIncutCounter = {};
  let currentBox = null;
  let currentPlank = null;
  
  for (let r = 1; r < rawValues.length; r++) {
    const row = rawValues[r];
    const rowData = parseRowData(row, idx);
    
    // Get level from column or fallback
    const level = getRowLevel(row, idx);
    
    // HARD STOP: Skip Level 0 entirely
    if (level === 0) continue;
    
    if (level === 1) {
      currentBox = { box_name: rowData.entity_name };
      currentPlank = null;
    } else if (level === 2) {
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
        } else if (opType === 'incut_hole') {
          plankIncutCounter[plankKey] = (plankIncutCounter[plankKey] || 0) + 1;
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
  
  // Calculate max L-cut triplets
  let maxLCutTriplets = 0;
  for (const plankKey in plankLCutTripletCounter) {
    const tripletData = plankLCutTripletCounter[plankKey];
    const completeTriplets = Math.min(tripletData.starts, tripletData.centers, tripletData.ends);
    if (completeTriplets > maxLCutTriplets) {
      maxLCutTriplets = completeTriplets;
    }
  }
  maxCounts.l_cut = maxLCutTriplets;
  
  // Calculate max Gola profile triplets
  let maxGolaProfileTriplets = 0;
  for (const plankKey in plankGolaProfileCounter) {
    const tripletData = plankGolaProfileCounter[plankKey];
    const completeTriplets = Math.min(tripletData.starts, tripletData.centers, tripletData.ends);
    if (completeTriplets > maxGolaProfileTriplets) {
      maxGolaProfileTriplets = completeTriplets;
    }
  }
  maxCounts.gola_profile = maxGolaProfileTriplets;
  
  // Max incut cuts: auto-detect 2-point pairs vs 4-point rectangles per plank
  let maxIncutCuts = 0;
  let hasAnyFourPointCuts = false;
  for (const plankKey in plankIncutCounter) {
    const count = plankIncutCounter[plankKey];
    // If exactly divisible by 4, treat as 4-point rectangular cuts
    // Otherwise treat as 2-point line cuts
    let n;
    if (count >= 4 && count % 4 === 0) {
      n = count / 4;
      hasAnyFourPointCuts = true;
    } else {
      n = Math.floor(count / 2);
    }
    if (n > maxIncutCuts) maxIncutCuts = n;
  }
  maxCounts.incut_cut = maxIncutCuts;
  maxCounts.has_inplank = hasAnyFourPointCuts;
  
  return maxCounts;
}

function getPlankType(plankName) {
  const name = (plankName || '').toLowerCase();
  if (/left|right|vertical|maindummy|middle/.test(name)) return 'vertical';
  if (/door|back|skirting|drawfacia|drawfront|drawback|drawdummy|draw|dummy|tandemback/.test(name)) return 'face';
  if (/top|bottom|shelf|tandembottom/.test(name)) return 'horizontal';
  return 'auto';
}

function resolvePlankType(rowData, boxOrientation, plankName) {
  const nameType = getPlankType(plankName);
  if (nameType !== 'auto') return nameType;

  const { LenX, LenY, LenZ } = rowData || {};
  if (!(LenX > 0) || !(LenY > 0) || !(LenZ > 0)) return 'horizontal';

  if (boxOrientation === 'EW' || boxOrientation === 'NS') {
    const dims = [LenX, LenY, LenZ];
    const minDim = Math.min(...dims);
    if (minDim === LenZ) return 'horizontal';
    if (minDim === LenX) return 'vertical';
    if (minDim === LenY) return 'face';
  }
  return 'horizontal';
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

function flattenLCutCoordinates(rowData, plankType) {
  const { X: rawX, Y: rawY, Z: rawZ } = rowData;
  
  let faceX, faceY;
  
  if (plankType === 'horizontal') {
    faceX = rawY;
    faceY = rawX;
  } else if (plankType === 'vertical') {
    faceX = rawY;
    faceY = rawZ;
  } else {
    faceX = rawX;
    faceY = rawY;
  }
  
  return { faceX, faceY };
}

/**
 * Maps raw (X,Y,Z) to face (faceX, faceY) for incut points.
 * Same convention as L-cuts/Gola: thickness axis is dropped; face plane used for cutting.
 * Compatible with all plank types: face (e.g. door), vertical, horizontal.
 */
function flattenIncutCoordinates(rowData, plankType) {
  const { X: rawX, Y: rawY, Z: rawZ } = rowData;

  switch (plankType) {
    case 'horizontal':
      return { faceX: rawY, faceY: rawX };   // thickness = Z; face = (Y, X)
    case 'vertical':
      return { faceX: rawY, faceY: rawZ };   // thickness = X; face = (Y, Z)
    case 'face':
      return { faceX: rawX, faceY: rawZ };   // thickness = Y; face = (X, Z) e.g. door
    case 'auto':
    default:
      return { faceX: rawY, faceY: rawX };  // fallback: same as horizontal
  }
}

function transformCoordinates(rowData, currentBox, plankName, plankType, opType, plankThickness, plankOffset, finalPlankWidth) {
  const { X: rawX, Y: rawY, Z: rawZ, LenX, LenY, LenZ } = rowData;

  let rawFaceX, rawFaceY, rawFaceDimL, rawFaceDimW;
  let startZ;

  const lCutOpTypes = ['l_cut_start', 'l_cut_center', 'l_cut_end'];
  const golaProfileOpTypes = ['gola_profile_start', 'gola_profile_center', 'gola_profile_end'];
  const isLCut = lCutOpTypes.includes(opType) || golaProfileOpTypes.includes(opType);
  
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
    rawFaceY = isLCut ? rawY : rawZ;
    rawFaceDimL = LenX;
    rawFaceDimW = isLCut ? LenY : LenZ;
    startZ = isLCut ? LenZ : LenY;
  }

  let offset = Number(plankOffset);
  if (isNaN(offset) || offset < 0) offset = 0;

  if (offset > 0) {
    rawFaceX -= offset;
    rawFaceY -= offset;
  }

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
      box_model:     findColumnIndexFormatted(header, 'Box_Model'),
      Level:         findColumnIndexFormatted(header, 'Level')  // Level column
    };

    const requiredCols = ['entity_name', 'unit_location', 'material', 'LenX', 'LenY', 'LenZ', 'X', 'Y', 'Z'];
    const missing = requiredCols.filter(col => idx[col] === -1);
    if (missing.length > 0) throw new Error('Missing required columns: ' + missing.join(', ') + '.');

    // Check if Level column exists
    const hasLevelColumn = idx.Level !== -1;
    if (!hasLevelColumn) {
      Logger.log('WARNING: No "Level" column found. Using fallback pattern detection.');
    } else {
      Logger.log('Level column found at index ' + idx.Level + '. Using direct column reading.');
    }

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
    
    // L-cut triplet headers
    const maxLCutCount = maxOpCounts.l_cut || 0;
    for (let i = 1; i <= maxLCutCount; i++) {
      dynamicOpHeader.push(
        `L_cut_${i}_start_X`, `L_cut_${i}_start_Y`,
        `L_cut_${i}_center_X`, `L_cut_${i}_center_Y`,
        `L_cut_${i}_end_X`, `L_cut_${i}_end_Y`
      );
    }
    
    // Gola profile triplet headers
    const maxGolaProfileCount = maxOpCounts.gola_profile || 0;
    for (let i = 1; i <= maxGolaProfileCount; i++) {
      dynamicOpHeader.push(
        `Gola_profile_${i}_start_X`, `Gola_profile_${i}_start_Y`,
        `Gola_profile_${i}_center_X`, `Gola_profile_${i}_center_Y`,
        `Gola_profile_${i}_end_X`, `Gola_profile_${i}_end_Y`
      );
    }
    
    // Incut headers (point1/point2 always; point3/point4 added when 4-point inplank_holes exist)
    const maxIncutCount = maxOpCounts.incut_cut || 0;
    const hasInplankHoles = maxOpCounts.has_inplank || false;
    for (let i = 1; i <= maxIncutCount; i++) {
      dynamicOpHeader.push(
        `Incut_cut_${i}_point1_X`, `Incut_cut_${i}_point1_Y`,
        `Incut_cut_${i}_point2_X`, `Incut_cut_${i}_point2_Y`
      );
      if (hasInplankHoles) {
        dynamicOpHeader.push(
          `Incut_cut_${i}_point3_X`, `Incut_cut_${i}_point3_Y`,
          `Incut_cut_${i}_point4_X`, `Incut_cut_${i}_point4_Y`
        );
      }
    }
    
    // Legacy l_cutting columns
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
    
    const plankLCutCollector = {};
    const plankGolaProfileCollector = {};
    const plankIncutCollector = {};

    // Sequential plank_id - ONLY for Level 2
    let nextPlankId = 1;
    
    // Initialize plank_id column for writeback - all empty by default
    const rawPlankIdCol = [];
    for (let i = 1; i < rawValues.length; i++) {
      rawPlankIdCol.push(['']);
    }
    
    // Track Level 0 count
    let level0Count = 0;

    for (let r = 1; r < rawValues.length; r++) {
      const row = rawValues[r];
      const rowData = parseRowData(row, idx);
      
      // ============================================================
      // GET LEVEL FROM COLUMN (PRIMARY) OR FALLBACK TO PATTERN
      // ============================================================
      const level = getRowLevel(row, idx);

      // ============================================================
      // LEVEL 0: HARD STOP
      // - NEVER appear in formatted data
      // - NEVER get plank_id
      // ============================================================
      if (level === 0) {
        level0Count++;
        Logger.log('HARD STOP Level 0 at row ' + (r + 1) + ': ' + rowData.entity_name);
        continue;
      }

      // ============================================================
      // LEVEL 1: Boxes
      // ============================================================
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

      // ============================================================
      // LEVEL 2: Planks - ONLY these get plank_ids
      // ============================================================
      if (level === 2) {
        if (!currentBox) continue;
        const plank_name = rowData.entity_name || `Component_${r + 1}`;
        const plankType = resolvePlankType(rowData, currentBox.orientation, plank_name);
        const dims = calculateTransformedDimensions(rowData, currentBox.orientation, plankType);
        
        const plankKey = makePlankKey(currentBox, plank_name, r + 1);
        plankThicknessMap[plankKey] = dims.thickness;
        
        const materialRaw = rowData.material || '';
        const edgeBinding = applyEdgeBindingWithSettings(
          plank_name, materialRaw, dims.length, dims.width, dims.thickness, ebSettings
        );
        
        plankOffsetMap[plankKey] = edgeBinding.offset;

        // Sequential plank_id - no gaps
        const currentPlankId = String(nextPlankId);
        nextPlankId++;
        
        // Write back to raw data
        rawPlankIdCol[r - 1] = [currentPlankId];
        
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

      // ============================================================
      // LEVEL 3: Operations
      // ============================================================
      if (level === 3) {
        if (!currentPlank || !currentBox) continue;
        const opType = detectOperationType(rowData.entity_name);
        if (opType === 'other') continue;

        const plankKey = currentPlank.key;
        const plankOffset = plankOffsetMap[plankKey] || 0;
        const plankRowIndex = plankRowMap[plankKey];
        if (!plankRowIndex) continue;
        
        // Handle L-cut triplet types
        if (opType === 'l_cut_start' || opType === 'l_cut_center' || opType === 'l_cut_end') {
          if (!plankLCutCollector[plankKey]) {
            plankLCutCollector[plankKey] = { 
              starts: [], centers: [], ends: [], 
              rowIndex: plankRowIndex,
              finalWidth: currentPlank.finalWidth,
              finalLength: currentPlank.finalLength,
              ebOffset: plankOffset,
              plankName: currentPlank.name
            };
          }
          
          const { faceX, faceY } = flattenLCutCoordinates(rowData, currentPlank.type);
          const point = { x: faceX, y: faceY };
          
          if (opType === 'l_cut_start') plankLCutCollector[plankKey].starts.push(point);
          else if (opType === 'l_cut_center') plankLCutCollector[plankKey].centers.push(point);
          else if (opType === 'l_cut_end') plankLCutCollector[plankKey].ends.push(point);
          
          continue;
        }
        
        // Handle Gola profile triplet types
        if (opType === 'gola_profile_start' || opType === 'gola_profile_center' || opType === 'gola_profile_end') {
          if (!plankGolaProfileCollector[plankKey]) {
            plankGolaProfileCollector[plankKey] = { 
              starts: [], centers: [], ends: [], 
              rowIndex: plankRowIndex,
              finalWidth: currentPlank.finalWidth,
              finalLength: currentPlank.finalLength,
              ebOffset: plankOffset,
              plankName: currentPlank.name
            };
          }
          
          const { faceX, faceY } = flattenLCutCoordinates(rowData, currentPlank.type);
          const point = { x: faceX, y: faceY };
          
          if (opType === 'gola_profile_start') plankGolaProfileCollector[plankKey].starts.push(point);
          else if (opType === 'gola_profile_center') plankGolaProfileCollector[plankKey].centers.push(point);
          else if (opType === 'gola_profile_end') plankGolaProfileCollector[plankKey].ends.push(point);
          
          continue;
        }
        
        // Handle Incut / Inplank hole (auto-detect 2-point or 4-point from geometry)
        if (opType === 'incut_hole') {
          if (!plankIncutCollector[plankKey]) {
            plankIncutCollector[plankKey] = {
              points: [],
              rowIndex: plankRowIndex,
              finalWidth: currentPlank.finalWidth,
              finalLength: currentPlank.finalLength,
              ebOffset: plankOffset,
              plankName: currentPlank.name
            };
          }
          const { faceX, faceY } = flattenIncutCoordinates(rowData, currentPlank.type);
          plankIncutCollector[plankKey].points.push({ x: faceX, y: faceY });
          continue;
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
          
          Logger.log('Warning: Legacy L-cut detected for plank "' + currentPlank.name + '"');
          continue;
        }

        // Standard operations
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
    
    // Write L-cut triplets
    for (const plankKey in plankLCutCollector) {
      const collector = plankLCutCollector[plankKey];
      const { starts, centers, ends, rowIndex, finalWidth, finalLength, ebOffset, plankName } = collector;
      
      const numTriplets = Math.min(starts.length, centers.length, ends.length);
      
      if (starts.length !== centers.length || centers.length !== ends.length) {
        Logger.log('Warning: Incomplete L-cut triplets for plank "' + plankKey + '"');
      }
      
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
        
        // EB overshoot correction
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
          const tmp = start; start = end; end = tmp;
        }
        
        if (colStartX) outSheet.getRange(rowIndex, colStartX).setValue(formatCoordinate(start.x));
        if (colStartY) outSheet.getRange(rowIndex, colStartY).setValue(formatCoordinate(start.y));
        if (colCenterX) outSheet.getRange(rowIndex, colCenterX).setValue(formatCoordinate(center.x));
        if (colCenterY) outSheet.getRange(rowIndex, colCenterY).setValue(formatCoordinate(center.y));
        if (colEndX) outSheet.getRange(rowIndex, colEndX).setValue(formatCoordinate(end.x));
        if (colEndY) outSheet.getRange(rowIndex, colEndY).setValue(formatCoordinate(end.y));
      }
    }
    
    // Write Gola profile triplets
    for (const plankKey in plankGolaProfileCollector) {
      const collector = plankGolaProfileCollector[plankKey];
      const { starts, centers, ends, rowIndex, finalWidth, finalLength, ebOffset, plankName } = collector;
      
      const numTriplets = Math.min(starts.length, centers.length, ends.length);
      
      if (starts.length !== centers.length || centers.length !== ends.length) {
        Logger.log('Warning: Incomplete Gola profile triplets for plank "' + plankKey + '"');
      }
      
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
        
        // EB overshoot correction
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
          const tmp = start; start = end; end = tmp;
        }
        
        if (colStartX) outSheet.getRange(rowIndex, colStartX).setValue(formatCoordinate(start.x));
        if (colStartY) outSheet.getRange(rowIndex, colStartY).setValue(formatCoordinate(start.y));
        if (colCenterX) outSheet.getRange(rowIndex, colCenterX).setValue(formatCoordinate(center.x));
        if (colCenterY) outSheet.getRange(rowIndex, colCenterY).setValue(formatCoordinate(center.y));
        if (colEndX) outSheet.getRange(rowIndex, colEndX).setValue(formatCoordinate(end.x));
        if (colEndY) outSheet.getRange(rowIndex, colEndY).setValue(formatCoordinate(end.y));
      }
    }
    
    // Write Incut cuts (auto-detect: 4 points divisible by 4 → rectangles, otherwise → pairs of 2)
    for (const plankKey in plankIncutCollector) {
      const collector = plankIncutCollector[plankKey];
      const { points, rowIndex, finalWidth, finalLength, ebOffset, plankName } = collector;
      if (!points || points.length < 2) continue;

      let workingPoints = points.map(p => ({ x: p.x, y: p.y }));

      // Edge-aware EB adjustment: snap edge coordinates to 0 or finalDim,
      // subtract offset for interior coordinates (-ebX, -ebY).
      if (ebOffset > 0 && typeof finalWidth === 'number' && finalWidth > 0 && typeof finalLength === 'number' && finalLength > 0) {
        const rawWidth = finalWidth + 2 * ebOffset;
        const rawLength = finalLength + 2 * ebOffset;
        const SNAP_TOL = ebOffset + 1.5;

        workingPoints.forEach(p => {
          if (p.x <= SNAP_TOL) {
            p.x = 0;
          } else if (rawWidth > 0 && p.x >= rawWidth - SNAP_TOL) {
            p.x = finalWidth;
          } else {
            p.x -= ebOffset;
          }

          if (p.y <= SNAP_TOL) {
            p.y = 0;
          } else if (rawLength > 0 && p.y >= rawLength - SNAP_TOL) {
            p.y = finalLength;
          } else {
            p.y -= ebOffset;
          }
        });
      }

      const pName = String(plankName || '').toLowerCase();
      const shouldMirror = pName.includes('right') || pName.includes('bottom') || pName.includes('door');
      const isFourPointMode = workingPoints.length >= 4 && workingPoints.length % 4 === 0;

      let cutNum = 0;

      if (isFourPointMode) {
        // 4-point rectangular cuts - sort into clockwise winding order
        for (let i = 0; i + 3 < workingPoints.length; i += 4) {
          const raw = [
            { x: workingPoints[i].x, y: workingPoints[i].y },
            { x: workingPoints[i + 1].x, y: workingPoints[i + 1].y },
            { x: workingPoints[i + 2].x, y: workingPoints[i + 2].y },
            { x: workingPoints[i + 3].x, y: workingPoints[i + 3].y }
          ];
          // Sort into proper rectangle winding: BL → BR → TR → TL (clockwise)
          const minX = Math.min(...raw.map(p => p.x));
          const maxX = Math.max(...raw.map(p => p.x));
          const minY = Math.min(...raw.map(p => p.y));
          const maxY = Math.max(...raw.map(p => p.y));
          // pts are already in EB-adjusted space (workingPoints were adjusted above)
          let pts = [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY }
          ];

          if (shouldMirror && typeof finalWidth === 'number') {
            pts = pts.map(p => ({ x: finalWidth - p.x, y: p.y }));
            pts.reverse();
          }

          cutNum++;
          for (let pi = 0; pi < 4; pi++) {
            const colX = outHeaderMap[`Incut_cut_${cutNum}_point${pi + 1}_X`];
            const colY = outHeaderMap[`Incut_cut_${cutNum}_point${pi + 1}_Y`];
            if (colX) outSheet.getRange(rowIndex, colX).setValue(formatCoordinate(pts[pi].x));
            if (colY) outSheet.getRange(rowIndex, colY).setValue(formatCoordinate(pts[pi].y));
          }
        }
      } else {
        // 2-point line cuts
        for (let i = 0; i + 1 < workingPoints.length; i += 2) {
          let p1 = { x: workingPoints[i].x, y: workingPoints[i].y };
          let p2 = { x: workingPoints[i + 1].x, y: workingPoints[i + 1].y };

          if (shouldMirror && typeof finalWidth === 'number') {
            p1.x = finalWidth - p1.x;
            p2.x = finalWidth - p2.x;
            const tmp = p1; p1 = p2; p2 = tmp;
          }

          cutNum++;
          const colP1X = outHeaderMap[`Incut_cut_${cutNum}_point1_X`];
          const colP1Y = outHeaderMap[`Incut_cut_${cutNum}_point1_Y`];
          const colP2X = outHeaderMap[`Incut_cut_${cutNum}_point2_X`];
          const colP2Y = outHeaderMap[`Incut_cut_${cutNum}_point2_Y`];
          if (colP1X) outSheet.getRange(rowIndex, colP1X).setValue(formatCoordinate(p1.x));
          if (colP1Y) outSheet.getRange(rowIndex, colP1Y).setValue(formatCoordinate(p1.y));
          if (colP2X) outSheet.getRange(rowIndex, colP2X).setValue(formatCoordinate(p2.x));
          if (colP2Y) outSheet.getRange(rowIndex, colP2Y).setValue(formatCoordinate(p2.y));
        }
      }
    }

    // Write plank_id column back to raw sheet
    rawSheet.getRange(2, plankIdCol1, rawPlankIdCol.length, 1).setValues(rawPlankIdCol);

    formatOutputSheet(outSheet, outHeader.length);
    
    // Success message
    let successMessage = 'Formatting complete! (Sequential IDs - Level 2 only)';
    if (level0Count > 0) {
      successMessage += '\n\n⛔ HARD STOPPED ' + level0Count + ' Level 0 row(s).\nThey have NO plank_id and are NOT in formatted data.';
    }
    showToast(successMessage, 'Success', 5);

  } catch (e) {
    Logger.log(e);
    showAlert('An error occurred: ' + e.message);
  }
}

// =================================================================
// ===================  FORMATTED-TO-RAW PLANK_ID SYNC  ============
// =================================================================
// When plank_id is edited in Formatted_Plank_Data, update raw data last column only.
// Match by box_name + plank_name. No new IDs — sync existing plank_id column value.

function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SYNC_FORMATTED_SHEET) return;
  const ss = e.source;
  const formattedData = sheet.getDataRange().getValues();
  if (formattedData.length < 2) return;
  const headers = formattedData[0].map(function (h) { return String(h).trim(); });
  const cols = getFormattedSyncColumnIndices(headers);
  if (!cols) return;
  const plankIdColSheet = cols.plank_id + 1;
  if (e.range.getColumn() !== plankIdColSheet) return;
  const rawSheet = ss.getSheetByName(SYNC_RAW_SHEET);
  if (!rawSheet) return;
  const lastCol = rawSheet.getLastColumn();
  if (lastCol < 1) return;
  const editedRow1 = e.range.getRow();
  const numRows = e.range.getNumRows();
  for (let r = 0; r < numRows; r++) {
    const sheetRow = editedRow1 + r;
    const dataIndex = sheetRow - 1;
    if (dataIndex < 1 || dataIndex >= formattedData.length) continue;
    const rowData = formattedData[dataIndex];
    const room_name = String(rowData[cols.room_name] != null ? rowData[cols.room_name] : '').trim();
    const box_name = String(rowData[cols.box_name] != null ? rowData[cols.box_name] : '').trim();
    const box_model = cols.box_model >= 0 ? String(rowData[cols.box_model] != null ? rowData[cols.box_model] : '').trim() : '';
    const plank_name = String(rowData[cols.plank_name] != null ? rowData[cols.plank_name] : '').trim();
    const plankIdValue = rowData[cols.plank_id];
    const valueToWrite = (plankIdValue !== null && plankIdValue !== undefined && plankIdValue !== '') ? String(plankIdValue) : '';
    let occurrence = 0;
    for (let j = 1; j <= dataIndex; j++) {
      const rn = String(formattedData[j][cols.room_name] != null ? formattedData[j][cols.room_name] : '').trim();
      const bn = String(formattedData[j][cols.box_name] != null ? formattedData[j][cols.box_name] : '').trim();
      const bm = cols.box_model >= 0 ? String(formattedData[j][cols.box_model] != null ? formattedData[j][cols.box_model] : '').trim() : '';
      const pn = String(formattedData[j][cols.plank_name] != null ? formattedData[j][cols.plank_name] : '').trim();
      if (rn === room_name && bn === box_name && pn === plank_name && (bm || '') === (box_model || '')) occurrence++;
    }
    const rawRow = findRawRowForPlankSync(ss, room_name, box_name, plank_name, box_model, occurrence);
    if (rawRow != null) rawSheet.getRange(rawRow, lastCol).setValue(valueToWrite);
  }
}

function syncAllPlankIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formattedSheet = ss.getSheetByName(SYNC_FORMATTED_SHEET);
  const rawSheet = ss.getSheetByName(SYNC_RAW_SHEET);
  if (!formattedSheet) { showAlert('Sheet "' + SYNC_FORMATTED_SHEET + '" not found.'); return; }
  if (!rawSheet) { showAlert('Sheet "' + SYNC_RAW_SHEET + '" not found.'); return; }
  const formattedValues = formattedSheet.getDataRange().getValues();
  if (formattedValues.length < 2) { showAlert('Formatted_Plank_Data has no data rows.'); return; }
  const rawValues = rawSheet.getDataRange().getValues();
  const lastCol = rawSheet.getLastColumn();
  if (lastCol < 1) return;
  const headers = formattedValues[0].map(function (h) { return String(h).trim(); });
  const cols = getFormattedSyncColumnIndices(headers);
  if (!cols) { showAlert('Formatted_Plank_Data missing column: room_name, box_name, plank_name, or plank_id.'); return; }
  const formattedMap = {};
  const countTriple = {};
  for (let i = 1; i < formattedValues.length; i++) {
    const row = formattedValues[i];
    const room_name = String(row[cols.room_name] != null ? row[cols.room_name] : '').trim();
    const box_name = String(row[cols.box_name] != null ? row[cols.box_name] : '').trim();
    const box_model = cols.box_model >= 0 ? String(row[cols.box_model] != null ? row[cols.box_model] : '').trim() : '';
    const plank_name = String(row[cols.plank_name] != null ? row[cols.plank_name] : '').trim();
    const plank_id = row[cols.plank_id];
    const tripleKey = (room_name || '') + '\t' + (box_name || '') + '\t' + (plank_name || '') + '\t' + (box_model || '');
    countTriple[tripleKey] = (countTriple[tripleKey] || 0) + 1;
    const occurrence = countTriple[tripleKey];
    const key = makeSyncKey(room_name, box_name, plank_name, box_model, occurrence);
    formattedMap[key] = (plank_id !== null && plank_id !== undefined && plank_id !== '') ? String(plank_id) : '';
  }
  const planks = getRawPlankRowsForSync(rawValues);
  const numRawRows = rawValues.length;
  const lastColValues = [];
  for (let i = 1; i < numRawRows; i++) lastColValues.push(rawValues[i][lastCol - 1]);
  const rawCountTriple = {};
  for (let p = 0; p < planks.length; p++) {
    const pl = planks[p];
    const tripleKey = (pl.room || '') + '\t' + (pl.box_name || '') + '\t' + (pl.plank_name || '') + '\t' + (pl.box_model || '');
    rawCountTriple[tripleKey] = (rawCountTriple[tripleKey] || 0) + 1;
    const occurrence = rawCountTriple[tripleKey];
    const key = makeSyncKey(pl.room, pl.box_name, pl.plank_name, pl.box_model, occurrence);
    const plankIdValue = formattedMap[key] !== undefined ? formattedMap[key] : '';
    const dataRowIndex = pl.sheetRow - 2;
    if (dataRowIndex >= 0 && dataRowIndex < lastColValues.length) lastColValues[dataRowIndex] = plankIdValue;
  }
  if (lastColValues.length > 0) {
    rawSheet.getRange(2, lastCol, lastColValues.length, 1).setValues(lastColValues.map(function (v) { return [v]; }));
  }
  showToast('Synced plank_id from Formatted_Plank_Data to raw data (last column).', 'Sync done', 3);
} 