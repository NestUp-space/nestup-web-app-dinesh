/**
 * visualization.gs
 * Wall-based Cabinet Installation Guide System
 *
 * UPDATED:
 * - Uses plank_id directly from "visual data" / "raw data" (NO lookup from Formatted_Plank_Data)
 * - Wall → Box → Plank hierarchy (NO centering)
 * - Material color coding
 * - Step-by-step assembly
 * - Works as Sheets popup + Deployable web app
 * - EDIT MODE: Move, Rotate planks and save to "visual data" tab
 * - BOX MOVE MODE: Move entire boxes and update all plank positions
 */

// ============================================
// VISUAL DATA TAB MANAGEMENT
// ============================================

/**
 * Create or get "visual data" tab (copy of raw data)
 */
function getOrCreateVisualDataTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let visualSheet = ss.getSheetByName('visual data');

  if (!visualSheet) {
    // Find the raw data source sheet
    let sourceSheet = ss.getSheetByName('raw data');
    if (!sourceSheet) sourceSheet = ss.getSheetByName('Raw Data');
    if (!sourceSheet) sourceSheet = ss.getSheetByName('raw_data');
    if (!sourceSheet) sourceSheet = ss.getActiveSheet();

    visualSheet = sourceSheet.copyTo(ss);
    visualSheet.setName('visual data');

    // Move to end
    ss.setActiveSheet(visualSheet);
    ss.moveActiveSheet(ss.getNumSheets());
  }

  return visualSheet;
}

/**
 * Reset visual data tab (delete and recreate from raw data)
 * Run this if you need to refresh the visual data
 */
function resetVisualDataTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const visualSheet = ss.getSheetByName('visual data');

  if (visualSheet) {
    ss.deleteSheet(visualSheet);
  }

  SpreadsheetApp.getUi().alert('Visual data tab deleted. Run showVisualization() to create fresh copy.');
}

/**
 * Debug function to check headers
 */
function debugHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  let msg = 'Headers found:\n\n';
  headers.forEach((h, i) => {
    msg += `Col ${i + 1}: "${h}"\n`;
  });

  SpreadsheetApp.getUi().alert(msg);
}

/**
 * Update plank position in visual data tab
 * Called from client-side when plank is moved/rotated
 */
function updatePlankPosition(rowIndex, newX, newY, newZ) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('visual data');

  if (!sheet) {
    return { success: false, error: 'visual data tab not found' };
  }

  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const lowerHeaders = headers.map(h => (h || '').toString().trim().toLowerCase());

    const xCol = lowerHeaders.indexOf('x') + 1;
    const yCol = lowerHeaders.indexOf('y') + 1;
    const zCol = lowerHeaders.indexOf('z') + 1;

    if (xCol > 0) sheet.getRange(rowIndex, xCol).setValue(newX + ' mm');
    if (yCol > 0) sheet.getRange(rowIndex, yCol).setValue(newY + ' mm');
    if (zCol > 0) sheet.getRange(rowIndex, zCol).setValue(newZ + ' mm');

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Update plank dimensions in visual data tab
 * Called from client-side when plank is resized (push/pull)
 */
function updatePlankDimensions(rowIndex, newLenX, newLenY, newLenZ) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('visual data');

  if (!sheet) {
    return { success: false, error: 'visual data tab not found' };
  }

  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const lowerHeaders = headers.map(h => (h || '').toString().trim().toLowerCase());

    const lenXCol = lowerHeaders.indexOf('lenx') + 1;
    const lenYCol = lowerHeaders.indexOf('leny') + 1;
    const lenZCol = lowerHeaders.indexOf('lenz') + 1;

    if (lenXCol > 0) sheet.getRange(rowIndex, lenXCol).setValue(newLenX + ' mm');
    if (lenYCol > 0) sheet.getRange(rowIndex, lenYCol).setValue(newLenY + ' mm');
    if (lenZCol > 0) sheet.getRange(rowIndex, lenZCol).setValue(newLenZ + ' mm');

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Update both position and dimensions
 */
