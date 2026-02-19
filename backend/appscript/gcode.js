/**
 * CNC G-code Generator (GRBL-Based)
 * Version: 9.1.0 - Nested Folder Structure (Material -> Thickness)
 * Description: 
 * - Generates G-code sorted by Material folders.
 * - NEW: Sub-folders for Thickness inside Material folders.
 * - File naming includes Material + Thickness + Sheet.
 * - T1 Cuts Smallest Parts First.
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
 * @property {Object.<string, Array<{x: number, y: number, length?: number, width?: number, depth?: number, type?: string}>>} features
 * @property {Array<{x: number, y: number}>} features.l_cuts - L-Cut dimensions
 */

// Global storage
let generatedFiles = [];
let driveFolder = null;

// CRITICAL CONSTANT: Master Folder ID from the provided link
const MASTER_FOLDER_ID = '1Nm09d0EQTXwtBI8rz2lLE0Iwb9J8gQyy';

// ========================================
// G-CODE SPECIFIC UTILITIES
// ========================================
// Note: Project folder functions are in project_storage.js

/**
 * Generate short material code (max 4 characters)
 * e.g., "Pink" -> "Pink", "Black" -> "Blck", "Inner White" -> "InWh"
 */
function getShortMaterialCode(material, maxLen = 4) {
  if (!material) return 'Mat';
  // Remove special chars, keep only letters and numbers
  const clean = String(material).replace(/[^a-zA-Z0-9]/g, '');
  // Take first maxLen characters
  return clean.substring(0, maxLen);
}

/**
 * Generate short filename for G-code (max 15 characters including .nc)
 * Format: [Mat4][Thick]_S[Num].nc
 * e.g., "Pink18_S1.nc" (12 chars)
 */
function generateShortFilename(materialName, thickness, sheetIndex) {
  const shortMat = getShortMaterialCode(materialName, 4);
  const thickNum = Math.round(thickness);
  const filename = `${shortMat}${thickNum}_S${sheetIndex}.nc`;
  
  // Ensure max 15 chars
  if (filename.length > 15) {
    const shorterMat = getShortMaterialCode(materialName, 3);
    return `${shorterMat}${thickNum}_S${sheetIndex}.nc`;
  }
  return filename;
}

// Note: PDF, Labels, CSV save functions are in project_storage.js

/**
 * Generate report download content (called from report_template.html)
 * Also saves a copy to the project folder
 */
function generateReportDownload(format, reportData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const projectName = ss.getName().replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  
  let content = '';
  let mimeType = '';
  let filename = '';
  
  switch(format) {
    case 'html':
      content = generateHTMLReportContent(reportData);
      mimeType = 'text/html';
      filename = `${projectName}_Report_${timestamp}.html`;
      break;
      
    case 'text':
      content = generateTextReportContent(reportData);
      mimeType = 'text/plain';
      filename = `${projectName}_Report_${timestamp}.txt`;
      break;
      
    case 'csv':
      content = generateCSVReportContent(reportData);
      mimeType = 'text/csv';
      filename = `${projectName}_Report_${timestamp}.csv`;
      break;
      
    case 'json':
      content = JSON.stringify(reportData, null, 2);
      mimeType = 'application/json';
      filename = `${projectName}_Report_${timestamp}.json`;
      break;
      
    default:
      throw new Error('Invalid format: ' + format);
  }
  
  // Save to project folder
  try {
    const folder = getProjectSubfolder('REPORTS');
    const blob = Utilities.newBlob(content, mimeType, filename);
    folder.createFile(blob);
  } catch(e) {
    Logger.log('Error saving report to project folder: ' + e.message);
  }
  
  return { content, mimeType, filename };
}

/**
 * Generate HTML report content
 */
function generateHTMLReportContent(reportData) {
  const { summary, sheets, materialThicknessStats } = reportData;
  const usableSheetArea = (1220 - 20) * (2440 - 20);
  
  let html = `<!DOCTYPE html>
<html>
<head>
    <title>Cutlist Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Cutlist Report</h1>
        <p>Generated: ${summary.generatedDate}</p>
    </div>
    
    <div class="section">
        <h2>Project Summary</h2>
        <p><strong>Total Sheets:</strong> ${summary.totalSheets}</p>
        <p><strong>Total Planks:</strong> ${summary.totalPlanks}</p>
        <p><strong>Overall Utilization:</strong> ${summary.overallUtilization || 'N/A'}%</p>
    </div>
    
    <div class="section">
        <h2>Sheet Utilization</h2>
        <table>
            <tr><th>Sheet #</th><th>Planks</th><th>Used Area</th><th>Utilization</th></tr>`;
  
  if (sheets) {
    Object.entries(sheets).forEach(([sheetNum, sheet]) => {
      const utilization = ((sheet.usedArea / usableSheetArea) * 100).toFixed(1);
      html += `<tr>
                <td>Sheet ${sheetNum}</td>
                <td>${sheet.planks ? sheet.planks.length : 0}</td>
                <td>${Math.round(sheet.usedArea || 0)} mm²</td>
                <td>${utilization}%</td>
            </tr>`;
    });
  }
  
  html += `</table></div>
    
    <div class="section">
        <h2>Materials Summary</h2>
        <table>
            <tr><th>Material</th><th>Planks</th><th>Total Area</th><th>Sheets</th></tr>`;
  
  if (materialThicknessStats) {
    Object.values(materialThicknessStats).forEach(stats => {
      html += `<tr>
                <td>${stats.material} (${stats.thickness}mm)</td>
                <td>${stats.plankCount}</td>
                <td>${Math.round(stats.totalArea)} mm²</td>
                <td>${stats.sheetCount}</td>
            </tr>`;
    });
  }
  
  html += `</table></div>
</body>
</html>`;
  
  return html;
}

