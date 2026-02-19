// NOTE: Write numeric mm values as numbers (no ' mm' suffix) to avoid #VALUE! in formulas.

/**
 * visualization_enhanced.gs
 * SketchUp-Style Cabinet Designer - Phase 0+1+2+3
 * 
 * PHASE 0: Foundation & Sheet Structure
 * PHASE 1: Catalog & Box Placement
 * PHASE 2: Dynamic Component Options
 * PHASE 3: Material Selection System (NEW)
 * 
 * Sheet Structure:
 * - Central_Catalogue: Read-only template with formulas (external file)
 * - Central_Material_Catalogue: Material catalog (plywood, laminates) (external file)
 * - site_measurements: Wall definitions
 * - Design_Data: Working design with boxes and planks
 */

// ============================================
// CONFIGURATION
// ============================================

const DESIGNER_CONFIG = {
  // External Central_Catalogue file
  catalogueFileId: '1A9W8gsjkalw8DHwmkRsh33UnOy5Y0seAUhyDrWNWeKA',
  catalogueSheetName: 'Sheet1',

  // External Material Catalog file (NEW)
  materialCatalogFileId: '1BJnNmIwG8J07LJGhnWQJ-gJbENSGJ2ArRCxypJAGMto',
  materialSheets: {
    plywood: 'Plywood Library',
    laminate: 'Laminate Library',
    edgeband: 'Edgeband Library',
    hardware: 'Hardware Library'
  },

  sheets: {
    siteMeasurements: 'site_measurements',
    designData: 'Design_Data'
  },

  catalogueColumns: {
    entityName: 1,
    level: 2,
    material: 3,
    roomName: 4,
    unitLocation: 5,
    boxModel: 6,
    boxType: 7,
    lenX: 8,
    lenY: 9,
    lenZ: 10,
    x: 11,
    y: 12,
    z: 13,
    boxWidth: 14,
    boxDepth: 15,
    boxHeight: 16,
    skirting: 17,
    skirtingWidth: 18,
    carcusThickness: 19,
    doorThickness: 20,
    backplankThickness: 21,
    vbMainPosition: 22,
    vbDoublePosition: 23,
    screwPosition: 24,
    profileDepth: 25,
    profileWidth: 26,
    profileDistance: 27,
    rotZ: 28,
    carcusPly: 29,
    doorPly: 30,
    backPly: 31
  },

  // Plywood column mapping (for Material Catalog - Plywood Library sheet)
  plywoodColumns: {
    sno: 1,
    brand: 2,
    gradeType: 3,
    material: 4,
    thickness: 5,
    price: 6,
    remarks: 7
  },

  // Laminate column mapping (for Material Catalog - Laminate Library sheet)
  // Note: Row 1 is header, data starts from row 2
  laminateColumns: {
    sno: 1,         // Column A - S no:
    brand: 2,       // Column B - Brand
    code: 3,        // Column C - Laminate code
    colour: 4,      // Column D - Colour
    thickness: 5,   // Column E - Laminate thickness
    price: 6,       // Column F - Laminate Price
    photoUrl: 7,    // Column G - Laminate Photo (Google Drive URL)
    comments: 8     // Column H - Comments
  },

  // Core material types and their prefixes
  coreMaterials: {
    'Plywood': '',        // No prefix for plywood
    'Block Board': 'BB',
    'BB': 'BB',
    'MDF': 'MDF',
    'HDHMR': 'HDHMR'
  },

  // Wall Layout System Configuration (NEW)
  wallLayout: {
    spacing: 500,           // Gap between walls in mm
    floorExtension: 200,    // How far floor extends in front of wall
    defaultFloorY: 0,       // Ground level
    colors: [
      '#8B7355', '#6B8E23', '#4682B4', '#CD853F', '#708090',
      '#9370DB', '#20B2AA', '#DAA520', '#778899', '#BC8F8F'
    ],
    activeHighlight: '#FF6B00',
    labelHeight: 100        // Height above wall for label
  }
};

// Editable options configuration - UPDATED with material dropdowns
DESIGNER_CONFIG.editableOptions = [
  // Dimension options (number inputs)
  { key: 'boxWidth', header: 'box_width', label: 'Box Width', unit: 'mm', type: 'number' },
  { key: 'boxDepth', header: 'box_depth', label: 'Box Depth', unit: 'mm', type: 'number' },
  { key: 'boxHeight', header: 'box_height', label: 'Box Height', unit: 'mm', type: 'number' },
  { key: 'skirting', header: 'Skriting', label: 'Skirting Height', unit: 'mm', type: 'number' },
  { key: 'skirtingWidth', header: 'skriting_width', label: 'Skirting Width', unit: 'mm', type: 'number' },

  // Material selection options (dropdowns) - NEW
  { key: 'carcusPly', header: 'carcus_ply', label: 'Carcass Plywood', type: 'material-dropdown', category: 'plywood', thicknessTarget: 'carcusThickness' },
  { key: 'doorPly', header: 'door_ply', label: 'Door Plywood', type: 'material-dropdown', category: 'plywood', thicknessTarget: 'doorThickness' },
  { key: 'backPly', header: 'back_ply', label: 'Back Panel Plywood', type: 'material-dropdown', category: 'plywood', thicknessTarget: 'backplankThickness' },

  // Thickness options (read-only, auto-filled from material selection)
  { key: 'carcusThickness', header: 'carcus_thickness', label: 'Carcass Thickness', unit: 'mm', type: 'readonly', derivedFrom: 'carcusPly' },
  { key: 'doorThickness', header: 'door_thickness', label: 'Door Thickness', unit: 'mm', type: 'readonly', derivedFrom: 'doorPly' },
  { key: 'backplankThickness', header: 'backplank_thickness', label: 'Back Panel Thickness', unit: 'mm', type: 'readonly', derivedFrom: 'backPly' }
];


// ============================================
// MENU & ENTRY POINTS
// ============================================

function showDesigner() {
  initializeSheetsIfNeeded();

  const designerData = buildDesignerData();

  const htmlTemplate = HtmlService.createTemplateFromFile('designer_index');
  // Use JSON.stringify with proper escaping for HTML embedding
  var jsonStr = JSON.stringify(designerData);
  // No additional escaping needed - the scriptlet will output it directly as JS object
  htmlTemplate.designerDataJson = jsonStr;

  const htmlOutput = htmlTemplate.evaluate()
    .setWidth(1500)
    .setHeight(950)
    .setTitle('Cabinet 3D Designer - SketchUp Style');

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Cabinet 3D Designer');
}

function getDesignerDataForInit() {
  return buildDesignerData();
}

// ============================================
// MATERIAL CATALOG FUNCTIONS (NEW)
// ============================================

/**
 * Test connection to Material Catalog
 */
function testMaterialCatalogConnection() {
  const ui = SpreadsheetApp.getUi();

  try {
    const materialFile = SpreadsheetApp.openById(DESIGNER_CONFIG.materialCatalogFileId);
    const plywoodSheet = materialFile.getSheetByName(DESIGNER_CONFIG.materialSheets.plywood);

    if (!plywoodSheet) {
      ui.alert('Error', 'Connected to file but sheet "' + DESIGNER_CONFIG.materialSheets.plywood + '" not found.', ui.ButtonSet.OK);
      return;
    }

    const lastRow = plywoodSheet.getLastRow();
    const lastCol = plywoodSheet.getLastColumn();

    // Get sample data
    const sampleData = plywoodSheet.getRange(2, 1, Math.min(5, lastRow - 1), lastCol).getValues();

    ui.alert('Success',
      'Connected to Material Catalog!\n\n' +
      '📁 File: ' + materialFile.getName() + '\n' +
      '📄 Sheet: ' + DESIGNER_CONFIG.materialSheets.plywood + '\n' +
      '📊 Rows: ' + lastRow + '\n' +
      '📊 Columns: ' + lastCol + '\n\n' +
      'Sample entries:\n' +
      sampleData.slice(0, 3).map(row => `- ${row[1]} ${row[2]} ${row[3]} ${row[4]}mm`).join('\n'),
      ui.ButtonSet.OK);

  } catch (e) {
    ui.alert('Error',
      'Cannot connect to Material Catalog.\n\n' +
      'File ID: ' + DESIGNER_CONFIG.materialCatalogFileId + '\n\n' +
      'Error: ' + e.toString() + '\n\n' +
      'Please check:\n' +
      '1. The file ID is correct\n' +
      '2. You have view access to the file\n' +
      '3. The file has not been deleted',
      ui.ButtonSet.OK);
  }
}

/**
 * Test connection to Laminate Library
 */
function testLaminateLibraryConnection() {
  const ui = SpreadsheetApp.getUi();

  try {
    const result = getLaminateOptions();

    if (!result.success) {
      ui.alert('Error', 'Failed to connect: ' + result.error, ui.ButtonSet.OK);
      return;
    }

    const sampleLaminates = result.options.slice(0, 5);
    const sampleText = sampleLaminates.map(l =>
      '• ' + l.code + ' - ' + l.colour + ' (' + l.brand + ')'
    ).join('\n');

    ui.alert('Success',
      'Connected to Laminate Library!\n\n' +
      '📊 Total Laminates: ' + result.options.length + '\n\n' +
      'Sample entries:\n' + sampleText,
      ui.ButtonSet.OK);

  } catch (e) {
    ui.alert('Error', 'Cannot connect to Laminate Library.\n\nError: ' + e.toString(), ui.ButtonSet.OK);
  }
}


function getLaminateOptions() {
  try {
    // ✅ CORRECT - Use the config variable
    const ss = SpreadsheetApp.openById(DESIGNER_CONFIG.materialCatalogFileId);
    const sheet = ss.getSheetByName(DESIGNER_CONFIG.materialSheets.laminate);

    if (!sheet) {
      return { success: false, error: 'Laminate Library sheet not found' };
    }

    const data = sheet.getDataRange().getValues();

    // YOUR EXCEL STRUCTURE:
    // Index 0 (Row 1): Empty
    // Index 1 (Row 2): Empty
    // Index 2 (Row 3): Headers [S no:, Brand, Laminate code, Colour, ...]
    // Index 3 (Row 4): First data [1, Century, 5836 SL, ...]

    const options = [];

    // ✅ FIX: Start from index 3 (Row 4) - actual data
    for (let i = 3; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows
      if (!row[1] && !row[2]) continue;
      
      // Skip header row if accidentally included
      if (row[1] === 'Brand' || row[2] === 'Laminate code') continue;

      const rawPhotoUrl = row[6] || ''; // Column G = Laminate Photo
      const directPhotoUrl = convertDriveUrlToDirectLink(rawPhotoUrl);

      options.push({
        brand: String(row[1] || '').trim(),        // Column B = Brand
        code: String(row[2] || '').trim(),         // Column C = Laminate code
        colour: String(row[3] || '').trim(),       // Column D = Colour
        thickness: parseThickness(row[4]),          // Column E = Laminate thickness
        price: row[5] || 0,                         // Column F = Laminate Price
        photoUrl: directPhotoUrl,                   // Column G = Laminate Photo (CONVERTED!)
        comments: String(row[7] || '').trim()       // Column H = Comments
      });
    }

    Logger.log('✅ Loaded ' + options.length + ' laminates with photo URLs');

    return { success: true, options: options };

  } catch (e) {
    Logger.log('Error in getLaminateOptions: ' + e.toString());
    return { success: false, error: e.message };
  }
}

/**
 * Parse thickness string like "2 mm" to number 2
 */
function parseThickness(thicknessStr) {
  if (!thicknessStr) return 0;
  const match = String(thicknessStr).match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * ROBUST: Convert Google Drive view/share URL to direct image URL
 * Handles:
 * 1. https://drive.google.com/file/d/FILE_ID/view...
 * 2. https://drive.google.com/open?id=FILE_ID
 * 3. https://drive.google.com/uc?id=FILE_ID
 */
function convertDriveUrlToDirectLink(url) {
  if (!url || typeof url !== 'string') return '';

  // Clean whitespace
  url = url.trim();

  // 1. If it's already a direct link (uc?export=view), return it
  if (url.indexOf('drive.google.com/uc') > -1 && url.indexOf('export=view') > -1) {
    return url;
  }

  var fileId = '';

  // 2. Try to match /file/d/ID
  var matchFile = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) {
    fileId = matchFile[1];
  }
  // 3. Try to match id=ID
  else {
    var matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) {
      fileId = matchId[1];
    }
  }

  // If we found an ID, construct the direct link
  if (fileId) {
    return 'https://drive.google.com/uc?export=view&id=' + fileId;
  }

  // If no ID found, return original (will likely fail, but better than nothing)
  return url;
}

/**
 * Search laminates by code, colour, or brand
 */
function searchLaminates(searchTerm) {
  var result = getLaminateOptions();
  if (!result.success) return result;

  if (!searchTerm || searchTerm.trim() === '') {
    return result;
  }

  var term = searchTerm.toLowerCase().trim();

  var filtered = result.options.filter(function (opt) {
    var display = (opt.displayName || '').toLowerCase();
    return (
      opt.code.toLowerCase().includes(term) ||
      opt.colour.toLowerCase().includes(term) ||
      opt.brand.toLowerCase().includes(term) ||
      (display && display.includes(term))
    );
  });

  return { success: true, options: filtered };
}

/**
 * Get laminate details by code
 */
function getLaminateByCode(laminateCode) {
  if (!laminateCode) return null;

  var result = getLaminateOptions();
  if (!result.success) return null;

  for (var i = 0; i < result.options.length; i++) {
    if (result.options[i].code === laminateCode) {
      return result.options[i];
    }
  }
  return null;
}

/**
 * Compute the material string based on naming convention
 * @param {string} coreType - Plywood, BB, MDF, HDHMR
 * @param {string} outerLaminateCode - Outer side laminate code
 * @param {string} innerLaminateCode - Inner side laminate code (optional)
 * @returns {string} - Computed material string
 * 
 * Convention:
 * - BSL = Both Side Laminate (same on both sides)
 * - & = Different laminates (outer & inner)
 * - No BSL = Outer only (inner is default)
 * - Core prefix: BB, MDF, HDHMR (Plywood has none)
 */
function computeMaterialString(coreType, outerLaminateCode, innerLaminateCode) {
  if (!outerLaminateCode) return '';

  // Get core prefix
  var corePrefix = DESIGNER_CONFIG.coreMaterials[coreType] || '';

  var materialString = '';

  if (innerLaminateCode && innerLaminateCode !== outerLaminateCode) {
    // Different laminates on each side: [Core] OuterCode & InnerCode
    materialString = outerLaminateCode + ' & ' + innerLaminateCode;
  } else if (innerLaminateCode && innerLaminateCode === outerLaminateCode) {
    // Same laminate on both sides: [Core] BSL Code
    materialString = 'BSL ' + outerLaminateCode;
  } else {
    // Outer only (inner is default): [Core] Code
    materialString = outerLaminateCode;
  }

  // Add core prefix if not plywood
  if (corePrefix) {
    materialString = corePrefix + ' ' + materialString;
  }

  return materialString.trim();
}

/**
 * Parse material string back to components
 * @param {string} materialString - e.g., "BB BSL OAK-055" or "PNK-001 & WHT-002"
 * @returns {Object} - { coreType, outerCode, innerCode, isBSL }
 */