function updatePlankFull(rowIndex, newX, newY, newZ, newLenX, newLenY, newLenZ) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('visual data');

  if (!sheet) {
    return { success: false, error: 'visual data tab not found' };
  }

  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const lowerHeaders = headers.map(h => (h || '').toString().trim().toLowerCase());

    const xCol = lowerHeaders.indexOf('x') + 1;
    const yCol = lowerHeaders.indexOf('y') + 1;
    const zCol = lowerHeaders.indexOf('z') + 1;
    const lenXCol = lowerHeaders.indexOf('lenx') + 1;
    const lenYCol = lowerHeaders.indexOf('leny') + 1;
    const lenZCol = lowerHeaders.indexOf('lenz') + 1;

    if (xCol > 0) sheet.getRange(rowIndex, xCol).setValue(newX + ' mm');
    if (yCol > 0) sheet.getRange(rowIndex, yCol).setValue(newY + ' mm');
    if (zCol > 0) sheet.getRange(rowIndex, zCol).setValue(newZ + ' mm');
    if (lenXCol > 0) sheet.getRange(rowIndex, lenXCol).setValue(newLenX + ' mm');
    if (lenYCol > 0) sheet.getRange(rowIndex, lenYCol).setValue(newLenY + ' mm');
    if (lenZCol > 0) sheet.getRange(rowIndex, lenZCol).setValue(newLenZ + ' mm');

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * UPDATE BOX POSITION - Move all planks in a box by a delta offset
 * Called from client-side when a box is moved
 * @param {Array} plankUpdates - Array of {rowIndex, newX, newY, newZ} for each plank
 */
function updateBoxPosition(plankUpdates) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('visual data');

  if (!sheet) {
    return { success: false, error: 'visual data tab not found' };
  }

  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const lowerHeaders = headers.map(h => (h || '').toString().trim().toLowerCase());

    const xCol = lowerHeaders.indexOf('x') + 1;
    const yCol = lowerHeaders.indexOf('y') + 1;
    const zCol = lowerHeaders.indexOf('z') + 1;

    if (xCol === 0 || yCol === 0 || zCol === 0) {
      return { success: false, error: 'X, Y, or Z columns not found' };
    }

    // Update each plank's position
    let updatedCount = 0;
    for (const update of plankUpdates) {
      const { rowIndex, newX, newY, newZ } = update;
      
      if (rowIndex && rowIndex > 1) {
        sheet.getRange(rowIndex, xCol).setValue(Math.round(newX) + ' mm');
        sheet.getRange(rowIndex, yCol).setValue(Math.round(newY) + ' mm');
        sheet.getRange(rowIndex, zCol).setValue(Math.round(newZ) + ' mm');
        updatedCount++;
      }
    }

    return { success: true, updatedCount: updatedCount };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Update the box row itself (Level 1) position
 * @param {number} boxRowIndex - Row index of the box (Level 1)
 * @param {number} newX - New X position
 * @param {number} newY - New Y position  
 * @param {number} newZ - New Z position
 */
function updateBoxRowPosition(boxRowIndex, newX, newY, newZ) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('visual data');

  if (!sheet) {
    return { success: false, error: 'visual data tab not found' };
  }

  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const lowerHeaders = headers.map(h => (h || '').toString().trim().toLowerCase());

    const xCol = lowerHeaders.indexOf('x') + 1;
    const yCol = lowerHeaders.indexOf('y') + 1;
    const zCol = lowerHeaders.indexOf('z') + 1;

    if (xCol > 0) sheet.getRange(boxRowIndex, xCol).setValue(Math.round(newX) + ' mm');
    if (yCol > 0) sheet.getRange(boxRowIndex, yCol).setValue(Math.round(newY) + ' mm');
    if (zCol > 0) sheet.getRange(boxRowIndex, zCol).setValue(Math.round(newZ) + ' mm');

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Update box and all its planks positions
 * @param {number} boxRowIndex - Row index of the box
 * @param {number} deltaX - Change in X
 * @param {number} deltaY - Change in Y
 * @param {number} deltaZ - Change in Z
 * @param {Array} plankUpdates - Array of {rowIndex, newX, newY, newZ}
 */
