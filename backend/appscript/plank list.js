/**
 * Reads data from 'Formatted_Plank_Data', calculates Edge Binding (EB) with tiered wastage,
 * and creates a new 'Plank List' sheet, sorted by material.
 *
 * NEW RULE: Planks with thickness < 12mm get 0 EB and do not count towards wastage totals.
 */
function createPlankList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheetName = "Formatted_Plank_Data";
    const destSheetName = "Plank List";

    // 1. Get the source sheet
    const sourceSheet = ss.getSheetByName(sourceSheetName);
    if (!sourceSheet) {
      throw new Error(`Source sheet "${sourceSheetName}" not found.`);
    }

    const sourceData = sourceSheet.getDataRange().getValues();
    if (sourceData.length < 2) {
      throw new Error(`Source sheet "${sourceSheetName}" contains no data.`);
    }

    // 2. Find column positions
    const header = sourceData[0].map(h => String(h).trim());
    const colIndices = {
      name: header.indexOf('plank_name'),
      id: header.indexOf('plank_id'),
      material: header.indexOf('plank_material'),
      width: header.indexOf('plank_width'),
      length: header.indexOf('plank_length'), // Maps to "Height"
      thickness: header.indexOf('plank_thickness')
    };

    // Check for required columns
    for (const key in colIndices) {
      if (colIndices[key] === -1) {
        const colName = key === 'id' ? 'plank_id' : `plank_${key}`;
        throw new Error(`Required column "${colName}" not found in "${sourceSheetName}".`);
      }
    }

    // --- Helper function to apply your specific wastage rules ---
    /**
     * Calculates the wastage rate based on material type and total quantity.
     * @param {string} materialName - The name of the material.
     * @param {number} totalEb - The total base EB quantity (in meters) for this material.
     * @returns {number} The wastage rate (e.g., 0.30 for 30%).
     */
    function getWastageRate(materialName, totalEb) {
      const isInner = materialName && typeof materialName === 'string' && materialName.toLowerCase().includes('inner');

      if (isInner) {
        // Rules for "Inner"
        if (totalEb > 500) {
          return 0.10; // 10%
        } else {
          return 0.15; // 15% (for quantities <= 500)
        }
      } else {
        // Rules for "Color"
        if (totalEb < 25) {
          return 0.30; // 30%
        } else if (totalEb <= 50) { // 25 to 50
          return 0.25; // 25%
        } else if (totalEb <= 100) { // 50.1 to 100
          return 0.20; // 20%
        } else { // More than 100
          return 0.15; // 15%
        }
      }
    }
    // --- END HELPER FUNCTION ---

    // 3. Prepare destination sheet
    let destSheet = ss.getSheetByName(destSheetName);
    if (destSheet) {
      destSheet.clear();
    } else {
      destSheet = ss.insertSheet(destSheetName);
    }

    // 4. Build output data header
    const newHeader = ["Plank Name", "Material", "Width (mm)", "Height (mm)", "Thickness (mm)", "Plank id", "Grain?", "Edge Binding (m)"];
    const outputData = [newHeader];
    const materialColIndex = newHeader.indexOf("Material");

    // --- MODIFIED: Pass 1 - Calculate total base EB for each material (only if thickness >= 12) ---
    const materialEbTotals = {}; // Object to store totals, e.g., {"Material A": 120.5, "Material B": 30.2}

    for (let i = 1; i < sourceData.length; i++) {
      const row = sourceData[i];
      const material = row[colIndices.material];
      const width = row[colIndices.width];
      const length = row[colIndices.length];
      const thickness = row[colIndices.thickness]; // <-- Get thickness

      // Skip if data is missing
      if (!material || !width || !length || thickness === "") continue;

      // --- NEW RULE ---
      const numThickness = parseFloat(thickness);
      // Only include in wastage calculation if thickness is 12mm or more
      if (isNaN(numThickness) || numThickness < 12) {
        continue; 
      }
      // --- END NEW RULE ---

      const numWidth = parseFloat(width);
      const numLength = parseFloat(length);

      if (!isNaN(numWidth) && !isNaN(numLength)) {
        // Calculate base EB (perimeter in meters) for this one plank
        const baseEb = (numWidth + numLength) * 2 / 1000;
        
        // Add to the total for that material
        if (!materialEbTotals[material]) {
          materialEbTotals[material] = 0;
        }
        materialEbTotals[material] += baseEb;
      }
    }
    // --- END PASS 1 ---


    // --- MODIFIED: Pass 2 - Build output rows using tiered wastage ---
    // Loop through source data (skip header row) and map to new format
    for (let i = 1; i < sourceData.length; i++) {
      const row = sourceData[i];
      
      const plankName = row[colIndices.name];
      const plankId = row[colIndices.id];
      const material = row[colIndices.material];
      const width = row[colIndices.width];
      const length = row[colIndices.length]; // This is the "Height"
      const thickness = row[colIndices.thickness];

      // Skip any rows that are missing essential data
      if (!plankName || !plankId || !material || !width || !length || thickness === "") {
        continue;
      }

      // --- MODIFIED: Calculate Edge Binding (EB) with Wastage & Thickness Rule ---
      const numWidth = parseFloat(width);
      const numLength = parseFloat(length);
      const numThickness = parseFloat(thickness);
      let eb = ""; // Default to blank

      // --- NEW RULE ---
      if (isNaN(numThickness) || numThickness < 12) {
        eb = 0; // Set EB to 0 if thickness is less than 12
      } 
      // --- END NEW RULE ---
      else if (!isNaN(numWidth) && !isNaN(numLength)) {
        // Thickness is >= 12 and dimensions are valid, so calculate
        
        // 1. Calculate the base EB for THIS plank
        const baseEb = (numWidth + numLength) * 2 / 1000;
        
        // 2. Get the TOTAL EB for this plank's material (calculated in Pass 1)
        const totalMaterialEb = materialEbTotals[material] || 0;
        
        // 3. Determine wastage rate using the new helper function
        const wastageRate = getWastageRate(material, totalMaterialEb);
        
        // 4. Apply wastage to THIS plank's base EB
        // Formula: Base * (1 + Rate)
        eb = baseEb * (1 + wastageRate);
      }
      // If thickness >= 12 but width/length are invalid, 'eb' will remain "" (blank)
      // --- END MODIFICATION ---
      
      outputData.push([
        plankName,
        material,
        width,
        length,      // plank_length is mapped to Height (mm)
        thickness,
        plankId,     // Use the ID that was read
        '',          // Grain? column is left blank
        eb           // Add calculated EB value
      ]);
    }

    // 5. Write the new data to the destination sheet
    if (outputData.length > 1) {
      
      // --- Sort data by Material to "group" them ---
      const headerRow = outputData.shift(); // Remove header
      
      outputData.sort((a, b) => {
        if (a[materialColIndex] < b[materialColIndex]) return -1;
        if (a[materialColIndex] > b[materialColIndex]) return 1;
        return 0; // If equal
      });
      
      outputData.unshift(headerRow); // Add header back
      // --- End of Sorting ---

      destSheet.getRange(1, 1, outputData.length, newHeader.length).setValues(outputData);
      destSheet.autoResizeColumns(1, newHeader.length);
      destSheet.setFrozenRows(1);
      
      // Format the EB column as a number (3 decimal places)
      const ebColLetter = String.fromCharCode('A'.charCodeAt(0) + newHeader.length - 1);
      destSheet.getRange(`${ebColLetter}2:${ebColLetter}${outputData.length}`)
               .setNumberFormat('0.000'); 

      SpreadsheetApp.getUi().alert('✅ Plank List with Wastage created and grouped successfully!');
    } else {
      SpreadsheetApp.getUi().alert('⚠️ No valid data was found to create a Plank List.');
    }

  } catch (e) {
    Logger.log(e);
    SpreadsheetApp.getUi().alert('An error occurred: ' + e.message);
  }
}