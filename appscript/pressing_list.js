function generatePressingList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const srcName = "Material Summary";
  const dstName = "Pressing List";

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

  // Prepare destination sheet
  let dst = ss.getSheetByName(dstName);
  let existingMap = {};
  if (!dst) dst = ss.insertSheet(dstName);
  else {
    const dstLastRow = dst.getLastRow();
    if (dstLastRow >= 2) {
      const dstLastCol = dst.getLastColumn();
      const existing = dst.getRange(2, 1, dstLastRow - 1, dstLastCol).getValues();
      for (let row of existing) {
        const key = (row[1] ? row[1].toString().trim() : "") + "|" + (row[3] ? row[3].toString().trim() : "");
        existingMap[key] = { checkbox: !!row[5], comment: row[6] || "" };
      }
    }
    dst.clear();
  }

  const headersDst = ["S.No", "Material", "Ply Type", "Thickness", "Sheet Quantity", "Pressing Completed", "Comments"];
  dst.getRange(1, 1, 1, headersDst.length).setValues([headersDst]).setFontWeight("bold");
  dst.setFrozenRows(1);

  // --- Parser: keep full material (with numbers), extract thickness ---
  function parseMaterialAndThickness(cellValue) {
    if (!cellValue) return { material: "", thickness: "" };
    let s = String(cellValue).trim();

    // Find thickness (number + "mm")
    const match = s.match(/(\d+(?:\.\d+)?\s*mm)/i);
    const thickness = match ? match[1].trim() : "";

    // Remove only the thickness text & brackets to get the material
    const material = s.replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, "")
                      .replace(/\d+(?:\.\d+)?\s*mm/gi, "")
                      .replace(/[-\/,:]+$/g, "")
                      .trim();

    return { material, thickness };
  }

  function determinePlyType(materialText) {
    if (!materialText) return "Plywood";
    const t = materialText.toString().toUpperCase();
    if (t.includes("HDHMR")) return "HDHMR";
    if (t.includes("BB")) return "Block Board";
    if (t.includes("BWP")) return "BWP plywood";
    if (t.includes("MR")) return "MR";
    return "Plywood";
  }

  function reduceThickness(thicknessText) {
    if (!thicknessText) return "";
    const match = thicknessText.match(/(\d+(\.\d+)?)/);
    if (!match) return thicknessText;
    const value = parseFloat(match[1]) - 2;
    if (isNaN(value) || value <= 0) return thicknessText;
    return value + "mm";
  }

  // Build pressing data
  const pressingRows = [];
  let serial = 1;
  for (let i = 0; i < data.length; i++) {
    const combined = data[i][matThColIndex];
    const parsed = parseMaterialAndThickness(combined);
    const sheetQty = data[i][sheetsUsedColIndex] || "";
    if (!parsed.material) continue;

    const originalThickness = parsed.thickness;
    const adjustedThickness = reduceThickness(originalThickness);
    const material = parsed.material + (originalThickness ? " - " + originalThickness : "");
    const plyType = determinePlyType(parsed.material);
    const key = material + "|" + adjustedThickness;
    const existing = existingMap[key] || { checkbox: false, comment: "" };

    pressingRows.push([serial++, material, plyType, adjustedThickness, sheetQty, existing.checkbox, existing.comment]);
  }

  if (pressingRows.length > 0) {
    const dataRange = dst.getRange(2, 1, pressingRows.length, pressingRows[0].length);
    dataRange.setValues(pressingRows);

    // Add checkboxes
    const checkboxRange = dst.getRange(2, 6, pressingRows.length);
    checkboxRange.clearDataValidations();
    checkboxRange.insertCheckboxes();
    dst.getRange(2, 6, pressingRows.length).setValues(pressingRows.map(r => [!!r[5]]));

    // --- Highlight only keywords inside Material cell ---
  // --- Highlight only first occurrence of keywords inside Material cell ---
const colorMap = [
  { keywords: ["HDHMR"], color: "#228B22" },  // Green
  { keywords: ["BSL"], color: "#1E90FF" },    // Blue
  { keywords: ["BB", "BLOCK BOARD"], color: "#6A0DAD" }, // Purple
  { keywords: ["MR"], color: "#FF8C00" }      // Orange
];

for (let i = 0; i < pressingRows.length; i++) {
  const materialCell = dst.getRange(i + 2, 2); // Material column only
  const text = pressingRows[i][1].toString();
  const rich = SpreadsheetApp.newRichTextValue().setText(text);
  const upper = text.toUpperCase();

  for (const rule of colorMap) {
    for (const kw of rule.keywords) {
      const idx = upper.indexOf(kw);
      if (idx !== -1) {
        // Only color the first occurrence
        rich.setTextStyle(idx, idx + kw.length,
          SpreadsheetApp.newTextStyle().setForegroundColor(rule.color).setBold(true).build()
        );
        break; // stop after first occurrence of this keyword
      }
    }
  }

  materialCell.setRichTextValue(rich.build());
}
  }

  dst.autoResizeColumns(1, headersDst.length);
  dst.setColumnWidth(7, 220);
  SpreadsheetApp.getUi().alert("✅ Pressing List updated — material codes preserved, keywords highlighted (" + pressingRows.length + " rows).");
}