function updateBoxAndPlanksPosition(boxRowIndex, newBoxX, newBoxY, newBoxZ, plankUpdates) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('visual data');

  if (!sheet) {
    return { success: false, error: 'visual data tab not found' };
  }

  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const lowerHeaders = headers.map(h => (h || '').toString().trim().toLowerCase());

    const xCol = lowerHeaders.indexOf('x') + 1;
    const yCol = lowerHeaders.indexOf('y') + 1;
    const zCol = lowerHeaders.indexOf('z') + 1;

    if (xCol === 0 || yCol === 0 || zCol === 0) {
      return { success: false, error: 'X, Y, or Z columns not found' };
    }

    // Update the box row itself
    if (boxRowIndex && boxRowIndex > 1) {
      sheet.getRange(boxRowIndex, xCol).setValue(Math.round(newBoxX) + ' mm');
      sheet.getRange(boxRowIndex, yCol).setValue(Math.round(newBoxY) + ' mm');
      sheet.getRange(boxRowIndex, zCol).setValue(Math.round(newBoxZ) + ' mm');
    }

    // Update each plank's position
    let updatedCount = 0;
    for (const update of plankUpdates) {
      const { rowIndex, newX, newY, newZ } = update;
      
      if (rowIndex && rowIndex > 1) {
        sheet.getRange(rowIndex, xCol).setValue(Math.round(newX) + ' mm');
        sheet.getRange(rowIndex, yCol).setValue(Math.round(newY) + ' mm');
        sheet.getRange(rowIndex, zCol).setValue(Math.round(newZ) + ' mm');
        updatedCount++;
      }
    }

    return { success: true, updatedCount: updatedCount };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ============================================
// MAIN ENTRY POINTS
// ============================================

function showVisualization() {
  const ui = SpreadsheetApp.getUi();

  // Create or get visual data tab
  const visualSheet = getOrCreateVisualDataTab();
  const values = visualSheet.getDataRange().getValues();

  if (!values || values.length < 2) {
    ui.alert('No Data Found', 'The sheet is empty or has only a header row.', ui.ButtonSet.OK);
    return;
  }

  const headerIndex = parseHeaders(values[0]);
  if (!headerIndex) {
    ui.alert('Header Mismatch', 'Required columns not found.', ui.ButtonSet.OK);
    return;
  }

  const visualizationData = buildHierarchy(values, headerIndex);

  if (visualizationData.walls.length === 0) {
    ui.alert('No Walls Found', 'Could not find any Level 0 (Wall) data.', ui.ButtonSet.OK);
    return;
  }

  const missingCount = countMissingIds(visualizationData);
  if (missingCount > 0) {
    ui.alert(
      'Missing Plank IDs',
      `${missingCount} planks have no plank_id in raw/visual data.\n\nPlease generate IDs first in raw data.`,
      ui.ButtonSet.OK
    );
  }

  const template = HtmlService.createTemplateFromFile('index');
  template.data = JSON.stringify(visualizationData);

  const htmlOutput = template.evaluate()
    .setWidth(1400)
    .setHeight(850)
    .setTitle('Cabinet Installation Guide');

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Cabinet Installation Guide');
}

