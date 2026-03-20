/**
 * Hardware Sheet Generator for Google Sheets
 * Generates a hardware list with quantities based on total square feet (SFT)
 */

function addHardwareSheet() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const response = ui.prompt(
    "Enter Total SFT",
    "Enter total square feet (SFT):",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const sft = Number(response.getResponseText());
  if (!sft || sft <= 0) {
    ui.alert("Invalid SFT");
    return;
  }

  let sheet = ss.getSheetByName("Hardware");
  if (!sheet) {
    sheet = ss.insertSheet("Hardware");
  } else {
    sheet.clear();
  }

  // Set headers
  sheet.getRange("A1:B1").setValues([["Description", "Quantity"]]);
  sheet.getRange("A1:B1").setFontWeight("bold");

  const hardwareList = [
    "Hinges Soft Close- 0 Crank",
    "Hinges Soft Close- 16 Crank",
    "Hinges Soft Close- 180 Crank",
    "12 inches / 300mm - Channel",
    "14 inches / 350mm - Channel",
    "16 inches / 400mm - Channel",
    "18 inches / 450mm - Channel",
    "20 inches / 500mm - Channel",
    "22 inches / 550 mm - Channel",
    "*Fevicol - Probond",
    "*Fevicol - D3",
    "*HeatX",
    "VB Fittings",
    "*Abro Tapes",
    "*Laminate cutter",
    "Tandem Baskets",
    "Tandem Baskets-4\"",
    "Tandem Baskets-6\"",
    "Tandem Baskets-8\"",
    "22 inches / 550mm - Tandem Channel",
    "Bottle Pullout 21x20x8 inches",
    "Bottle Pullout 21x20x10 inches",
    "Bottle Pullout 20 inches Channel",
    "Sliding Channel 2 Door Fitting",
    "Removable Shelf Buttons",
    "Magic Corner",
    "Oval Rod",
    "Oval Bracket",
    "Draw Locks",
    "Cupboard Locks",
    "L Tower Bolt",
    "Gola Profile - (L)",
    "Gola Profile - (C)",
    "G Profile",
    "PVC Gitty (38/6)",
    "Hydraulics",
    "PVC Legs",
    "SS Legs",
    "Single Screw L Clamps - EBCO",
    "PTA Screws 3 inches",
    "PTA Screws (4mm x 16mm)",
    "PTA Screws (4mm x 20mm)",
    "PTA Screws (4mm x 30mm)",
    "PTA Screws (4mm x 45mm)"
  ];

  const data = hardwareList.map(item => [item, getStandardQty(item, sft)]);
  sheet.getRange(2, 1, data.length, 2).setValues(data);

  sheet.autoResizeColumns(1, 2);
}

/**
 * Calculate standard quantity for a hardware item based on SFT
 * @param {string} item - The hardware item name
 * @param {number} sft - Total square feet
 * @returns {string} - Quantity with unit
 */