function parseMaterialString(materialString) {
  if (!materialString) {
    return { coreType: 'Plywood', outerCode: '', innerCode: '', isBSL: false };
  }

  var str = materialString.trim();
  var remaining = str;
  var coreType = 'Plywood';

  // Check for core prefix (BB, MDF, HDHMR)
  var corePrefixes = ['HDHMR', 'MDF', 'BB']; // Check longer ones first
  for (var i = 0; i < corePrefixes.length; i++) {
    var prefix = corePrefixes[i];
    if (str.indexOf(prefix + ' ') === 0) {
      coreType = prefix;
      remaining = str.substring(prefix.length + 1).trim();
      break;
    }
  }

  // Check for BSL (Both Side Laminate)
  if (remaining.indexOf('BSL ') === 0) {
    var code = remaining.substring(4).trim();
    return { coreType: coreType, outerCode: code, innerCode: code, isBSL: true };
  }

  // Check for & (different laminates)
  if (remaining.indexOf(' & ') !== -1) {
    var parts = remaining.split(' & ');
    return {
      coreType: coreType,
      outerCode: parts[0].trim(),
      innerCode: parts[1].trim(),
      isBSL: false
    };
  }

  // Just outer code (inner is default)
  return { coreType: coreType, outerCode: remaining, innerCode: '', isBSL: false };
}

/**
 * Update a single plank's material
 * @param {number} plankRowIndex - Row index in Design_Data (1-indexed)
 * @param {string} materialString - The computed material string
 * @returns {Object} - { success, message/error }
 */
function updatePlankMaterial(plankRowIndex, materialString) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  try {
    // Verify this is a level 2 row (plank)
    var level = parseFloat(designSheet.getRange(plankRowIndex, DESIGNER_CONFIG.catalogueColumns.level).getValue());
    if (level !== 2) {
      return { success: false, error: 'Can only update material for planks (level 2). Found level: ' + level };
    }

    // Update the material column
    designSheet.getRange(plankRowIndex, DESIGNER_CONFIG.catalogueColumns.material).setValue(materialString);

    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'Material updated to: ' + materialString,
      rowIndex: plankRowIndex
    };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Update multiple planks' material at once
 * @param {number[]} plankRowIndices - Array of row indices
 * @param {string} materialString - The computed material string
 * @returns {Object} - { success, updatedCount, message/error }
 */
function bulkUpdatePlankMaterials(plankRowIndices, materialString) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  if (!plankRowIndices || plankRowIndices.length === 0) {
    return { success: false, error: 'No plank rows specified' };
  }

  try {
    var updatedCount = 0;
    var errors = [];

    for (var i = 0; i < plankRowIndices.length; i++) {
      var rowIndex = plankRowIndices[i];

      // Verify this is a level 2 row (plank)
      var level = parseFloat(designSheet.getRange(rowIndex, DESIGNER_CONFIG.catalogueColumns.level).getValue());

      if (level !== 2) {
        errors.push('Row ' + rowIndex + ' is not a plank (level=' + level + ')');
        continue;
      }

      // Update the material column
      designSheet.getRange(rowIndex, DESIGNER_CONFIG.catalogueColumns.material).setValue(materialString);
      updatedCount++;
    }

    SpreadsheetApp.flush();

    return {
      success: true,
      updatedCount: updatedCount,
      message: 'Updated ' + updatedCount + ' planks to: ' + materialString,
      errors: errors.length > 0 ? errors : null
    };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Get the core type (plywood type) for a box
 * Reads from the box's carcusPly selection and extracts the material type
 */
function getBoxCoreType(boxRowIndex) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) return 'Plywood';

  try {
    var headerMap = getHeaderIndexMapCaseInsensitive(designSheet);
    var carcusPlyCol = headerMap['carcus_ply'];

    if (!carcusPlyCol) return 'Plywood';

    var carcusPlyValue = String(designSheet.getRange(boxRowIndex, carcusPlyCol).getValue() || '').toLowerCase();

    // Check what type of core material is selected
    if (carcusPlyValue.indexOf('block board') !== -1 || carcusPlyValue.indexOf('blockboard') !== -1) {
      return 'Block Board';
    } else if (carcusPlyValue.indexOf('mdf') !== -1) {
      return 'MDF';
    } else if (carcusPlyValue.indexOf('hdhmr') !== -1) {
      return 'HDHMR';
    }

    return 'Plywood';

  } catch (e) {
    Logger.log('Error getting box core type: ' + e.toString());
    return 'Plywood';
  }
}

/**
 * Extract core material type from plywood selection string
 * Uses Option A (keyword search) + Option C (material column fallback)
 * 
 * @param {string} plySelectionString - e.g., "Austin MR HDHMR 18mm" or "Century MDF 12mm"
 * @returns {string} - 'HDHMR', 'MDF', 'BB', or 'Plywood'
 */
function getCoreMaterialFromPlySelection(plySelectionString) {
  if (!plySelectionString || typeof plySelectionString !== 'string') {
    return 'Plywood';
  }

  var upperStr = plySelectionString.toUpperCase();

  // Option A: Search for keywords in display name (check longer keywords first)
  if (upperStr.indexOf('HDHMR') !== -1) {
    return 'HDHMR';
  }
  if (upperStr.indexOf('MDF') !== -1) {
    return 'MDF';
  }
  if (upperStr.indexOf('BLOCK BOARD') !== -1 || upperStr.indexOf('BLOCKBOARD') !== -1) {
    return 'BB';
  }
  if (upperStr.indexOf('BB ') !== -1 || upperStr.indexOf(' BB') !== -1 || upperStr === 'BB') {
    return 'BB';
  }

  // Option C: Fallback - look up in Plywood Library by display name
  var coreMaterial = lookupCoreMaterialFromLibrary(plySelectionString);
  if (coreMaterial) {
    return coreMaterial;
  }

  // Default to Plywood if nothing found
  return 'Plywood';
}

/**
 * Look up core material from Plywood Library sheet (Option C fallback)
 * @param {string} displayName - The plywood display name to look up
 * @returns {string|null} - Core material type or null if not found
 */
function lookupCoreMaterialFromLibrary(displayName) {
  if (!displayName) return null;

  try {
    var materialFile = SpreadsheetApp.openById(DESIGNER_CONFIG.materialCatalogFileId);
    var plywoodSheet = materialFile.getSheetByName(DESIGNER_CONFIG.materialSheets.plywood);

    if (!plywoodSheet) return null;

    var lastRow = plywoodSheet.getLastRow();
    if (lastRow <= 1) return null;

    var data = plywoodSheet.getRange(2, 1, lastRow - 1, 7).getValues();
    var cols = DESIGNER_CONFIG.plywoodColumns;

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var brand = String(row[cols.brand - 1] || '').trim();
      var gradeType = String(row[cols.gradeType - 1] || '').trim();
      var material = String(row[cols.material - 1] || '').trim();
      var thickness = parseFloat(row[cols.thickness - 1]) || 0;

      // Reconstruct display name to match
      var reconstructed = (brand + ' ' + gradeType + ' ' + material + ' ' + thickness + 'mm').replace(/\s+/g, ' ').trim();

      if (reconstructed === displayName || displayName.indexOf(brand) !== -1) {
        // Found match - check material column for core type
        var matUpper = material.toUpperCase();

        if (matUpper.indexOf('HDHMR') !== -1) return 'HDHMR';
        if (matUpper.indexOf('MDF') !== -1) return 'MDF';
        if (matUpper.indexOf('BLOCK') !== -1 || matUpper === 'BB') return 'BB';
        if (matUpper.indexOf('PLY') !== -1) return 'Plywood';

        // If material column has a value but doesn't match keywords
        if (material) {
          for (var key in DESIGNER_CONFIG.coreMaterials) {
            if (matUpper.indexOf(key.toUpperCase()) !== -1) {
              return key;
            }
          }
        }
      }
    }

    return null;
  } catch (e) {
    Logger.log('Error in lookupCoreMaterialFromLibrary: ' + e.toString());
    return null;
  }
}

/**
 * Determine the plank category based on entity name / role
 * @param {string} entityName - Plank entity name
 * @returns {string} - 'carcass', 'door', or 'back'
 */
function determinePlankCategory(entityName) {
  if (!entityName) return 'carcass';

  var name = entityName.toLowerCase();

  // Door category
  if (name.indexOf('door') !== -1 ||
    name.indexOf('shutter') !== -1 ||
    name.indexOf('drawer front') !== -1 ||
    name.indexOf('drawer_front') !== -1 ||
    name.indexOf('drawerfront') !== -1) {
    return 'door';
  }

  // Back category
  if (name.indexOf('back') !== -1 ||
    name.indexOf('backplank') !== -1 ||
    name.indexOf('back_plank') !== -1 ||
    name.indexOf('backpanel') !== -1 ||
    name.indexOf('back_panel') !== -1) {
    return 'back';
  }

  // Everything else is carcass
  return 'carcass';
}

/**
 * Get the appropriate core material for a plank based on its category
 * @param {number} boxRowIndex - Row index of parent box in Design_Data
 * @param {string} plankCategory - 'carcass', 'door', or 'back'
 * @returns {string} - Core material type
 */
function getCoreMaterialForPlankCategory(boxRowIndex, plankCategory) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet || !boxRowIndex) return 'Plywood';

  try {
    var headerMap = getHeaderIndexMapCaseInsensitive(designSheet);
    var plyColumnKey;

    switch (plankCategory) {
      case 'door':
        plyColumnKey = 'door_ply';
        break;
      case 'back':
        plyColumnKey = 'back_ply';
        break;
      case 'carcass':
      default:
        plyColumnKey = 'carcus_ply';
        break;
    }

    var plyCol = headerMap[plyColumnKey];
    if (!plyCol) {
      Logger.log('Column not found: ' + plyColumnKey);
      return 'Plywood';
    }

    var plyValue = String(designSheet.getRange(boxRowIndex, plyCol).getValue() || '');

    if (!plyValue) return 'Plywood';

    return getCoreMaterialFromPlySelection(plyValue);

  } catch (e) {
    Logger.log('Error in getCoreMaterialForPlankCategory: ' + e.toString());
    return 'Plywood';
  }
}

/**
 * Find the parent box row index for a plank
 */
function findParentBoxRow(plankRowIndex) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) return null;

  try {
    // Search backwards from plank row to find level 1 (box)
    for (var row = plankRowIndex - 1; row >= 2; row--) {
      var level = parseFloat(designSheet.getRange(row, DESIGNER_CONFIG.catalogueColumns.level).getValue());
      if (level === 1) {
        return row;
      }
      if (level === 0) {
        // Hit a wall without finding a box - shouldn't happen
        break;
      }
    }
    return null;
  } catch (e) {
    Logger.log('Error finding parent box: ' + e.toString());
    return null;
  }
}

/**
 * Apply laminate to plank with automatic core type detection based on plank category
 * @param {number} plankRowIndex - Row index of plank in Design_Data
 * @param {string} outerLaminateCode - Outer laminate code
 * @param {string} innerLaminateCode - Inner laminate code (optional)
 * @returns {Object} - Result object
 */