function doGet(e) {
  // Create or get visual data tab
  const visualSheet = getOrCreateVisualDataTab();
  const values = visualSheet.getDataRange().getValues();

  const headerIndex = parseHeaders(values[0]);
  if (!headerIndex) {
    return HtmlService.createHtmlOutput('<h1>Error: Invalid data format</h1>');
  }

  const visualizationData = buildHierarchy(values, headerIndex);

  const template = HtmlService.createTemplateFromFile('index');
  template.data = JSON.stringify(visualizationData);

  return template.evaluate()
    .setTitle('Cabinet Installation Guide')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

// ============================================
// HEADER PARSING
// ============================================

function parseHeaders(headerRow) {
  const rawHeaders = headerRow.map(h => (h || '').toString().trim());
  const lowerHeaders = rawHeaders.map(h => h.toLowerCase().replace(/\s+/g, ' '));

  const headerIndex = {};

  lowerHeaders.forEach((h, i) => {
    const normalized = h.replace(/[\s_]/g, '');

    if (normalized === 'entityname' || h === 'entity name' || h === 'entity_name') headerIndex['entity name'] = i;
    if (normalized === 'level' || h === 'level') headerIndex['level'] = i;
    if (normalized === 'material' || h === 'material') headerIndex['material'] = i;
    if (normalized === 'roomname' || h === 'room_name' || h === 'room name') headerIndex['room_name'] = i;
    if (normalized === 'unitlocation' || h === 'unit_location' || h === 'unit location') headerIndex['unit_location'] = i;
    if (normalized === 'boxmodel' || h === 'box_model' || h === 'box model') headerIndex['box_model'] = i;
    if (normalized === 'boxtype' || h === 'box_type' || h === 'box type') headerIndex['box_type'] = i;
    if (h === 'x') headerIndex['x'] = i;
    if (h === 'y') headerIndex['y'] = i;
    if (h === 'z') headerIndex['z'] = i;
    if (normalized === 'lenx' || h === 'len_x' || h === 'len x') headerIndex['lenx'] = i;
    if (normalized === 'leny' || h === 'len_y' || h === 'len y') headerIndex['leny'] = i;
    if (normalized === 'lenz' || h === 'len_z' || h === 'len z') headerIndex['lenz'] = i;

    // ✅ plank_id column (required now)
    if (normalized === 'plankid' || h === 'plank_id' || h === 'plank id') headerIndex['plank_id'] = i;
  });

  // Required headers (now includes plank_id)
  const requiredHeaders = [
    'level', 'entity name', 'material', 'room_name', 'unit_location',
    'box_model', 'box_type', 'x', 'y', 'z', 'lenx', 'leny', 'lenz',
    'plank_id'
  ];

  const missing = requiredHeaders.filter(req => headerIndex[req] === undefined);
  if (missing.length > 0) {
    console.log('Missing headers:', missing.join(', '));
    console.log('Found headers:', Object.keys(headerIndex).join(', '));
    console.log('Raw headers:', rawHeaders.join(' | '));
    return null;
  }

  return headerIndex;
}

function parseNumber(value) {
  const cleaned = String(value).replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// ============================================
// HIERARCHY BUILDER
// ============================================

function buildHierarchy(values, headerIndex) {
  const walls = [];
  let currentWall = null;
  let currentBox = null;
  let globalBoxId = 1;
  let wallId = 1;

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (row.every(cell => String(cell).trim() === '')) continue;

    const level = String(row[headerIndex['level']]).trim().toLowerCase();
    const entityName = String(row[headerIndex['entity name']] || '').trim();
    const material = String(row[headerIndex['material']] || '').trim();
    const roomName = String(row[headerIndex['room_name']] || '').trim();
    const unitLocation = String(row[headerIndex['unit_location']] || '').trim();
    const boxModel = String(row[headerIndex['box_model']] || '').trim();
    const boxType = String(row[headerIndex['box_type']] || '').trim();

    const X = parseNumber(row[headerIndex['x']]);
    const Y = parseNumber(row[headerIndex['y']]);
    const Z = parseNumber(row[headerIndex['z']]);
    const lenX = parseNumber(row[headerIndex['lenx']]);
    const lenY = parseNumber(row[headerIndex['leny']]);
    const lenZ = parseNumber(row[headerIndex['lenz']]);

    // Read plank_id directly from sheet row
    const rawPlankId = row[headerIndex['plank_id']];
    const plankId = (rawPlankId !== undefined && rawPlankId !== null && String(rawPlankId).trim() !== '')
      ? String(rawPlankId).trim()
      : null;

    // LEVEL 0: Wall
    if (level === '0' || level === 'wall') {
      if (currentWall) walls.push(currentWall);

      currentWall = {
        id: `wall_${wallId++}`,
        entityName: entityName,
        roomName: roomName,
        unitLocation: unitLocation,
        material: material,
        position: { x: X, y: Y, z: Z },
        dimensions: { lenX: lenX || 5000, lenY: lenY || 200, lenZ: lenZ || 3000 },
        boxes: [],
        rowIndex: r + 1
      };
      currentBox = null;
    }

    // LEVEL 1: Box
    else if ((level === '1' || level.startsWith('box')) && currentWall) {
      currentBox = {
        id: `box_${globalBoxId++}`,
        entityName: entityName,
        roomName: roomName,
        unitLocation: unitLocation,
        boxModel: boxModel,
        boxType: boxType,
        position: { x: X, y: Y, z: Z },
        dimensions: { lenX: lenX, lenY: lenY, lenZ: lenZ },
        planks: [],
        checklist: [],
        rowIndex: r + 1  // Store box row index for updating
      };
      currentWall.boxes.push(currentBox);
    }

    // LEVEL 2: Plank
    else if ((level === '2' || level.startsWith('plank')) && currentBox) {
      if (lenX <= 0 || lenY <= 0 || lenZ <= 0) continue;

      const plankRole = determinePlankRole(entityName);
      const materialColor = getMaterialColor(material);

      const plank = {
        id: plankId || 'NO ID',
        entityName: entityName,
        material: material,
        materialColor: materialColor,
        position: { x: X, y: Y, z: Z },
        dimensions: { lenX: lenX, lenY: lenY, lenZ: lenZ },
        role: plankRole,
        explodeDirection: getExplodeDirection(plankRole),
        assemblyDirection: getAssemblyDirection(plankRole),
        isDoor: plankRole === 'door',
        hingeSide: determineHingeSide(entityName),
        assemblyOrder: getAssemblyOrder(plankRole),
        autoGenerated: false,
        rowIndex: r + 1
      };

      currentBox.planks.push(plank);
      currentBox.checklist.push({
        id: plank.id,
        name: entityName,
        material: material,
        dimensions: `${lenX} × ${lenY} × ${lenZ}`,
        checked: false
      });
    }
    // LEVEL 3: Holes/Operations - IGNORED
  }

  if (currentWall) walls.push(currentWall);

  // Sort planks by assembly order
  walls.forEach(wall => {
    wall.boxes.forEach(box => {
      box.planks.sort((a, b) => a.assemblyOrder - b.assemblyOrder);
      box.planks.forEach((plank, index) => {
        plank.stepNumber = index + 1;
      });
      box.totalSteps = box.planks.length;
    });
  });

  const totalBoxes = walls.reduce((sum, w) => sum + w.boxes.length, 0);
  const totalPlanks = walls.reduce((sum, w) =>
    sum + w.boxes.reduce((s, b) => s + b.planks.length, 0), 0);

  // Material legend
  const materialsSet = new Set();
  walls.forEach(wall => {
    wall.boxes.forEach(box => {
      box.planks.forEach(plank => {
        if (plank.material) materialsSet.add(plank.material);
      });
    });
  });

  const materialLegend = Array.from(materialsSet).map(mat => ({
    name: mat,
    color: getMaterialColor(mat)
  }));

  return {
    walls: walls,
    materialLegend: materialLegend,
    summary: {
      totalWalls: walls.length,
      totalBoxes: totalBoxes,
      totalPlanks: totalPlanks,
      timestamp: new Date().toISOString(),
      autoGeneratedIds: 0
    }
  };
}

// ============================================
// ID HELPERS
// ============================================

function countMissingIds(visualizationData) {
  let count = 0;
  visualizationData.walls.forEach(wall => {
    wall.boxes.forEach(box => {
      box.planks.forEach(plank => {
        if (plank.id === 'NO ID') count++;
      });
    });
  });
  return count;
}

// ============================================
// OTHER HELPERS
// ============================================

function determinePlankRole(entityName) {
  const name = entityName.toLowerCase();
  if (name.includes('door')) return 'door';
  if (name.includes('bottom')) return 'bottom';
  if (name.includes('top')) return 'top';
  if (name.includes('left')) return 'left';
  if (name.includes('right')) return 'right';
  if (name.includes('back')) return 'back';
  if (name.includes('front')) return 'front';
  if (name.includes('shelf') || name.includes('plank')) return 'shelf';
  if (name.includes('skirting')) return 'skirting';
  if (name.includes('facia') || name.includes('fascia')) return 'facia';
  if (name.includes('draw') || name.includes('drawer')) return 'drawer';
  if (name.includes('dummy')) return 'dummy';
  return 'other';
}

function getExplodeDirection(role) {
  const d = 600;
  switch (role) {
    case 'left': return { x: -d, y: 0, z: 0 };
    case 'right': return { x: d, y: 0, z: 0 };
    case 'top': return { x: 0, y: 0, z: d };
    case 'bottom': return { x: 0, y: 0, z: -d };
    case 'back': return { x: 0, y: d, z: 0 };
    case 'front': case 'door': return { x: 0, y: -d, z: 0 };
    case 'shelf': return { x: 0, y: -d * 0.5, z: 0 };
    case 'skirting': return { x: 0, y: -d * 0.3, z: -d * 0.3 };
    case 'drawer': return { x: 0, y: -d * 0.7, z: 0 };
    default: return { x: 0, y: -d * 0.4, z: 0 };
  }
}

function getAssemblyDirection(role) {
  switch (role) {
    case 'left': return { arrow: '→', text: 'Place LEFT' };
    case 'right': return { arrow: '←', text: 'Place RIGHT' };
    case 'top': return { arrow: '↓', text: 'Place on TOP' };
    case 'bottom': return { arrow: '↑', text: 'Place at BOTTOM' };
    case 'back': return { arrow: '⟵', text: 'Place at BACK' };
    case 'front': case 'door': return { arrow: '⟶', text: 'Attach FRONT' };
    case 'shelf': return { arrow: '—', text: 'Insert SHELF' };
    case 'skirting': return { arrow: '↓', text: 'Fix SKIRTING' };
    case 'drawer': return { arrow: '⟶', text: 'Slide DRAWER' };
    default: return { arrow: '•', text: 'Place part' };
  }
}

function getAssemblyOrder(role) {
  const orderMap = {
    'skirting': 1, 'bottom': 2, 'left': 3, 'right': 4,
    'back': 5, 'top': 6, 'shelf': 7, 'dummy': 8,
    'facia': 9, 'drawer': 10, 'front': 11, 'door': 12, 'other': 7
  };
  return orderMap[role] || 7;
}

function determineHingeSide(entityName) {
  const name = entityName.toLowerCase();
  if (name.includes('left') || name.includes('_l')) return 'left';
  if (name.includes('right') || name.includes('_r')) return 'right';
  const doorMatch = name.match(/door\s*(\d+)/i);
  if (doorMatch) {
    return parseInt(doorMatch[1]) % 2 === 1 ? 'left' : 'right';
  }
  return 'right';
}

function getMaterialColor(material) {
  const materialColors = {
    '2632 SF Inner': '#DEB887',
    'BB EHGP 701': '#FFFFFF',
    '7070': '#E5E7EB',
    'EHGP 701': '#FAF9F6',
    'Color (Kitchen)': '#F5DEB3'
  };
  return materialColors[(material || '').trim()] || '#D1D5DB';
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}