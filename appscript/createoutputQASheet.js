/**
 * Creates a QA sheet with checkboxes by pulling and reformatting data 
 * from the "Plank List".
 */
function  createOutputQASheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // 1. Get the source sheet ("Plank List")
  const plankSheet = ss.getSheetByName("Plank List");
  if (!plankSheet) {
    ui.alert("Error: 'Plank List' sheet not found.");
    return;
  }

  // 2. Get or create the destination sheet
  let qaSheet = ss.getSheetByName("QA Sheet");
  if (!qaSheet) {
    qaSheet = ss.insertSheet("QA Sheet");
  } else {
    qaSheet.clear(); // Clear existing content
  }

  // 3. Read the source data (assuming headers are in row 1)
  const plankRange = plankSheet.getRange(1, 1, plankSheet.getLastRow(), plankSheet.getLastColumn());
  const plankValues = plankRange.getValues();
  const plankHeaders = plankValues.shift(); // Get headers and remove from data

  // 4. Find the column indices from the "Plank List"
  // This is robust and doesn't depend on column order
  const colIndices = {
    material: plankHeaders.indexOf("Material"),
    thickness: plankHeaders.indexOf("Thickness (mm)"),
    plankId: plankHeaders.indexOf("Plank id"),
    width: plankHeaders.indexOf("Width (mm)"),
    height: plankHeaders.indexOf("Height (mm)")
  };

  // Check if all required columns were found
  if (Object.values(colIndices).some(index => index === -1)) {
    ui.alert("Error: Could not find all required columns in 'Plank List'.\nPlease ensure these headers exist: Material, Thickness (mm), Plank id, Width (mm), Height (mm).");
    return;
  }

  // 5. Create the output array, starting with the headers
  const outputData = [];
  const outputHeaders = ["Colors", "Thickness", "Lables", "Width", "Height", "QA", "Comments", "Image"];
  outputData.push(outputHeaders);

  // 6. Loop through the data and map it
  for (const row of plankValues) {
    // Skip empty rows
    if (row[colIndices.plankId] === "") continue; 
    
    const colors = row[colIndices.material];
    const thickness = row[colIndices.thickness];
    const lables = row[colIndices.plankId]; // "Lables" from screenshot maps to "Plank id"
    const width = row[colIndices.width];
    const height = row[colIndices.height];

    // Add the mapped row + empty columns for QA, Comments, Image
    outputData.push([
      colors,
      thickness,
      lables,
      width,
      height,
      "", // Placeholder for QA checkbox
      "", // Empty Comments
      ""  // Empty Image
    ]);
  }

  // 7. Write all data to the QA sheet at once
  if (outputData.length > 1) { // Only write if there's data
    qaSheet.getRange(1, 1, outputData.length, outputData[0].length).setValues(outputData);

    // 8. Apply formatting to match the screenshot
    const headerRange = qaSheet.getRange("A1:H1");
    headerRange.setFontWeight("bold").setBackground("#FFF2CC"); // Light yellow background
    
    const dataRange = qaSheet.getRange(1, 1, qaSheet.getLastRow(), outputHeaders.length);
    dataRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    
    // ✅ --- ADD CHECKBOXES ---
    // 9. Add checkboxes to the "QA" column (Column F, which is 6)
    //    We start from row 2 (to skip the header)
    //    The number of data rows is outputData.length - 1
    const qaCheckboxRange = qaSheet.getRange(2, 6, outputData.length - 1, 1);
    qaCheckboxRange.insertCheckboxes();
    // ✅ --- END ---

    // 10. Auto-resize columns
    qaSheet.autoResizeColumns(1, 8);
    
    ui.alert("Success: 'QA Sheet' has been generated with checkboxes.");
  } else {
    ui.alert("No data found in 'Plank List' to process.");
  }
}