/**
 * Generate text report content
 */
function generateTextReportContent(reportData) {
  const { summary, sheets, materialThicknessStats } = reportData;
  let text = `CUTLIST REPORT
==============
Generated: ${summary.generatedDate}

PROJECT SUMMARY
---------------
Total Sheets: ${summary.totalSheets}
Total Planks: ${summary.totalPlanks}
Overall Utilization: ${summary.overallUtilization || 'N/A'}%

SHEET UTILIZATION
-----------------
`;

  if (sheets) {
    Object.entries(sheets).forEach(([sheetNum, sheet]) => {
      const usableSheetArea = (1220 - 20) * (2440 - 20);
      const utilization = ((sheet.usedArea / usableSheetArea) * 100).toFixed(1);
      text += `Sheet ${sheetNum}: ${sheet.planks ? sheet.planks.length : 0} planks, ${Math.round(sheet.usedArea || 0)} mm², ${utilization}%\n`;
    });
  }

  text += `\nMATERIALS SUMMARY
-----------------
`;

  if (materialThicknessStats) {
    Object.values(materialThicknessStats).forEach(stats => {
      text += `${stats.material} (${stats.thickness}mm): ${stats.plankCount} planks, ${Math.round(stats.totalArea)} mm², ${stats.sheetCount} sheets\n`;
    });
  }

  return text;
}

/**
 * Generate CSV report content
 */
function generateCSVReportContent(reportData) {
  const { sheets, materialThicknessStats } = reportData;
  let csv = 'Sheet,Planks,Used Area (mm²),Utilization (%)\n';
  
  if (sheets) {
    const usableSheetArea = (1220 - 20) * (2440 - 20);
    Object.entries(sheets).forEach(([sheetNum, sheet]) => {
      const utilization = ((sheet.usedArea / usableSheetArea) * 100).toFixed(1);
      csv += `${sheetNum},${sheet.planks ? sheet.planks.length : 0},${Math.round(sheet.usedArea || 0)},${utilization}\n`;
    });
  }
  
  csv += '\nMaterial,Thickness (mm),Plank Count,Total Area (mm²),Sheet Count\n';
  
  if (materialThicknessStats) {
    Object.values(materialThicknessStats).forEach(stats => {
      csv += `"${stats.material}",${stats.thickness},${stats.plankCount},${Math.round(stats.totalArea)},${stats.sheetCount}\n`;
    });
  }
  
  return csv;
} 

// G-Code State Tracking (Simplified Z-state for full Z26 retraction policy)
let current_tool_ID = null;
let current_sheet_ID = null;

// MACHINE CONSTANTS
const Z_SAFE = 26.0; // The fixed safe Z height for all rapid moves (G00)

// CRITICAL X/Y MINIMUM: Ensures coordinates are non-negative.
const MIN_COORDINATE_VALUE = 0.0000;

// CRITICAL Z-HEIGHT: The lowest point the tool tip will reach (0.01 to avoid the spoil board Z=0).
const Z_THROUGH_CUT_FINAL_HEIGHT = -0.01;

const SPINDLE_SPEED = 18000;
const CUTTING_FEED_RATE = 12000;
const PLUNGE_FEED_RATE = 6000.0;
const BIT_RADIUS = 4;
const TOOL_DIAMETER_T2 = 10;

// TOOL DEPTHS (These are the *distance DOWN from the top of the material*)
const FIXED_DEPTHS = {
  // T2 Slot/Groove depth is dynamically read from slot.depth in the sheet
  T4: 16, // VB Main
  T5: 14, // Hinge Hole
  T6: 11, // VB Double
};

/**
 * MAIN FUNCTION - Complete CNC G-code generation with Drive upload
 */
function generateGCodeFiles() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const nestSheet = ss.getSheetByName('Nest Result');

    if (!nestSheet) {
      throw new Error('❌ "Nest Result" sheet not found. Please check the sheet name.');
    }

    // Process data
    const data = getNestData(nestSheet);
    
    // --- UPDATED: Grouping now tracks Thickness folder names ---
    const sheets = groupBySheet(data);
    // -----------------------------------------------------------

    if (Object.keys(sheets).length === 0) {
      throw new Error('❌ No valid data found in the sheet.');
    }

    // Generate G-code
    generatedFiles = [];
    const gcodeResults = generateGCodeForSheets(sheets);

    // --- UPDATED: Create Hierarchical Folder Structure (Mat -> Thick) ---
    const ncFiles = createNCFilesInDrive(gcodeResults);
    // --------------------------------------------------------------------

    // Create ZIP file (using a folder link as a ZIP download proxy)
    const zipUrl = zipAndUploadFiles(ncFiles);

    // Show download links
    showDownloadLinksPopup(ncFiles, zipUrl);

  } catch (error) {
    handleError(error);
  }
}

