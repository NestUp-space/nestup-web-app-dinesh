/**
 * Project Storage Manager
 * Handles all project folder operations for centralized storage
 * 
 * Master Folder: 1V1zMM5wFR65Nb1oQM2_1hhYuXe1RFFeV
 * 
 * Structure:
 * - ProjectName/
 *   - SHEETS/ (all sheets as separate Google Sheets - LINKED)
 *   - G-CODE/ (copy of G-code files)
 *   - PDF/
 *   - LABELS/
 *   - INVOICES/
 *   - REPORTS/
 *   - MATERIAL_ESTIMATE/
 */

// ========================================
// CONSTANTS
// ========================================

// Master folder for ALL project data (sheets, PDFs, labels, invoices, etc.)
const PROJECT_MASTER_FOLDER_ID = '1V1zMM5wFR65Nb1oQM2_1hhYuXe1RFFeV';

// ========================================
// PROJECT FOLDER MANAGEMENT
// ========================================

/**
 * Get or create the project folder (named after the spreadsheet)
 * Stores folder ID in document properties for reuse
 * @returns {GoogleAppsScript.Drive.Folder} The project folder
 */
function getOrCreateProjectFolder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const projectName = ss.getName().trim().replace(/[/\\?%*:|"<>]/g, '_');
  const props = PropertiesService.getDocumentProperties();

  // Check if folder already exists for this project
  let folderId = props.getProperty('PROJECT_FOLDER_ID');
  let folderName = props.getProperty('PROJECT_FOLDER_NAME');

  if (folderId && folderName === projectName) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      // Folder was deleted, create new one
    }
  }

  // Get master folder
  const masterFolder = DriveApp.getFolderById(PROJECT_MASTER_FOLDER_ID);

  // Check if folder with this name already exists
  const existingFolders = masterFolder.getFoldersByName(projectName);
  if (existingFolders.hasNext()) {
    const existingFolder = existingFolders.next();
    props.setProperty('PROJECT_FOLDER_ID', existingFolder.getId());
    props.setProperty('PROJECT_FOLDER_NAME', projectName);
    return existingFolder;
  }

  // Create new folder
  const projectFolder = masterFolder.createFolder(projectName);
  props.setProperty('PROJECT_FOLDER_ID', projectFolder.getId());
  props.setProperty('PROJECT_FOLDER_NAME', projectName);

  return projectFolder;
}

/**
 * Get or create a subfolder within the project folder
 * @param {string} subfolderName - Name of the subfolder
 * @returns {GoogleAppsScript.Drive.Folder} The subfolder
 */
function getProjectSubfolder(subfolderName) {
  const projectFolder = getOrCreateProjectFolder();

  // Check specifically for case-insensitive match
  const folders = projectFolder.getFolders();
  while (folders.hasNext()) {
    const folder = folders.next();
    if (folder.getName().toLowerCase() === subfolderName.toLowerCase()) {
      return folder;
    }
  }

  // If not found, create it (using the provided casing)
  return projectFolder.createFolder(subfolderName);
}

/**
 * Get the URL of the project folder
 * @returns {string} The folder URL
 */
function getProjectFolderUrl() {
  return getOrCreateProjectFolder().getUrl();
}

/**
 * Moves the current Spreadsheet into the Project Folder
 * (Keeps it organized inside the client folder)
 */
function moveActiveSpreadsheetToProjectFolder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const file = DriveApp.getFileById(ss.getId());
  const projectFolder = getOrCreateProjectFolder();

  // Check if already there (parents)
  const parents = file.getParents();
  let isAlreadyInPlace = false;
  while (parents.hasNext()) {
    if (parents.next().getId() === projectFolder.getId()) {
      isAlreadyInPlace = true;
      break;
    }
  }

  if (!isAlreadyInPlace) {
    file.moveTo(projectFolder);
    Logger.log('Moved spreadsheet to ' + projectFolder.getName());
  }
}

/**
 * UTILITY: Uploads a file from Frontend (HTML/JS) to Project Folder
 * Type: 'LABELS', 'G_CODES', 'ESTIMATES', 'DOCUMENTS'
 */