function applyLaminateToPlank(plankRowIndex, outerLaminateCode, innerLaminateCode) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  try {
    // Get plank entity name to determine category
    var entityName = String(designSheet.getRange(plankRowIndex, DESIGNER_CONFIG.catalogueColumns.entityName).getValue() || '');
    var plankCategory = determinePlankCategory(entityName);

    // Find parent box row to get ply selection
    var boxRowIndex = findParentBoxRow(plankRowIndex);

    // Get the appropriate core material based on plank category
    var coreType = 'Plywood';
    if (boxRowIndex) {
      coreType = getCoreMaterialForPlankCategory(boxRowIndex, plankCategory);
    }

    // Compute material string with correct core prefix
    var materialString = computeMaterialString(coreType, outerLaminateCode, innerLaminateCode || null);

    // Update the plank's material column
    designSheet.getRange(plankRowIndex, DESIGNER_CONFIG.catalogueColumns.material).setValue(materialString);

    SpreadsheetApp.flush();

    return {
      success: true,
      materialString: materialString,
      coreType: coreType,
      plankCategory: plankCategory,
      message: 'Material updated to: ' + materialString
    };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Apply laminate to multiple planks with category-aware core material
 * @param {number[]} plankRowIndices - Array of plank row indices
 * @param {string} outerLaminateCode - Outer laminate code
 * @param {string} innerLaminateCode - Inner laminate code (optional)
 * @returns {Object} - Result object
 */
function applyLaminateToMultiplePlanks(plankRowIndices, outerLaminateCode, innerLaminateCode) {
  if (!plankRowIndices || plankRowIndices.length === 0) {
    return { success: false, error: 'No planks specified' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  try {
    var updatedCount = 0;
    var errors = [];
    var materialStrings = {};

    for (var i = 0; i < plankRowIndices.length; i++) {
      var plankRowIndex = plankRowIndices[i];

      // Verify this is a level 2 row (plank)
      var level = parseFloat(designSheet.getRange(plankRowIndex, DESIGNER_CONFIG.catalogueColumns.level).getValue());

      if (level !== 2) {
        errors.push('Row ' + plankRowIndex + ' is not a plank (level=' + level + ')');
        continue;
      }

      // Get plank entity name to determine category
      var entityName = String(designSheet.getRange(plankRowIndex, DESIGNER_CONFIG.catalogueColumns.entityName).getValue() || '');
      var plankCategory = determinePlankCategory(entityName);

      // Find parent box row
      var boxRowIndex = findParentBoxRow(plankRowIndex);

      // Get the appropriate core material based on plank category
      var coreType = 'Plywood';
      if (boxRowIndex) {
        coreType = getCoreMaterialForPlankCategory(boxRowIndex, plankCategory);
      }

      // Compute material string
      var materialString = computeMaterialString(coreType, outerLaminateCode, innerLaminateCode || null);

      // Update the material column
      designSheet.getRange(plankRowIndex, DESIGNER_CONFIG.catalogueColumns.material).setValue(materialString);
      updatedCount++;

      // Track which material strings were used
      if (!materialStrings[materialString]) {
        materialStrings[materialString] = 0;
      }
      materialStrings[materialString]++;
    }

    SpreadsheetApp.flush();

    // Build summary
    var summaryParts = [];
    for (var ms in materialStrings) {
      summaryParts.push(ms + ' (' + materialStrings[ms] + ' planks)');
    }

    return {
      success: true,
      updatedCount: updatedCount,
      message: 'Updated ' + updatedCount + ' planks',
      materialSummary: summaryParts.join(', '),
      errors: errors.length > 0 ? errors : null
    };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}


/**
 * Get all plywood options from Material Catalog
 * Returns array of: { displayName: "Austin MR Plywood 18mm", thickness: 18, brand: "Austin", ... }
 */
function getPlywoodOptions() {
  try {
    const materialFile = SpreadsheetApp.openById(DESIGNER_CONFIG.materialCatalogFileId);
    const plywoodSheet = materialFile.getSheetByName(DESIGNER_CONFIG.materialSheets.plywood);

    if (!plywoodSheet) {
      return { success: false, error: 'Plywood Library sheet not found' };
    }

    const lastRow = plywoodSheet.getLastRow();
    if (lastRow <= 1) {
      return { success: true, options: [] };
    }

    const data = plywoodSheet.getRange(2, 1, lastRow - 1, 7).getValues();
    const cols = DESIGNER_CONFIG.plywoodColumns;

    const options = [];
    const seen = new Set(); // To avoid duplicates

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      const brand = String(row[cols.brand - 1] || '').trim();
      const gradeType = String(row[cols.gradeType - 1] || '').trim();
      const material = String(row[cols.material - 1] || '').trim();
      const thickness = parseFloat(row[cols.thickness - 1]) || 0;
      const price = parseFloat(row[cols.price - 1]) || 0;
      const remarks = String(row[cols.remarks - 1] || '').trim();

      // Skip rows with missing essential data
      if (!brand || !thickness) continue;

      // Create display name: "Brand Grade Material Thickness"
      // e.g., "Austin MR Plywood 18mm"
      const displayName = `${brand} ${gradeType} ${material} ${thickness}mm`.replace(/\s+/g, ' ').trim();

      // Skip duplicates
      if (seen.has(displayName)) continue;
      seen.add(displayName);

      options.push({
        displayName: displayName,
        thickness: thickness,
        brand: brand,
        gradeType: gradeType,
        material: material,
        price: price,
        remarks: remarks,
        rowIndex: i + 2 // 1-indexed, +1 for header
      });
    }

    // Sort by brand, then by thickness
    options.sort((a, b) => {
      if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
      if (a.gradeType !== b.gradeType) return a.gradeType.localeCompare(b.gradeType);
      return a.thickness - b.thickness;
    });

    return { success: true, options: options };

  } catch (e) {
    Logger.log('Error getting plywood options: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Get thickness from a material display name
 * @param {string} displayName - e.g., "Austin MR Plywood 18mm"
 * @returns {number} - thickness in mm, or 0 if not found
 */
function getThicknessFromMaterial(displayName) {
  if (!displayName) return 0;

  // Extract thickness from display name using regex
  const match = displayName.match(/(\d+(?:\.\d+)?)\s*mm/i);
  if (match) {
    return parseFloat(match[1]);
  }

  // If regex fails, look up in catalog
  const plywoodResult = getPlywoodOptions();
  if (plywoodResult.success) {
    const found = plywoodResult.options.find(opt => opt.displayName === displayName);
    if (found) return found.thickness;
  }

  return 0;
}




// ============================================
// SHEET INITIALIZATION
// ============================================

function initializeSheetsIfNeeded() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss.getSheetByName(DESIGNER_CONFIG.sheets.designData)) {
    createDesignDataSheet(ss);
  }
}

function testCatalogueConnection() {
  const ui = SpreadsheetApp.getUi();

  try {
    const catalogueFile = SpreadsheetApp.openById(DESIGNER_CONFIG.catalogueFileId);
    const catalogueSheet = catalogueFile.getSheetByName(DESIGNER_CONFIG.catalogueSheetName);

    if (!catalogueSheet) {
      ui.alert('Error', 'Connected to file but sheet "' + DESIGNER_CONFIG.catalogueSheetName + '" not found.', ui.ButtonSet.OK);
      return;
    }

    const lastRow = catalogueSheet.getLastRow();
    const lastCol = catalogueSheet.getLastColumn();

    const data = catalogueSheet.getRange(2, 2, lastRow - 1, 1).getValues();
    let boxCount = 0;
    for (let i = 0; i < data.length; i++) {
      if (parseFloat(data[i][0]) === 1) boxCount++;
    }

    ui.alert('Success',
      'Connected to Central_Catalogue!\n\n' +
      '📁 File: ' + catalogueFile.getName() + '\n' +
      '📄 Sheet: ' + DESIGNER_CONFIG.catalogueSheetName + '\n' +
      '📊 Rows: ' + lastRow + '\n' +
      '📊 Columns: ' + lastCol + '\n' +
      '📦 Boxes found: ' + boxCount,
      ui.ButtonSet.OK);

  } catch (e) {
    ui.alert('Error',
      'Cannot connect to Central_Catalogue.\n\n' +
      'File ID: ' + DESIGNER_CONFIG.catalogueFileId + '\n\n' +
      'Error: ' + e.toString() + '\n\n' +
      'Please check:\n' +
      '1. The file ID is correct\n' +
      '2. You have view access to the file\n' +
      '3. The file has not been deleted',
      ui.ButtonSet.OK);
  }
}

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  try {
    const catalogueFile = SpreadsheetApp.openById(DESIGNER_CONFIG.catalogueFileId);
    const catalogueSheet = catalogueFile.getSheetByName(DESIGNER_CONFIG.catalogueSheetName);
    if (!catalogueSheet) {
      ui.alert('Error', 'Sheet "' + DESIGNER_CONFIG.catalogueSheetName + '" not found in Central_Catalogue file.', ui.ButtonSet.OK);
      return;
    }
  } catch (e) {
    ui.alert('Error', 'Cannot access Central_Catalogue file. Please check the file ID and permissions.\n\nError: ' + e.toString(), ui.ButtonSet.OK);
    return;
  }

  const siteMeasurements = ss.getSheetByName(DESIGNER_CONFIG.sheets.siteMeasurements);
  if (!siteMeasurements) {
    ui.alert('Error', 'site_measurements sheet not found in this project. Please create it first.', ui.ButtonSet.OK);
    return;
  }

  createDesignDataSheet(ss);

  ui.alert('Success', 'Design_Data sheet has been initialized.\n\nCentral_Catalogue: Connected ✓\nMaterial_Catalogue: Connected ✓\nsite_measurements: Found ✓', ui.ButtonSet.OK);
}

function createDesignDataSheet(ss) {
  let sheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (sheet) {
    ss.deleteSheet(sheet);
  }

  sheet = ss.insertSheet(DESIGNER_CONFIG.sheets.designData);

  // Get headers from external Central_Catalogue file + add new material columns
  try {
    const catalogueFile = SpreadsheetApp.openById(DESIGNER_CONFIG.catalogueFileId);
    const catalogueSheet = catalogueFile.getSheetByName(DESIGNER_CONFIG.catalogueSheetName);

    if (catalogueSheet) {
      const headers = catalogueSheet.getRange(1, 1, 1, catalogueSheet.getLastColumn()).getValues()[0];

      // Add new material selection columns if not present
      const newHeaders = [...headers];
      const materialColumns = ['carcus_ply', 'door_ply', 'back_ply'];
      materialColumns.forEach(col => {
        if (!headers.some(h => String(h).toLowerCase().replace(/[_\s]/g, '') === col.replace(/_/g, ''))) {
          newHeaders.push(col);
        }
      });

      sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);

      sheet.getRange(1, 1, 1, newHeaders.length)
        .setBackground('#FF6B00')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold');
    }
  } catch (e) {
    Logger.log('Error accessing Central_Catalogue: ' + e.toString());
    // Set default headers if cannot access catalogue
    const defaultHeaders = ['Entity Name', 'level', 'Material', 'Room_Name', 'Unit_Location',
      'Box_Model', 'Box_Type', 'LenX', 'LenY', 'LenZ', 'X', 'Y', 'Z',
      'F_LenX', 'F_LenY', 'F_LenZ', 'F_X', 'F_Y', 'F_Z',
      'Box_width', 'Box_depth', 'Box_height', 'Skirting', 'Skirting_width',
      'carcus_thickness', 'door_thickness', 'backplank_thickness', 'RotZ',
      'carcus_ply', 'door_ply', 'back_ply'];
    sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
    sheet.getRange(1, 1, 1, defaultHeaders.length)
      .setBackground('#FF6B00')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
  }

  sheet.setFrozenRows(1);
  return sheet;
}

function resetDesign() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Reset Design',
    'This will delete all data in Design_Data sheet. Are you sure?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    createDesignDataSheet(ss);
    ui.alert('Design has been reset.');
  }
}

// ============================================
// CATALOG FUNCTIONS
// ============================================

function getCatalogBoxes() {
  try {
    const catalogueFile = SpreadsheetApp.openById(DESIGNER_CONFIG.catalogueFileId);
    const catalogue = catalogueFile.getSheetByName(DESIGNER_CONFIG.catalogueSheetName);

    if (!catalogue) {
      return { success: false, error: 'Sheet "' + DESIGNER_CONFIG.catalogueSheetName + '" not found in Central_Catalogue file' };
    }

    const data = catalogue.getDataRange().getValues();
    const boxes = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const level = parseFloat(row[DESIGNER_CONFIG.catalogueColumns.level - 1]);

 if (level === 1) {
        boxes.push({
          rowIndex: i + 1,
          entityName: row[DESIGNER_CONFIG.catalogueColumns.entityName - 1] || `Box ${boxes.length + 1}`,
          boxModel: row[DESIGNER_CONFIG.catalogueColumns.boxModel - 1] || '',
          boxType: row[DESIGNER_CONFIG.catalogueColumns.boxType - 1] || '',
          roomName: row[DESIGNER_CONFIG.catalogueColumns.roomName - 1] || '',
          boxWidth: parseNumber(row[DESIGNER_CONFIG.catalogueColumns.boxWidth - 1]),
          boxDepth: parseNumber(row[DESIGNER_CONFIG.catalogueColumns.boxDepth - 1]),
          boxHeight: parseNumber(row[DESIGNER_CONFIG.catalogueColumns.boxHeight - 1]),
          skirting: parseNumber(row[DESIGNER_CONFIG.catalogueColumns.skirting - 1]),
          skirtingWidth: parseNumber(row[DESIGNER_CONFIG.catalogueColumns.skirtingWidth - 1]),
          carcusThickness: parseNumber(row[DESIGNER_CONFIG.catalogueColumns.carcusThickness - 1]),
          doorThickness: parseNumber(row[DESIGNER_CONFIG.catalogueColumns.doorThickness - 1]),
          backplankThickness: parseNumber(row[DESIGNER_CONFIG.catalogueColumns.backplankThickness - 1]),
          // ADD THESE THREE NEW FIELDS:
          carcusPly: row[DESIGNER_CONFIG.catalogueColumns.carcusPly - 1] || '',
          doorPly: row[DESIGNER_CONFIG.catalogueColumns.doorPly - 1] || '',
          backPly: row[DESIGNER_CONFIG.catalogueColumns.backPly - 1] || ''
        });
      }
    }

    return { success: true, boxes: boxes };
  } catch (e) {
    return { success: false, error: 'Cannot access Central_Catalogue: ' + e.toString() };
  }
}

/**
 * Get full box data including all planks (level 2) and sub-components (level 3)
 * UPDATED: Now includes level 3 data and maintains exact row order
 */
function getBoxFullData(boxRowIndex) {
  try {
    const catalogueFile = SpreadsheetApp.openById(DESIGNER_CONFIG.catalogueFileId);
    const catalogue = catalogueFile.getSheetByName(DESIGNER_CONFIG.catalogueSheetName);

    if (!catalogue) {
      return { success: false, error: 'Sheet "' + DESIGNER_CONFIG.catalogueSheetName + '" not found in Central_Catalogue file' };
    }

    const data = catalogue.getDataRange().getValues();
    const formulas = catalogue.getDataRange().getFormulas();

    const boxData = {
      boxRow: null,
      planks: [],           // Level 2 rows (for backward compatibility)
      subComponents: [],    // Level 3 rows
      allRows: [],          // All child rows in order (level 2 and 3)
      startRow: boxRowIndex,
      endRow: boxRowIndex
    };

    // Get the box row (level 1)
    const boxRowData = data[boxRowIndex - 1];
    const boxRowFormulas = formulas[boxRowIndex - 1];

    boxData.boxRow = {
      level: 1,
      values: boxRowData,
      formulas: boxRowFormulas,
      rowIndex: boxRowIndex
    };

    let currentPlank = null;
    let currentPlankIndex = -1;

    // Iterate through rows after the box row
    for (let i = boxRowIndex; i < data.length; i++) {
      const row = data[i];
      const rowFormulas = formulas[i];
      const level = parseFloat(row[DESIGNER_CONFIG.catalogueColumns.level - 1]);
      const rowIndex = i + 1; // 1-indexed

      // Stop if we hit another box (level 1) or wall (level 0)
      if ((level === 1 || level === 0) && i > boxRowIndex - 1) {
        break;
      }

      if (level === 2) {
        // This is a plank
        currentPlankIndex++;
        currentPlank = {
          level: 2,
          values: row,
          formulas: rowFormulas,
          rowIndex: rowIndex,
          plankIndex: currentPlankIndex,
          subComponents: []
        };

        boxData.planks.push(currentPlank);
        boxData.allRows.push({
          level: 2,
          values: row,
          formulas: rowFormulas,
          rowIndex: rowIndex,
          plankIndex: currentPlankIndex,
          parentPlankIndex: null
        });
        boxData.endRow = rowIndex;

      } else if (level === 3) {
        // This is a sub-component (belongs to current plank)
        const subComponent = {
          level: 3,
          values: row,
          formulas: rowFormulas,
          rowIndex: rowIndex,
          parentPlankIndex: currentPlankIndex
        };

        // Add to current plank's subComponents array
        if (currentPlank) {
          currentPlank.subComponents.push(subComponent);
        }

        boxData.subComponents.push(subComponent);
        boxData.allRows.push({
          level: 3,
          values: row,
          formulas: rowFormulas,
          rowIndex: rowIndex,
          parentPlankIndex: currentPlankIndex
        });
        boxData.endRow = rowIndex;
      }
    }

    Logger.log(`getBoxFullData: Box at row ${boxRowIndex} has ${boxData.planks.length} planks and ${boxData.subComponents.length} sub-components`);

    return { success: true, data: boxData };
  } catch (e) {
    Logger.log('Error in getBoxFullData: ' + e.toString());
    return { success: false, error: 'Cannot access Central_Catalogue: ' + e.toString() };
  }
}

// ============================================
// BOX PLACEMENT FUNCTIONS
// ============================================

/**
 * Add box to design - UPDATED to include level 3 data
 * Maintains exact row order from catalogue (box -> planks -> sub-components)
 */
/**
 * Find the correct insert position for a new box under a specific wall section
 * Returns the row number where new box should be inserted
 * If wall doesn't exist, returns -1 (wall header needs to be created first)
 */
function findWallInsertPosition(wallName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);
  
  if (!designSheet || designSheet.getLastRow() <= 1) {
    Logger.log('findWallInsertPosition: Empty sheet, will create wall header at row 2');
    return { wallExists: false, insertRow: 2 };
  }
  
  const data = designSheet.getRange(2, 1, designSheet.getLastRow() - 1, 5).getValues();
  const normalizedWallName = String(wallName || '').trim().toLowerCase();
  
  let wallHeaderRow = -1;
  let wallSectionEnd = -1;
  let inTargetWallSection = false;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const level = parseFloat(row[1]);  // Level column
    const entityName = String(row[0] || '').trim().toLowerCase();
    const sheetRow = i + 2;  // Convert to 1-based sheet row
    
    if (level === 0) {
      // This is a wall header
      if (entityName === normalizedWallName) {
        // Found our target wall
        wallHeaderRow = sheetRow;
        inTargetWallSection = true;
        wallSectionEnd = sheetRow;  // Initialize to header row
      } else if (inTargetWallSection) {
        // We've hit the next wall header, so our section ended at previous row
        break;
      }
    } else if (inTargetWallSection) {
      // We're inside the target wall section, update the end position
      wallSectionEnd = sheetRow;
    }
  }
  
  if (wallHeaderRow === -1) {
    // Wall doesn't exist in Design_Data
    Logger.log('findWallInsertPosition: Wall "' + wallName + '" not found, will create header at end');
    return { wallExists: false, insertRow: designSheet.getLastRow() + 1 };
  }
  
  // Insert after the last row of this wall's section
  const insertRow = wallSectionEnd + 1;
  Logger.log('findWallInsertPosition: Wall "' + wallName + '" found at row ' + wallHeaderRow + ', insert at row ' + insertRow);
  
  return { wallExists: true, insertRow: insertRow, wallHeaderRow: wallHeaderRow };
}

