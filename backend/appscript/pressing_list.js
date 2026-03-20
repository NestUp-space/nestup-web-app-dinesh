function generatePressingList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const srcName = "Material Summary";
  const dstName = "Pressing List";
  const customerDetailsSheetName = "Customer Details";

  // --- Customer Details: read Field/Value from sheet (B or C for value) ---
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

  const customerSheet = ss.getSheetByName(customerDetailsSheetName);
  const customerMap = getCustomerDetailsMap(customerSheet);
  const customerName = getCustomerDetail(customerMap, "Customer Name") || getCustomerDetail(customerMap, "Firm Name") || "";
  const siteAddress = getCustomerDetail(customerMap, "Site Address") || getCustomerDetail(customerMap, "Location") || "";

  const source = ss.getSheetByName(srcName);
  if (!source) {
    SpreadsheetApp.getUi().alert("Sheet '" + srcName + "' not found.");
    return;
  }

  const lastCol = source.getLastColumn();
  const lastRow = source.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("No data found in '" + srcName + "'.");
    return;
  }

  const headers = source.getRange(1, 1, 1, lastCol).getValues()[0];

  // Detect columns
  let matThColIndex = headers.findIndex(h => {
    if (!h) return false;
    const hh = h.toString().toLowerCase();
    return (hh.includes("material") && hh.includes("thick")) || hh.includes("material&thickness");
  });
  if (matThColIndex === -1) matThColIndex = 0;

  let sheetsUsedColIndex = headers.findIndex(h => {
    if (!h) return false;
    const hh = h.toString().toLowerCase();
    return hh.match(/sheets?\s*used/) || hh.match(/sheet\s*qty/);
  });
  if (sheetsUsedColIndex === -1) sheetsUsedColIndex = Math.max(2, lastCol - 1);

  const data = source.getRange(2, 1, lastRow - 1, lastCol).getValues();

  // Helpers for key building (used when reading existing sheet and when building rows)
  function parseMaterialAndThickness(cellValue) {
    if (!cellValue) return { material: "", thickness: "" };
    let s = String(cellValue).trim();
    const match = s.match(/(\d+(?:\.\d+)?)\s*mm/i);
    const thickness = match ? match[1].trim() : "";
    const material = s.replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, "")
                      .replace(/\d+(?:\.\d+)?\s*mm/gi, "")
                      .replace(/[-\/,:]+$/g, "")
                      .trim();
    return { material, thickness };
  }
  function reduceThickness(thicknessText) {
    if (!thicknessText) return "";
    const match = String(thicknessText).match(/(\d+(\.\d+)?)/);
    if (!match) return thicknessText;
    const value = parseFloat(match[1]) - 2;
    if (isNaN(value) || value <= 0) return thicknessText;
    return value + "mm";
  }
  function thicknessToNumber(thicknessText) {
    if (!thicknessText) return "";
    const match = String(thicknessText).match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : thicknessText;
  }
  function formatColorCode(materialPart, thicknessMm) {
    const mat = (materialPart || "").trim().replace(/\s+/g, " ");
    const num = thicknessMm ? (parseFloat(String(thicknessMm).replace(/[^\d.]/g, "")) || 0) : 0;
    return num ? mat + "-" + num.toFixed(1) : mat;
  }
  function buildRowKey(materialCellValue, thicknessCellValue) {
    const parsed = parseMaterialAndThickness(materialCellValue);
    const thicknessNum = thicknessToNumber(thicknessCellValue);
    const colorCode = formatColorCode(parsed.material, parsed.thickness);
    return colorCode + "|" + (thicknessNum !== "" ? thicknessNum : thicknessCellValue);
  }

  const TABLE_HEADER_ROW = 6;
  const DATA_START_ROW = 7;

  let dst = ss.getSheetByName(dstName);
  let existingMap = {};
  if (!dst) dst = ss.insertSheet(dstName);
  else {
    const dstLastRow = dst.getLastRow();
    if (dstLastRow >= TABLE_HEADER_ROW + 1) {
      const dstLastCol = dst.getLastColumn();
      const headerRow = dst.getRange(TABLE_HEADER_ROW, 1, 1, 6).getValues()[0];
      const firstHeader = (headerRow[0] && headerRow[0].toString().trim().toLowerCase()) || "";
      if (firstHeader === "color") {
        const existing = dst.getRange(DATA_START_ROW, 1, dstLastRow - DATA_START_ROW + 1, Math.min(6, dstLastCol)).getValues();
        for (let row of existing) {
          const key = (row[0] ? row[0].toString().trim() : "") + "|" + (row[2] ? row[2].toString().trim() : "");
          existingMap[key] = { checkbox: !!row[4], comment: (row[5] !== null && row[5] !== undefined) ? String(row[5]).trim() : "" };
        }
      } else {
        const existing = dst.getRange(2, 1, dstLastRow - 2, dstLastCol).getValues();
        for (let row of existing) {
          const key = buildRowKey(row[1], row[3]);
          existingMap[key] = { checkbox: !!row[5], comment: row[6] || "" };
        }
      }
    }
    dst.clear();
  }

  const headersDst = ["Color", "Material", "Thickness", "Count", "Pressing Completed", "Comments"];
  // getRange(row, column, numRows, numColumns) - 3rd/4th are count, not end row/col
  dst.getRange(TABLE_HEADER_ROW, 1, 1, headersDst.length).setValues([headersDst]);
  dst.getRange(TABLE_HEADER_ROW, 1, 1, headersDst.length).setFontWeight("bold").setBackground("#FFEB9C");

  // --- Header block: logo, title, customer details, total quantity ---
  dst.getRange(1, 1).setValue("NESTUP").setFontSize(12).setFontWeight("bold");
  dst.getRange(1, 1).setFontColor("#FF8C00");
  dst.getRange(2, 1, 1, 6).merge().setValue("Pressing Checklist").setFontSize(14).setFontWeight("bold").setHorizontalAlignment("center");
  dst.getRange(3, 1).setValue("Customer Name: " + (customerName || ""));
  dst.getRange(3, 4).setValue("Site Address: " + (siteAddress || "NA"));

  function determinePlyType(materialText) {
    if (!materialText) return "Plywood";
    const t = materialText.toString().toUpperCase();
    if (t.includes("HDHMR")) return "HDHMR";
    if (t.includes("BB")) return "Blockboard";
    if (t.includes("BWP")) return "BWP plywood";
    if (t.includes("MR")) return "MR";
    return "Plywood";
  }

  function isDimensionCount(val) {
    if (val === null || val === undefined) return false;
    const s = String(val).trim();
    return /\d+\s*[xX]\s*\d+/.test(s);
  }

  // Build pressing data: [color, material, thicknessNum, count, checkbox, comment]
  const pressingRows = [];
  for (let i = 0; i < data.length; i++) {
    const combined = data[i][matThColIndex];
    const parsed = parseMaterialAndThickness(combined);
    const sheetQty = data[i][sheetsUsedColIndex];
    const countVal = sheetQty !== null && sheetQty !== undefined && sheetQty !== "" ? sheetQty : "";
    if (!parsed.material) continue;

    const originalThickness = parsed.thickness;
    const adjustedThickness = reduceThickness(originalThickness);
    const thicknessNum = thicknessToNumber(adjustedThickness);
    const colorCode = formatColorCode(parsed.material, originalThickness);
    const plyType = determinePlyType(parsed.material);
    const key = colorCode + "|" + (thicknessNum !== "" ? thicknessNum : adjustedThickness);
    const existing = existingMap[key] || { checkbox: false, comment: "" };

    pressingRows.push([colorCode, plyType, thicknessNum, countVal, existing.checkbox, existing.comment]);
  }

  let totalQuantity = 0;
  for (let r = 0; r < pressingRows.length; r++) {
    const c = pressingRows[r][3];
    if (c !== null && c !== undefined && c !== "") {
      if (isDimensionCount(c)) totalQuantity += 1;
      else {
        const n = parseFloat(String(c).replace(/[^\d.]/g, ""));
        if (!isNaN(n)) totalQuantity += n;
      }
    }
  }
  dst.getRange(4, 1).setValue("Total Quantity: " + totalQuantity);

  if (pressingRows.length > 0) {
    const dataRange = dst.getRange(DATA_START_ROW, 1, pressingRows.length, 6);
    dataRange.setValues(pressingRows);

    const checkboxCol = 5;
    const checkboxRange = dst.getRange(DATA_START_ROW, checkboxCol, pressingRows.length);
    checkboxRange.clearDataValidations();
    checkboxRange.insertCheckboxes();
    dst.getRange(DATA_START_ROW, checkboxCol, pressingRows.length).setValues(pressingRows.map(r => [!!r[4]]));

    // Count column: red for dimension strings (cut pieces)
    const countCol = 4;
    for (let i = 0; i < pressingRows.length; i++) {
      const cell = dst.getRange(DATA_START_ROW + i, countCol);
      if (isDimensionCount(pressingRows[i][3])) cell.setFontColor("#CC0000");
    }

    // Comments column: blue
    const commentsCol = 6;
    dst.getRange(DATA_START_ROW, commentsCol, pressingRows.length, 1).setFontColor("#0000CC");

    // Footer note in red
    const footerRow = DATA_START_ROW + pressingRows.length;
    dst.getRange(footerRow, 1).setValue("Note: - Please check the Cutting List wherever there are CUT PIECES").setFontColor("#CC0000");
  }

  dst.setFrozenRows(TABLE_HEADER_ROW);
  dst.autoResizeColumns(1, 6);
  dst.setColumnWidth(6, 220);
  SpreadsheetApp.getUi().alert("Pressing List updated — " + pressingRows.length + " rows. Customer details and formatting applied.");
}