function uploadFileToProject(folderType, fileName, content, mimeType) {
  try {
    const folder = getProjectSubfolder(folderType);
    let blob;

    // Handle Base64 encoded data (common from frontend PDFs)
    if (mimeType === 'application/pdf' && content.startsWith('data:application/pdf;base64,')) {
      const base64Data = content.split(',')[1];
      const decoded = Utilities.base64Decode(base64Data);
      blob = Utilities.newBlob(decoded, mimeType, fileName);
    } else {
      // Text/HTML content
      blob = Utilities.newBlob(content, mimeType, fileName);
    }

    folder.createFile(blob);
    return { success: true, url: folder.getUrl() };

  } catch (e) {
    Logger.log('Upload Failed: ' + e.message);
    return { success: false, error: e.message };
  }
}

// ========================================
// SHEET EXPORT (As Linked Google Sheets)
// ========================================

/**
 * Export a single sheet as a separate Google Spreadsheet
 * The exported sheet is LINKED - stored mapping allows sync
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to export
 * @param {GoogleAppsScript.Drive.Folder} folder - The destination folder
 * @returns {Object} Info about the exported sheet
 */
function exportSheetAsLinkedSpreadsheet(sheet, folder) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = sheet.getName();
  const props = PropertiesService.getDocumentProperties();

  // Check if already exported - get existing file
  const mappingKey = `EXPORTED_SHEET_${sheetName}`;
  const existingFileId = props.getProperty(mappingKey);

  let targetSpreadsheet;
  let isNew = false;

  if (existingFileId) {
    try {
      targetSpreadsheet = SpreadsheetApp.openById(existingFileId);
    } catch (e) {
      // File was deleted, will create new
      targetSpreadsheet = null;
    }
  }

  if (!targetSpreadsheet) {
    // Create new spreadsheet
    targetSpreadsheet = SpreadsheetApp.create(sheetName);
    isNew = true;

    // Move to project folder
    const file = DriveApp.getFileById(targetSpreadsheet.getId());
    file.moveTo(folder);

    // Store mapping
    props.setProperty(mappingKey, targetSpreadsheet.getId());
  }

  // Get target sheet (first sheet in the spreadsheet)
  let targetSheet = targetSpreadsheet.getSheets()[0];

  // Clear existing content
  targetSheet.clear();

  // Copy all data from source sheet
  const sourceRange = sheet.getDataRange();
  const numRows = sourceRange.getNumRows();
  const numCols = sourceRange.getNumColumns();

  if (numRows > 0 && numCols > 0) {
    const values = sourceRange.getValues();
    targetSheet.getRange(1, 1, numRows, numCols).setValues(values);

    // Copy formatting
    try {
      const formats = sourceRange.getNumberFormats();
      targetSheet.getRange(1, 1, numRows, numCols).setNumberFormats(formats);

      const backgrounds = sourceRange.getBackgrounds();
      targetSheet.getRange(1, 1, numRows, numCols).setBackgrounds(backgrounds);

      const fontWeights = sourceRange.getFontWeights();
      targetSheet.getRange(1, 1, numRows, numCols).setFontWeights(fontWeights);

      const fontColors = sourceRange.getFontColors();
      targetSheet.getRange(1, 1, numRows, numCols).setFontColors(fontColors);
    } catch (e) {
      Logger.log('Could not copy some formatting for ' + sheetName + ': ' + e.message);
    }

    // Copy data validation (dropdowns, checkboxes)
    try {
      const validations = sourceRange.getDataValidations();
      targetSheet.getRange(1, 1, numRows, numCols).setDataValidations(validations);
    } catch (e) {
      Logger.log('Could not copy data validations for ' + sheetName + ': ' + e.message);
    }

    // Copy column widths
    try {
      for (let col = 1; col <= numCols; col++) {
        const width = sheet.getColumnWidth(col);
        targetSheet.setColumnWidth(col, width);
      }
    } catch (e) {
      Logger.log('Could not copy column widths for ' + sheetName + ': ' + e.message);
    }

    // Copy row heights
    try {
      for (let row = 1; row <= numRows; row++) {
        const height = sheet.getRowHeight(row);
        targetSheet.setRowHeight(row, height);
      }
    } catch (e) {
      Logger.log('Could not copy row heights for ' + sheetName + ': ' + e.message);
    }

    // Copy merged cells
    try {
      const mergedRanges = sheet.getRange(1, 1, numRows, numCols).getMergedRanges();
      mergedRanges.forEach(range => {
        const a1Notation = range.getA1Notation();
        targetSheet.getRange(a1Notation).merge();
      });
    } catch (e) {
      Logger.log('Could not copy merged cells for ' + sheetName + ': ' + e.message);
    }
  }

  // Rename sheet if needed
  if (targetSheet.getName() !== sheetName) {
    targetSheet.setName(sheetName);
  }

  return {
    name: sheetName,
    id: targetSpreadsheet.getId(),
    url: targetSpreadsheet.getUrl(),
    isNew: isNew
  };
}