function addBoxToDesign(catalogBoxRowIndex, wallName, position) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found. Please initialize sheets first.' };
  }

  const boxDataResult = getBoxFullData(catalogBoxRowIndex);
  if (!boxDataResult.success) {
    return boxDataResult;
  }

  const boxData = boxDataResult.data;
  
  // Find the correct insert position for this wall
  const insertInfo = findWallInsertPosition(wallName);
  let insertRow = insertInfo.insertRow;
  
  Logger.log('addBoxToDesign: Wall="' + wallName + '", insertInfo=' + JSON.stringify(insertInfo));

  // If wall header doesn't exist, create it first
  if (!insertInfo.wallExists) {
    const wallInfo = getWallInfo(wallName);
    if (wallInfo.success) {
      const wallRow = createWallRow(wallInfo.wall, wallName);
      
      // Insert wall header row
      if (insertRow <= designSheet.getLastRow()) {
        designSheet.insertRowBefore(insertRow);
      }
      designSheet.getRange(insertRow, 1, 1, wallRow.length).setValues([wallRow]);
      Logger.log('addBoxToDesign: Created wall header "' + wallName + '" at row ' + insertRow);
      insertRow++;
    } else {
      Logger.log('addBoxToDesign: Warning - wall info not found for "' + wallName + '", proceeding without header');
    }
  }

  const boxTargetRow = insertRow;
  
  // Calculate total rows to insert (box + children)
  const totalRowsToInsert = 1 + boxData.allRows.length;
  
  // Insert blank rows if we're inserting in the middle of the sheet
  if (insertRow <= designSheet.getLastRow()) {
    designSheet.insertRowsBefore(insertRow, totalRowsToInsert);
    Logger.log('addBoxToDesign: Inserted ' + totalRowsToInsert + ' rows at position ' + insertRow);
  }

  // Copy box row values
  const boxValues = [...boxData.boxRow.values];

  // Update position if provided (write to base X, Y, Z columns)
  if (position) {
    boxValues[DESIGNER_CONFIG.catalogueColumns.x - 1] = position.x;
    boxValues[DESIGNER_CONFIG.catalogueColumns.y - 1] = position.y;
    boxValues[DESIGNER_CONFIG.catalogueColumns.z - 1] = position.z;
  }
  
  // Set unitLocation to wallName for proper wall association
  boxValues[DESIGNER_CONFIG.catalogueColumns.unitLocation - 1] = wallName;

  // Write box row
  designSheet.getRange(insertRow, 1, 1, boxValues.length).setValues([boxValues]);
  insertRow++;

  // Insert all child rows (planks AND sub-components) in exact catalogue order
  for (const childRow of boxData.allRows) {
    const childValues = [...childRow.values];
    designSheet.getRange(insertRow, 1, 1, childValues.length).setValues([childValues]);

    // Apply adjusted formulas (for F_ columns and computed values)
    for (let col = 0; col < childRow.formulas.length; col++) {
      const formula = childRow.formulas[col];
      if (formula && formula.startsWith('=')) {
        const adjustedFormula = adjustFormulaToNewBoxRow(formula, boxData.boxRow.rowIndex, boxTargetRow);
        designSheet.getRange(insertRow, col + 1).setFormula(adjustedFormula);
      }
    }

    insertRow++;
  }

  SpreadsheetApp.flush();
  syncFinalToBaseColumns();

  const plankCount = boxData.planks.length;
  const subComponentCount = boxData.subComponents.length;
  const totalRows = 1 + plankCount + subComponentCount;

  return {
    success: true,
    boxRowIndex: boxTargetRow,
    wallName: wallName,
    message: `Box added at row ${boxTargetRow} under wall "${wallName}" (${plankCount} planks, ${subComponentCount} sub-components, ${totalRows} total rows)`
  };
}

/**
 * Add box to design with FULL intelligent defaults
 * This function applies all defaults from the frontend BoxDefaultsManager:
 * - Position (x, y, z)
 * - Box dimensions (boxWidth, boxDepth, boxHeight)
 * - Skirting (skirting, skirtingWidth)
 * - Thickness values (carcassThickness, doorThickness, backplankThickness)
 * - Material selections (carcusPly, doorPly, backPly)
 * 
 * @param {number} catalogBoxRowIndex - Row index in Central_Catalogue
 * @param {string} wallName - Target wall name
 * @param {object} defaults - Full defaults object from frontend
 * @returns {object} - Result with success status and applied defaults summary
 */
function addBoxToDesignWithDefaults(catalogBoxRowIndex, wallName, defaults) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found. Please initialize sheets first.' };
  }

  const boxDataResult = getBoxFullData(catalogBoxRowIndex);
  if (!boxDataResult.success) {
    return boxDataResult;
  }

  const boxData = boxDataResult.data;
  const c = DESIGNER_CONFIG.catalogueColumns;
  
  Logger.log('addBoxToDesignWithDefaults: Wall="' + wallName + '", defaults=' + JSON.stringify(defaults));
  
  // Find the correct insert position for this wall
  const insertInfo = findWallInsertPosition(wallName);
  let insertRow = insertInfo.insertRow;
  
  Logger.log('addBoxToDesignWithDefaults: insertInfo=' + JSON.stringify(insertInfo));

  // If wall header doesn't exist, create it first
  if (!insertInfo.wallExists) {
    const wallInfo = getWallInfo(wallName);
    if (wallInfo.success) {
      const wallRow = createWallRow(wallInfo.wall, wallName);
      
      // Insert wall header row
      if (insertRow <= designSheet.getLastRow()) {
        designSheet.insertRowBefore(insertRow);
      }
      designSheet.getRange(insertRow, 1, 1, wallRow.length).setValues([wallRow]);
      Logger.log('addBoxToDesignWithDefaults: Created wall header "' + wallName + '" at row ' + insertRow);
      insertRow++;
    } else {
      Logger.log('addBoxToDesignWithDefaults: Warning - wall info not found for "' + wallName + '", proceeding without header');
    }
  }

  const boxTargetRow = insertRow;
  
  // Calculate total rows to insert (box + children)
  const totalRowsToInsert = 1 + boxData.allRows.length;
  
  // Insert blank rows if we're inserting in the middle of the sheet
  if (insertRow <= designSheet.getLastRow()) {
    designSheet.insertRowsBefore(insertRow, totalRowsToInsert);
    Logger.log('addBoxToDesignWithDefaults: Inserted ' + totalRowsToInsert + ' rows at position ' + insertRow);
  }

  // Copy box row values
  const boxValues = [...boxData.boxRow.values];
  
  // Track what defaults were actually applied
  const appliedDefaults = {};

  // Apply position defaults
  if (defaults && defaults.position) {
    boxValues[c.x - 1] = (defaults.position.x || 0);
    boxValues[c.y - 1] = (defaults.position.y || 0);
    boxValues[c.z - 1] = (defaults.position.z || 0);
    appliedDefaults.position = defaults.position;
    Logger.log('addBoxToDesignWithDefaults: Applied position X=' + defaults.position.x + ', Y=' + defaults.position.y + ', Z=' + defaults.position.z);
  }
  
  // Apply box dimension defaults
  if (defaults && defaults.boxWidth !== undefined) {
    boxValues[c.boxWidth - 1] = defaults.boxWidth;
    appliedDefaults.boxWidth = defaults.boxWidth;
  }
  if (defaults && defaults.boxDepth !== undefined) {
    boxValues[c.boxDepth - 1] = defaults.boxDepth;
    appliedDefaults.boxDepth = defaults.boxDepth;
  }
  if (defaults && defaults.boxHeight !== undefined) {
    boxValues[c.boxHeight - 1] = defaults.boxHeight;
    appliedDefaults.boxHeight = defaults.boxHeight;
  }
  
  // Apply skirting defaults
  if (defaults && defaults.skirting !== undefined) {
    boxValues[c.skirting - 1] = defaults.skirting;
    appliedDefaults.skirting = defaults.skirting;
  }
  if (defaults && defaults.skirtingWidth !== undefined) {
    boxValues[c.skirtingWidth - 1] = defaults.skirtingWidth;
    appliedDefaults.skirtingWidth = defaults.skirtingWidth;
  }
  
  // Apply thickness defaults
  if (defaults && defaults.carcassThickness !== undefined) {
    boxValues[c.carcusThickness - 1] = defaults.carcassThickness;
    appliedDefaults.carcassThickness = defaults.carcassThickness;
  }
  if (defaults && defaults.doorThickness !== undefined) {
    boxValues[c.doorThickness - 1] = defaults.doorThickness;
    appliedDefaults.doorThickness = defaults.doorThickness;
  }
  if (defaults && defaults.backplankThickness !== undefined) {
    boxValues[c.backplankThickness - 1] = defaults.backplankThickness;
    appliedDefaults.backplankThickness = defaults.backplankThickness;
  }
  
  // Apply material defaults (ply selections)
  if (defaults && defaults.carcusPly) {
    boxValues[c.carcusPly - 1] = defaults.carcusPly;
    appliedDefaults.carcusPly = defaults.carcusPly;
  }
  if (defaults && defaults.doorPly) {
    boxValues[c.doorPly - 1] = defaults.doorPly;
    appliedDefaults.doorPly = defaults.doorPly;
  }
  if (defaults && defaults.backPly) {
    boxValues[c.backPly - 1] = defaults.backPly;
    appliedDefaults.backPly = defaults.backPly;
  }
  
  // Set unitLocation to wallName for proper wall association
  boxValues[c.unitLocation - 1] = wallName;

  // Write box row
  designSheet.getRange(insertRow, 1, 1, boxValues.length).setValues([boxValues]);
  insertRow++;

  // Insert all child rows (planks AND sub-components) in exact catalogue order
  for (const childRow of boxData.allRows) {
    const childValues = [...childRow.values];
    designSheet.getRange(insertRow, 1, 1, childValues.length).setValues([childValues]);

    // Apply adjusted formulas (for F_ columns and computed values)
    for (let col = 0; col < childRow.formulas.length; col++) {
      const formula = childRow.formulas[col];
      if (formula && formula.startsWith('=')) {
        const adjustedFormula = adjustFormulaToNewBoxRow(formula, boxData.boxRow.rowIndex, boxTargetRow);
        designSheet.getRange(insertRow, col + 1).setFormula(adjustedFormula);
      }
    }

    insertRow++;
  }

  SpreadsheetApp.flush();
  syncFinalToBaseColumns();

  const plankCount = boxData.planks.length;
  const subComponentCount = boxData.subComponents.length;
  const totalRows = 1 + plankCount + subComponentCount;

  Logger.log('addBoxToDesignWithDefaults: Success - applied defaults: ' + JSON.stringify(appliedDefaults));

  return {
    success: true,
    boxRowIndex: boxTargetRow,
    wallName: wallName,
    appliedDefaults: appliedDefaults,
    message: `Box added at row ${boxTargetRow} under wall "${wallName}" with intelligent defaults (${plankCount} planks, ${subComponentCount} sub-components, ${totalRows} total rows)`
  };
}

/**
 * Adjust formula references when copying from Central Catalogue to Design_Data
 * FIXED: Now handles ALL row references within the box group by calculating offset
 * 
 * @param {string} formula - The original formula
 * @param {number} originalBoxRow - The box row in Central Catalogue  
 * @param {number} newBoxRow - The box row in Design_Data
 */
function adjustFormulaToNewBoxRow(formula, originalBoxRow, newBoxRow) {
  if (!formula || !formula.startsWith('=')) {
    return formula;
  }

  let newFormula = formula;

  // Calculate the row offset (how much rows shifted)
  const rowOffset = newBoxRow - originalBoxRow;

  // If no offset, return original formula
  if (rowOffset === 0) {
    return formula;
  }

  // Find all cell references in the formula (handles both absolute $A$1 and relative A1)
  const cellRefRegex = /(\$?)([A-Z]+)(\$?)(\d+)/g;
  const replacements = [];
  let match;

  while ((match = cellRefRegex.exec(formula)) !== null) {
    const fullMatch = match[0];
    const dollarBeforeCol = match[1];
    const col = match[2];
    const dollarBeforeRow = match[3];
    const row = parseInt(match[4]);

    // Only adjust rows that are >= originalBoxRow (part of the box group)
    if (row >= originalBoxRow) {
      const newRow = row + rowOffset;
      const newRef = dollarBeforeCol + col + dollarBeforeRow + newRow;

      replacements.push({
        original: fullMatch,
        replacement: newRef,
        index: match.index,
        length: fullMatch.length
      });
    }
  }

  // Apply replacements in reverse order to maintain string positions
  replacements.sort((a, b) => b.index - a.index);

  for (const rep of replacements) {
    newFormula = newFormula.substring(0, rep.index) +
      rep.replacement +
      newFormula.substring(rep.index + rep.length);
  }

  return newFormula;
}

function needsWallHeader(designSheet, wallName) {
  const lastRow = designSheet.getLastRow();
  if (lastRow <= 1) return true;

  const data = designSheet.getRange(2, 1, lastRow - 1, 5).getValues();

  for (const row of data) {
    const level = parseFloat(row[1]);
    const name = row[0];
    if (level === 0 && name === wallName) {
      return false;
    }
  }

  return true;
}

function createWallRow(wallData, wallName) {
  const row = new Array(31).fill(''); // Increased to accommodate new columns
  row[DESIGNER_CONFIG.catalogueColumns.entityName - 1] = wallName;
  row[DESIGNER_CONFIG.catalogueColumns.level - 1] = 0;
  row[DESIGNER_CONFIG.catalogueColumns.roomName - 1] = wallData.roomName || '';
  row[DESIGNER_CONFIG.catalogueColumns.lenX - 1] = (wallData.width || 0);
  row[DESIGNER_CONFIG.catalogueColumns.lenY - 1] = (wallData.depth || 0);
  row[DESIGNER_CONFIG.catalogueColumns.lenZ - 1] = (wallData.height || 0);
  return row;
}

// ============================================
// WALL FUNCTIONS (UPDATED WITH LAYOUT SYSTEM)
// ============================================

function getWalls() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const siteSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.siteMeasurements);

  if (!siteSheet) {
    return { success: false, error: 'site_measurements sheet not found', walls: [], layoutInfo: null };
  }

  const data = siteSheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());

  const nameCol = findColumnIndex(headers, ['name', 'wall_name', 'wallname', 'entity name', 'entityname']);
  const levelCol = findColumnIndex(headers, ['level']);
  const widthCol = findColumnIndex(headers, ['width', 'lenx', 'len_x']);
  const depthCol = findColumnIndex(headers, ['depth', 'leny', 'len_y', 'thickness']);
  const heightCol = findColumnIndex(headers, ['height', 'lenz', 'len_z']);
  const roomCol = findColumnIndex(headers, ['room', 'room_name', 'roomname']);
  const posXCol = findColumnIndex(headers, ['posx', 'pos_x', 'position_x']);
  const posYCol = findColumnIndex(headers, ['posy', 'pos_y', 'position_y']);
  const posZCol = findColumnIndex(headers, ['posz', 'pos_z', 'position_z']);

  // SINGLE WALL WORKSPACE MODE: All walls at origin (0,0,0)
  // User switches active wall via dropdown; only one wall visible at a time
  const walls = [];
  const colors = DESIGNER_CONFIG.wallLayout ? DESIGNER_CONFIG.wallLayout.colors : ['#8B7355'];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const level = levelCol >= 0 ? parseFloat(row[levelCol]) : 0;

    if (level === 0 || levelCol < 0) {
      const name = nameCol >= 0 ? row[nameCol] : `Wall ${walls.length + 1}`;
      if (!name || String(name).trim() === '') continue;

      const wallWidth = widthCol >= 0 ? parseNumber(row[widthCol]) : 3000;
      const wallDepth = depthCol >= 0 ? parseNumber(row[depthCol]) : 200;
      const wallHeight = heightCol >= 0 ? parseNumber(row[heightCol]) : 2700;

      const wallIndex = walls.length;
      const colorIndex = wallIndex % colors.length;

      // SINGLE WALL MODE: All walls positioned at origin
      walls.push({
        rowIndex: i + 1,
        name: String(name).trim(),
        width: wallWidth,
        depth: wallDepth,
        height: wallHeight,
        roomName: roomCol >= 0 ? row[roomCol] : '',
        wallIndex: wallIndex,
        colorIndex: colorIndex,
        color: colors[colorIndex],
        position: {
          x: 0,
          y: 0,
          z: 0
        }
      });
    }
  }

  // Layout info for single wall mode
  const firstWallWidth = walls.length > 0 ? walls[0].width : 0;
  const layoutInfo = {
    totalWidth: firstWallWidth,
    wallCount: walls.length,
    spacing: 0
  };

  Logger.log('getWalls (Single Wall Mode): Found ' + walls.length + ' walls, all at origin');
  return { success: true, walls: walls, layoutInfo: layoutInfo };
}

