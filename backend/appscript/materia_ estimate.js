/**
 * @OnlyCurrentDoc
 * This script provides a complete, one-click solution to generate a material estimate
 * and create a professional client-facing document from a template.
 * Version: 4.0 (EB inner thickness-based merge + OS skip + <=3mm laminate-only)
 */

// ============================
// Helper: EB size (Option A) – inner = 0.8 mm
// ============================
const getEbSize = (thickness, isInner = false) => {
  if (isInner) {
    const t = Number(thickness) || 18;

    if (t >= 16 && t <= 17) return "22mm*0.8mm";   // 18mm → 22*0.8
    if (t >= 18 && t <= 20) return "25mm*0.8mm";   // 20mm → 25*0.8
    if (t >= 23 && t <= 27) return "30mm*0.8mm";   // 25mm/27mm → 30*0.8

    return "22mm*0.8mm"; // default
  }

  if (!thickness && thickness !== 0) return "22mm*2.0mm";
  const t = Number(thickness);
  if (isNaN(t)) return "22mm*2.0mm";

  if (t >= 16 && t <= 17) return "22mm*2.0mm";
  if (t >= 18 && t <= 20) return "25mm*2.0mm";
  if (t >= 23 && t <= 27) return "30mm*2.0mm";
  if (t > 27) return "45mm*2.0mm";
  return "22mm*2.0mm"; // default
};

// ============================
// Helper: format quantity – remove .0
// ============================
const fmtQty = (n) => (Number.isInteger(n) ? n : Math.round(n));