/**
 * Export ALL sheets to project folder as linked Google Sheets
 * @returns {Array} Results of export
 */
function exportAllSheetsAsLinkedSpreadsheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsFolder = getProjectSubfolder('SHEETS');
  const results = [];

  const allSheets = ss.getSheets();

  allSheets.forEach(sheet => {
    try {
      const result = exportSheetAsLinkedSpreadsheet(sheet, sheetsFolder);
      results.push({ ...result, status: 'success' });
    } catch (e) {
      Logger.log('Error exporting sheet ' + sheet.getName() + ': ' + e.message);
      results.push({ name: sheet.getName(), status: 'error', message: e.message });
    }
  });

  return results;
}

/**
 * Sync changes FROM an exported sheet BACK to the main spreadsheet
 * @param {string} sheetName - Name of the sheet to sync
 * @returns {boolean} Success status
 */
function syncFromExportedSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getDocumentProperties();

  const mappingKey = `EXPORTED_SHEET_${sheetName}`;
  const exportedFileId = props.getProperty(mappingKey);

  if (!exportedFileId) {
    throw new Error(`Sheet '${sheetName}' has not been exported yet`);
  }

  let exportedSpreadsheet;
  try {
    exportedSpreadsheet = SpreadsheetApp.openById(exportedFileId);
  } catch (e) {
    throw new Error(`Could not open exported sheet: ${e.message}`);
  }

  const exportedSheet = exportedSpreadsheet.getSheets()[0];
  const mainSheet = ss.getSheetByName(sheetName);

  if (!mainSheet) {
    throw new Error(`Sheet '${sheetName}' not found in main spreadsheet`);
  }

  // Get data from exported sheet
  const sourceRange = exportedSheet.getDataRange();
  const numRows = sourceRange.getNumRows();
  const numCols = sourceRange.getNumColumns();

  if (numRows > 0 && numCols > 0) {
    // Clear main sheet and copy data
    mainSheet.clear();
    const values = sourceRange.getValues();
    mainSheet.getRange(1, 1, numRows, numCols).setValues(values);

    // Copy formatting
    try {
      const formats = sourceRange.getNumberFormats();
      mainSheet.getRange(1, 1, numRows, numCols).setNumberFormats(formats);

      const backgrounds = sourceRange.getBackgrounds();
      mainSheet.getRange(1, 1, numRows, numCols).setBackgrounds(backgrounds);

      const fontWeights = sourceRange.getFontWeights();
      mainSheet.getRange(1, 1, numRows, numCols).setFontWeights(fontWeights);
    } catch (e) {
      Logger.log('Could not copy some formatting: ' + e.message);
    }
  }

  return true;
}

// ========================================
// SYNC WITH DIFF PREVIEW (GATEKEEPER)
// ========================================

/**
 * Triggered by Menu: Opens the Diff Preview Dialog
 */
function showSyncDiffDialog() {
  const html = HtmlService.createHtmlOutputFromFile('sync_diff')
    .setWidth(600)
    .setHeight(500)
    .setTitle('Sync Manager');
  SpreadsheetApp.getUi().showModalDialog(html, 'Sync Manager');
}

/**
 * Backend: Calculates differences between Master and Isolated Sheet
 */
function getDiffDataForActiveSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const sheetName = sheet.getName();

  try {
    const props = PropertiesService.getDocumentProperties();
    const mappingKey = `EXPORTED_SHEET_${sheetName}`;
    const exportedFileId = props.getProperty(mappingKey);

    if (!exportedFileId) {
      return { error: `This sheet is not linked to an isolated file. Export it first.` };
    }

    // Open Isolated Sheet
    const exportedSS = SpreadsheetApp.openById(exportedFileId);
    const exportedSheet = exportedSS.getSheets()[0]; // Assumes single sheet or first sheet

    // Get Data
    const masterValues = sheet.getDataRange().getValues();
    const isolatedValues = exportedSheet.getDataRange().getValues();

    // Compare
    const changes = [];
    const maxRows = Math.max(masterValues.length, isolatedValues.length);
    const maxCols = Math.max(masterValues[0]?.length || 0, isolatedValues[0]?.length || 0);

    for (let r = 0; r < maxRows; r++) {
      for (let c = 0; c < maxCols; c++) {
        const masterVal = (masterValues[r] && masterValues[r][c]) !== undefined ? masterValues[r][c] : "";
        const isolatedVal = (isolatedValues[r] && isolatedValues[r][c]) !== undefined ? isolatedValues[r][c] : "";

        // Loose equality check (to avoid "5" vs 5 issues preferably, but strict is safer for exactness)
        // Using toString() comparison for robustness with dates/numbers
        if (masterVal.toString() !== isolatedVal.toString()) {
          changes.push({
            row: r + 1,
            col: c + 1,
            a1: sheet.getRange(r + 1, c + 1).getA1Notation(),
            oldVal: masterVal,
            newVal: isolatedVal
          });
        }
      }
    }

    return {
      sheetName: sheetName,
      hasChanges: changes.length > 0,
      changes: changes
    };

  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Backend: Performs the actual Sync (Overwrites Master with Isolated)
 */
function performSyncForActiveSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  try {
    // Reuse existing robust sync function
    syncFromExportedSheet(sheet.getName());
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
/**
 * Sync ALL exported sheets back to main spreadsheet
 * @returns {Array} Results of sync
 */
function syncAllSheetsFromExports() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getDocumentProperties();
  const results = [];

  const allSheets = ss.getSheets();

  allSheets.forEach(sheet => {
    const sheetName = sheet.getName();
    const mappingKey = `EXPORTED_SHEET_${sheetName}`;
    const exportedFileId = props.getProperty(mappingKey);

    if (exportedFileId) {
      try {
        syncFromExportedSheet(sheetName);
        results.push({ name: sheetName, status: 'success' });
      } catch (e) {
        results.push({ name: sheetName, status: 'error', message: e.message });
      }
    }
  });

  return results;
}

// ========================================
// FILE SAVING FUNCTIONS
// ========================================

/**
 * Save PDF to project folder
 * @param {string} base64Content - Base64 encoded PDF content
 * @param {string} filename - Filename for the PDF
 * @returns {string} Project folder URL
 */
function savePdfToProjectFolder(base64Content, filename) {
  try {
    const folder = getProjectSubfolder('PDF');
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Content),
      'application/pdf',
      filename
    );
    folder.createFile(blob);
    return getProjectFolderUrl();
  } catch (e) {
    Logger.log('Error saving PDF: ' + e.message);
    throw e;
  }
}

/**
 * Save Labels to project folder
 * @param {string} base64Content - Base64 encoded content
 * @param {string} filename - Filename
 * @returns {string} Project folder URL
 */
function saveLabelsToProjectFolder(base64Content, filename) {
  try {
    const folder = getProjectSubfolder('LABELS');
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Content),
      'application/pdf',
      filename
    );
    folder.createFile(blob);
    return getProjectFolderUrl();
  } catch (e) {
    Logger.log('Error saving Labels: ' + e.message);
    throw e;
  }
}

/**
 * Save Labels HTML to project folder
 * @param {string} htmlContent - HTML content
 * @param {string} filename - Filename
 * @returns {string} Project folder URL
 */
function saveLabelsHtmlToProjectFolder(htmlContent, filename) {
  try {
    const folder = getProjectSubfolder('LABELS');
    const blob = Utilities.newBlob(htmlContent, 'text/html', filename);
    folder.createFile(blob);
    return getProjectFolderUrl();
  } catch (e) {
    Logger.log('Error saving Labels HTML: ' + e.message);
    throw e;
  }
}

