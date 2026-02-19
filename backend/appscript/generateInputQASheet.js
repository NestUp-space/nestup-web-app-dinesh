/**************************************************************
 * MAIN FUNCTION - CALLED BY YOUR MENU
 **************************************************************/
function generateInputQASheet() {
  const ui = SpreadsheetApp.getUi();
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Starting QA sheet generation...', 'Nestup Tools', 10);

    // --- 1. Define Constants ---
    const config = {
      customerSheetName: 'Customer Details', // Capital 'D' based on your previous save function
      estimateSheetName: 'Material Estimate',
      logoId: '13gPm0yWW_8cwHbZFct9MFYvXUTmC7VVY',
      headerColor: '#fef2c0',
      borderColor: '#d9d9d9',
      numBlankRows: 5
    };

    // --- 2. Get Source Data ---
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const customerSheet = ss.getSheetByName(config.customerSheetName);
    const estimateSheet = ss.getSheetByName(config.estimateSheetName);

    if (!customerSheet || !estimateSheet) {
      throw new Error(`Could not find required sheets: "${config.customerSheetName}" or "${config.estimateSheetName}".`);
    }

    // --- CHANGED: Get header data from Vertical Layout (Key-Value pairs) ---
    // The image shows Column A = Field, Column B = Value.
    const customerDataMap = getCustomerDataVertical(customerSheet);
    
    // Map the keys exactly as they appear in your "Customer Details" sheet (Column A)
    const headerData = {
        customerName: customerDataMap['Customer Name'] || 'New Project',
        contact: customerDataMap['Contact Number'] || '',
        address: customerDataMap['Location'] || ''
    };

    // Get material data (Kept existing logic for Estimate sheet)
    const materialData = getMaterialData(estimateSheet);

    // --- 3. Create New Sheet ---
    const sheetName = `Input QA - ${headerData.customerName}`;
    
    // Delete the sheet if it already exists to start fresh
    let qaSheet = ss.getSheetByName(sheetName);
    if (qaSheet) {
      ss.deleteSheet(qaSheet);
    }
    qaSheet = ss.insertSheet(sheetName, 0); // Insert as the first sheet
    qaSheet.clear(); // Clear all default formatting

    // --- 4. Get Logo ---
    const logoBlob = DriveApp.getFileById(config.logoId).getBlob();

    // --- 5. Build Sheet Structure ---
    buildAndFormatQASheet(qaSheet, headerData, materialData, logoBlob, config);

    // --- 6. Success! ---
    qaSheet.activate();
    ui.alert('Success!', 'The Input QA sheet has been generated.', ui.ButtonSet.OK);

  } catch (e) {
    Logger.log(e);
    ui.alert('Error', `An error occurred: ${e.message}`, ui.ButtonSet.OK);
  }
}

/**************************************************************
 * HELPER FUNCTIONS
 **************************************************************/

/**
 * NEW: Reads data from a vertical "Field | Value" layout (Columns A & B).
 * Assumes Row 1 is Header (Field/Value) and data starts from Row 2.
 */
function getCustomerDataVertical(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return {}; // No data

  // Get Range A2:B(LastRow)
  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues(); 
  const result = {};

  data.forEach(row => {
    const key = row[0].toString().trim(); // Column A
    const value = row[1];                 // Column B
    if (key) {
      result[key] = value;
    }
  });

  return result;
}

// ... existing getMaterialData, parsePlywoodDescription, parseQuantity, buildAndFormatQASheet ...
// (You can keep the rest of your helper functions as they were, 
//  unless you need findDataFromHeaders for other sheets, you can remove it.)

/**
 * Parses the complex "Material Estimate" sheet layout.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The "Material Estimate" sheet.
 * @returns {Object} An object containing arrays for plywoods, laminates, and edgeBandings.
 */