// ============================
// Main Function
// ============================
function generateMaterialEstimate() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Helper function to extract only the color/brand code
  const getCleanColorCode = (rawString) => {
    if (!rawString) return 'NA';

    let str = rawString.trim();

    const removeWords = ['bwp', 'bb', 'hdhmr', 'mdf', 'hdf', 'ply', 'bsl', 'inner', 'veneer', 'wood', 'timber'];
    removeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      str = str.replace(regex, '');
    });

    str = str.replace(/\(.*?\)/g, '');
    str = str.replace(/\(\s*\d+\s*mm\s*\)/gi, '');
    str = str.replace(/\b\d+mm\b/gi, '');
    str = str.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

    return str || 'NA';
  };

  const processHardwareValue = (value) => {
    if (!value && value !== 0) return 0;
    if (typeof value === 'number') return value;

    const strValue = value.toString().trim();
    if (strValue === '') return 0;

    if (strValue.includes(',')) {
      const numbers = strValue.split(',').map(num => {
        const cleaned = num.trim().replace(/[^\d.-]/g, '');
        return parseFloat(cleaned) || 0;
      });
      return numbers.reduce((sum, num) => sum + num, 0);
    }

    const cleaned = strValue.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  };

  try {
    ui.showModalDialog(
      HtmlService.createHtmlOutput('<p>Processing... Please wait.</p>').setWidth(300).setHeight(100),
      'Generating Estimate'
    );

    const sourceSheet = ss.getSheetByName("Material Summary");
    const hardwareSheet = ss.getSheetByName("Hardware");
    const sftSheet = ss.getSheetByName("SFT Results");

    if (!sourceSheet || !hardwareSheet) {
      throw new Error("One of the required sheets (Material Summary or Hardware) is missing.");
    }

    let outputSheet = ss.getSheetByName("Material Estimate");
    if (!outputSheet) { outputSheet = ss.insertSheet("Material Estimate"); }

    // --- SFT LOGIC ---
    let totalSqFt = 0;
    if (sftSheet) {
      const sftData = sftSheet.getDataRange().getValues();
      for (let i = 0; i < sftData.length; i++) {
        for (let j = 0; j < sftData[i].length; j++) {
          const cellValue = sftData[i][j];
          if (cellValue && cellValue.toString().toLowerCase().includes('total square feet')) {
            if (i + 1 < sftData.length && typeof sftData[i + 1][j] === 'number') {
              totalSqFt = parseFloat(sftData[i + 1][j]);
              break;
            }
            if (j + 1 < sftData[i].length && typeof sftData[i][j + 1] === 'number') {
              totalSqFt = parseFloat(sftData[i][j + 1]);
              break;
            }
          }
        }
        if (totalSqFt > 0) break;
      }
      if (totalSqFt === 0) {
        for (let i = sftData.length - 1; i >= 0; i--) {
          for (let j = sftData[i].length - 1; j >= 0; j--) {
            const cellValue = sftData[i][j];
            if (typeof cellValue === 'number' && cellValue > 0) {
              totalSqFt = parseFloat(cellValue);
              break;
            }
          }
          if (totalSqFt > 0) break;
        }
      }
    }

    const plywoodSummary = {}, laminateSummary = {};
    const edgeBandingByLaminate = {};
    let totalSheets = 0, totalAcrylicSides = 0;
    const laminateKeyMap = {};

    // --- EB SUMMARY HELPER (with OS skip + inner merge + <=3mm skip) ---
    const addToEbSummary = (key, ebAmount, isInner, thickness = 18, isOS = false) => {

      // Skip EB completely for OS laminates (OS Inner, ACR123 (OS), OS acr123)
      const keyLower = key.toLowerCase();
      if (
        keyLower.includes("(os") ||
        keyLower.includes(" os") ||
        keyLower.includes("os ")
      ) {
        return;
      }
      if (isOS) return;
      if (ebAmount === 0 || !ebAmount) return;

      // Skip EB if thickness <= 3mm (laminate-only case)
      if (thickness <= 3) return;

      const ebWidth = getEbSize(thickness, isInner);

      // Inner: merge by laminate + EB width only
      // Outer: keep thickness in key
      const ebKey = isInner
        ? `${key}__${ebWidth}__inner`
        : `${key}__${thickness}mm__${ebWidth}__outer`;

      if (!edgeBandingByLaminate[ebKey]) {
        edgeBandingByLaminate[ebKey] = {
          totalMeters: 0,
          isInner: isInner,
          ebWidth: ebWidth
        };
      }
      edgeBandingByLaminate[ebKey].totalMeters += ebAmount;
    };

    let totalInnerSheets = 0;
    const summaryDataRange = sourceSheet.getDataRange();
    const summaryValues = summaryDataRange.getValues();
    const summaryHeaders = summaryValues[0];
    const summaryMap = {};
    summaryHeaders.forEach((h, i) => { if (h) summaryMap[h.trim()] = i; });

    const reqSummaryCols = ["Material & Thickness", "Sheets Used", "Total Edge (m)", "Room Name(s)"];
    for (const col of reqSummaryCols) {
      if (summaryMap[col] === undefined) {
        throw new Error(`Missing required column '${col}' in 'Material Summary' sheet.`);
      }
    }

    for (let i = 1; i < summaryValues.length; i++) {
      let originalThickness = null;
      let finalThickness = null;

      const row = summaryValues[i];
      const materialString = row[summaryMap["Material & Thickness"]];
      const sheetsUsed = Number(row[summaryMap["Sheets Used"]]);
      const totalEb = parseFloat(row[summaryMap["Total Edge (m)"]]) || 0;
      const roomNamesString = row[summaryMap["Room Name(s)"]] || "";

      if ((!materialString || isNaN(sheetsUsed) || sheetsUsed === 0) && totalEb === 0) continue;

      const thicknessMatch = materialString ? materialString.match(/\((\d+)mm?\)/i) : null;
      if (thicknessMatch && thicknessMatch[1]) {
        originalThickness = parseInt(thicknessMatch[1], 10);
        finalThickness = originalThickness - 2;
      }

      // ✔ ply thickness <= 3mm → laminate-only (no plywood, no EB)
      const isThinOnly = originalThickness !== null && originalThickness <= 3;

      if (sheetsUsed > 0) {
        if (!isThinOnly) {
          totalSheets += sheetsUsed;

          if (originalThickness !== null) {
            let plywoodType = "Plywood";
            const materialLowerTmp = materialString.toLowerCase();

            if (materialLowerTmp.includes('bwp')) plywoodType = "BWP";
            else if (materialLowerTmp.includes('bb')) plywoodType = "Blockboard";
            else if (materialLowerTmp.includes('hdhmr')) plywoodType = "HDHMR";
            else if (materialLowerTmp.includes('mdf')) plywoodType = "MDF";
            else if (materialLowerTmp.includes('hdf')) plywoodType = "HDF";

            const plywoodKey = `${plywoodType} - ${finalThickness}mm`;
            plywoodSummary[plywoodKey] = (plywoodSummary[plywoodKey] || 0) + sheetsUsed;
          }

          if (materialString && materialString.toLowerCase().includes('acr')) {
            totalAcrylicSides += sheetsUsed;
          }
        }
      }

      // --- Material / Laminate properties ---
      const material = materialString ? materialString.toLowerCase() : '';
      // Detect OS laminate (OS inner or OS colour)
      const isOSLaminate =
        material.includes('(os') ||
        /\bos\b/.test(material);

      const colorCode = getCleanColorCode(materialString);
      const roomsToAdd = roomNamesString.split(',')
  .map(r => r.trim())
  .filter(r => r && r.toLowerCase() !== 'n/a');


// =======================================
// 🔥 NEW SPECIAL LOGIC FOR @   AND   &
// =======================================
let cleanColor = colorCode.trim();

// -------- CASE 1: 123 @ 183 --------
if (materialString.includes("@")) {

  const parts = cleanColor.split("@");
  const firstColor = parts[0].trim();

  // inner laminate = ONE SIDE only
  if (!laminateSummary["Inner Laminates"]) {
    laminateSummary["Inner Laminates"] = {
      exteriorSheets: 0,
      innerSheets: 0,
      colorCode: "Inner"
    };
  }

  laminateSummary["Inner Laminates"].innerSheets += sheetsUsed;
  totalInnerSheets += sheetsUsed;

  // EB only for first colour
  addToEbSummary(
    firstColor,
    totalEb,
    false,
    originalThickness || 18,
    isOSLaminate
  );
  // ⭐ Match single-colour EB description logic
let descRooms = laminateSummary["Inner Laminates"]?.rooms;
let descriptionEB = (descRooms && descRooms.size > 0)
  ? Array.from(descRooms).sort().join(", ")
  : firstColor;

let ebCodeForTwoColour = `NA / NA / ${firstColor}`;

  continue; // stop normal logic
}

// -------- CASE 2: 123 & 999 --------
if (materialString.includes("&")) {

  const parts = cleanColor.split("&");

  if (parts.length === 2) {
    const firstColor  = parts[0].trim();
    const secondColor = parts[1].trim();

    // First colour laminate
    if (!laminateSummary[firstColor]) {
      laminateSummary[firstColor] = {
        exteriorSheets: 0,
        innerSheets: 0,
        colorCode: firstColor,
        rooms: new Set()
      };
    }
    laminateSummary[firstColor].exteriorSheets += sheetsUsed;
    roomsToAdd.forEach(r => laminateSummary[firstColor].rooms.add(r));

    // Second colour laminate
    if (!laminateSummary[secondColor]) {
      laminateSummary[secondColor] = {
        exteriorSheets: 0,
        innerSheets: 0,
        colorCode: secondColor,
        rooms: new Set()
      };
    }
    laminateSummary[secondColor].exteriorSheets += sheetsUsed;
    roomsToAdd.forEach(r => laminateSummary[secondColor].rooms.add(r));

    // EB only for first colour
    addToEbSummary(
      firstColor,
      totalEb,
      false,
      originalThickness || 18,
      isOSLaminate
    );

    continue;
  }
}
// =======================================
// END SPECIAL LOGIC
// =======================================


const splitRegex = /\s+(?:and|&|n)\s+/i;
const codes = colorCode.split(splitRegex);

      let laminateKey = colorCode;
      if (colorCode !== 'NA') {
        const lowerKey = colorCode.toLowerCase();
        if (!laminateKeyMap[lowerKey]) laminateKeyMap[lowerKey] = colorCode;
        laminateKey = laminateKeyMap[lowerKey];
      }

      const hasBSL = material.includes('bsl');
      const isInner = material.includes('inner');
      const isWoodenInner = isInner && (material.includes('wood') || material.includes('timber') || material.includes('veneer'));

      if (isInner) {
        const innerKey = isWoodenInner ? 'Wooden Inner Laminates' : 'Inner Laminates';

        if (!laminateSummary[innerKey]) {
          laminateSummary[innerKey] = {
            exteriorSheets: 0,
            innerSheets: 0,
            colorCode: 'Inner'
          };
        }

        if (sheetsUsed > 0) {
          const innerSheets = sheetsUsed * 2;
          laminateSummary[innerKey].innerSheets += innerSheets;
          totalInnerSheets += innerSheets;
        }

        // Inner EB – thickness-based + skip OS + skip <=3mm handled inside
        addToEbSummary(
          innerKey,
          totalEb,
          true,
          finalThickness || originalThickness || 18,
          isOSLaminate
        );

      } else if (hasBSL) {
        if (!laminateSummary[laminateKey]) {
          laminateSummary[laminateKey] = {
            exteriorSheets: 0, innerSheets: 0,
            colorCode: laminateKey, rooms: new Set()
          };
        }

        if (sheetsUsed > 0) {
          laminateSummary[laminateKey].exteriorSheets += sheetsUsed * 2;
          roomsToAdd.forEach(r => laminateSummary[laminateKey].rooms.add(r));
        }

        // Outer EB – thickness-based + skip OS + skip <=3mm handled inside
        addToEbSummary(
          laminateKey,
          totalEb,
          false,
          finalThickness || originalThickness || 18,
          isOSLaminate
        );

      } else {
        if (!laminateSummary[laminateKey]) {
          laminateSummary[laminateKey] = {
            exteriorSheets: 0, innerSheets: 0,
            colorCode: laminateKey, rooms: new Set()
          };
        }

        if (sheetsUsed > 0) {
          laminateSummary[laminateKey].exteriorSheets += sheetsUsed;
          roomsToAdd.forEach(r => laminateSummary[laminateKey].rooms.add(r));

          const innerKey = 'Inner Laminates';
          if (!laminateSummary[innerKey]) {
            laminateSummary[innerKey] = {
              exteriorSheets: 0, innerSheets: 0,
              colorCode: 'Inner'
            };
          }

          laminateSummary[innerKey].innerSheets += sheetsUsed;
          totalInnerSheets += sheetsUsed;
        }

        // Outer EB – thickness-based + skip OS + skip <=3mm handled inside
        addToEbSummary(
          laminateKey,
          totalEb,
          false,
          finalThickness || originalThickness || 18,
          isOSLaminate
        );
      }
    }

    laminateSummary['Final Inner Total'] = { exteriorSheets: 0, innerSheets: totalInnerSheets, colorCode: 'Inner' };

    // --- HARDWARE ---
    const hardwareOutput = [['Description', 'Quantity']];

    const completeHardwareList = [
      { name: 'Hinges Soft Close- 0 Crank', unit: 'sets' }, { name: 'Hinges Soft Close- 16 Crank', unit: 'sets' }, { name: 'Hinges Soft Close- 180 Crank', unit: 'sets' },
      { name: '12 inches / 300mm - Channel', unit: 'sets' }, { name: '14 inches / 350mm - Channel', unit: 'sets' }, { name: '16 inches / 400mm - Channel', unit: 'sets' },
      { name: '18 inches / 450mm - Channel', unit: 'sets' }, { name: '20 inches / 500mm - Channel', unit: 'sets' }, { name: '22 inches / 550 mm - Channel', unit: 'set' },
      { name: '*Fevicol - Probond', unit: 'kgs' }, { name: '*Fevicol - D3', unit: 'kgs' }, { name: '*HeatX', unit: 'kgs' }, { name: 'VB Fittings', unit: 'Pieces' },
      { name: '*Abro Tapes', unit: 'Bundles' }, { name: '*Laminate cutter', unit: 'Piece' }, { name: 'Tandem Baskets', unit: 'sets' },
      { name: 'Bottle Pullout 21x20x8 inches', unit: 'Piece' }, { name: 'Bottle Pullout 20 inches Channel', unit: 'Set' }, { name: 'Sliding Channel 2 Door Fitting', unit: 'Set' },
      { name: 'Removable Shelf Buttons', unit: 'pieces' }, { name: 'Magic Corner', unit: 'sets' }, { name: 'Oval Rod', unit: 'Lengths' }, { name: 'Oval Bracket', unit: 'sets' },
      { name: 'Draw Locks', unit: 'pieces' }, { name: 'Cupboard Locks', unit: 'piece' }, { name: 'L Tower Bolt', unit: 'pieces' }, { name: 'Gola Profile - (L)', unit: 'Lengths' },
      { name: 'Gola Profile - (C)', unit: 'Lengths' }, { name: 'PVC Gitty (38/6)', unit: 'Box' }, { name: 'Hydraulics', unit: 'sets' }, { name: 'PVC Legs', unit: 'pieces' },
      { name: 'SS Legs', unit: 'pieces' }, { name: 'Single Screw L Clamps - EBCO', unit: 'pieces' }, { name: 'PTA Screws 3 inches', unit: 'pieces' },
      { name: 'PTA Screws (4mm x 16mm)', unit: 'Boxes' }, { name: 'PTA Screws (4mm x 20mm)', unit: 'Boxes' }, { name: 'PTA Screws (4mm x 30mm)', unit: 'Boxes' },
      { name: 'PTA Screws (4mm x 45mm)', unit: 'Boxes' }
    ];

    const hardwareMap = {};
    if (hardwareSheet.getLastRow() > 1) {
      const lastHardwareCol = hardwareSheet.getLastColumn();
      const hardwareData = hardwareSheet.getRange(1, 2, hardwareSheet.getLastRow(), lastHardwareCol - 1).getValues();
      const headers = hardwareData[0];
      for (let i = 1; i < hardwareData.length; i++) {
        for (let j = 0; j < hardwareData[i].length; j++) {
          const description = headers[j];
          const quantity = hardwareData[i][j];
          if (description && (quantity || quantity === 0)) {
            const processedQuantity = processHardwareValue(quantity);
            if (processedQuantity > 0) {
              if (!hardwareMap[description]) hardwareMap[description] = 0;
              hardwareMap[description] += processedQuantity;
            }
          }
        }
      }
    }

    completeHardwareList.forEach(item => {
      let quantity = '';
      if (item.name === '*Fevicol - Probond') {
        quantity = Math.round(totalAcrylicSides * 0.8);
      } else if (item.name === '*Fevicol - D3') {
        const grossFevicol = totalSheets * 1.6;
        const totalProbond = totalAcrylicSides * 0.8;
        const netFevicol = grossFevicol - totalProbond;
        quantity = Math.round(netFevicol);
      } else {
        const matchingKey = Object.keys(hardwareMap).find(key =>
          key.toLowerCase().includes(item.name.replace(/\*/g, '').toLowerCase().trim())
        );
        if (matchingKey) {
          quantity = Math.round(hardwareMap[matchingKey]);
        }
      }
      if (quantity !== '' && quantity !== 0) {
        hardwareOutput.push([item.name, fmtQty(quantity)]);
      } else {
        hardwareOutput.push([item.name, '']);
      }
    });

    // --- WRITE TO OUTPUT SHEET ---
    outputSheet.clear();
    let startRow = 1;
    const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    outputSheet.getRange(startRow, 1, 1, 12).merge().setValue(`--- Estimate Generated on ${timestamp} ---`)
      .setHorizontalAlignment('center').setFontWeight('bold').setBackground('#f3f3f3');
    startRow += 2;
    let currentCol = 1;

    // PLYWOOD TABLE
    const plywoodOutput = [['Description', 'Quantity']];

    Object.keys(plywoodSummary).sort().forEach(key => {
      plywoodOutput.push([key, `${fmtQty(plywoodSummary[key])} (8ftx4ft Sheets)`]);
    });

    outputSheet.getRange(startRow, currentCol, plywoodOutput.length, 2).setValues(plywoodOutput)
      .setBorder(true, true, true, true, true, true);
    outputSheet.getRange(startRow, currentCol, 1, 2).setFontWeight('bold');
    currentCol += 3;

    // LAMINATE TABLE
    const laminateOutput = [['Description', 'Brand / Colour / Code', 'Quantity']];
    const sortedLaminateKeys = Object.keys(laminateSummary).sort((a, b) => {
      const isInnerA = a.toLowerCase().includes('inner');
      const isInnerB = b.toLowerCase().includes('inner');
      if (!isInnerA && isInnerB) return -1;
      if (isInnerA && !isInnerB) return 1;
      return a.localeCompare(b);
    });
    let innerRowAdded = false;

    sortedLaminateKeys.forEach(key => {
      const data = laminateSummary[key];
      if (!data) return;
      const isInner = key.toLowerCase().includes('inner') || data.colorCode === 'Inner';
      const quantity = fmtQty(isInner ? data.innerSheets || 0 : data.exteriorSheets || 0);
      if (quantity === 0) return;
      if (isInner && innerRowAdded && key !== 'Final Inner Total') return;

      let description, finalColorCode;
      if (isInner) {
        description = 'Inner Laminates';
        finalColorCode = 'Inner';
        innerRowAdded = true;
      } else {
        if (data.rooms && data.rooms.size > 0) {
          description = Array.from(data.rooms).sort().join(', ');
        } else {
          description = key;
        }
        finalColorCode = data.colorCode && data.colorCode !== 'NA' ? data.colorCode : key;
      }

      const codeColumn = `NA / NA / ${finalColorCode}`;
     laminateOutput.push([description, codeColumn, String(quantity+" No's")]);
    });

    if (laminateOutput.length > 1) {
      outputSheet.getRange(startRow, currentCol, laminateOutput.length, 3)
        .setValues(laminateOutput)
        .setBorder(true, true, true, true, true, true);
      outputSheet.getRange(startRow, currentCol, 1, 3).setFontWeight('bold');
    }
    currentCol += 4;

    // EDGE BANDING TABLE
    const ebTableStartRow = startRow;
    const edgeBandingOutput = [['Description', 'Brand / Colour / Code', 'Width*thickness', 'Quantity']];
    
    Object.keys(edgeBandingByLaminate).forEach(fullKey => {
  const ebData = edgeBandingByLaminate[fullKey];
  if (!ebData || ebData.totalMeters === 0) return;

  const laminateKey = fullKey.split('__')[0];
    // ⭐ FINAL FIX — Identify 2-colour laminate using Material Summary sheet

// 1️⃣ Find original laminate string from Material Summary row
let originalColorKey = "";
for (let r = 1; r < summaryValues.length; r++) {
  let matStr = String(summaryValues[r][summaryMap["Material & Thickness"]] || "");
  let clean = getCleanColorCode(matStr);
  
  if (clean === laminateKey || clean.startsWith(laminateKey)) {
    originalColorKey = clean;
    break;
  }
}

// 2️⃣ Only treat as 2-colour if REAL laminate contains @ or &
if (originalColorKey.includes("@") || originalColorKey.includes("&")) {

  // Extract FIRST colour
  let firstColorFix = originalColorKey.split(/[@&]/)[0].trim();

  // 3️⃣ Find ROOM NAME from Material Summary sheet
  let matchedRooms = "";
  for (let r = 1; r < summaryValues.length; r++) {
    let matStr = String(summaryValues[r][summaryMap["Material & Thickness"]] || "");
    if (matStr.includes(firstColorFix)) {
      matchedRooms = String(summaryValues[r][summaryMap["Room Name(s)"]] || "").trim();
      break;
    }
  }

  // Fallback
  let descFix = matchedRooms !== "" ? matchedRooms : firstColorFix;

  // EB Brand/Colour/Code
  let codeFix = `NA / NA / ${firstColorFix}`;

  // Push Final EB Row
  edgeBandingOutput.push([
    descFix,
    codeFix,
    ebData.ebWidth,
    `${fmtQty(ebData.totalMeters)} Meters`
  ]);

  return; // stop normal flow
}

  if (
  !laminateKey ||
  laminateKey === "NA" ||
  laminateKey === "NA / NA / NA" ||
  laminateKey.trim() === ""
) {
  return;
}
      const laminateData = laminateSummary[laminateKey];

      let description;
      if (laminateData && laminateData.rooms && laminateData.rooms.size > 0) {
        description = Array.from(laminateData.rooms).sort().join(', ');
      } else {
        description = laminateKey;
      }

      let laminateCodeForDesc = 'NA / NA / NA';
      if (laminateData && laminateData.colorCode) {
        const finalColorCodePart =
          (laminateData.colorCode === 'Inner' || laminateData.colorCode === 'NA' || !laminateData.colorCode)
            ? laminateKey
            : laminateData.colorCode;
        laminateCodeForDesc = `NA / NA / ${finalColorCodePart}`;
        description += `\n(${laminateCodeForDesc})`;
      }

      const ebCodeColumn = laminateCodeForDesc;

      // Inner/Outer EB width now always comes from getEbSize() (no constant override)
      const widthThickness = ebData.ebWidth;

     const quantity = fmtQty(ebData.totalMeters);
edgeBandingOutput.push([description, ebCodeColumn, widthThickness, String(quantity+" Meters")]);
    });

    if (edgeBandingOutput.length > 1) {
      outputSheet
        .getRange(ebTableStartRow, currentCol, edgeBandingOutput.length, 4)
        .setValues(edgeBandingOutput)
        .setBorder(true, true, true, true, true, true)
        .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      outputSheet.getRange(ebTableStartRow, currentCol, 1, 4).setFontWeight('bold');
    }
    currentCol += 5;

    // HARDWARE TABLE
    if (hardwareOutput.length > 1) {
      outputSheet.getRange(startRow, currentCol, hardwareOutput.length, 2).setValues(hardwareOutput)
        .setBorder(true, true, true, true, true, true);
      outputSheet.getRange(startRow, currentCol, 1, 2).setFontWeight('bold');
    }

    for (let i = 1; i <= outputSheet.getLastColumn(); i++) {
      outputSheet.autoResizeColumn(i);
    }

    // --- CREATE DOCUMENT ---
    const TEMPLATE_ID = '10lY9rqh0xBG_wsZ_YxJBlimttWu7xdPb8-8XSfwNAlk';
    const FOLDER_ID = '1GO01YKbf0HmuvhWApgAFxgLW_FEXlpXh';
    const template = DriveApp.getFileById(TEMPLATE_ID);
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const formattedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy");
    const newFileName = `Material Estimate - ${formattedDate}`;
    const newDocFile = template.makeCopy(newFileName, folder);
    const doc = DocumentApp.openById(newDocFile.getId());
    const body = doc.getBody();

    body.replaceText('{{date}}', formattedDate);
    body.replaceText('{{total_sq_ft}}', `${Math.round(totalSqFt)} Sq ft`);

    const dataRange = outputSheet.getDataRange();
    const data = dataRange.getValues();

    const findTableData = (header, startCol, numCols = 2) => {
      const tableData = [];
      for (let r = 0; r < data.length; r++) {
        if (data[r][startCol] === header) {
          tableData.push(data[r].slice(startCol, startCol + numCols));
          for (let i = r + 1; i < data.length; i++) {
            let isEmpty = true;
            for (let c = startCol; c < startCol + numCols; c++) {
              if (data[i][c] !== '' && data[i][c] !== null && data[i][c] !== undefined) {
                isEmpty = false;
                break;
              }
            }
            if (isEmpty && i > r + 1) {
              let nextHeaderFound = false;
              for (let k = i; k < Math.min(i + 3, data.length); k++) {
                if (data[k][0] === 'Description' || data[k][3] === 'Description' || data[k][7] === 'Description' || data[k][12] === 'Description') {
                  nextHeaderFound = true;
                  break;
                }
              }
              if (nextHeaderFound) break;
            }
            if (!isEmpty) {
              tableData.push(data[i].slice(startCol, startCol + numCols));
            } else if (i <= r + 1) {
              tableData.push(data[i].slice(startCol, startCol + numCols));
            } else {
              let nextHeaderFound = false;
              for (let k = i; k < Math.min(i + 3, data.length); k++) {
                if (data[k][0] === 'Description' || data[k][3] === 'Description' || data[k][7] === 'Description' || data[k][12] === 'Description') {
                  nextHeaderFound = true;
                  break;
                }
              }
              if (nextHeaderFound) break;
            }
          }
          break;
        }
      }
      while (tableData.length > 1 && tableData[tableData.length - 1].every(cell => cell === '')) {
        tableData.pop();
      }
      return tableData;
    };

    const replacePlaceholderWithTable = (placeholder, tableData, numColumns) => {
      const element = body.findText(placeholder);
      if (element && tableData.length > 0) {
        const paragraph = element.getElement().getParent();
        const index = body.getChildIndex(paragraph);
        paragraph.removeFromParent();
        const table = body.insertTable(index, tableData);
        table.setBorderColor('#000000');
        for (let i = 0; i < table.getNumRows(); i++) {
          for (let j = 0; j < table.getRow(i).getNumCells(); j++) {
            table.getRow(i).getCell(j).setPaddingLeft(5).setPaddingRight(5);
          }
        }
        if (table.getNumRows() > 0) {
          const headerRow = table.getRow(0);
          for (let i = 0; i < headerRow.getNumCells(); i++) {
            headerRow.getCell(i).editAsText().setBold(true);
          }
        }
      } else if (element) {
        element.getElement().removeFromParent();
      }
    };

    replacePlaceholderWithTable('{{plywood_table}}', findTableData('Description', 0, 2), 2);
    replacePlaceholderWithTable('{{laminate_table}}', findTableData('Description', 3, 3), 3);
    replacePlaceholderWithTable('{{edge_banding_table}}', findTableData('Description', 7, 4), 4);
    replacePlaceholderWithTable('{{hardware_table}}', findTableData('Description', 12, 2), 2);

    doc.saveAndClose();

    // DUAL STORAGE - Copy to Project Folder
    let projectFolderUrl = '';
    try {
      const matEstFolder = getProjectSubfolder('MATERIAL_ESTIMATE');
      newDocFile.makeCopy(newFileName, matEstFolder);
      projectFolderUrl = getProjectFolderUrl();
    } catch(e) {
      Logger.log('Error copying Material Estimate to project folder: ' + e.message);
    }

    const docUrl = newDocFile.getUrl();
    const htmlOutput = HtmlService.createHtmlOutput(
      `<body style="font-family: Arial, sans-serif; text-align: center; padding: 15px;">
         <p style="font-size: 18px; font-weight: bold; color: #2e7d32;">✅ Success!</p>
         <p>A new estimate document has been created.</p>
         
         ${projectFolderUrl ? `
         <div style="background: #e8f5e9; padding: 12px; border-radius: 6px; margin: 15px 0;">
           <strong>📁 Project Folder:</strong><br>
           <a href="${projectFolderUrl}" target="_blank" style="color: #1976d2;">Open Project Folder</a>
         </div>
         ` : ''}
         
         <a href="${docUrl}" target="_blank" style="font-size: 16px; text-decoration: none; background-color: #4CAF50; color: white; padding: 12px 24px; border-radius: 5px; display: inline-block; margin-top: 10px;">Show Estimate</a>
         
         <br><br>
         <button onclick="google.script.host.close()" style="background: #757575; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
       </body>`
    ).setWidth(350).setHeight(320);
    ui.showModalDialog(htmlOutput, 'Document Generated Successfully');

  } catch (e) {
    Logger.log(e);
    const ui = SpreadsheetApp.getUi();
    ui.alert('An Error Occurred', 'The script could not be completed. Error: ' + e.message, ui.ButtonSet.OK);
  }
}