/**
 * Save CSV to project folder
 * @param {string} csvContent - CSV content
 * @param {string} filename - Filename
 * @returns {string} Project folder URL
 */
function saveCsvToProjectFolder(csvContent, filename) {
  try {
    const folder = getProjectSubfolder('CSV');
    const blob = Utilities.newBlob(csvContent, 'text/csv', filename);
    folder.createFile(blob);
    return getProjectFolderUrl();
  } catch (e) {
    Logger.log('Error saving CSV: ' + e.message);
    throw e;
  }
}

/**
 * Save Report to project folder
 * @param {string} content - Report content
 * @param {string} mimeType - MIME type
 * @param {string} filename - Filename
 * @returns {string} Project folder URL
 */
function saveReportToProjectFolder(content, mimeType, filename) {
  try {
    const folder = getProjectSubfolder('REPORTS');
    const blob = Utilities.newBlob(content, mimeType, filename);
    folder.createFile(blob);
    return getProjectFolderUrl();
  } catch (e) {
    Logger.log('Error saving Report: ' + e.message);
    throw e;
  }
}

// ========================================
// MENU FUNCTIONS
// ========================================

/**
 * Export all data to project folder - Main menu function
 * Exports all sheets as linked Google Sheets
 */
function exportAllDataToProjectFolder() {
  const ui = SpreadsheetApp.getUi();

  try {
    ui.alert('Starting Export', 'Exporting all sheets to project folder...\nThis may take a moment.', ui.ButtonSet.OK);

    // Export all sheets as linked Google Sheets
    const results = exportAllSheetsAsLinkedSpreadsheets();

    // Count successes and failures
    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'error').length;

    // Get project folder URL
    const projectFolderUrl = getProjectFolderUrl();

    // Generate results HTML
    const resultsHtml = results.map(r => {
      if (r.status === 'success') {
        return `<li style="margin: 5px 0;">✅ <a href="${r.url}" target="_blank">${r.name}</a></li>`;
      } else {
        return `<li style="margin: 5px 0;">❌ ${r.name}: ${r.message}</li>`;
      }
    }).join('');

    const htmlOutput = HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 15px;">
        <h3 style="color: #2e7d32; margin-top: 0;">✅ Export Complete!</h3>
        
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
          <strong style="font-size: 16px;">📁 Project Folder</strong><br><br>
          <a href="${projectFolderUrl}" target="_blank" 
             style="display: inline-block; background: #4caf50; color: white; padding: 12px 24px; 
                    border-radius: 6px; text-decoration: none; font-weight: bold;">
            Open Project Folder
          </a>
        </div>
        
        <h4>Exported Sheets (${successCount}/${results.length}):</h4>
        <div style="max-height: 250px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 10px;">
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${resultsHtml}
          </ul>
        </div>
        
        ${failCount > 0 ? `<p style="color: #d32f2f;">⚠️ ${failCount} sheet(s) failed to export</p>` : ''}
        
        <p style="font-size: 12px; color: #666; margin-top: 15px;">
          <strong>Note:</strong> Sheets are linked. Use "Sync Sheets" to import changes made by other departments.
        </p>
        
        <div style="text-align: center; margin-top: 15px;">
          <button onclick="google.script.host.close()" 
                  style="background: #757575; color: white; border: none; padding: 10px 24px; 
                         border-radius: 4px; cursor: pointer; font-size: 14px;">
            Close
          </button>
        </div>
      </div>
    `).setWidth(450).setHeight(550);

    ui.showModalDialog(htmlOutput, 'Project Export Complete');

  } catch (e) {
    Logger.log('Error in exportAllDataToProjectFolder: ' + e.message);
    ui.alert('Error', 'Failed to export: ' + e.message, ui.ButtonSet.OK);
  }
}

/**
 * Sync all sheets from exported versions - Menu function
 * Imports changes made in exported sheets back to main spreadsheet
 */
function syncSheetsFromProjectFolder() {
  const ui = SpreadsheetApp.getUi();

  const confirm = ui.alert(
    'Sync Sheets',
    'This will import changes from exported sheets back to this spreadsheet.\n\nAny local changes will be overwritten with data from the exported sheets.\n\nContinue?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  try {
    const results = syncAllSheetsFromExports();

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'error').length;

    if (results.length === 0) {
      ui.alert('No Exported Sheets', 'No sheets have been exported yet. Please run "Export All Data" first.', ui.ButtonSet.OK);
      return;
    }

    const resultsHtml = results.map(r => {
      if (r.status === 'success') {
        return `<li>✅ ${r.name}</li>`;
      } else {
        return `<li>❌ ${r.name}: ${r.message}</li>`;
      }
    }).join('');

    const htmlOutput = HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 15px;">
        <h3 style="color: #2e7d32; margin-top: 0;">🔄 Sync Complete!</h3>
        
        <h4>Synced Sheets (${successCount}/${results.length}):</h4>
        <ul style="list-style: none; padding: 0;">
          ${resultsHtml}
        </ul>
        
        ${failCount > 0 ? `<p style="color: #d32f2f;">⚠️ ${failCount} sheet(s) failed to sync</p>` : ''}
        
        <button onclick="google.script.host.close()" 
                style="background: #757575; color: white; border: none; padding: 10px 24px; 
                       border-radius: 4px; cursor: pointer; margin-top: 15px;">
          Close
        </button>
      </div>
    `).setWidth(350).setHeight(400);

    ui.showModalDialog(htmlOutput, 'Sync Complete');

  } catch (e) {
    Logger.log('Error in syncSheetsFromProjectFolder: ' + e.message);
    ui.alert('Error', 'Failed to sync: ' + e.message, ui.ButtonSet.OK);
  }
}