function getMaterialData(estimateSheet) {
  // Get all data from the estimate sheet
  const data = estimateSheet.getDataRange().getValues();
  
  // Header row is Row 3 (index 2 in the array)
  const headerRow = data[2]; 
  
  // Find column indices based on your screenshot's layout
  // Note: These are 0-based array indices
  const plyDescCol = 0;       // Col A
  const plyQtyCol = 1;        // Col B
  
  const lamDescCol = 3;       // Col D
  const lamBrandCol = 4;      // Col E
  const lamQtyCol = 5;        // Col F
  
  const ebDescCol = 7;        // Col H
  const ebBrandCol = 8;       // Col I
  const ebThickCol = 9;       // Col J
  const ebQtyCol = 10;        // Col K

  const materials = {
    plywoods: [],
    laminates: [],
    edgeBandings: []
  };

  // Start from Row 4 (index 3) and loop through all data
  for (let i = 3; i < data.length; i++) {
    const row = data[i];

    // --- Process Plywoods (Section A) ---
    const plyDescRaw = row[plyDescCol];
    if (plyDescRaw) {
      const [desc, thickness] = parsePlywoodDescription(plyDescRaw.toString());
      const count = parseQuantity(row[plyQtyCol].toString());
      materials.plywoods.push([desc, thickness, count]);
    }
    
    // --- Process Laminates (Section B) ---
    const lamDescRaw = row[lamDescCol];
    if (lamDescRaw) {
      materials.laminates.push([
        lamDescRaw,         // Description
        row[lamBrandCol],   // Brand / Colour / code
        row[lamQtyCol]      // Count
      ]);
    }
    
    // --- Process Edge Banding (Section C) ---
    const ebDescRaw = row[ebDescCol];
    if (ebDescRaw) {
      materials.edgeBandings.push([
        ebDescRaw,          // Description
        row[ebBrandCol],    // Brand / Colour / Code
        row[ebThickCol],    // Thickness x width
        row[ebQtyCol]       // Quantity
      ]);
    }
  }
  return materials;
}

/**
 * Splits "Plywood - 18mm" into ["Plywood", "18mm"].
 * @param {string} rawDesc The raw description string.
 * @returns {Array<string>} An array [description, thickness].
 */
function parsePlywoodDescription(rawDesc) {
  if (rawDesc.includes(' - ')) {
    const parts = rawDesc.split(' - ');
    const thickness = parts.pop().trim(); // Get the last part as thickness
    const description = parts.join(' - ').trim(); // Join the rest as description
    return [description, thickness];
  }
  return [rawDesc, '']; // Return raw description and blank thickness if no " - "
}

/**
 * Extracts "21" from "21 (8ftx4ft Sheets)".
 * @param {string} rawQty The raw quantity string.
 * @returns {string} The extracted number as a string.
 */
function parseQuantity(rawQty) {
  const match = rawQty.match(/^(\d+)/); // Get numbers from the start of the string
  return match ? match[1] : rawQty; // Return the number or the original string
}

/**
 * Builds the entire layout, formatting, and data for the QA sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The new QA sheet.
 * @param {Object} headerData Customer data.
 * @param {Object} materialData Material data.
 * @param {GoogleAppsScript.Base.Blob} logoBlob The logo image.
 * @param {Object} config The configuration object.
 */