/**
 * DATA PROCESSING FUNCTIONS
 */

/**
 * Extracts and processes nest data from sheet
 */
function getNestData(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim()); // Get headers from the first row

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
      const plank = {
        id: String(row[colIndices.plankId]) || `PLANK_${index + 1}`,
        name: String(row[colIndices.plankName]) || 'N/A',
        material: String(row[colIndices.material]) || 'N/A',
        thickness: parseFloat(row[colIndices.thickness]) || 0,
        sheet: String(row[colIndices.sheet]).trim(),
        x: parseFloat(row[colIndices.x]) || 0,
        y: parseFloat(row[colIndices.y]) || 0,
        placedWidth: parseFloat(row[colIndices.placedWidth]) || 0,
        placedHeight: parseFloat(row[colIndices.placedHeight]) || 0,
        rotated: String(row[colIndices.rotated]).toLowerCase() === 'yes' || String(row[colIndices.rotated]).toLowerCase() === 'si',
        features: extractFeatures(row, headers)
      };
      
      return plank; 
      
    } catch (e) {
      Logger.log(`Error processing row ${index + 2}: ${e}`);
      return null;
    }
  }).filter(p => p && isValidPlank(p));
}

/**
 * Extracts feature coordinates and geometry from row data
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

    // --- 2. Slot/Profile Groove Features (T2) ---
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

  // --- 3. L-Cut Triplets (NEW ARCHITECTURE) ---
  // Extract explicit start/center/end triplets
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
    
    // Validate all 6 are numbers
    if (isNaN(startX) || isNaN(startY) || isNaN(centerX) ||
        isNaN(centerY) || isNaN(endX) || isNaN(endY)) continue;
    
    // Skip if all zeros (empty triplet)
    if (startX === 0 && startY === 0 && centerX === 0 && 
        centerY === 0 && endX === 0 && endY === 0) continue;
    
    features.l_cuts.push({
      start: { x: startX, y: startY },
      center: { x: centerX, y: centerY },
      end: { x: endX, y: endY }
    });
  }
  
  // --- 3b. Gola Profile Triplets ---
  // Extract explicit start/center/end triplets for Gola profiles
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
    
    // Validate all 6 are numbers
    if (isNaN(startX) || isNaN(startY) || isNaN(centerX) ||
        isNaN(centerY) || isNaN(endX) || isNaN(endY)) continue;
    
    // Skip if all zeros (empty triplet)
    if (startX === 0 && startY === 0 && centerX === 0 && 
        centerY === 0 && endX === 0 && endY === 0) continue;
    
    features.gola_profiles.push({
      start: { x: startX, y: startY },
      center: { x: centerX, y: centerY },
      end: { x: endX, y: endY }
    });
  }
  
  // --- 4. Legacy L-cutting fallback (for backward compatibility) ---
  // Only use if no triplets found
  if (features.l_cuts.length === 0) {
    const legacyXIdx = headers.indexOf('l_cutting_1_X');
    const legacyYIdx = headers.indexOf('l_cutting_1_Y');
    
    if (legacyXIdx !== -1 && legacyYIdx !== -1) {
      const xVal = parseFloat(row[legacyXIdx]);
      const yVal = parseFloat(row[legacyYIdx]);
      
      if (!isNaN(xVal) && !isNaN(yVal) && (xVal !== 0 || yVal !== 0)) {
        // Mark as legacy for warning
        features.l_cuts.push({ 
          legacy: true, 
          x: xVal, 
          y: yVal 
        });
        Logger.log('Warning: Legacy L-cut detected; please re-export using triplet format.');
      }
    }
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
 * --- UPDATED GROUPING LOGIC ---
 * Groups planks by Material AND Thickness.
 * Extracts "folderName" (Color) AND "thicknessFolder" (e.g. 18MM) separately.
 */