function getWallInfo(wallName) {
  const wallsResult = getWalls();
  if (!wallsResult.success) return wallsResult;

  const wall = wallsResult.walls.find(w => w.name === wallName);
  if (!wall) {
    return { success: false, error: `Wall "${wallName}" not found` };
  }

  return { success: true, wall: wall };
}

/**
 * Get wall by index
 */
function getWallByIndex(wallIndex) {
  const wallsResult = getWalls();
  if (!wallsResult.success) return null;

  if (wallIndex >= 0 && wallIndex < wallsResult.walls.length) {
    return wallsResult.walls[wallIndex];
  }
  return null;
}

/**
 * Calculate world position for a box given wall position + local box position
 */
function calculateBoxWorldPosition(wallPosition, boxLocalPosition) {
  return {
    x: (wallPosition.x || 0) + (boxLocalPosition.x || 0),
    y: (wallPosition.y || 0) + (boxLocalPosition.y || 0),
    z: (wallPosition.z || 0) + (boxLocalPosition.z || 0)
  };
}

/**
 * Calculate local position for a box given wall position + world position
 */
function calculateBoxLocalPosition(wallPosition, boxWorldPosition) {
  return {
    x: (boxWorldPosition.x || 0) - (wallPosition.x || 0),
    y: (boxWorldPosition.y || 0) - (wallPosition.y || 0),
    z: (boxWorldPosition.z || 0) - (wallPosition.z || 0)
  };
}

// ============================================
// DYNAMIC OPTIONS FUNCTIONS (UPDATED)
// ============================================

function getHeaderIndexMapCaseInsensitive(sheet) {
  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];

  const map = {};
  headers.forEach((h, i) => {
    if (h) {
      const key = String(h).trim().toLowerCase();
      map[key] = i + 1;
      map[String(h).trim()] = i + 1;
    }
  });

  return map;
}

function getBoxOptions(boxRowIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  const headerMap = getHeaderIndexMapCaseInsensitive(designSheet);

  const lastCol = designSheet.getLastColumn();
  const rowData = designSheet.getRange(boxRowIndex, 1, 1, lastCol).getValues()[0];

  const levelCol = headerMap['level'];
  if (!levelCol) {
    return { success: false, error: 'level column not found in Design_Data' };
  }

  const levelValue = parseFloat(rowData[levelCol - 1]);
  if (levelValue !== 1) {
    return { success: false, error: 'Only boxes (level 1) allowed. Found level: ' + levelValue };
  }

  const options = {};

  DESIGNER_CONFIG.editableOptions.forEach(opt => {
    const colIndex = headerMap[opt.header.toLowerCase()];

    if (!colIndex) {
      Logger.log('Header not found: ' + opt.header);
      // For new material columns, they might not exist yet - that's OK
      if (opt.type === 'material-dropdown') {
        options[opt.key] = {
          value: '',
          label: opt.label,
          unit: opt.unit || '',
          type: opt.type,
          category: opt.category,
          thicknessTarget: opt.thicknessTarget
        };
      }
      return;
    }

    const rawValue = rowData[colIndex - 1];

    options[opt.key] = {
      value: opt.type === 'number' || opt.type === 'readonly' ? parseNumber(rawValue) : String(rawValue || ''),
      label: opt.label,
      unit: opt.unit || '',
      type: opt.type || 'number',
      header: opt.header,
      category: opt.category,
      thicknessTarget: opt.thicknessTarget,
      derivedFrom: opt.derivedFrom
    };
  });

  const entityNameCol = headerMap['entity name'] || headerMap['entity_name'] || headerMap['entityname'];
  const boxModelCol = headerMap['box_model'] || headerMap['boxmodel'];
  const boxTypeCol = headerMap['box_type'] || headerMap['boxtype'];

  return {
    success: true,
    options: options,
    entityName: entityNameCol ? (rowData[entityNameCol - 1] || '') : '',
    boxModel: boxModelCol ? (rowData[boxModelCol - 1] || '') : '',
    boxType: boxTypeCol ? (rowData[boxTypeCol - 1] || '') : '',
    rowIndex: boxRowIndex
  };
}

/**
 * Update box options - ENHANCED for material selection
 * When a material is selected, automatically update the corresponding thickness
 */
function updateBoxOptions(boxRowIndex, updatedOptions) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  const headerMap = getHeaderIndexMapCaseInsensitive(designSheet);

  const levelCol = headerMap['level'];
  if (!levelCol) {
    return { success: false, error: 'level column not found' };
  }

  const levelValue = parseFloat(designSheet.getRange(boxRowIndex, levelCol).getValue());
  if (levelValue !== 1) {
    return { success: false, error: 'Only boxes (level 1) allowed' };
  }

  let updatedCount = 0;

  // Process material selections and auto-update thickness
  const materialToThicknessMap = {
    'carcusPly': 'carcusThickness',
    'doorPly': 'doorThickness',
    'backPly': 'backplankThickness'
  };

  Object.entries(updatedOptions).forEach(([key, value]) => {
    const opt = DESIGNER_CONFIG.editableOptions.find(o => o.key === key);
    if (!opt) {
      Logger.log('Option config not found for key: ' + key);
      return;
    }

    // Find or create the column
    let colIndex = headerMap[opt.header.toLowerCase()];

    // If column doesn't exist for material options, we need to add it
    if (!colIndex && opt.type === 'material-dropdown') {
      // Add new column
      const lastCol = designSheet.getLastColumn();
      colIndex = lastCol + 1;
      designSheet.getRange(1, colIndex).setValue(opt.header);
      headerMap[opt.header.toLowerCase()] = colIndex;
    }

    if (!colIndex) {
      Logger.log('Column not found for header: ' + opt.header);
      return;
    }

    // Write the value
    designSheet.getRange(boxRowIndex, colIndex).setValue(value);
    updatedCount++;

    // If this is a material selection, auto-update the corresponding thickness
    if (opt.type === 'material-dropdown' && materialToThicknessMap[key]) {
      const thicknessKey = materialToThicknessMap[key];
      const thicknessOpt = DESIGNER_CONFIG.editableOptions.find(o => o.key === thicknessKey);

      if (thicknessOpt) {
        const thicknessColIndex = headerMap[thicknessOpt.header.toLowerCase()];
        if (thicknessColIndex) {
          // Extract thickness from material display name
          const thickness = getThicknessFromMaterial(value);
          designSheet.getRange(boxRowIndex, thicknessColIndex).setValue(thickness);
          Logger.log(`Auto-updated ${thicknessKey} to ${thickness} from material: ${value}`);
          updatedCount++;
        }
      }
    }
  });

  SpreadsheetApp.flush();
  syncFinalToBaseColumns();

  return {
    success: true,
    message: 'Updated ' + updatedCount + ' options'
  };
}

/**
 * Update box position AND rotation
 * FIXED: Made rotZ parameter optional with default value
 */