function buildAndFormatQASheet(sheet, headerData, materialData, logoBlob, config) {
  const checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  let currentRow = 1;

  // --- A. Logo and Main Title ---
  // Insert the image and get the OverGridImage object
  const image = sheet.insertImage(logoBlob, 1, 1); // Inserts anchored at A1

  // Set a target height and resize the image, maintaining aspect ratio
  const targetHeight = 60; // Target height in pixels
  const originalHeight = image.getHeight();
  const originalWidth = image.getWidth();
  
  if (originalHeight > 0) { // Avoid division by zero
    const aspectRatio = originalWidth / originalHeight;
    const newWidth = targetHeight * aspectRatio;
    
    image.setHeight(targetHeight);
    image.setWidth(newWidth);
  } else {
    // Fallback if image data is weird
    image.setHeight(targetHeight); 
  }

  // Set up the title cell
  sheet.getRange('C1:F2').merge().setValue('Input QA')
    .setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  
  // Set row heights to fit the resized logo and title
  sheet.setRowHeight(1, 35);
  sheet.setRowHeight(2, 35); // Total 70px height for header
  
  currentRow = 4; // Start content below the header area
  // --- B. Customer Headers ---  <-- ADD THIS SECTION
  const customerHeaders = [
    ['Customer Name :', headerData.customerName, '', 'Site Address :', headerData.address],
    ['NestUp QA SignOff :', 'NA', '', 'Date :', new Date()],
    ['Name & Contact No:', headerData.contact, '', '', ''] 
  ];
  sheet.getRange(currentRow, 1, 3, 5).setValues(customerHeaders)
    .setFontSize(10).setVerticalAlignment('middle');
  sheet.getRange(currentRow, 1, 3, 5).setBorder(false, false, false, false, false, false);
  // Make headers bold
  sheet.getRange(currentRow, 1, 3, 1).setFontWeight('bold');
  sheet.getRange(currentRow, 4, 2, 1).setFontWeight('bold');
  sheet.getRange(currentRow + 2, 1, 1, 1).setFontWeight('bold');
  // Format Date
  sheet.getRange(currentRow + 1, 5).setNumberFormat('dd-mmm-yyyy');
  // Merge header value cells
  sheet.getRange(currentRow, 2, 1, 2).merge();
  sheet.getRange(currentRow, 5, 1, 2).merge();
  sheet.getRange(currentRow + 1, 2, 1, 2).merge();
  sheet.getRange(currentRow + 1, 5, 1, 2).merge();
  sheet.getRange(currentRow + 2, 2, 1, 2).merge();
  
  currentRow += 4; // Add a blank row

  // --- C. Material Sections ---
  
  // Helper to build a table
  const buildTable = (title, headers, data) => {
    // 1. Set Section Title
    sheet.getRange(currentRow, 1, 1, headers.length).merge().setValue(title)
      .setFontWeight('bold').setHorizontalAlignment('center').setBackground(config.headerColor);
    currentRow++;

    // 2. Set Table Headers
    sheet.getRange(currentRow, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground(config.headerColor);
    currentRow++;

    // 3. Populate Data
    if (data.length > 0) {
      sheet.getRange(currentRow, 1, data.length, data[0].length).setValues(data);
      // Add checkboxes
      sheet.getRange(currentRow, headers.indexOf('Input QA') + 1, data.length, 1).setDataValidation(checkboxRule);
      currentRow += data.length;
    }

    // 4. Add Blank Rows
    const blankRowData = Array(headers.length).fill('');
    const blankRows = [];
    for (let i = 0; i < config.numBlankRows; i++) {
      blankRows.push(blankRowData);
    }
    sheet.getRange(currentRow, 1, config.numBlankRows, headers.length).setValues(blankRows);
    // Add checkboxes to blank rows
    sheet.getRange(currentRow, headers.indexOf('Input QA') + 1, config.numBlankRows, 1).setDataValidation(checkboxRule);
    currentRow += config.numBlankRows;

    // 5. Add Borders
    sheet.getRange(currentRow - data.length - config.numBlankRows - 1, 1, data.length + config.numBlankRows + 1, headers.length)
      .setBorder(true, true, true, true, true, true, config.borderColor, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    
    currentRow += 2; // Add spacing row
  };
  
  // --- Section A: Plywoods ---
  const plyHeaders = ['Description', 'Thickness', 'Count', 'Input QA', 'Comments'];
  // Prep data for Plywoods (add empty strings for QA and Comments)
  const plyData = materialData.plywoods.map(row => [...row, false, '']);
  buildTable('A. Plywoods', plyHeaders, plyData);

  // --- Section B: Laminates ---
  const lamHeaders = ['Description', 'Brand / Colour / code', 'Count', 'Input QA', 'Comments'];
  // Prep data for Laminates
  const lamData = materialData.laminates.map(row => [...row, false, '']);
  buildTable('B. Laminates', lamHeaders, lamData);

  // --- Section C: Edge Banding ---
  const ebHeaders = ['Description', 'Brand / Colour / Code', 'Thickness x width', 'Quantity', 'Input QA', 'Comments'];
  // Prep data for Edge Banding
  const ebData = materialData.edgeBandings.map(row => [...row, false, '']);
  buildTable('C. Edge Banding', ebHeaders, ebData);

  // --- Section D: Hardware (NEW) ---
  const hwHeaders = ['Description', 'Brand / Code', 'Count', 'Input QA', 'Comments'];
  buildTable('D. Hardware', hwHeaders, []); // Pass empty data array

  // --- D. Final Formatting ---
  sheet.getRange('A:F').setVerticalAlignment('middle');
  
  // Auto-resize all columns based on content
  sheet.autoResizeColumns(1, 6);
  
  // Now, force the QA columns to be small
  // (Plywoods, Laminates, Hardware have QA in Col 4)
  sheet.setColumnWidth(4, 75); 
  // (Edge Banding has QA in Col 5)
  sheet.setColumnWidth(5, 75); 

  // Make the 'Comments' column (F) a bit wider for notes
  sheet.setColumnWidth(6, 200);

  sheet.deleteColumns(7, sheet.getMaxColumns() - 6); // Delete unused columns
  sheet.deleteRows(currentRow, sheet.getMaxRows() - currentRow); // Delete unused rows
}