/**
 * Open the project folder in a new tab
 */
function openProjectFolder() {
  const url = getProjectFolderUrl();
  const htmlOutput = HtmlService.createHtmlOutput(`
    <script>
      window.open('${url}', '_blank');
      google.script.host.close();
    </script>
  `).setWidth(1).setHeight(1);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Opening...');
}

/**
 * Reset project folder location - clears cached folder ID
 * Use this to fix projects that were created in the wrong location
 */
function resetProjectFolderLocation() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getDocumentProperties();

  // Confirm with user before resetting
  const confirm = ui.alert(
    'Reset Project Folder Location',
    'This will:\n\n' +
    '1. Clear the cached folder location\n' +
    '2. Create a new project folder in the correct location\n' +
    '3. You will need to re-export sheets to the new folder\n\n' +
    'The old folder will NOT be deleted.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  // Clear cached folder properties
  props.deleteProperty('PROJECT_FOLDER_ID');
  props.deleteProperty('PROJECT_FOLDER_NAME');

  // Clear all exported sheet mappings too
  const allProps = props.getProperties();
  for (let key in allProps) {
    if (key.startsWith('EXPORTED_SHEET_')) {
      props.deleteProperty(key);
    }
  }

  // Create new folder in correct location
  const newFolder = getOrCreateProjectFolder();

  // Show success with link to new folder
  const htmlOutput = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #2e7d32; margin-top: 0;">✅ Project Folder Reset!</h2>
      
      <p>The project folder has been moved to the correct location.</p>
      
      <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <strong>New Location:</strong><br>
        <a href="${newFolder.getUrl()}" target="_blank" style="color: #1976d2; word-break: break-all;">
          ${newFolder.getUrl()}
        </a>
      </div>
      
      <a href="${newFolder.getUrl()}" target="_blank" 
         style="display: inline-block; background: #4caf50; color: white; padding: 12px 24px; 
                border-radius: 6px; text-decoration: none; font-weight: bold; margin: 10px 0;">
        📂 Open New Project Folder
      </a>
      
      <p style="color: #666; font-size: 13px; margin-top: 20px;">
        <strong>Next Step:</strong> Run "Export All to Project Folder" to re-export your sheets to the new location.
      </p>
      
      <button onclick="google.script.host.close()" 
              style="background: #757575; color: white; border: none; padding: 10px 20px; 
                     border-radius: 4px; cursor: pointer; margin-top: 10px;">
        Close
      </button>
    </div>
  `).setWidth(450).setHeight(380);

  ui.showModalDialog(htmlOutput, 'Project Folder Reset Complete');
}