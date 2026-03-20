/**
 * Creates an Output QA sheet with checkboxes by pulling and reformatting data
 * from "Plank List" and "Formatted_Plank_Data".
 * Groups data by Room → Box Name → Color (Material).
 * Formatting and customer details match Pressing List and Input QA style.
 */
function createOutputQASheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const customerDetailsSheetName = "Customer Details";

  const config = {
    headerColor: "#fef2c0",
    borderColor: "#d9d9d9"
  };

  // --- Customer Details: read Field/Value from sheet (B or C for value), same as Pressing List ---
  function getCustomerDetailsMap(sheet) {
    const map = {};
    if (!sheet) return map;
    const lastRow = Math.min(sheet.getLastRow(), 35);
    if (lastRow < 2) return map;
    const range = sheet.getRange(2, 1, lastRow, 3);
    const rows = range.getValues();
    for (let i = 0; i < rows.length; i++) {
      const field = (rows[i][0] && rows[i][0].toString().trim()) || "";
      if (!field) continue;
      const key = field.toLowerCase().trim();
      const valB = rows[i][1];
      const valC = rows[i][2];
      const value = (valB !== null && valB !== undefined && String(valB).trim() !== "")
        ? (typeof valB === "number" ? String(valB) : String(valB).trim())
        : (valC !== null && valC !== undefined && String(valC).trim() !== ""
          ? (typeof valC === "number" ? String(valC) : String(valC).trim())
          : "");
      map[key] = value;
    }
    return map;
  }

  function getCustomerDetail(customerMap, fieldName) {
    if (!customerMap) return "";
    const key = fieldName.toLowerCase().trim();
    return customerMap[key] || "";
  }

  try {
    console.log("Starting createOutputQASheet function");

    const customerSheet = ss.getSheetByName(customerDetailsSheetName);
    const customerMap = getCustomerDetailsMap(customerSheet);
    const customerName = getCustomerDetail(customerMap, "Customer Name") || getCustomerDetail(customerMap, "Firm Name") || "";
    const siteAddress = getCustomerDetail(customerMap, "Site Address") || getCustomerDetail(customerMap, "Location") || "";
    const contactNumber = getCustomerDetail(customerMap, "Contact Number") || "";

    // 1. Get the source sheets
    const plankSheet = ss.getSheetByName("Plank List");
    const formattedSheet = ss.getSheetByName("Formatted_Plank_Data");

    if (!plankSheet) {
      ui.alert("Error: 'Plank List' sheet not found.");
      return;
    }
    if (!formattedSheet) {
      ui.alert("Error: 'Formatted_Plank_Data' sheet not found.");
      return;
    }

    // 2. Get or create the destination sheet (name with customer like Input QA when available)
    const sheetName = customerName ? "Output QA - " + customerName : "Output QA";
    let qaSheet = ss.getSheetByName(sheetName);
    if (!qaSheet) {
      qaSheet = ss.insertSheet(sheetName);
    } else {
      qaSheet.clear(); // Clear existing content
    }

    // 3. Read Plank List data
    const plankRange = plankSheet.getRange(1, 1, plankSheet.getLastRow(), plankSheet.getLastColumn());
    const plankValues = plankRange.getValues();
    const plankHeaders = plankValues.shift();

    // Find column indices in Plank List
    const plankColIndices = {
      material: plankHeaders.indexOf("Material"),
      thickness: plankHeaders.indexOf("Thickness (mm)"),
      plankId: plankHeaders.indexOf("Plank id"),
      width: plankHeaders.indexOf("Width (mm)"),
      height: plankHeaders.indexOf("Height (mm)")
    };

    // Check if all required columns were found in Plank List
    if (Object.values(plankColIndices).some(index => index === -1)) {
      ui.alert("Error: Could not find all required columns in 'Plank List'.\nPlease ensure these headers exist: Material, Thickness (mm), Plank id, Width (mm), Height (mm).");
      return;
    }

    // 4. Read Formatted_Plank_Data
    const formattedRange = formattedSheet.getRange(1, 1, formattedSheet.getLastRow(), formattedSheet.getLastColumn());
    const formattedValues = formattedRange.getValues();
    const formattedHeaders = formattedValues.shift();

    // Find column indices in Formatted_Plank_Data
    const formattedColIndices = {
      roomName: formattedHeaders.indexOf("room_name"),
      boxName: formattedHeaders.indexOf("box_name"),
      plankId: formattedHeaders.indexOf("plank_id"),
      plankMaterial: formattedHeaders.indexOf("plank_material")
    };

    // Check if all required columns were found in Formatted_Plank_Data
    if (Object.values(formattedColIndices).some(index => index === -1)) {
      ui.alert("Error: Could not find all required columns in 'Formatted_Plank_Data'.\nPlease ensure these headers exist: room_name, box_name, plank_id, plank_material.");
      return;
    }

    // 5. Create a lookup map from Formatted_Plank_Data (plank_id -> {room_name, box_name})
    const formattedLookup = {};
    for (const row of formattedValues) {
      const plankId = row[formattedColIndices.plankId];
      if (plankId !== "" && plankId !== null && plankId !== undefined) {
        formattedLookup[plankId] = {
          roomName: row[formattedColIndices.roomName] || "",
          boxName: row[formattedColIndices.boxName] || ""
        };
      }
    }

    // 6. Build the data array by matching Plank List with Formatted_Plank_Data
    const dataRows = [];
    for (const row of plankValues) {
      const plankId = row[plankColIndices.plankId];
      if (plankId === "" || plankId === null || plankId === undefined) continue;

      const formattedInfo = formattedLookup[plankId] || { roomName: "Unknown", boxName: "Unknown" };
      
      const roomName = formattedInfo.roomName;
      const boxName = formattedInfo.boxName;
      // Remove anything in parentheses (including the parentheses) from color
      let color = row[plankColIndices.material];
      if (color && typeof color === 'string') {
        color = color.replace(/\s*\([^)]*\)/g, '').trim();
      }
      const thickness = row[plankColIndices.thickness];
      const width = row[plankColIndices.width];
      const height = row[plankColIndices.height];

      dataRows.push({
        roomName: roomName,
        boxName: boxName,
        color: color,
        thickness: thickness,
        plankId: plankId,
        width: width,
        height: height
      });
    }

    // 7. Sort data by Room → Box Name → Color
    dataRows.sort((a, b) => {
      // First sort by Room Name
      if (a.roomName !== b.roomName) {
        return String(a.roomName).localeCompare(String(b.roomName));
      }
      // Then by Box Name
      if (a.boxName !== b.boxName) {
        return String(a.boxName).localeCompare(String(b.boxName));
      }
      // Then by Color
      return String(a.color).localeCompare(String(b.color));
    });

    // 8. Create the output array with headers
    const outputHeaders = ["Room", "Unit/Box Name", "Color", "Thickness", "Labels", "Width", "Height", "QA", "Comments"];
    const outputData = [outputHeaders];

    for (const row of dataRows) {
      outputData.push([
        row.roomName,
        row.boxName,
        row.color,
        row.thickness,
        row.plankId,
        row.width,
        row.height,
        "", // Placeholder for QA checkbox
        ""  // Empty Comments
      ]);
    }

    const TABLE_HEADER_ROW = 6;
    const DATA_START_ROW = 7;

    // 9. Write header block (customer details) then table (Pressing List / Input QA style)
    if (outputData.length > 1) {
      // --- Header block: logo, title, customer details, total items (same structure as Pressing / Input QA) ---
      qaSheet.getRange(1, 1).setValue("NESTUP").setFontSize(12).setFontWeight("bold");
      qaSheet.getRange(1, 1).setFontColor("#FF8C00");
      qaSheet.getRange(2, 1, 1, outputHeaders.length).merge().setValue("Output QA")
        .setFontSize(14).setFontWeight("bold").setHorizontalAlignment("center");
      qaSheet.getRange(3, 1).setValue("Customer Name: " + (customerName || ""));
      qaSheet.getRange(3, 4).setValue("Site Address: " + (siteAddress || "NA"));
      qaSheet.getRange(4, 1).setValue("Name & Contact No: " + (contactNumber || ""));
      qaSheet.getRange(5, 1).setValue("Total Items: " + (outputData.length - 1));
      qaSheet.getRange(5, 4).setValue("Date: " + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT", "dd-MMM-yyyy"));

      qaSheet.getRange(TABLE_HEADER_ROW, 1, 1, outputHeaders.length).setValues([outputHeaders]);
      qaSheet.getRange(DATA_START_ROW, 1, outputData.length - 1, outputHeaders.length)
        .setValues(outputData.slice(1));

      // 10. Apply formatting (Pressing List / Input QA style)
      const headerRange = qaSheet.getRange(TABLE_HEADER_ROW, 1, 1, outputHeaders.length);
      headerRange.setFontWeight("bold").setBackground(config.headerColor);

      const lastDataRow = DATA_START_ROW + outputData.length - 2;
      const tableRange = qaSheet.getRange(TABLE_HEADER_ROW, 1, lastDataRow, outputHeaders.length);
      tableRange.setBorder(true, true, true, true, true, true, config.borderColor, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

      // 11. Add checkboxes to the "QA" column (Column H, which is 8)
      const qaCheckboxRange = qaSheet.getRange(DATA_START_ROW, 8, lastDataRow - DATA_START_ROW + 1, 1);
      qaCheckboxRange.insertCheckboxes();

      // 12. Freeze title and header (Pressing List style)
      qaSheet.setFrozenRows(TABLE_HEADER_ROW);

      // 13. Auto-resize columns
      qaSheet.autoResizeColumns(1, 9);
      qaSheet.setColumnWidth(9, 220); // Comments column wider, like Pressing List

      // 14. Alternating row colors by room (subtle, matches sheet family style)
      let currentRoom = "";
      let colorToggle = false;
      for (let i = DATA_START_ROW; i <= lastDataRow; i++) {
        const rowRoom = qaSheet.getRange(i, 1).getValue();
        if (rowRoom !== currentRoom) {
          currentRoom = rowRoom;
          colorToggle = !colorToggle;
        }
        if (colorToggle) {
          qaSheet.getRange(i, 1, 1, 9).setBackground("#f9f9f9");
        }
      }

      ui.alert("Success: '" + sheetName + "' sheet has been generated with " + (outputData.length - 1) + " items, grouped by Room, Box Name, and Color.");
    } else {
      ui.alert("No data found to process. Please check that Plank IDs match between 'Plank List' and 'Formatted_Plank_Data'.");
    }

  } catch (e) {
    console.error("ERROR in createOutputQASheet:", e.name, e.message, e.stack);
    ui.alert("Error in Output QA Generation:\n" + e.name + ": " + e.message + "\n\nStack:\n" + e.stack);
  }
}