function updateBoxPosition(boxRowIndex, newX, newY, newZ, rotZ) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  try {
    const level = parseFloat(designSheet.getRange(boxRowIndex, DESIGNER_CONFIG.catalogueColumns.level).getValue());
    if (level === 0) {
      return { success: false, error: 'Cannot modify wall position' };
    }
    if (level !== 1) {
      return { success: false, error: 'Can only update box positions (level 1)' };
    }

    // Save position to base X, Y, Z columns
    designSheet.getRange(boxRowIndex, DESIGNER_CONFIG.catalogueColumns.x).setValue(newX);
    designSheet.getRange(boxRowIndex, DESIGNER_CONFIG.catalogueColumns.y).setValue(newY);
    designSheet.getRange(boxRowIndex, DESIGNER_CONFIG.catalogueColumns.z).setValue(newZ);

    // Save rotation if provided (make it optional)
    if (rotZ !== undefined && rotZ !== null && DESIGNER_CONFIG.catalogueColumns.rotZ) {
      designSheet.getRange(boxRowIndex, DESIGNER_CONFIG.catalogueColumns.rotZ).setValue(rotZ + '°');
    }

    SpreadsheetApp.flush();
    syncFinalToBaseColumns();

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ============================================
// REAL-TIME SAVE FUNCTIONS (NEW - Phase 4)
// ============================================

/**
 * Save box position immediately (called on drag end, movement button click)
 * @param {number} rowIndex - Box row index in Design_Data
 * @param {number} x - X position in mm
 * @param {number} y - Y position in mm
 * @param {number} z - Z position in mm
 */
function saveBoxPositionRealtime(rowIndex, x, y, z) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  try {
    // Verify it's a box (level 1)
    const level = parseFloat(designSheet.getRange(rowIndex, DESIGNER_CONFIG.catalogueColumns.level).getValue());
    if (level !== 1) {
      return { success: false, error: 'Can only update box positions (level 1)' };
    }

    // Update X, Y, Z columns
    designSheet.getRange(rowIndex, DESIGNER_CONFIG.catalogueColumns.x).setValue(x);
    designSheet.getRange(rowIndex, DESIGNER_CONFIG.catalogueColumns.y).setValue(y);
    designSheet.getRange(rowIndex, DESIGNER_CONFIG.catalogueColumns.z).setValue(z);

    SpreadsheetApp.flush();

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Save box rotation immediately
 * @param {number} rowIndex - Box row index
 * @param {number} rotZ - Rotation in degrees
 */
function saveBoxRotationRealtime(rowIndex, rotZ) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  try {
    const level = parseFloat(designSheet.getRange(rowIndex, DESIGNER_CONFIG.catalogueColumns.level).getValue());
    if (level !== 1) {
      return { success: false, error: 'Can only update box rotation (level 1)' };
    }

    designSheet.getRange(rowIndex, DESIGNER_CONFIG.catalogueColumns.rotZ).setValue(rotZ + '°');
    SpreadsheetApp.flush();

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Save a single dimension field immediately
 * @param {number} rowIndex - Box row index
 * @param {string} field - Field name: 'boxWidth', 'boxDepth', 'boxHeight'
 * @param {number} value - Value in mm
 */
function saveBoxDimensionRealtime(rowIndex, field, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  const columnMap = {
    'boxWidth': DESIGNER_CONFIG.catalogueColumns.boxWidth,
    'boxDepth': DESIGNER_CONFIG.catalogueColumns.boxDepth,
    'boxHeight': DESIGNER_CONFIG.catalogueColumns.boxHeight
  };

  const col = columnMap[field];
  if (!col) {
    return { success: false, error: 'Unknown dimension field: ' + field };
  }

  try {
    designSheet.getRange(rowIndex, col).setValue(value);
    SpreadsheetApp.flush();
    syncFinalToBaseColumns();

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Save skirting fields immediately (real-time save)
 * @param {number} rowIndex - Box row index
 * @param {number} skirting - Skirting height in mm (can be null)
 * @param {number} skirtingWidth - Skirting width in mm (can be null)
 */
function saveBoxSkirtingRealtime(rowIndex, skirting, skirtingWidth) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  try {
    var level = parseFloat(designSheet.getRange(rowIndex, DESIGNER_CONFIG.catalogueColumns.level).getValue());
    if (level !== 1) {
      return { success: false, error: 'Can only update box options (level 1)' };
    }

    if (skirting !== undefined && skirting !== null) {
      designSheet.getRange(rowIndex, DESIGNER_CONFIG.catalogueColumns.skirting).setValue(skirting);
      Logger.log('Saved skirting: ' + skirting + ' to row ' + rowIndex);
    }
    if (skirtingWidth !== undefined && skirtingWidth !== null) {
      designSheet.getRange(rowIndex, DESIGNER_CONFIG.catalogueColumns.skirtingWidth).setValue(skirtingWidth);
      Logger.log('Saved skirtingWidth: ' + skirtingWidth + ' to row ' + rowIndex);
    }

    SpreadsheetApp.flush();
    syncFinalToBaseColumns();

    return { success: true, message: 'Skirting saved' };
  } catch (e) {
    Logger.log('Error in saveBoxSkirtingRealtime: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}
/**
 * Save material selection immediately (with auto-thickness update)
 * @param {number} rowIndex - Box row index
 * @param {string} field - Field name: 'carcusPly', 'doorPly', 'backPly'
 * @param {string} value - Material display name
 */
function saveBoxMaterialRealtime(rowIndex, field, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  const headerMap = getHeaderIndexMapCaseInsensitive(designSheet);

  const materialToThicknessMap = {
    'carcusPly': { header: 'carcus_ply', thicknessHeader: 'carcus_thickness' },
    'doorPly': { header: 'door_ply', thicknessHeader: 'door_thickness' },
    'backPly': { header: 'back_ply', thicknessHeader: 'backplank_thickness' }
  };

  const config = materialToThicknessMap[field];
  if (!config) {
    return { success: false, error: 'Unknown material field: ' + field };
  }

  try {
    // Update material column
    const matCol = headerMap[config.header.toLowerCase()];
    if (matCol) {
      designSheet.getRange(rowIndex, matCol).setValue(value);
    }

    // Auto-update thickness
    const thickness = getThicknessFromMaterial(value);
    if (thickness > 0) {
      const thickCol = headerMap[config.thicknessHeader.toLowerCase()];
      if (thickCol) {
        designSheet.getRange(rowIndex, thickCol).setValue(thickness);
      }
    }

    SpreadsheetApp.flush();
    syncFinalToBaseColumns();

    return { success: true, thickness: thickness };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Save thickness field immediately
 * @param {number} rowIndex - Box row index
 * @param {string} field - Field name: 'carcusThickness', 'doorThickness', 'backplankThickness'
 * @param {number} value - Thickness in mm
 */
function saveBoxThicknessRealtime(rowIndex, field, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  const columnMap = {
    'carcusThickness': DESIGNER_CONFIG.catalogueColumns.carcusThickness,
    'doorThickness': DESIGNER_CONFIG.catalogueColumns.doorThickness,
    'backplankThickness': DESIGNER_CONFIG.catalogueColumns.backplankThickness
  };

  const col = columnMap[field];
  if (!col) {
    return { success: false, error: 'Unknown thickness field: ' + field };
  }

  try {
    designSheet.getRange(rowIndex, col).setValue(value);
    SpreadsheetApp.flush();

    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}


/**
 * UNIFIED UPDATE: Updates Dimensions, Materials, Position, and Rotation in one atomic operation.
 * This prevents synchronization errors between size and position formulas.
 * 
 * @param {number} boxRowIndex - Row index of the box in Design_Data
 * @param {Object} options - Dimension and material options {boxWidth: 600, carcusPly: "Austin MR...", etc}
 * @param {Object} position - Position object {x: 100, y: 50, z: 0}
 * @param {number} rotZ - Rotation around Z axis in degrees
 * @returns {Object} - {success: boolean, message/error: string}
 */
function updateBoxFullAttributes(boxRowIndex, options, position, rotZ) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  const headerMap = getHeaderIndexMapCaseInsensitive(designSheet);
  const c = DESIGNER_CONFIG.catalogueColumns;

  // Verify it's a box (Level 1)
  const levelValue = parseFloat(designSheet.getRange(boxRowIndex, c.level).getValue());
  if (levelValue !== 1) {
    return { success: false, error: 'Target is not a box (Level 1). Found level: ' + levelValue };
  }

  try {
    let updatedCount = 0;

    // ========================================
    // 1. UPDATE DIMENSION & MATERIAL OPTIONS
    // ========================================
    const materialToThicknessMap = {
      'carcusPly': 'carcusThickness',
      'doorPly': 'doorThickness',
      'backPly': 'backplankThickness'
    };

    if (options && typeof options === 'object') {
      Object.entries(options).forEach(([key, value]) => {
        const opt = DESIGNER_CONFIG.editableOptions.find(o => o.key === key);
        if (!opt) {
          Logger.log('Option config not found for key: ' + key);
          return;
        }

        let colIndex = headerMap[opt.header.toLowerCase()];

        // Auto-create column if missing (for new material columns)
        if (!colIndex && opt.type === 'material-dropdown') {
          const lastCol = designSheet.getLastColumn();
          colIndex = lastCol + 1;
          designSheet.getRange(1, colIndex).setValue(opt.header);
          headerMap[opt.header.toLowerCase()] = colIndex;
          Logger.log('Created new column for: ' + opt.header);
        }

        if (colIndex) {
          designSheet.getRange(boxRowIndex, colIndex).setValue(value);
          updatedCount++;

          // Auto-update thickness if this was a material dropdown
          if (opt.type === 'material-dropdown' && materialToThicknessMap[key]) {
            const thicknessKey = materialToThicknessMap[key];
            const thicknessOpt = DESIGNER_CONFIG.editableOptions.find(o => o.key === thicknessKey);
            if (thicknessOpt) {
              const tCol = headerMap[thicknessOpt.header.toLowerCase()];
              if (tCol) {
                const thickness = getThicknessFromMaterial(value);
                if (thickness > 0) {
                  designSheet.getRange(boxRowIndex, tCol).setValue(thickness);
                  Logger.log('Auto-updated ' + thicknessKey + ' to ' + thickness);
                  updatedCount++;
                }
              }
            }
          }
        } else {
          Logger.log('Column not found for header: ' + opt.header);
        }
      });
    }

    // ========================================
    // 2. UPDATE POSITION
    // ========================================
    if (position && typeof position === 'object') {
      if (position.x !== undefined) {
        designSheet.getRange(boxRowIndex, c.x).setValue(position.x);
        updatedCount++;
      }
      if (position.y !== undefined) {
        designSheet.getRange(boxRowIndex, c.y).setValue(position.y);
        updatedCount++;
      }
      if (position.z !== undefined) {
        designSheet.getRange(boxRowIndex, c.z).setValue(position.z);
        updatedCount++;
      }
    }

    // ========================================
    // 3. UPDATE ROTATION
    // ========================================
    if (rotZ !== null && rotZ !== undefined && c.rotZ) {
      designSheet.getRange(boxRowIndex, c.rotZ).setValue(rotZ + '°');
      updatedCount++;
    }

    // ========================================
    // 4. FLUSH AND SYNC
    // ========================================
    SpreadsheetApp.flush();
    syncFinalToBaseColumns();

    Logger.log('updateBoxFullAttributes: Updated ' + updatedCount + ' fields for row ' + boxRowIndex);

    return {
      success: true,
      message: 'Box fully updated. ' + updatedCount + ' fields changed.',
      updatedCount: updatedCount
    };

  } catch (e) {
    Logger.log('Error in updateBoxFullAttributes: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Duplicate box row - UPDATED to include level 3 data
 */
function duplicateBoxRow(originalRowIndex, newX, newY, newZ) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  try {
    const lastCol = designSheet.getLastColumn();
    const originalData = designSheet.getRange(originalRowIndex, 1, 1, lastCol).getValues()[0];

    const level = parseFloat(originalData[DESIGNER_CONFIG.catalogueColumns.level - 1]);
    if (level !== 1) {
      return { success: false, error: 'Can only duplicate boxes (level 1)' };
    }

    // Find the last row belonging to this box (including level 2 AND level 3)
    let lastChildRow = originalRowIndex;
    const lastRow = designSheet.getLastRow();

    for (let row = originalRowIndex + 1; row <= lastRow; row++) {
      const rowLevel = parseFloat(designSheet.getRange(row, DESIGNER_CONFIG.catalogueColumns.level).getValue());
      // Include both level 2 (planks) and level 3 (sub-components)
      if (rowLevel === 2 || rowLevel === 3) {
        lastChildRow = row;
      } else {
        break;
      }
    }

    const numRowsToCopy = lastChildRow - originalRowIndex + 1;
    const rowsToCopy = designSheet.getRange(originalRowIndex, 1, numRowsToCopy, lastCol).getValues();

    // Update position in base X, Y, Z columns (only for the box row)
    rowsToCopy[0][DESIGNER_CONFIG.catalogueColumns.x - 1] = newX;
    rowsToCopy[0][DESIGNER_CONFIG.catalogueColumns.y - 1] = newY;
    rowsToCopy[0][DESIGNER_CONFIG.catalogueColumns.z - 1] = newZ;

    const insertRow = designSheet.getLastRow() + 1;
    designSheet.getRange(insertRow, 1, numRowsToCopy, lastCol).setValues(rowsToCopy);

    SpreadsheetApp.flush();
    syncFinalToBaseColumns();

    // Count level 2 and level 3 rows
    let plankCount = 0;
    let subComponentCount = 0;
    for (let i = 1; i < rowsToCopy.length; i++) {
      const rowLevel = parseFloat(rowsToCopy[i][DESIGNER_CONFIG.catalogueColumns.level - 1]);
      if (rowLevel === 2) plankCount++;
      else if (rowLevel === 3) subComponentCount++;
    }

    return {
      success: true,
      newRowIndex: insertRow,
      message: `Box duplicated (${numRowsToCopy} rows: 1 box, ${plankCount} planks, ${subComponentCount} sub-components)`
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Delete box row - UPDATED to include level 3 data
 */
function deleteBoxRow(boxRowIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet) {
    return { success: false, error: 'Design_Data sheet not found' };
  }

  try {
    const level = parseFloat(designSheet.getRange(boxRowIndex, DESIGNER_CONFIG.catalogueColumns.level).getValue());
    if (level === 0) {
      return { success: false, error: 'Cannot delete wall' };
    }
    if (level !== 1) {
      return { success: false, error: 'Can only delete boxes (level 1)' };
    }

    // Find the last row belonging to this box (including level 2 AND level 3)
    let lastChildRow = boxRowIndex;
    const lastRow = designSheet.getLastRow();

    for (let row = boxRowIndex + 1; row <= lastRow; row++) {
      const rowLevel = parseFloat(designSheet.getRange(row, DESIGNER_CONFIG.catalogueColumns.level).getValue());
      // Include both level 2 (planks) and level 3 (sub-components)
      if (rowLevel === 2 || rowLevel === 3) {
        lastChildRow = row;
      } else {
        break;
      }
    }

    const numRowsToDelete = lastChildRow - boxRowIndex + 1;

    designSheet.deleteRows(boxRowIndex, numRowsToDelete);

    SpreadsheetApp.flush();

    return {
      success: true,
      message: `Deleted box and ${numRowsToDelete - 1} child rows (planks + sub-components)`
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ============================================
// DATA BUILDER FOR FRONTEND
// ============================================

function buildDesignerData() {
  var wallsResult = getWalls();
  var catalogResult = getCatalogBoxes();
  var designData = getDesignData();
  var plywoodResult = getPlywoodOptions();
  var laminateResult = getLaminateOptions();

  return {
    walls: wallsResult.success ? wallsResult.walls : [],
    wallLayoutInfo: wallsResult.success ? wallsResult.layoutInfo : null,
    wallLayoutConfig: DESIGNER_CONFIG.wallLayout || null,
    catalogBoxes: catalogResult.success ? catalogResult.boxes : [],
    designData: designData,
    editableOptions: DESIGNER_CONFIG.editableOptions,
    materialLegend: getMaterialLegend(),
    // Plywood options for box-level dropdowns
    plywoodOptions: plywoodResult.success ? plywoodResult.options : [],
    materialCatalogConnected: plywoodResult.success,
    // Laminate options for plank-level paint mode (NEW)
    laminateOptions: laminateResult.success ? laminateResult.options : [],
    laminateCatalogConnected: laminateResult.success,
    // Core material types for naming convention
    coreMaterials: DESIGNER_CONFIG.coreMaterials
  };
}

/**
 * Get design data from Design_Data sheet
 * KEY FIX: Merges calculated wall positions from getWalls() (site_measurements)
 * into the wall objects, so walls render side-by-side instead of stacking at origin.
 * Also stores parent wall info in boxes for proper wall->box association.
 */
function getDesignData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet || designSheet.getLastRow() <= 1) {
    return { walls: [], boxes: [], planks: [], subComponents: [] };
  }

  // SINGLE WALL WORKSPACE MODE: Get wall metadata from getWalls()
  // All walls use origin position (0,0,0) - only one wall visible at a time
  const wallsResult = getWalls();
  const wallLayoutMap = {};
  if (wallsResult.success && wallsResult.walls) {
    wallsResult.walls.forEach(w => {
      // Map by wall name for lookup - all positions are (0,0,0) in single wall mode
      wallLayoutMap[w.name] = {
        position: { x: 0, y: 0, z: 0 },
        wallIndex: w.wallIndex,
        colorIndex: w.colorIndex,
        color: w.color,
        width: w.width,
        depth: w.depth,
        height: w.height
      };
    });
  }
  Logger.log('Single Wall Workspace Mode: ' + Object.keys(wallLayoutMap).length + ' walls mapped to origin');

  const data = designSheet.getDataRange().getDisplayValues();
  const headers = data[0];

  const headerMap = {};
  headers.forEach((h, i) => {
    if (h) {
      headerMap[String(h).trim().toLowerCase()] = i;
    }
  });

  const cols = {
    entityName: headerMap['entity name'] || headerMap['entityname'] || 0,
    level: headerMap['level'] || 1,
    material: headerMap['material'] || 2,
    roomName: headerMap['room_name'] || headerMap['roomname'] || 3,
    unitLocation: headerMap['unit_location'] || headerMap['unitlocation'] || 4,
    boxModel: headerMap['box_model'] || headerMap['boxmodel'] || 5,
    boxType: headerMap['box_type'] || headerMap['boxtype'] || 6,
    lenX: headerMap['lenx'] || 7,
    lenY: headerMap['leny'] || 8,
    lenZ: headerMap['lenz'] || 9,
    x: headerMap['x'] || 10,
    y: headerMap['y'] || 11,
    z: headerMap['z'] || 12,
    boxWidth: headerMap['box_width'] || 19,
    boxDepth: headerMap['box_depth'] || 20,
    boxHeight: headerMap['box_height'] || 21,
    skirting: headerMap['skirting'] || 22,
    skirtingWidth: headerMap['skirting_width'] || 23,
    carcusThickness: headerMap['carcus_thickness'] || 24,
    doorThickness: headerMap['door_thickness'] || 25,
    backplankThickness: headerMap['backplank_thickness'] || 26,
    rotZ: headerMap['rotz'] || headerMap['rot_z'] || headerMap['rotation_z'] || 27,
    carcusPly: headerMap['carcus_ply'] || 28,
    doorPly: headerMap['door_ply'] || 29,
    backPly: headerMap['back_ply'] || 30
  };

  const result = {
    walls: [],
    boxes: [],
    planks: [],
    subComponents: []
  };

  let currentWall = null;
  let currentBox = null;
  let currentPlank = null;
  let wallId = 0;
  let boxId = 0;
  let plankId = 0;
  let subComponentId = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const entityName = row[cols.entityName];
    const level = parseFloat(row[cols.level]);

    if (!entityName && isNaN(level)) continue;

    const designRowIndex = i + 1;

    if (level === 0) {
      // WALL (Level 0) - SINGLE WALL WORKSPACE MODE
      const wallName = String(entityName).trim();
      
      // Get layout metadata (color, index) but position is always origin
      const layoutInfo = wallLayoutMap[wallName] || {};
      
      currentWall = {
        id: `wall_${wallId}`,
        name: wallName,
        entityName: wallName,
        roomName: row[cols.roomName],
        dimensions: {
          lenX: layoutInfo.width || parseNumber(row[cols.lenX]),
          lenY: layoutInfo.depth || parseNumber(row[cols.lenY]),
          lenZ: layoutInfo.height || parseNumber(row[cols.lenZ])
        },
        // SINGLE WALL MODE: All walls at origin (0,0,0)
        position: {
          x: 0,
          y: 0,
          z: 0
        },
        // Layout metadata
        wallIndex: layoutInfo.wallIndex !== undefined ? layoutInfo.wallIndex : wallId,
        colorIndex: layoutInfo.colorIndex !== undefined ? layoutInfo.colorIndex : wallId,
        color: layoutInfo.color || '#8B7355',
        boxes: [],
        rowIndex: designRowIndex
      };
      
      Logger.log('Wall "' + wallName + '" (Single Wall Mode) at origin');
      
      result.walls.push(currentWall);
      wallId++;
      currentBox = null;
      currentPlank = null;

    } else if (level === 1) {
      // BOX (Level 1)
      currentBox = {
        id: `box_${boxId++}`,
        entityName: entityName,
        material: row[cols.material],
        roomName: row[cols.roomName],
        unitLocation: row[cols.unitLocation],
        boxModel: row[cols.boxModel],
        boxType: row[cols.boxType],
        dimensions: {
          lenX: parseNumber(row[cols.lenX]),
          lenY: parseNumber(row[cols.lenY]),
          lenZ: parseNumber(row[cols.lenZ])
        },
        // Box position is LOCAL to its parent wall
        position: {
          x: parseNumber(row[cols.x]),
          y: parseNumber(row[cols.y]),
          z: parseNumber(row[cols.z])
        },
        rotZ: parseNumber(row[cols.rotZ]) || 0,
        boxWidth: parseNumber(row[cols.boxWidth]),
        boxDepth: parseNumber(row[cols.boxDepth]),
        boxHeight: parseNumber(row[cols.boxHeight]),
        skirting: parseNumber(row[cols.skirting]),
        skirtingWidth: parseNumber(row[cols.skirtingWidth]),
        carcusThickness: parseNumber(row[cols.carcusThickness]),
        doorThickness: parseNumber(row[cols.doorThickness]),
        backplankThickness: parseNumber(row[cols.backplankThickness]),
        carcusPly: row[cols.carcusPly] || '',
        doorPly: row[cols.doorPly] || '',
        backPly: row[cols.backPly] || '',
        planks: [],
        rowIndex: designRowIndex,
        // KEY FIX: Store parent wall association
        parentWallName: currentWall ? currentWall.name : null,
        parentWallId: currentWall ? currentWall.id : null,
        parentWallIndex: currentWall ? currentWall.wallIndex : null
      };

      // Add to current wall's boxes array (nested)
      if (currentWall) {
        currentWall.boxes.push(currentBox);
      }
      // Also add to flat boxes array for backward compatibility
      result.boxes.push(currentBox);
      currentPlank = null;

    } else if (level === 2) {
      // PLANK (Level 2)
      var materialString = row[cols.material] || '';
      var parsedMaterial = parseMaterialString(materialString);

      var laminateInfo = null;
      if (parsedMaterial.outerCode) {
        laminateInfo = getLaminateByCode(parsedMaterial.outerCode);
      }

      currentPlank = {
        id: `plank_${plankId++}`,
        entityName: entityName,
        material: materialString,
        materialColor: getMaterialColor(materialString),
        parsedMaterial: parsedMaterial,
        laminateInfo: laminateInfo,
        hasMaterial: !!materialString,
        dimensions: {
          lenX: parseNumber(row[cols.lenX]),
          lenY: parseNumber(row[cols.lenY]),
          lenZ: parseNumber(row[cols.lenZ])
        },
        position: {
          x: parseNumber(row[cols.x]),
          y: parseNumber(row[cols.y]),
          z: parseNumber(row[cols.z])
        },
        role: determinePlankRole(entityName),
        rowIndex: designRowIndex,
        parentBoxRowIndex: currentBox ? currentBox.rowIndex : null,
        parentBoxId: currentBox ? currentBox.id : null,
        subComponents: []
      };

      currentPlank.explodeDirection = getExplodeDirection(currentPlank.role);
      currentPlank.assemblyDirection = getAssemblyDirection(currentPlank.role);

      if (currentBox) {
        currentBox.planks.push(currentPlank);
      }
      result.planks.push(currentPlank);

    } else if (level === 3) {
      // SUB-COMPONENT (Level 3)
      const subComponent = {
        id: `subcomp_${subComponentId++}`,
        entityName: entityName,
        material: row[cols.material],
        materialColor: getMaterialColor(row[cols.material]),
        dimensions: {
          lenX: parseNumber(row[cols.lenX]),
          lenY: parseNumber(row[cols.lenY]),
          lenZ: parseNumber(row[cols.lenZ])
        },
        position: {
          x: parseNumber(row[cols.x]),
          y: parseNumber(row[cols.y]),
          z: parseNumber(row[cols.z])
        },
        role: determineSubComponentRole(entityName),
        rowIndex: designRowIndex,
        parentPlankId: currentPlank ? currentPlank.id : null,
        parentPlankRowIndex: currentPlank ? currentPlank.rowIndex : null,
        parentBoxId: currentBox ? currentBox.id : null,
        parentBoxRowIndex: currentBox ? currentBox.rowIndex : null
      };

      if (currentPlank) {
        currentPlank.subComponents.push(subComponent);
      }

      result.subComponents.push(subComponent);
    }
  }

  Logger.log(`getDesignData: Found ${result.walls.length} walls, ${result.boxes.length} boxes, ${result.planks.length} planks, ${result.subComponents.length} sub-components`);

  return result;
}

function getPlacedBoxes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet || designSheet.getLastRow() <= 1) {
    Logger.log('getPlacedBoxes: No data in Design_Data sheet');
    return { success: true, boxes: [] };
  }

  const data = designSheet.getRange(2, 1, designSheet.getLastRow() - 1, designSheet.getLastColumn()).getDisplayValues();
  const boxes = [];

  const c = DESIGNER_CONFIG.catalogueColumns;
  
  // Track current wall as we iterate (Level 0 = wall header)
  let currentParentWall = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const level = parseFloat(row[c.level - 1]);
    const entityName = row[c.entityName - 1] || '';

    // Track wall context (Level 0 rows are wall headers)
    if (level === 0) {
      currentParentWall = String(entityName).trim();
      continue;
    }

    if (level === 1) {
      // Read position from X, Y, Z columns
      const posX = parseNumber(row[c.x - 1]) || 0;
      const posY = parseNumber(row[c.y - 1]) || 0;
      const posZ = parseNumber(row[c.z - 1]) || 0;

      const boxWidth = parseNumber(row[c.boxWidth - 1]) || 600;
      const boxDepth = parseNumber(row[c.boxDepth - 1]) || 550;
      const boxHeight = parseNumber(row[c.boxHeight - 1]) || 800;

      // Also check unitLocation column for wall association
      const unitLocation = String(row[c.unitLocation - 1] || '').trim();
      const parentWallName = unitLocation || currentParentWall || null;

      const boxData = {
        rowIndex: i + 2,
        entityName: entityName || 'Box',
        position: {
          x: posX,
          y: posY,
          z: posZ
        },
        dimensions: {
          width: boxWidth,
          depth: boxDepth,
          height: boxHeight
        },
        parentWallName: parentWallName  // NEW: Track which wall this box belongs to
      };

      boxes.push(boxData);
      Logger.log('getPlacedBoxes: Found box "' + boxData.entityName + '" at X=' + posX + ', width=' + boxWidth + ', wall=' + parentWallName);
    }
  }

  Logger.log('getPlacedBoxes: Total boxes found = ' + boxes.length);
  return { success: true, boxes: boxes };
}

/**
 * Get placed boxes for a specific wall only
 * Used by calculateNextBoxPosition to scope positioning to wall context
 */
function getPlacedBoxesForWall(wallName) {
  const allBoxesResult = getPlacedBoxes();
  
  if (!allBoxesResult.success) {
    return allBoxesResult;
  }
  
  const normalizedWallName = String(wallName || '').trim().toLowerCase();
  
  // Filter boxes to only those belonging to this wall
  const wallBoxes = allBoxesResult.boxes.filter(box => {
    const boxWallName = String(box.parentWallName || '').trim().toLowerCase();
    return boxWallName === normalizedWallName;
  });
  
  Logger.log('getPlacedBoxesForWall("' + wallName + '"): Found ' + wallBoxes.length + ' boxes (out of ' + allBoxesResult.boxes.length + ' total)');
  
  return { success: true, boxes: wallBoxes };
}

/**
 * Calculate next box position with smart gap filling - WALL-SCOPED
 * Rules:
 * 1. Only considers boxes belonging to wallName (each wall starts fresh at X=0)
 * 2. Always place left-to-right (X-axis)
 * 3. 5mm gap between boxes
 * 4. Fill gaps left by deleted boxes
 */
function calculateNextBoxPosition(wallName, newBoxWidth) {
  const GAP_SIZE = 5; // 5mm gap between boxes
  
  // WALL-SCOPED: Get only boxes for this specific wall
  const placedResult = getPlacedBoxesForWall(wallName);
  
  Logger.log('calculateNextBoxPosition: Wall="' + wallName + '", newBoxWidth=' + newBoxWidth);

  // If no boxes exist on this wall, place at origin (each wall starts fresh)
  if (!placedResult.success || placedResult.boxes.length === 0) {
    Logger.log('calculateNextBoxPosition: No boxes on wall "' + wallName + '", placing at origin (0,0,0)');
    return { x: 0, y: 0, z: 0 };
  }

  const boxes = placedResult.boxes;
  const boxWidth = parseFloat(newBoxWidth) || 600;

  // Sort boxes by X position (left to right)
  boxes.sort((a, b) => a.position.x - b.position.x);
  
  Logger.log('calculateNextBoxPosition: Found ' + boxes.length + ' boxes on wall "' + wallName + '"');

  // Strategy 1: Check for gaps between existing boxes that can fit the new box
  // Check if there's a gap at the start (before first box)
  if (boxes[0].position.x >= boxWidth + GAP_SIZE) {
    Logger.log('calculateNextBoxPosition: Found gap at start, placing at X=0');
    return { x: 0, y: 0, z: 0 };
  }

  // Check gaps between consecutive boxes
  for (let i = 0; i < boxes.length - 1; i++) {
    const currentBox = boxes[i];
    const nextBox = boxes[i + 1];

    const currentRightEdge = currentBox.position.x + currentBox.dimensions.width;
    const gapStart = currentRightEdge + GAP_SIZE;
    const gapEnd = nextBox.position.x - GAP_SIZE;
    const gapWidth = gapEnd - gapStart + GAP_SIZE; // Available space

    if (gapWidth >= boxWidth) {
      // Found a gap that fits the new box
      const newX = currentRightEdge + GAP_SIZE;
      Logger.log('calculateNextBoxPosition: Found gap between boxes, placing at X=' + newX);
      return { x: newX, y: 0, z: 0 };
    }
  }

  // Strategy 2: No gaps found, place at the rightmost edge + gap
  const lastBox = boxes[boxes.length - 1];
  const maxRightEdge = lastBox.position.x + lastBox.dimensions.width;
  const newX = maxRightEdge + GAP_SIZE;

  Logger.log('calculateNextBoxPosition: Placing at rightmost edge + 5mm gap, X=' + newX + ' on wall "' + wallName + '"');

  return { x: newX, y: 0, z: 0 };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sync F_ column values to base columns (LenX/Y/Z, X/Y/Z)
 * NOTE: F_ columns don't exist in this spreadsheet structure, so this function is disabled
 */
function syncFinalToBaseColumns() {
  // No F_ columns exist in this spreadsheet structure
  // This function is intentionally empty
  return;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const cleaned = String(value).replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function findColumnIndex(headers, possibleNames) {
  for (const name of possibleNames) {
    const idx = headers.indexOf(name.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

function determinePlankRole(entityName) {
  const name = (entityName || '').toLowerCase();
  if (name.includes('door')) return 'door';
  if (name.includes('bottom')) return 'bottom';
  if (name.includes('top')) return 'top';
  if (name.includes('left')) return 'left';
  if (name.includes('right')) return 'right';
  if (name.includes('back')) return 'back';
  if (name.includes('front')) return 'front';
  if (name.includes('shelf') || name.includes('plank')) return 'shelf';
  if (name.includes('skirting') || name.includes('skriting')) return 'skirting';
  if (name.includes('facia') || name.includes('fascia')) return 'facia';
  if (name.includes('draw') || name.includes('drawer')) return 'drawer';
  if (name.includes('dummy')) return 'dummy';
  return 'other';
}

/**
 * Determine sub-component role based on entity name
 * Used for level 3 items (hardware, holes, grooves, etc.)
 */
function determineSubComponentRole(entityName) {
  const name = (entityName || '').toLowerCase();

  // Holes
  if (name.includes('vb_main') || name.includes('vb main')) return 'vb_main_hole';
  if (name.includes('vb_double') || name.includes('vb double')) return 'vb_double_hole';
  if (name.includes('hinge') && name.includes('hole')) return 'hinge_hole';
  if (name.includes('screw') && name.includes('hole')) return 'screw_hole';
  if (name.includes('dowel')) return 'dowel_hole';

  // Grooves
  if (name.includes('slot') || name.includes('groove')) return 'slot_groove';

  // Hardware
  if (name.includes('hinge')) return 'hinge';
  if (name.includes('handle')) return 'handle';
  if (name.includes('knob')) return 'knob';
  if (name.includes('screw')) return 'screw';
  if (name.includes('cam')) return 'cam_lock';
  if (name.includes('runner') || name.includes('slide')) return 'drawer_runner';
  if (name.includes('bracket')) return 'bracket';
  if (name.includes('support')) return 'support';

  // Edgeband
  if (name.includes('edge') || name.includes('band') || name.includes('edgeband')) return 'edgeband';
  if (name.includes('tape')) return 'tape';
  if (name.includes('trim')) return 'trim';

  // Laminate/Finish
  if (name.includes('laminate')) return 'laminate';
  if (name.includes('veneer')) return 'veneer';
  if (name.includes('finish')) return 'finish';

  // Glass/Insert
  if (name.includes('glass')) return 'glass';
  if (name.includes('mirror')) return 'mirror';
  if (name.includes('insert')) return 'insert';

  return 'other';
}

function getExplodeDirection(role) {
  const d = 600;
  const directions = {
    'left': { x: -d, y: 0, z: 0 },
    'right': { x: d, y: 0, z: 0 },
    'top': { x: 0, y: 0, z: d },
    'bottom': { x: 0, y: 0, z: -d },
    'back': { x: 0, y: d, z: 0 },
    'front': { x: 0, y: -d, z: 0 },
    'door': { x: 0, y: -d, z: 0 },
    'shelf': { x: 0, y: -d * 0.5, z: 0 },
    'skirting': { x: 0, y: -d * 0.3, z: -d * 0.3 },
    'drawer': { x: 0, y: -d * 0.7, z: 0 }
  };
  return directions[role] || { x: 0, y: -d * 0.4, z: 0 };
}

function getAssemblyDirection(role) {
  const directions = {
    'left': { arrow: '→', text: 'Place LEFT' },
    'right': { arrow: '←', text: 'Place RIGHT' },
    'top': { arrow: '↓', text: 'Place on TOP' },
    'bottom': { arrow: '↑', text: 'Place at BOTTOM' },
    'back': { arrow: '⟵', text: 'Place at BACK' },
    'front': { arrow: '⟶', text: 'Attach FRONT' },
    'door': { arrow: '⟶', text: 'Attach DOOR' },
    'shelf': { arrow: '—', text: 'Insert SHELF' },
    'skirting': { arrow: '↓', text: 'Fix SKIRTING' },
    'drawer': { arrow: '⟶', text: 'Slide DRAWER' }
  };
  return directions[role] || { arrow: '•', text: 'Place part' };
}

function getMaterialColor(material) {
  const materialColors = {
    '2632 SF Inner': '#8B7355',
    'BB EHGP 701': '#FAFAFA',
    '7070': '#D1D5DB',
    'EHGP 701': '#F5F5F0',
    'Color (Kitchen)': '#DEB887',
    'Plywood': '#C4A77D',
    'MDF': '#E8DCC8',
    'Laminate White': '#FFFFFF',
    'Laminate Oak': '#B8860B',
    'Glass': '#E0F4FF'
  };
  return materialColors[(material || '').trim()] || '#9CA3AF';
}

function getMaterialLegend() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const designSheet = ss.getSheetByName(DESIGNER_CONFIG.sheets.designData);

  if (!designSheet || designSheet.getLastRow() <= 1) {
    return [];
  }

  const data = designSheet.getDataRange().getValues();
  const materials = new Set();

  for (let i = 1; i < data.length; i++) {
    const material = data[i][2];
    if (material) materials.add(material);
  }

  return Array.from(materials).map(mat => ({
    name: mat,
    color: getMaterialColor(mat)
  }));
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================
// Inlined movement/snap/collision/default modules
// (Browser globals + GAS-safe; no CommonJS requires)
// ============================================
(function (root) {
  const vec = (x = 0, y = 0, z = 0) => ({ x, y, z });
  const clone = (v) => vec(v.x, v.y, v.z);
  const add = (a, b) => vec(a.x + b.x, a.y + b.y, a.z + b.z);
  const sub = (a, b) => vec(a.x - b.x, a.y - b.y, a.z - b.z);
  const scale = (v, s) => vec(v.x * s, v.y * s, v.z * s);
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const length = (v) => Math.sqrt(dot(v, v));
  const normalize = (v) => {
    const len = length(v);
    if (len === 0) return vec(0, 0, 0);
    return scale(v, 1 / len);
  };
  const approxEqual = (a, b, eps = 1e-6) =>
    Math.abs(a.x - b.x) <= eps &&
    Math.abs(a.y - b.y) <= eps &&
    Math.abs(a.z - b.z) <= eps;
  root.Vec3 = { vec, clone, add, sub, scale, dot, length, normalize, approxEqual };
})(typeof self !== 'undefined' ? self : this);

(function (root) {
  const Vec3 = root.Vec3;
  const { vec, clone, add, sub } = Vec3;
  const AABB = {
    fromMinMax: (min, max) => ({ min: clone(min), max: clone(max) }),
    fromCenterSize: (center, size) => {
      const half = Vec3.scale(size, 0.5);
      return { min: sub(center, half), max: add(center, half) };
    },
    size: (aabb) => sub(aabb.max, aabb.min),
    translate: (aabb, delta) => ({ min: add(aabb.min, delta), max: add(aabb.max, delta) }),
    overlap: (a, b, epsilon = 0) =>
      a.min.x < b.max.x - epsilon &&
      a.max.x > b.min.x + epsilon &&
      a.min.y < b.max.y - epsilon &&
      a.max.y > b.min.y + epsilon &&
      a.min.z < b.max.z - epsilon &&
      a.max.z > b.min.z + epsilon,
    overlapOnAxesExcept: (a, b, skipAxis, epsilon = 0) => {
      const axes = ['x', 'y', 'z'].filter((ax) => ax !== skipAxis);
      return axes.every((ax) => a.min[ax] < b.max[ax] - epsilon && a.max[ax] > b.min[ax] + epsilon);
    },
    minDistance: (a, b) => {
      const dx = Math.max(0, Math.max(a.min.x - b.max.x, b.min.x - a.max.x));
      const dy = Math.max(0, Math.max(a.min.y - b.max.y, b.min.y - a.max.y));
      const dz = Math.max(0, Math.max(a.min.z - b.max.z, b.min.z - a.max.z));
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
    corners: (aabb) => {
      const { min, max } = aabb;
      return [
        vec(min.x, min.y, min.z),
        vec(max.x, min.y, min.z),
        vec(min.x, max.y, min.z),
        vec(max.x, max.y, min.z),
        vec(min.x, min.y, max.z),
        vec(max.x, min.y, max.z),
        vec(min.x, max.y, max.z),
        vec(max.x, max.y, max.z)
      ];
    }
  };
  root.AABB = AABB;
})(typeof self !== 'undefined' ? self : this);

(function (root) {
  const Vec3 = root.Vec3;
  const AABB = root.AABB;
  const EPS = 0.01;
  const clampAxisDelta = (moving, delta, staticAABBs, axis, epsilon = EPS) => {
    let allowed = delta;
    if (delta === 0) return { allowed, aabb: moving };
    staticAABBs.forEach((other) => {
      if (!AABB.overlapOnAxesExcept(moving, other, axis, epsilon)) return;
      if (delta > 0) {
        const gap = other.min[axis] - moving.max[axis] - epsilon;
        if (gap < allowed) allowed = Math.max(gap, 0);
      } else {
        const gap = other.max[axis] - moving.min[axis] + epsilon;
        if (gap > allowed) allowed = Math.min(gap, 0);
      }
    });
    const translation =
      axis === 'x'
        ? Vec3.vec(allowed, 0, 0)
        : axis === 'y'
        ? Vec3.vec(0, allowed, 0)
        : Vec3.vec(0, 0, allowed);
    const aabb = AABB.translate(moving, translation);
    return { allowed, aabb };
  };
  const clampDelta = (movingAABB, delta, staticAABBs, axisOrder = ['x', 'y', 'z'], epsilon = EPS) => {
    let current = movingAABB;
    let applied = Vec3.vec(0, 0, 0);
    axisOrder.forEach((axis) => {
      const step = delta[axis];
      const { allowed, aabb } = clampAxisDelta(current, step, staticAABBs, axis, epsilon);
      applied = { ...applied, [axis]: allowed };
      current = aabb;
    });
    return { aabb: current, appliedDelta: applied };
  };
  const overlapsAny = (movingAABB, staticAABBs, epsilon = EPS) =>
    staticAABBs.some((aabb) => AABB.overlap(movingAABB, aabb, epsilon));
  const resolve = (movingAABB, desiredDelta, staticAABBs, axisOrder = ['x', 'y', 'z'], epsilon = EPS) =>
    clampDelta(movingAABB, desiredDelta, staticAABBs, axisOrder, epsilon);
  root.CollisionSolver = { EPS, clampDelta, overlapsAny, resolve };
})(typeof self !== 'undefined' ? self : this);

(function (root) {
  const Vec3 = root.Vec3;
  const AABB = root.AABB;
  const SNAP_THRESHOLD = 100;
  const KEEP_THRESHOLD = 120;
  const RELEASE_THRESHOLD = 140;
  const TOLERANCE = 2;
  const defaultState = () => ({ active: false, type: null, targetId: null, meta: null });
  const projectPointToPlane = (point, plane) => {
    const { normal, distance } = plane;
    const n = Vec3.normalize(normal);
    const d = (Vec3.dot(point, n) - distance) / Vec3.dot(n, n || Vec3.vec(1, 0, 0));
    return Vec3.sub(point, Vec3.scale(n, d));
  };
  const distanceToPlane = (point, plane) => {
    const n = Vec3.normalize(plane.normal);
    return Math.abs(Vec3.dot(point, n) - plane.distance);
  };
  const computeWallSnap = (aabb, walls) => {
    const candidates = [];
    const backFace = AABB.corners(aabb).filter((c) => c.z === aabb.min.z);
    const backPoint = backFace[0];
    walls.forEach((wall, idx) => {
      const dist = distanceToPlane(backPoint, wall);
      if (dist <= SNAP_THRESHOLD && dist >= 0) {
        const proj = projectPointToPlane(backPoint, wall);
        const delta = Vec3.sub(proj, backPoint);
        candidates.push({
          type: 'wall',
          distance: dist,
          delta,
          id: wall.id || idx,
          meta: { wallName: wall.name || `Wall ${idx}`, plane: wall }
        });
      }
    });
    return candidates;
  };
  const computeFloorSnap = (aabb, floorY = 0) => {
    const bottom = aabb.min.y;
    const dist = bottom - floorY;
    if (dist > 0 && dist <= SNAP_THRESHOLD) {
      return [{ type: 'floor', distance: dist, delta: Vec3.vec(0, -dist, 0), id: 'floor', meta: { floorY } }];
    }
    return [];
  };
  const computeCornerSnap = (movingAABB, nearbyBoxes) => {
    const movingCorners = AABB.corners(movingAABB);
    let best = null;
    nearbyBoxes.forEach((box) => {
      movingCorners.forEach((corner) => {
        box.corners.forEach((targetCorner) => {
          const d = Vec3.length(Vec3.sub(targetCorner, corner));
          if (d <= SNAP_THRESHOLD) {
            if (
              !best ||
              d < best.distance ||
              (Math.abs(d - best.distance) < 1e-6 && (box.id ?? Number.MAX_SAFE_INTEGER) < (best.boxId ?? Number.MAX_SAFE_INTEGER))
            ) {
              best = {
                type: 'corner',
                distance: d,
                delta: Vec3.sub(targetCorner, corner),
                id: box.id,
                meta: { boxId: box.id, boxName: box.name || `Box ${box.id}`, targetCorner, anchorCorner: corner }
              };
            }
          }
        });
      });
    });
    return best ? [best] : [];
  };
  const distanceForState = (state, aabb) => {
    if (!state || !state.type) return Infinity;
    switch (state.type) {
      case 'wall': {
        const plane = state.meta?.plane;
        if (!plane) return Infinity;
        const backPoint = AABB.corners(aabb).find((c) => c.z === aabb.min.z);
        return distanceToPlane(backPoint || aabb.min, plane);
      }
      case 'floor': {
        const floorY = state.meta?.floorY ?? 0;
        return Math.abs(aabb.min.y - floorY);
      }
      case 'corner': {
        const targetCorner = state.meta?.targetCorner;
        if (!targetCorner) return Infinity;
        const distances = AABB.corners(aabb).map((c) => Vec3.length(Vec3.sub(targetCorner, c)));
        return Math.min(...distances);
      }
      default:
        return Infinity;
    }
  };
  const deltaForState = (state, aabb) => {
    if (!state || !state.type) return Vec3.vec(0, 0, 0);
    switch (state.type) {
      case 'wall': {
        const plane = state.meta?.plane;
        const backPoint = AABB.corners(aabb).find((c) => c.z === aabb.min.z) || aabb.min;
        if (!plane) return Vec3.vec(0, 0, 0);
        const proj = projectPointToPlane(backPoint, plane);
        return Vec3.sub(proj, backPoint);
      }
      case 'floor': {
        const floorY = state.meta?.floorY ?? 0;
        const dist = aabb.min.y - floorY;
        return Vec3.vec(0, -dist, 0);
      }
      case 'corner': {
        const targetCorner = state.meta?.targetCorner;
        if (!targetCorner) return Vec3.vec(0, 0, 0);
        const closest = AABB.corners(aabb).reduce((best, c) => {
          const d = Vec3.length(Vec3.sub(targetCorner, c));
          return d < best.d ? { c, d } : best;
        }, { c: null, d: Infinity }).c;
        if (!closest) return Vec3.vec(0, 0, 0);
        return Vec3.sub(targetCorner, closest);
      }
      default:
        return Vec3.vec(0, 0, 0);
    }
  };
  const pickBest = (candidates) => {
    if (!candidates.length) return null;
    return candidates.sort((a, b) => a.distance - b.distance || (a.id ?? 0) - (b.id ?? 0))[0];
  };
  const computeSnap = (movingAABB, env, hysteresisState = defaultState()) => {
    const walls = env.walls || [];
    const floorY = env.floorY ?? 0;
    const nearbyBoxes = env.nearbyBoxes || [];
    const wallCandidates = computeWallSnap(movingAABB, walls);
    const floorCandidates = computeFloorSnap(movingAABB, floorY);
    const cornerCandidates = computeCornerSnap(movingAABB, nearbyBoxes);
    const candidates = [...wallCandidates, ...floorCandidates, ...cornerCandidates];
    const best = pickBest(candidates);
    if (hysteresisState.active && hysteresisState.type) {
      const dist = distanceForState(hysteresisState, movingAABB);
      if (dist <= RELEASE_THRESHOLD) {
        const delta = deltaForState(hysteresisState, movingAABB);
        return {
          snapped: true,
          delta,
          type: hysteresisState.type,
          meta: { ...hysteresisState.meta, distance: dist },
          state: { ...hysteresisState, meta: { ...hysteresisState.meta, distance: dist, delta } }
        };
      }
    }
    if (best) {
      return {
        snapped: true,
        delta: best.delta,
        type: best.type,
        meta: best.meta,
        state: { active: true, type: best.type, targetId: best.id, meta: { ...best.meta, distance: best.distance, delta: best.delta } }
      };
    }
    return { snapped: false, delta: Vec3.vec(0, 0, 0), type: null, meta: {}, state: defaultState() };
  };
  const snapAndValidate = (movingAABB, desiredDelta, env, collisionFn, hysteresisState) => {
    const snap = computeSnap(AABB.translate(movingAABB, desiredDelta), env, hysteresisState);
    let delta = Vec3.add(desiredDelta, snap.delta);
    const collisionResult = collisionFn(delta);
    let finalDelta = collisionResult.appliedDelta;
    const diff = Vec3.length(Vec3.sub(finalDelta, delta));
    if (snap.snapped && diff > TOLERANCE) {
      const retry = collisionFn(desiredDelta);
      finalDelta = retry.appliedDelta;
      return { delta: finalDelta, snap: { ...snap, snapped: false, dropped: true, state: defaultState() } };
    }
    return { delta: finalDelta, snap };
  };
  root.SnapSolver = { SNAP_THRESHOLD, KEEP_THRESHOLD, RELEASE_THRESHOLD, TOLERANCE, computeSnap, snapAndValidate, defaultState };
})(typeof self !== 'undefined' ? self : this);

(function (root) {
  const AABB = root.AABB;
  root.ProximityIndicators = {
    pickClosest: (movingAABB, others, threshold = 100, k = 3) => {
      const scored = others
        .map((o) => ({ ...o, distance: AABB.minDistance(movingAABB, o.aabb) }))
        .filter((o) => o.distance <= threshold)
        .sort((a, b) => a.distance - b.distance || (a.id ?? 0) - (b.id ?? 0));
      return scored.slice(0, k).map((o) => ({ id: o.id, name: o.name, object: o.object, aabb: o.aabb, distance: o.distance, corners: AABB.corners(o.aabb) }));
    }
  };
})(typeof self !== 'undefined' ? self : this);

(function (root) {
  const Vec3 = root.Vec3;
  const AABB = root.AABB;
  const CollisionSolver = root.CollisionSolver;
  const SnapSolver = root.SnapSolver;
  const axisOrderFromDelta = (delta) => ['x', 'y', 'z'].sort((a, b) => Math.abs(delta[b]) - Math.abs(delta[a]));
  const createMoveToolController = () => {
    const state = { axisKeys: {}, lockedAxis: null, snapState: SnapSolver.defaultState() };
    const resetSnap = () => { state.snapState = SnapSolver.defaultState(); };
    const reset = () => { state.axisKeys = {}; state.lockedAxis = null; resetSnap(); };
    const updateLockedAxis = () => {
      const entries = Object.entries(state.axisKeys);
      if (!entries.length) { state.lockedAxis = null; return; }
      entries.sort((a, b) => b[1] - a[1]);
      state.lockedAxis = entries[0][0];
    };
    const keyDown = (axis, ts = Date.now()) => { state.axisKeys[axis] = ts; updateLockedAxis(); };
    const keyUp = (axis) => { delete state.axisKeys[axis]; updateLockedAxis(); };
    const applyAxisLock = (delta) => {
      if (!state.lockedAxis) return delta;
      const locked = Vec3.vec(0, 0, 0);
      locked[state.lockedAxis] = delta[state.lockedAxis];
      return locked;
    };
    const resolveMove = ({ movingAABB, desiredDelta, staticAABBs, env }) => {
      const lockedDelta = applyAxisLock(desiredDelta);
      const axisOrder = state.lockedAxis ? [state.lockedAxis, ...['x', 'y', 'z'].filter((a) => a !== state.lockedAxis)] : axisOrderFromDelta(lockedDelta);
      const collisionFn = (delta) => CollisionSolver.resolve(movingAABB, delta, staticAABBs, axisOrder);
      const snapResult = SnapSolver.snapAndValidate(movingAABB, lockedDelta, env, collisionFn, state.snapState);
      state.snapState = snapResult.snap.state || SnapSolver.defaultState();
      return { delta: snapResult.delta, snap: snapResult.snap, lockedAxis: state.lockedAxis, axisOrder };
    };
    return { state, keyDown, keyUp, reset, resetSnap, applyAxisLock, resolveMove };
  };
  root.MoveToolController = { createMoveToolController };
})(typeof self !== 'undefined' ? self : this);

(function (root) {
  const computeFromPrevious = (prev, catalogDefaults) => {
    if (!prev) {
      return {
        position: { x: 0, y: 0, z: 0 },
        boxWidth: catalogDefaults.boxWidth,
        boxDepth: catalogDefaults.boxDepth,
        boxHeight: catalogDefaults.boxHeight,
        skirting: catalogDefaults.skirting || 0,
        skirtingWidth: catalogDefaults.skirtingWidth || 0,
        carcassThickness: catalogDefaults.carcassThickness,
        doorThickness: catalogDefaults.doorThickness,
        backplankThickness: catalogDefaults.backplankThickness,
        carcusPly: catalogDefaults.carcusPly,
        doorPly: catalogDefaults.doorPly,
        backPly: catalogDefaults.backPly
      };
    }
    return {
      position: { x: prev.position.x + prev.boxWidth, y: prev.position.y, z: prev.position.z },
      boxWidth: catalogDefaults.boxWidth,
      boxDepth: prev.boxDepth,
      boxHeight: prev.boxHeight,
      skirting: prev.skirting,
      skirtingWidth: prev.skirtingWidth,
      carcassThickness: prev.carcassThickness,
      doorThickness: prev.doorThickness,
      backplankThickness: prev.backplankThickness,
      carcusPly: prev.carcusPly,
      doorPly: prev.doorPly,
      backPly: prev.backPly
    };
  };
  root.BoxDefaults = { computeFromPrevious };
})(typeof self !== 'undefined' ? self : this);