function groupBySheet(nestData) {
  const grouped = nestData.reduce((acc, plank) => {
    // 1. Get Clean Material Name (e.g. "Pink")
    const cleanMaterial = plank.material.trim().replace(/\s*\(.*?\)/, '').trim();
    const folderName = cleanMaterial.replace(/\s+/g, '_'); 
    
    // 2. Determine Thickness Key (e.g. "18MM")
    const thicknessKey = `${Math.round(plank.thickness)}MM`; 
    
    // 3. Create Unique Group Key (e.g. "Pink_18MM")
    const uniqueGroupKey = `${folderName}_${thicknessKey}`;

    if (!acc[uniqueGroupKey]) {
      acc[uniqueGroupKey] = { 
        folderName: folderName, // Level 1 Folder: "Pink"
        thicknessFolderName: thicknessKey, // Level 2 Folder: "18MM"
        sheets: {} 
      };
    }

    // 4. Group by Sheet within this Material/Thickness combo
    if (!acc[uniqueGroupKey].sheets[plank.sheet]) {
      acc[uniqueGroupKey].sheets[plank.sheet] = [];
    }
    acc[uniqueGroupKey].sheets[plank.sheet].push(plank);
    return acc;
  }, {});

  const finalSheets = {};
  
  // Flatten into final list of files to generate
  Object.keys(grouped).sort().forEach(groupKey => {
    const groupData = grouped[groupKey];
    let sheetIndex = 1;
    
    const originalSheetNames = Object.keys(groupData.sheets).sort();

    originalSheetNames.forEach(origName => {
      // Get thickness number (e.g., 18 from "18MM")
      const thickNum = parseInt(groupData.thicknessFolderName.replace('MM', ''));
      
      // Generate SHORT filename (max 15 chars)
      const shortFilename = generateShortFilename(groupData.folderName, thickNum, sheetIndex);
      
      // Use short name as key (without .nc extension for internal use)
      const newSheetName = shortFilename.replace('.nc', '');
      
      finalSheets[newSheetName] = {
        materialFolder: groupData.folderName,       // "Pink"
        thicknessFolder: groupData.thicknessFolderName, // "18MM"
        planks: groupData.sheets[origName],
        shortFilename: shortFilename  // Store the short filename
      };
      
      sheetIndex++;
    });
  });

  return finalSheets;
}

/**
 * G-CODE GENERATION FUNCTIONS
 */

/**
 * Resets G-code state trackers for a new sheet generation run.
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
      // Generate code
      const gcode = generateGCodeForSheet(sheetData.planks, uniqueSheetName);
      
      // Use SHORT filename (max 15 chars)
      const fileName = sheetData.shortFilename || `${uniqueSheetName}.nc`;

      results.push({
        sheetName: uniqueSheetName, 
        fileName: fileName,
        materialFolder: sheetData.materialFolder,   // Pass Material name
        thicknessFolder: sheetData.thicknessFolder, // Pass Thickness name
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
  gcode.push(...processSlotTool('T2', 'Slot/Profile Grooves', planks)); 
  
  // Sort Planks for T1: Smallest Area First
  const sortedPlanksForT1 = [...planks].sort((a, b) => {
      const areaA = a.placedWidth * a.placedHeight;
      const areaB = b.placedWidth * b.placedHeight;
      return areaA - areaB; 
  });

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

// --- SLOT GROOVE LOGIC IMPLEMENTATION (T2) ---

/**
 * Calculates number of lateral passes
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
 * Processes Slot Tool (T2)
 */
function processSlotTool(toolNumber, operationName, planks) {
  const gcode = [];
  let hasOperations = false;

  planks.forEach(plank => {
    if (plank.features.slots && plank.features.slots.length > 0) {

      if (!hasOperations) {
        gcode.push(...outputToolStart(toolNumber, planks));
        hasOperations = true;
      }

      const Z_APPROACH = plank.thickness;

      plank.features.slots.forEach(slot => {
        gcode.push(...generateSlotGCode(plank, slot, Z_APPROACH));
      });
    }
  });

  if (hasOperations) {
    gcode.push('M05');
  }

  return gcode;
}

/**
 * Generates G-code for a single slot/groove
 */
