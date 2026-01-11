// SketchUp CSV → SFT Calculator
// This script calculates the square footage of boxes from a Google Sheet,
// filters by a fixed "Level 1", and outputs the results to a new sheet.
// Version: 3.4 (Hardcoded for Level "1" and reads from "raw data" sheet)

// ⚙️ --- CONFIGURATION ---
const CONFIG = {
  columnNames: {
    level: 'level',
    boxModel: 'box_model',
    boxType: 'box_type',
    orientation: 'unit_location',
    lengthX: 'lenx',
    lengthY: 'leny',
    lengthZ: 'lenz',
  },
  resultsSheetName: 'SFT Results',
  MM_TO_FEET_FACTOR: 0.00328084,
};
// -------------------------

/**
 * Main function that orchestrates the SFT calculation process.
 * MODIFIED: Now finds a sheet named "raw data" and permanently
 * filters for Level "1" without asking the user.
 */
function calculateBoxSFT() {
  const ui = SpreadsheetApp.getUi();
  try {
    // --- MODIFICATION: Hardcoded targetLevel to "1" ---
    const targetLevel = "1";
    // --- END MODIFICATION ---

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheetName = 'raw data';
    
    // Find the sheet by name, ignoring case
    const dataSheet = ss.getSheets().find(
      s => s.getName().toLowerCase() === sourceSheetName
    );

    // Check if the sheet was found
    if (!dataSheet) {
      throw new Error(`A sheet named "${sourceSheetName}" was not found. Please make sure it exists.`);
    }

    const { data, colIndices } = getDataFromSheet(dataSheet); 
    const { results, skippedCount } = processDataRows(data, colIndices, targetLevel);

    if (results.length <= 1) {
      // --- MODIFICATION: Updated alert message ---
      ui.alert('No Matching Data', `No valid boxes were found for Level "1".`, ui.ButtonSet.OK);
      // --- END MODIFICATION ---
      return;
    }

    writeResults(results, skippedCount);
  } catch (error) {
    Logger.log(`Error: ${error.stack}`);
    ui.alert('🚨 Script Error', `An error occurred:\n\n${error.message}`, ui.ButtonSet.OK);
  }
}

/**
 * --- THIS FUNCTION IS NO LONGER USED ---
 * Prompts the user to enter a level to filter by.
 * @param {GoogleAppsScript.Base.Ui} ui The Spreadsheet UI object.
 * @returns {string|null} The level entered by the user, or null if cancelled.
 */
// function getUserInput(ui) {
//   const response = ui.prompt('Enter Level', 'Which Level should be used?', ui.ButtonSet.OK_CANCEL);
//   if (response.getSelectedButton() !== ui.Button.OK) return null;
//   const targetLevel = response.getResponseText().trim();
//   if (!targetLevel) {
//     ui.alert('Input Needed', 'You must enter a level to filter by.', ui.ButtonSet.OK);
// In   return null;
//   }
//   return targetLevel;
// }

/**
 * Reads all data from a sheet and validates the presence of required headers.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to read from.
 * @returns {{data: Array<Array<any>>, colIndices: Object}}
 */
function getDataFromSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) throw new Error('The active sheet is empty.');

  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const colIndices = {
    level: headers.indexOf(CONFIG.columnNames.level),
    boxModel: headers.indexOf(CONFIG.columnNames.boxModel),
    boxType: headers.indexOf(CONFIG.columnNames.boxType),
    orientation: headers.indexOf(CONFIG.columnNames.orientation),
    lenX: headers.indexOf(CONFIG.columnNames.lengthX),
    lenY: headers.indexOf(CONFIG.columnNames.lengthY),
    lenZ: headers.indexOf(CONFIG.columnNames.lengthZ),
  };

  // Validate that all required columns are present
  const required = ['level', 'lenX', 'lenZ'];
  const missingColumns = required.filter(key => colIndices[key] === -1);

  if (missingColumns.length > 0) {
    const missingNames = missingColumns.map(key => CONFIG.columnNames[key]);
    throw new Error(`Required column(s) not found: "${missingNames.join('", "')}".`);
  }

  return { data, colIndices };
}