function getStandardQty(item, sft) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Formatted_Plank_Data");
  
  let data = null;
  let headers = null;
  
  if (sheet) {
    data = sheet.getDataRange().getValues();
    headers = data[0];
  }

  let qty = "";

  // ==================================================
  // HINGES SOFT CLOSE - 0 CRANK
  // ==================================================
  if (item === "Hinges Soft Close- 0 Crank" && headers) {
    let hingeIndexes = new Set();

    headers.forEach(h => {
      const match = h.match(/^hing_(\d+)_X$/);
      if (match) hingeIndexes.add(match[1]);
    });

    let count = 0;

    hingeIndexes.forEach(idx => {
      const xCol = headers.indexOf(`hing_${idx}_X`);
      const yCol = headers.indexOf(`hing_${idx}_Y`);
      const zCol = headers.indexOf(`hing_${idx}_Z`);

      if (xCol === -1 || yCol === -1 || zCol === -1) return;

      for (let r = 1; r < data.length; r++) {
        if (data[r][xCol] !== "" && data[r][yCol] !== "" && data[r][zCol] !== "") {
          count++;
        }
      }
    });

    qty = count;
  }

  // ==================================================
  // VB FITTINGS (VB MAIN ONLY)
  // ==================================================
  if (item === "VB Fittings" && headers) {
    let vbIndexes = new Set();

    headers.forEach(h => {
      const match = h.match(/^vb_main_(\d+)_X$/);
      if (match) vbIndexes.add(match[1]);
    });

    let count = 0;

    vbIndexes.forEach(idx => {
      const xCol = headers.indexOf(`vb_main_${idx}_X`);
      const yCol = headers.indexOf(`vb_main_${idx}_Y`);
      const zCol = headers.indexOf(`vb_main_${idx}_Z`);

      if (xCol === -1 || yCol === -1 || zCol === -1) return;

      for (let r = 1; r < data.length; r++) {
        if (data[r][xCol] !== "" && data[r][yCol] !== "" && data[r][zCol] !== "") {
          count++;
        }
      }
    });

    qty = count;
  }

  // ==================================================
  // PVC GITTY (38/6)
  // ==================================================
  if (item === "PVC Gitty (38/6)") {
    if (sft <= 400) qty = 1;
    else if (sft <= 1200) qty = 2;
    else qty = 3;
  }

  // ==================================================
  // PTA SCREWS 3 INCHES
  // ==================================================
  if (item === "PTA Screws 3 inches") {
    if (sft <= 250) qty = scaleQty(sft, 150, 250, 30, 50);
    else if (sft <= 500) qty = scaleQty(sft, 250, 500, 50, 100);
    else if (sft <= 750) qty = scaleQty(sft, 500, 750, 150, 250);
    else if (sft <= 1200) qty = scaleQty(sft, 750, 1200, 250, 350);
    else qty = 250;
  }

  // ==================================================
  // PTA SCREWS (4mm x 16mm)
  // ==================================================
  if (item === "PTA Screws (4mm x 16mm)") {
    if (sft <= 250) qty = scaleQty(sft, 150, 250, 250, 350);
    else if (sft <= 500) qty = scaleQty(sft, 250, 500, 350, 500);
    else if (sft <= 750) qty = scaleQty(sft, 500, 750, 500, 750);
    else if (sft <= 1200) qty = 1000;
    else qty = 1500;
  }

  // ==================================================
  // PTA SCREWS (4mm x 20mm)
  // ==================================================
  if (item === "PTA Screws (4mm x 20mm)") {
    if (sft <= 250) qty = scaleQty(sft, 150, 250, 150, 250);
    else if (sft <= 500) qty = scaleQty(sft, 250, 500, 250, 500);
    else if (sft <= 750) qty = scaleQty(sft, 500, 750, 500, 750);
    else if (sft <= 1200) qty = 1000;
    else qty = 1500;
  }

  // ==================================================
  // PTA SCREWS (4mm x 30mm)
  // ==================================================
  if (item === "PTA Screws (4mm x 30mm)") {
    if (sft <= 250) qty = scaleQty(sft, 150, 250, 250, 500);
    else if (sft <= 500) qty = scaleQty(sft, 250, 500, 500, 750);
    else if (sft <= 750) qty = scaleQty(sft, 500, 750, 750, 1000);
    else if (sft <= 1200) qty = 1300;
    else qty = 1500;
  }

  // ==================================================
  // PTA SCREWS (4mm x 45mm)
  // ==================================================
  if (item === "PTA Screws (4mm x 45mm)") {
    if (sft <= 250) qty = scaleQty(sft, 150, 250, 250, 500);
    else if (sft <= 500) qty = scaleQty(sft, 250, 500, 500, 750);
    else if (sft <= 750) qty = scaleQty(sft, 500, 750, 750, 1000);
    else if (sft <= 1200) qty = 1300;
    else qty = 1500;
  }

  // ==================================================
  // UNIT MAP (FINAL OUTPUT FORMATTING)
  // ==================================================
  const unitMap = {
    "Hinges Soft Close- 0 Crank": "sets",
    "Hinges Soft Close- 16 Crank": "sets",
    "Hinges Soft Close- 180 Crank": "sets",

    "12 inches / 300mm - Channel": "sets",
    "14 inches / 350mm - Channel": "sets",
    "16 inches / 400mm - Channel": "sets",
    "18 inches / 450mm - Channel": "sets",
    "20 inches / 500mm - Channel": "set",
    "22 inches / 550 mm - Channel": "set",

    "*Fevicol - Probond": "kgs\nProvided by NestUP & Bill accordingly",
    "*Fevicol - D3": "kgs\nProvided by NestUP & Bill accordingly",

    "VB Fittings": "Pieces\nProvided by NestUP & Bill accordingly\n*count may be change after production.",

    "*HeatX": "kgs",
    "*Abro Tapes": "Bundles",
    "*Laminate cutter": "Piece",

    "Tandem Baskets": "set",
    "Tandem Baskets-4\"": "set",
    "Tandem Baskets-6\"": "set",
    "Tandem Baskets-8\"": "set",
    "22 inches / 550mm - Tandem Channel": "sets",

    "Bottle Pullout 21x20x8 inches": "Piece",
    "Bottle Pullout 21x20x10 inches": "Piece",
    "Bottle Pullout 20 inches Channel": "Set",
    "Sliding Channel 2 Door Fitting": "Set",

    "Removable Shelf Buttons": "pieces",
    "Magic Corner": "sets",

    "Oval Rod": "Lengths",
    "Oval Bracket": "sets",

    "Draw Locks": "pieces",
    "Cupboard Locks": "piece",
    "L Tower Bolt": "pieces",

    "Gola Profile - (L)": "Lengths",
    "Gola Profile - (C)": "Lengths",
    "G Profile": "Lengths",

    "PVC Gitty (38/6)": "Boxes",
    "Hydraulics": "sets",
    "PVC Legs": "pieces",
    "SS Legs": "pieces",
    "Single Screw L Clamps - EBCO": "pieces",

    "PTA Screws 3 inches": "pieces",
    "PTA Screws (4mm x 16mm)": "Boxes",
    "PTA Screws (4mm x 20mm)": "Boxes",
    "PTA Screws (4mm x 30mm)": "Boxes",
    "PTA Screws (4mm x 45mm)": "Boxes"
  };

  // Return formatted output
  if (unitMap[item]) {
    return qty ? `${qty} ${unitMap[item]}` : unitMap[item];
  }

  return qty ? String(qty) : "";
}

/**
 * Scale quantity based on SFT range
 * @param {number} sft - Current square feet
 * @param {number} sftMin - Minimum SFT in range
 * @param {number} sftMax - Maximum SFT in range
 * @param {number} qtyMin - Minimum quantity
 * @param {number} qtyMax - Maximum quantity
 * @returns {number} - Scaled quantity
 */
function scaleQty(sft, sftMin, sftMax, qtyMin, qtyMax) {
  if (sft <= sftMin) return qtyMin;
  if (sft >= sftMax) return qtyMax;

  const ratio = (sft - sftMin) / (sftMax - sftMin);
  return Math.round(qtyMin + ratio * (qtyMax - qtyMin));
}