function generateSlotGCode(plank, slot, Z_APPROACH) {
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
  const { offsets } = getLateralPaths(slot.width, TOOL_DIAMETER_T2);

  offsets.forEach((offset) => {
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

    const Xs = Math.max(Xs_path, MIN_COORDINATE_VALUE);
    const Ys = Math.max(Ys_path, MIN_COORDINATE_VALUE);
    const Xe = Math.max(Xe_path, MIN_COORDINATE_VALUE);
    const Ye = Math.max(Ye_path, MIN_COORDINATE_VALUE);

    gcode.push(`G00 X${Xs.toFixed(4)} Y${Ys.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
    gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);
    gcode.push(`G01 Z${finalCutZ.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${Xe.toFixed(4)} Y${Ye.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
    gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  });

  return gcode;
}

// --- T1 PROFILE CUTTING LOGIC ---

/**
 * Calculates the 6 tool-offset coordinates for an L-Cut plank.
 */
function calculateLCutCoordinates(plank, l_cut_X, l_cut_Y, bitRadius) {
  const R = bitRadius;
  const isRotated = plank.rotated;

  const logicalWidth = isRotated ? plank.placedHeight : plank.placedWidth;
  const logicalHeight = isRotated ? plank.placedWidth : plank.placedHeight;

  const X1 = Math.max(0, Math.min(l_cut_X, logicalWidth - R));
const Y1 = Math.max(0, Math.min(l_cut_Y, logicalHeight - R));

  const PW = logicalWidth;
  const PH = logicalHeight;

  let relativeOffsetVertices = [];
  const name = plank.name.toLowerCase();

  if (name.includes("right")) {
    relativeOffsetVertices = [
      { x: X1 - R, y: -R }, 
      { x: PW + R, y: -R }, 
      { x: PW + R, y: PH + R }, 
      { x: -R, y: PH + R }, 
      { x: -R, y: Y1 + R }, 
      { x: X1 - R, y: Y1 + R } 
    ];
  } else {
    relativeOffsetVertices = [
      { x: -R, y: -R }, 
      { x: X1 + R, y: -R }, 
      { x: X1 + R, y: Y1 + R }, 
      { x: PW + R, y: Y1 + R }, 
      { x: PW + R, y: PH + R }, 
      { x: -R, y: PH + R } 
    ];
  }

  const plankOriginX = plank.x; 
  const plankOriginY = plank.y; 

  const finalCoords = relativeOffsetVertices.map(v => {
    let final_v = { ...v };
    if (isRotated) {
      final_v.x = -v.y;
      final_v.y = v.x;
    }
    final_v.x += plankOriginX;
    final_v.y += plankOriginY;
    return final_v;
  });

  return {
    p1: finalCoords[0], p2: finalCoords[1], p3: finalCoords[2],
    p4: finalCoords[3], p5: finalCoords[4], p6: finalCoords[5],
  };
}

/**
 * Generates G-code for a single RECTANGULAR plank profile (T1).
 */
function generateT1_Rectangle(plank) {
  const gcode = [];

  let width = plank.placedWidth;
  let height = plank.placedHeight;

  const coords = calculateProfileCoordinates(plank.x, plank.y, width, height, BIT_RADIUS);
  const passes = getProfilePassDepths(plank.thickness);
  const Z_APPROACH = plank.thickness;

  const p1X = Math.max(coords.p1.x, MIN_COORDINATE_VALUE); const p1Y = Math.max(coords.p1.y, MIN_COORDINATE_VALUE);
  const p2X = Math.max(coords.p2.x, MIN_COORDINATE_VALUE); const p2Y = Math.max(coords.p2.y, MIN_COORDINATE_VALUE);
  const p3X = Math.max(coords.p3.x, MIN_COORDINATE_VALUE); const p3Y = Math.max(coords.p3.y, MIN_COORDINATE_VALUE);
  const p4X = Math.max(coords.p4.x, MIN_COORDINATE_VALUE); const p4Y = Math.max(coords.p4.y, MIN_COORDINATE_VALUE);

  gcode.push(`G00 X${p1X.toFixed(4)} Y${p1Y.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
  gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);

  passes.forEach((depth) => {
    gcode.push(`G01 Z${depth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${p4X.toFixed(4)} Y${p4Y.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${p3X.toFixed(4)} Y${p3Y.toFixed(4)}`);
    gcode.push(`G01 X${p2X.toFixed(4)} Y${p2Y.toFixed(4)}`);
    gcode.push(`G01 X${p1X.toFixed(4)} Y${p1Y.toFixed(4)}`);
  });

  gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  return gcode;
}

/**
 * Generates G-code for a SINGLE L-cut (baby cut).
 * This is a preliminary cut that removes corner material BEFORE the main plank cut.
 * 
 * Path: start → center → end (2 line segments, open path)
 * Uses same T1 rules: pass depths, feed rates, safe height.
 * 
 * IMPORTANT: Applies BIT_RADIUS compensation for edge coordinates.
 * When a coordinate is at the plank edge (relative 0 or plank dimension),
 * the tool center needs to extend beyond to cut the full edge.
 */
function generateLCutOnly(plank, l_cut) {
  const gcode = [];
  
  const passes = getProfilePassDepths(plank.thickness);
  const Z_APPROACH = plank.thickness;
  const R = BIT_RADIUS;
  
  // Plank boundaries (absolute coordinates on the sheet)
  const plankLeft = plank.x;
  const plankBottom = plank.y;
  const plankRight = plank.x + plank.placedWidth;
  const plankTop = plank.y + plank.placedHeight;
  
  // Edge detection threshold (coordinates within this distance from edge get extended)
  const EDGE_THRESHOLD = 1.0; // 1mm tolerance for edge detection
  
  /**
   * Apply bit radius compensation for edge coordinates.
   * If coordinate is at plank edge, extend beyond by BIT_RADIUS so tool cuts full edge.
   */
  function compensateForEdge(x, y) {
    let compX = x;
    let compY = y;
    
    // Check X edges
    if (Math.abs(x - plankLeft) < EDGE_THRESHOLD) {
      compX = plankLeft - R; // Extend left beyond plank edge
    } else if (Math.abs(x - plankRight) < EDGE_THRESHOLD) {
      compX = plankRight + R; // Extend right beyond plank edge
    }
    
    // Check Y edges
    if (Math.abs(y - plankBottom) < EDGE_THRESHOLD) {
      compY = plankBottom - R; // Extend down beyond plank edge
    } else if (Math.abs(y - plankTop) < EDGE_THRESHOLD) {
      compY = plankTop + R; // Extend up beyond plank edge
    }
    
    // Ensure non-negative (machine can't go below 0)
    compX = Math.max(compX, MIN_COORDINATE_VALUE);
    compY = Math.max(compY, MIN_COORDINATE_VALUE);
    
    return { x: compX, y: compY };
  }
  
  // Apply edge compensation to all three points
  const startComp = compensateForEdge(l_cut.start.x, l_cut.start.y);
  const centerComp = compensateForEdge(l_cut.center.x, l_cut.center.y);
  const endComp = compensateForEdge(l_cut.end.x, l_cut.end.y);
  
  const startX = startComp.x;
  const startY = startComp.y;
  const centerX = centerComp.x;
  const centerY = centerComp.y;
  const endX = endComp.x;
  const endY = endComp.y;
  
  // Cut for each pass depth
  passes.forEach((depth, index) => {
    // Rapid to start point at safe height
    gcode.push(`G00 X${startX.toFixed(4)} Y${startY.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
    // Approach
    gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);
    // Plunge to depth
    gcode.push(`G01 Z${depth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
    // Cut to center
    gcode.push(`G01 X${centerX.toFixed(4)} Y${centerY.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
    // Cut to end
    gcode.push(`G01 X${endX.toFixed(4)} Y${endY.toFixed(4)}`);
    // Retract to safe height after each pass
    gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  });
  
  return gcode;
}

/**
 * Generates G-code for a plank that has L-cuts and/or Gola profiles.
 * THREE-STEP PROCESS:
 * 1. FIRST: Cut all L-cuts (baby cuts) - removes corner material
 * 2. SECOND: Cut all Gola profiles (same mechanics as L-cuts)
 * 3. THEN: Cut the main rectangle outline
 * 
 * This approach handles multiple cuts cleanly and follows Nest Result exactly.
 */
function generateT1_LCut(plank) {
  const gcode = [];
  
  // If no L-cuts and no Gola profiles, just cut rectangle
  const hasLCuts = plank.features.l_cuts && plank.features.l_cuts.length > 0;
  const hasGolaProfiles = plank.features.gola_profiles && plank.features.gola_profiles.length > 0;
  
  if (!hasLCuts && !hasGolaProfiles) {
    return generateT1_Rectangle(plank);
  }
  
  // STEP 1: Cut all L-cuts first (baby cuts)
  if (hasLCuts) {
    plank.features.l_cuts.forEach(l_cut => {
      if (l_cut.legacy) {
        // Legacy L-cuts use old format - generate using legacy function
        gcode.push(...generateLCutOnly_Legacy(plank, l_cut));
      } else {
        // Modern L-cuts with start/center/end triplet
        gcode.push(...generateLCutOnly(plank, l_cut));
      }
    });
  }
  
  // STEP 2: Cut all Gola profiles (same mechanics as L-cuts)
  if (hasGolaProfiles) {
    plank.features.gola_profiles.forEach(gola_profile => {
      // Gola profiles use the same cutting function as L-cuts
      // They have the same start/center/end triplet structure
      gcode.push(...generateLCutOnly(plank, gola_profile));
    });
  }
  
  // STEP 3: Cut the main rectangle outline
  gcode.push(...generateT1_Rectangle(plank));
  
  return gcode;
}

/**
 * Generates G-code for a SINGLE legacy L-cut (baby cut).
 * Uses old l_cutting_1_X/Y format with name-based corner detection.
 */
function generateLCutOnly_Legacy(plank, l_cut) {
  const gcode = [];
  
  Logger.log('Warning: Using legacy L-cut for plank "' + plank.name + '"; please re-export using triplet format.');
  
  const passes = getProfilePassDepths(plank.thickness);
  const Z_APPROACH = plank.thickness;
  const R = BIT_RADIUS;
  
  // Legacy format only has x, y (the L-cut dimensions)
  const l_cut_X = l_cut.x;
  const l_cut_Y = l_cut.y;
  
  // Calculate L-cut path based on plank name (left/right)
  const coords = calculateLCutCoordinates(plank, l_cut_X, l_cut_Y, R);
  
  // For legacy, we cut the L-shape path (3 points that form the L)
  // The L-cut removes a corner, so we trace: outer edge → inner corner → other outer edge
  const name = plank.name.toLowerCase();
  
  let startPt, centerPt, endPt;
  if (name.includes("right")) {
    // Right L-cut: corner at bottom-left of the L notch
    startPt = { x: coords.p1.x, y: coords.p1.y };
    centerPt = { x: coords.p6.x, y: coords.p6.y };
    endPt = { x: coords.p5.x, y: coords.p5.y };
  } else {
    // Left L-cut: corner at bottom-right of the L notch
    startPt = { x: coords.p2.x, y: coords.p2.y };
    centerPt = { x: coords.p3.x, y: coords.p3.y };
    endPt = { x: coords.p4.x, y: coords.p4.y };
  }
  
  const startX = Math.max(startPt.x, MIN_COORDINATE_VALUE);
  const startY = Math.max(startPt.y, MIN_COORDINATE_VALUE);
  const centerX = Math.max(centerPt.x, MIN_COORDINATE_VALUE);
  const centerY = Math.max(centerPt.y, MIN_COORDINATE_VALUE);
  const endX = Math.max(endPt.x, MIN_COORDINATE_VALUE);
  const endY = Math.max(endPt.y, MIN_COORDINATE_VALUE);
  
  // Rapid to start point at safe height
  gcode.push(`G00 X${startX.toFixed(4)} Y${startY.toFixed(4)} Z${Z_SAFE.toFixed(4)}`);
  gcode.push(`G00 Z${Z_APPROACH.toFixed(4)}`);
  
  // Cut for each pass depth
  passes.forEach((depth) => {
    gcode.push(`G01 Z${depth.toFixed(4)} F${PLUNGE_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${centerX.toFixed(4)} Y${centerY.toFixed(4)} F${CUTTING_FEED_RATE.toFixed(4)}`);
    gcode.push(`G01 X${endX.toFixed(4)} Y${endY.toFixed(4)}`);
    if (passes.indexOf(depth) < passes.length - 1) {
      gcode.push(`G01 X${startX.toFixed(4)} Y${startY.toFixed(4)}`);
    }
  });
  
  gcode.push(`G00 Z${Z_SAFE.toFixed(4)}`);
  
  return gcode;
}

/**
 * Processes T1 - Cutting Profile
 * NEW ARCHITECTURE: L-cut and Gola profile detection is based purely on features arrays presence,
 * NOT on plank name. This is deterministic and explicit.
 */
function processToolT1(planks) {
  const gcode = [];
  const toolNumber = 'T1';

  if (planks.length === 0) return gcode;

  gcode.push(...outputToolStart(toolNumber, planks));

  planks.forEach(plank => {
    // Deterministic detection: check if l_cuts OR gola_profiles arrays have entries
    const hasLCut = plank.features.l_cuts && plank.features.l_cuts.length > 0;
    const hasGolaProfile = plank.features.gola_profiles && plank.features.gola_profiles.length > 0;

    if (hasLCut || hasGolaProfile) {
      gcode.push(...generateT1_LCut(plank));
    } else {
      gcode.push(...generateT1_Rectangle(plank));
    }
  });

  gcode.push('M05');
  return gcode;
}

/**
 * Calculates profile coordinates with offset (FOR RECTANGLES)
 */
function calculateProfileCoordinates(x, y, width, height, bitRadius) {
  return {
    p1: { x: x - bitRadius, y: y - bitRadius },
    p2: { x: x + width + bitRadius, y: y - bitRadius },
    p3: { x: x + width + bitRadius, y: y + height + bitRadius },
    p4: { x: x - bitRadius, y: y + height + bitRadius }
  };
}

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
 * Maps operation name to feature type
 */
function getFeatureType(operationName) {
  const mapping = {
    'Screw Holes': 'screws',
    'Hinge Holes': 'hinges',
    'Slot/Profile Grooves': 'slots',
    'VB Main': 'vb_main',
    'VB Double': 'vb_double'
 };
 return mapping[operationName] || 'screws';
}


/**
 * GOOGLE DRIVE INTEGRATION
 */


/**
 * Creates NC files in Google Drive
 * --- UPDATED: Creates Material Folder -> then Thickness Folder ---
 * --- DUAL STORAGE: Also copies to centralized project folder ---
 */
function createNCFilesInDrive(gcodeResults) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // 1. Get Project Name from Sheet Name
    const projectName = ss.getName().trim().replace(/[/\\?%*:|"<>]/g, '_'); 
    
    // 2. Format Main Folder (NO TIMESTAMP - just G_CODES subfolder)
    const mainFolderName = `${projectName}_G_CODES`;

    // 3. Get Master Folder
    let masterFolder;
    try {
        masterFolder = DriveApp.getFolderById(MASTER_FOLDER_ID);
    } catch (e) {
        throw new Error(`Master Folder ID invalid.`);
    }

    // 4. Check if folder exists, otherwise create
    const existingFolders = masterFolder.getFoldersByName(mainFolderName);
    if (existingFolders.hasNext()) {
      driveFolder = existingFolders.next();
      // Clear existing files in folder for fresh generation
    } else {
      driveFolder = masterFolder.createFolder(mainFolderName);
    }
    
    // 5. Get Project Folder for dual storage
    const projectGcodeFolder = getProjectSubfolder('G-CODE');
    
    // Cache for subfolders to avoid re-fetching/creating (Optimization)
    const materialFoldersCache = {};
    const thicknessFoldersCache = {}; // Cache using composite key "Material_Thickness"
    const projectMaterialFoldersCache = {};
    const projectThicknessFoldersCache = {};
    const ncFiles = [];

    gcodeResults.forEach(result => {
      const materialName = result.materialFolder; // e.g., "Pink"
      const thicknessName = result.thicknessFolder; // e.g., "18MM"
      
      // === EXISTING LOCATION (G_CODES folder) ===
      // 5. Create or Get Material Subfolder (Level 1)
      let materialFolder;
      if (materialFoldersCache[materialName]) {
        materialFolder = materialFoldersCache[materialName];
      } else {
        const existingMat = driveFolder.getFoldersByName(materialName);
        materialFolder = existingMat.hasNext() ? existingMat.next() : driveFolder.createFolder(materialName);
        materialFoldersCache[materialName] = materialFolder;
      }

      // 6. Create or Get Thickness Subfolder (Level 2)
      const thickCacheKey = `${materialName}_${thicknessName}`;
      let thicknessFolder;
      
      if (thicknessFoldersCache[thickCacheKey]) {
        thicknessFolder = thicknessFoldersCache[thickCacheKey];
      } else {
        const existingThick = materialFolder.getFoldersByName(thicknessName);
        thicknessFolder = existingThick.hasNext() ? existingThick.next() : materialFolder.createFolder(thicknessName);
        thicknessFoldersCache[thickCacheKey] = thicknessFolder;
      }

      // 7. Save File in Thickness Subfolder
      const blob = Utilities.newBlob(result.content, 'text/plain', result.fileName);
      const file = thicknessFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      // === DUAL STORAGE: Copy to Project Folder ===
      // Create same structure in project folder
      let projMatFolder;
      if (projectMaterialFoldersCache[materialName]) {
        projMatFolder = projectMaterialFoldersCache[materialName];
      } else {
        const existingProjMat = projectGcodeFolder.getFoldersByName(materialName);
        projMatFolder = existingProjMat.hasNext() ? existingProjMat.next() : projectGcodeFolder.createFolder(materialName);
        projectMaterialFoldersCache[materialName] = projMatFolder;
      }
      
      let projThickFolder;
      if (projectThicknessFoldersCache[thickCacheKey]) {
        projThickFolder = projectThicknessFoldersCache[thickCacheKey];
      } else {
        const existingProjThick = projMatFolder.getFoldersByName(thicknessName);
        projThickFolder = existingProjThick.hasNext() ? existingProjThick.next() : projMatFolder.createFolder(thicknessName);
        projectThicknessFoldersCache[thickCacheKey] = projThickFolder;
      }
      
      // Copy file to project folder
      file.makeCopy(result.fileName, projThickFolder);
      
      ncFiles.push({
        name: result.fileName,
        url: file.getUrl(),
        sheet: result.sheetName,
        planks: result.plankCount
      });
    });

    createSummaryFile(ncFiles);
    return ncFiles;

  } catch (error) {
    throw new Error(`Failed to create Drive files: ${error.message}`);
  }
}


/**
 * Creates ZIP file of all NC files
 */
function zipAndUploadFiles(ncFiles) {
  try {
    if (!driveFolder) {
      throw new Error('Drive folder not created');
    }

    // Since we now have subfolders, flat-zipping is tricky in standard Apps Script.
    // We create a "DOWNLOAD_ALL" folder and copy files there flatly for easy bulk download.
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
2. Subfolders: Material (e.g., Pink)
3. Inner Subfolders: Thickness (e.g., 18MM)

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
 * USER INTERFACE FUNCTIONS
 */


/**
 * Shows popup with download links
 * Now includes link to centralized project folder
 */
function showDownloadLinksPopup(ncFiles, zipUrl) {
  const ui = SpreadsheetApp.getUi();
  const projectFolderUrl = getProjectFolderUrl();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px;">
        <h1 style="margin: 0; font-size: 24px;">🎉 CNC G-code Generation Complete!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Files saved to project folder</p>
      </div>
      
      <div style="margin-bottom: 20px; background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
        <h3 style="color: #2e7d32; margin: 0 0 10px 0;">📁 PROJECT FOLDER (All Files)</h3>
        <a href="${projectFolderUrl}" target="_blank" style="display: inline-block; background: #4caf50; color: white; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
          📂 Open Project Folder
        </a>
        <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">
          Contains all project files: G-CODE, PDF, Labels, CSV, etc.
        </p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #4a148c; margin-bottom: 10px;">📦 G-CODE FOLDER</h3>
        <a href="${driveFolder.getUrl()}" target="_blank" style="display: inline-block; background: #4a148c; color: white; padding: 10px 16px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 14px;">
          📥 Open G-Code Folder
        </a>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin-bottom: 10px;">📄 FILES GENERATED (${ncFiles.length})</h3>
        <div style="max-height: 180px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px; padding: 10px;">
          ${ncFiles.map(file => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #f0f0f0;">
              <span style="font-weight: bold; font-size: 13px;">${file.name}</span>
              <a href="${file.url}" target="_blank" style="background: #1976d2; color: white; padding: 5px 10px; border-radius: 3px; text-decoration: none; font-size: 11px;">
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
    .setHeight(650);

  ui.showModalDialog(htmlOutput, 'Download Your CNC G-code Files');
}


/**
 * ERROR HANDLING
 */


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
      <h1 style="font-size: 48px; margin: 0;">❌</h1>
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