/**
 * Helper function to determine orientation ('NS', 'EW', or 'N/A') from a string.
 * @param {string} unitLocation The text from the unit_location column.
 * @returns {string} The determined orientation.
 */
function getBoxOrientation(unitLocation) {
  const lowerCaseLocation = (unitLocation || '').toLowerCase();
  if (lowerCaseLocation.includes('north') || lowerCaseLocation.includes('south')) return 'NS';
  if (lowerCaseLocation.includes('east') || lowerCaseLocation.includes('west')) return 'EW';
  return 'N/A';
}

/**
 * Iterates through data rows and calculates SFT using lenX and lenZ.
 * @returns {{results: Array<Array<any>>, skippedCount: number}}
 */
function processDataRows(data, colIndices, targetLevel) {
  const results = [['Box Model', 'Box Type', 'Orientation', 'Length (lenX) (mm)', 'Width (lenZ) (mm)', 'Square Feet', 'Original Row']];
  let skippedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const levelValue = row[colIndices.level];

    if (levelValue && String(levelValue).trim() === targetLevel) {
      const orientationValue = row[colIndices.orientation];
      const orientation = getBoxOrientation(orientationValue);

      const lenX = parseFloat(String(row[colIndices.lenX]).replace(',', '.'));
      const lenZ = parseFloat(String(row[colIndices.lenZ]).replace(',', '.'));

      // Always use lenX for length and lenZ for width
      if (lenX > 0 && lenZ > 0) {
        const sft = (lenX * CONFIG.MM_TO_FEET_FACTOR) * (lenZ * CONFIG.MM_TO_FEET_FACTOR);
        results.push([
          row[colIndices.boxModel] || 'N/A',
          row[colIndices.boxType] || 'N/A',
          orientation,
          lenX,
          lenZ,
          sft,
          i + 1,
        ]);
      } else {
        skippedCount++;
        Logger.log(`Skipped row ${i + 1} due to invalid or zero dimensions.`);
      }
    }
  }
  return { results, skippedCount };
}

/**
 * Writes the calculated results and a total sum to the results sheet.
 * @param {Array<Array<any>>} results The data to write.
* @param {number} skippedCount The number of rows skipped.
 */
function writeResults(results, skippedCount) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let resultSheet = ss.getSheetByName(CONFIG.resultsSheetName);
  if (!resultSheet) {
    resultSheet = ss.insertSheet(CONFIG.resultsSheetName);
  } else {
    resultSheet.clear();
  }

  resultSheet.getRange(1, 1, results.length, results[0].length).setValues(results);
  formatResultSheet(resultSheet);

  const sftColumnIndex = 6; 
  const totalSFT = results.slice(1).reduce((sum, row) => sum + row[sftColumnIndex - 1], 0);
  const totalRowIndex = resultSheet.getLastRow() + 2;

  resultSheet.getRange(totalRowIndex, sftColumnIndex - 1).setValue('Total Square Feet:').setFontWeight('bold').setHorizontalAlignment('right');
  resultSheet.getRange(totalRowIndex, sftColumnIndex).setValue(totalSFT).setFontWeight('bold').setNumberFormat('0.00');
  
  ss.setActiveSheet(resultSheet);

  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '✅ SFT Calculation Complete!',
    `Processed: ${results.length - 1} boxes\n` +
    `Skipped: ${skippedCount} rows\n` +
    `Total SFT: ${totalSFT.toFixed(2)}\n\n` +
    `Results are in the "${CONFIG.resultsSheetName}" sheet.`,
    ui.ButtonSet.OK
  );
}

/**
 * Applies formatting to the results sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to format.
Example */
function formatResultSheet(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow === 0) return;

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, lastCol)
       .setBackground('#4a148c')
       .setFontColor('white')
       .setFontWeight('bold')
       .setHorizontalAlignment('center');
  
  if (lastRow > 1) {
    const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    dataRange.setVerticalAlignment('middle');
    
    const numberColumnStart = 4;
    const numberColumnCount = 3;
    sheet.getRange(2, numberColumnStart, lastRow - 1, numberColumnCount).setNumberFormat('0.00');
  }

  sheet.autoResizeColumns(1, lastCol);
}