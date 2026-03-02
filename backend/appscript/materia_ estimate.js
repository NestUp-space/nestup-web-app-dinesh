/**
 * @OnlyCurrentDoc
 * Material Estimate Generator - Complete Solution
 * Creates material estimates and professional client-facing documents
 * Version: 5.2 (Updated hardware processing - reads from Hardware sheet)
 * 
 * Inner Laminate Logic:
 * - inner 5 sheets → 10 inner laminates (×2)
 * - color 5 sheets → 5 color + 5 inner laminates
 * - color & 123SF inner 10 sheets → 10 color + 10 123SF inner laminates
 * - 123SF inner 10 sheets → 20 123SF inner laminates (×2)
 * 
 * Hardware Logic:
 * - Reads directly from Hardware sheet
 * - Only Fevicol - Probond and Fevicol - D3 are calculated from material data
 * - All other items taken as-is from Hardware sheet
 */

// ============================
// CONFIGURATION
// ============================
const ESTIMATE_CONFIG = {
  TEMPLATE_ID: '10lY9rqh0xBG_wsZ_YxJBlimttWu7xdPb8-8XSfwNAlk',
  FOLDER_ID: '1GO01YKbf0HmuvhWApgAFxgLW_FEXlpXh',
  SHEETS: {
    MATERIAL_SUMMARY: 'Material Summary',
    HARDWARE: 'Hardware',
    SFT_RESULTS: 'SFT Results',
    OUTPUT: 'Material Estimate'
  }
};

// ============================
// HELPER FUNCTIONS
// ============================

/**
 * Get edge banding size based on thickness
 */
function getEbSize(thickness, isInner) {
  isInner = isInner || false;
  var t = Number(thickness) || 18;

  if (isInner) {
    if (t >= 16 && t <= 17) return "22mm*0.8mm";
    if (t >= 18 && t <= 20) return "25mm*0.8mm";
    if (t >= 23 && t <= 27) return "30mm*0.8mm";
    return "22mm*0.8mm";
  }

  if (t >= 16 && t <= 17) return "22mm*2.0mm";
  if (t >= 18 && t <= 20) return "25mm*2.0mm";
  if (t >= 23 && t <= 27) return "30mm*2.0mm";
  if (t > 27) return "45mm*2.0mm";
  return "22mm*2.0mm";
}

/**
 * Format quantity - remove decimal for whole numbers
 */
function fmtQty(n) {
  return Number.isInteger(n) ? n : Math.round(n);
}

/**
 * Extract clean color code from material string
 * This removes keywords like BWP, MDF, inner, thickness, etc.
 */
function getCleanColorCode(rawString) {
  if (!rawString) return 'NA';

  var str = rawString.trim();

  var removeWords = [
    'bwp', 'bb', 'hdhmr', 'mr', 'bwr', 'pvc', 'wpvc', 'hdhm',
    'wpc', 'mdf', 'hdf', 'ply', 'bsl', 'inner', 'veneer', 'wood', 'timber'
  ];

  removeWords.forEach(function(word) {
    var regex = new RegExp('\\b' + word + '\\b', 'gi');
    str = str.replace(regex, '');
  });

  str = str.replace(/\(.*?\)/g, '');
  str = str.replace(/\(\s*\d+\s*mm\s*\)/gi, '');
  str = str.replace(/\b\d+mm\b/gi, '');
  str = str.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

  return str || 'NA';
}

/**
 * Extract inner color code from material string
 * For "124 SF Inner (18mm) BWP" → returns "124 SF"
 * For "color & 123SF Inner" → returns "123SF" (inner part only)
 */
function extractInnerColorCode(materialString, hasSymbol) {
  if (!materialString) return 'NA';
  
  var str = materialString;
  
  // If has @ or &, get the part after the symbol (the inner part)
  if (hasSymbol) {
    var parts = str.split(/[@&]/);
    if (parts.length > 1) {
      str = parts[1]; // Take the part after @ or &
    }
  }
  
  // Now clean this string to get the color code
  var removeWords = [
    'bwp', 'bb', 'hdhmr', 'mr', 'bwr', 'pvc', 'wpvc', 'hdhm',
    'wpc', 'mdf', 'hdf', 'ply', 'bsl', 'inner', 'veneer', 'wood', 'timber'
  ];

  removeWords.forEach(function(word) {
    var regex = new RegExp('\\b' + word + '\\b', 'gi');
    str = str.replace(regex, '');
  });

  str = str.replace(/\(.*?\)/g, '');
  str = str.replace(/\(\s*\d+\s*mm\s*\)/gi, '');
  str = str.replace(/\b\d+mm\b/gi, '');
  str = str.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

  return str || 'NA';
}

/**
 * Detect plywood type from material string
 */
function detectPlywoodType(materialLower) {
  if (materialLower.includes('bwp')) return "BWP";
  if (materialLower.includes('bb')) return "Blockboard";
  if (materialLower.includes('hdhmr')) return "HDHMR";
  if (materialLower.includes('mdf')) return "MDF";
  if (materialLower.includes('hdf')) return "HDF";
  if (materialLower.includes('mr')) return "MR";
  if (materialLower.includes('wpc')) return "WPC";
  if (materialLower.includes('bwr')) return "BWR";
  if (materialLower.includes('pvc')) return "PVC";
  return "Plywood";
}

/**
 * Check if material is OS laminate
 */
function isOSLaminateCheck(material) {
  return material.includes('(os') || /\bos\b/.test(material);
}

// ============================
// MAIN FUNCTION
// ============================
function generateMaterialEstimate() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  try {
    ui.showModalDialog(
      HtmlService.createHtmlOutput('<p>Processing... Please wait.</p>').setWidth(300).setHeight(100),
      'Generating Estimate'
    );

    var sourceSheet = ss.getSheetByName(ESTIMATE_CONFIG.SHEETS.MATERIAL_SUMMARY);
    var hardwareSheet = ss.getSheetByName(ESTIMATE_CONFIG.SHEETS.HARDWARE);
    var sftSheet = ss.getSheetByName(ESTIMATE_CONFIG.SHEETS.SFT_RESULTS);

    if (!sourceSheet || !hardwareSheet) {
      throw new Error("Required sheets (Material Summary or Hardware) missing.");
    }

    var outputSheet = ss.getSheetByName(ESTIMATE_CONFIG.SHEETS.OUTPUT);
    if (!outputSheet) {
      outputSheet = ss.insertSheet(ESTIMATE_CONFIG.SHEETS.OUTPUT);
    }

    // Process SFT Data
    var totalSqFt = processSftData(sftSheet);

    // Process Material Summary
    var materialResult = processMaterialSummary(sourceSheet);

    // Process Hardware - UPDATED to read directly from Hardware sheet
    var hardwareOutput = processHardware(hardwareSheet, materialResult.totalSheets, materialResult.totalAcrylicSides);

    // Write Output
    writeOutputSheet(
      outputSheet,
      materialResult.plywoodSummary,
      materialResult.laminateSummary,
      materialResult.edgeBandingByLaminate,
      hardwareOutput,
      materialResult.summaryValues,
      materialResult.summaryMap
    );

    // Create Document
    var docUrl = createDocument(outputSheet, totalSqFt);

    // Show Success
    showSuccessDialog(ui, docUrl);

  } catch (e) {
    Logger.log(e);
    ui.alert('An Error Occurred', 'Error: ' + e.message, ui.ButtonSet.OK);
  }
}

// ============================
// PROCESS SFT DATA
// ============================
function processSftData(sftSheet) {
  var totalSqFt = 0;

  if (!sftSheet) return totalSqFt;

  var sftData = sftSheet.getDataRange().getValues();

  for (var i = 0; i < sftData.length; i++) {
    for (var j = 0; j < sftData[i].length; j++) {
      var cellValue = sftData[i][j];
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
    for (var i = sftData.length - 1; i >= 0; i--) {
      for (var j = sftData[i].length - 1; j >= 0; j--) {
        var cellValue = sftData[i][j];
        if (typeof cellValue === 'number' && cellValue > 0) {
          totalSqFt = parseFloat(cellValue);
          break;
        }
      }
      if (totalSqFt > 0) break;
    }
  }

  return totalSqFt;
}

// ============================
// PROCESS MATERIAL SUMMARY
// ============================
function processMaterialSummary(sourceSheet) {
  var plywoodSummary = {};
  var laminateSummary = {};
  var edgeBandingByLaminate = {};
  var laminateKeyMap = {};

  var totalSheets = 0;
  var totalAcrylicSides = 0;
  var totalInnerSheets = 0;

  var summaryDataRange = sourceSheet.getDataRange();
  var summaryValues = summaryDataRange.getValues();
  var summaryHeaders = summaryValues[0];

  var summaryMap = {};
  summaryHeaders.forEach(function(h, i) {
    if (h) summaryMap[h.trim()] = i;
  });

  var reqCols = ["Material & Thickness", "Sheets Used", "Total Edge (m)", "Room Name(s)"];
  for (var c = 0; c < reqCols.length; c++) {
    if (summaryMap[reqCols[c]] === undefined) {
      throw new Error("Missing required column '" + reqCols[c] + "' in 'Material Summary' sheet.");
    }
  }

  // Edge banding helper
  function addToEbSummary(key, ebAmount, isInner, thickness, isOS) {
    thickness = thickness || 18;
    isOS = isOS || false;
    
    var keyLower = key.toLowerCase();

    if (keyLower.includes("(os") || keyLower.includes(" os") || keyLower.includes("os ")) return;
    if (isOS) return;
    if (ebAmount === 0 || !ebAmount) return;
    if (thickness <= 3) return;

    var ebWidth = getEbSize(thickness, isInner);
    var ebKey = isInner
      ? key + "__" + ebWidth + "__inner"
      : key + "__" + thickness + "mm__" + ebWidth + "__outer";

    if (!edgeBandingByLaminate[ebKey]) {
      edgeBandingByLaminate[ebKey] = {
        totalMeters: 0,
        isInner: isInner,
        ebWidth: ebWidth
      };
    }
    edgeBandingByLaminate[ebKey].totalMeters += ebAmount;
  }

  // Process each row
  for (var i = 1; i < summaryValues.length; i++) {
    var row = summaryValues[i];
    var materialString = row[summaryMap["Material & Thickness"]];
    var sheetsUsed = Number(row[summaryMap["Sheets Used"]]);
    var totalEb = parseFloat(row[summaryMap["Total Edge (m)"]]) || 0;
    var roomNamesString = row[summaryMap["Room Name(s)"]] || "";

    if ((!materialString || isNaN(sheetsUsed) || sheetsUsed === 0) && totalEb === 0) continue;

    var originalThickness = null;
    var finalThickness = null;
    var thicknessMatch = materialString ? materialString.match(/\((\d+)mm?\)/i) : null;
    if (thicknessMatch && thicknessMatch[1]) {
      originalThickness = parseInt(thicknessMatch[1], 10);
      finalThickness = originalThickness - 2;
    }

    var isThinOnly = originalThickness !== null && originalThickness <= 3;

    var material = materialString ? materialString.toLowerCase() : '';
    var colorCode = getCleanColorCode(materialString);
    var isOSLaminate = isOSLaminateCheck(material);
    var hasBSL = material.includes('bsl');
    var hasInner = material.includes('inner');

    var roomsToAdd = roomNamesString.split(',')
      .map(function(r) { return r.trim(); })
      .filter(function(r) { return r && r.toLowerCase() !== 'n/a'; });

    // ============================
    // PLYWOOD PROCESSING
    // ============================
    if (sheetsUsed > 0 && !isThinOnly) {
      totalSheets += sheetsUsed;

      if (originalThickness !== null) {
        var plywoodType = detectPlywoodType(material);
        var plywoodKey = plywoodType + " - " + finalThickness + "mm";
        plywoodSummary[plywoodKey] = (plywoodSummary[plywoodKey] || 0) + sheetsUsed;
      }

      if (material.includes('acr')) {
        totalAcrylicSides += sheetsUsed;
      }
    }

    // ============================
    // LAMINATE PROCESSING
    // ============================
    var laminateKey = colorCode;
    if (colorCode !== 'NA') {
      var lowerKey = colorCode.toLowerCase();
      if (!laminateKeyMap[lowerKey]) laminateKeyMap[lowerKey] = colorCode;
      laminateKey = laminateKeyMap[lowerKey];
    }

    // ------------------------------------------
    // CASE 1: Mixed outer + specific inner
    // Example: "122 @ 123SF Inner" or "color & 124 SF Inner"
    // ------------------------------------------
    if (hasInner && (materialString.includes('@') || materialString.includes('&'))) {
      var outerMatch = materialString.split(/[@&]/)[0].trim();
      var outerColor = getCleanColorCode(outerMatch);

      // Extract inner color using the new function (gets full color code like "124 SF")
      var innerColorCode = extractInnerColorCode(materialString, true);
      var specificInnerColor = innerColorCode !== 'NA' 
        ? innerColorCode + ' Inner' 
        : 'Inner';

      // Add OUTER colour laminate
      if (!laminateSummary[outerColor]) {
        laminateSummary[outerColor] = {
          exteriorSheets: 0,
          innerSheets: 0,
          colorCode: outerColor,
          rooms: new Set()
        };
      }
      laminateSummary[outerColor].exteriorSheets += sheetsUsed;
      roomsToAdd.forEach(function(r) { laminateSummary[outerColor].rooms.add(r); });

      // Add SPECIFIC INNER colour laminate (same as sheets, NOT ×2)
      if (!laminateSummary[specificInnerColor]) {
        laminateSummary[specificInnerColor] = {
          exteriorSheets: 0,
          innerSheets: 0,
          colorCode: specificInnerColor,
          rooms: new Set()
        };
      }
      laminateSummary[specificInnerColor].innerSheets += sheetsUsed;
      totalInnerSheets += sheetsUsed;

      addToEbSummary(outerColor, totalEb, false, originalThickness || 18, isOSLaminate);
      continue;
    }

    // ------------------------------------------
    // CASE 2: Two colours with & (no inner keyword)
    // Example: "123 & 999"
    // ------------------------------------------
    if (materialString.includes("&") && !hasInner) {
      var parts = colorCode.split(/\s*&\s*/);

      if (parts.length === 2) {
        var firstColor = parts[0].trim();
        var secondColor = parts[1].trim();

        if (!laminateSummary[firstColor]) {
          laminateSummary[firstColor] = {
            exteriorSheets: 0,
            innerSheets: 0,
            colorCode: firstColor,
            rooms: new Set()
          };
        }
        laminateSummary[firstColor].exteriorSheets += sheetsUsed;
        roomsToAdd.forEach(function(r) { laminateSummary[firstColor].rooms.add(r); });

        if (!laminateSummary[secondColor]) {
          laminateSummary[secondColor] = {
            exteriorSheets: 0,
            innerSheets: 0,
            colorCode: secondColor,
            rooms: new Set()
          };
        }
        laminateSummary[secondColor].exteriorSheets += sheetsUsed;
        roomsToAdd.forEach(function(r) { laminateSummary[secondColor].rooms.add(r); });

        addToEbSummary(firstColor, totalEb, false, originalThickness || 18, isOSLaminate);
        continue;
      }
    }

    // ------------------------------------------
    // CASE 3: Two colours with @ (no inner keyword)
    // Example: "123 @ 456"
    // ------------------------------------------
    if (materialString.includes("@") && !hasInner) {
      var atParts = colorCode.split(/\s*@\s*/);
      var firstAtColor = atParts[0].trim();

      if (!laminateSummary["Inner"]) {
        laminateSummary["Inner"] = {
          exteriorSheets: 0,
          innerSheets: 0,
          colorCode: "Inner",
          rooms: new Set()
        };
      }
      laminateSummary["Inner"].innerSheets += sheetsUsed;
      totalInnerSheets += sheetsUsed;

      addToEbSummary(firstAtColor, totalEb, false, originalThickness || 18, isOSLaminate);
      continue;
    }

    // ------------------------------------------
    // CASE 4: Specific inner only (no @ or &)
    // Example: "124 SF Inner" → "124 SF Inner"
    // ------------------------------------------
    if (hasInner && !materialString.includes('@') && !materialString.includes('&')) {
      // Use colorCode which already has full color extracted (e.g., "124 SF")
      // colorCode is cleaned and doesn't include "inner" keyword
      var specificInnerOnly = colorCode !== 'NA' 
        ? colorCode + ' Inner' 
        : 'Inner';

      if (!laminateSummary[specificInnerOnly]) {
        laminateSummary[specificInnerOnly] = {
          exteriorSheets: 0,
          innerSheets: 0,
          colorCode: specificInnerOnly,
          rooms: new Set()
        };
      }

      // ×2 for specific inner colour (both sides)
      var innerSheetsCount = sheetsUsed * 2;
      laminateSummary[specificInnerOnly].innerSheets += innerSheetsCount;
      totalInnerSheets += innerSheetsCount;

      addToEbSummary(
        specificInnerOnly,
        totalEb,
        true,
        finalThickness || originalThickness || 18,
        isOSLaminate
      );
      continue;
    }

    // ------------------------------------------
    // CASE 5: BSL (Both Side Laminate)
    // ------------------------------------------
    if (hasBSL) {
      if (!laminateSummary[laminateKey]) {
        laminateSummary[laminateKey] = {
          exteriorSheets: 0,
          innerSheets: 0,
          colorCode: laminateKey,
          rooms: new Set()
        };
      }

      if (sheetsUsed > 0) {
        laminateSummary[laminateKey].exteriorSheets += sheetsUsed * 2;
        roomsToAdd.forEach(function(r) { laminateSummary[laminateKey].rooms.add(r); });
      }

      addToEbSummary(
        laminateKey,
        totalEb,
        false,
        finalThickness || originalThickness || 18,
        isOSLaminate
      );
      continue;
    }

    // ------------------------------------------
    // CASE 6: Regular colour (no inner keyword)
    // Add to colour count + add to generic "Inner"
    // ------------------------------------------
    if (!hasInner) {
      if (!laminateSummary[laminateKey]) {
        laminateSummary[laminateKey] = {
          exteriorSheets: 0,
          innerSheets: 0,
          colorCode: laminateKey,
          rooms: new Set()
        };
      }

      if (sheetsUsed > 0) {
        laminateSummary[laminateKey].exteriorSheets += sheetsUsed;
        roomsToAdd.forEach(function(r) { laminateSummary[laminateKey].rooms.add(r); });

        if (!laminateSummary["Inner"]) {
          laminateSummary["Inner"] = {
            exteriorSheets: 0,
            innerSheets: 0,
            colorCode: "Inner",
            rooms: new Set()
          };
        }
        laminateSummary["Inner"].innerSheets += sheetsUsed;
        totalInnerSheets += sheetsUsed;
      }

      addToEbSummary(
        laminateKey,
        totalEb,
        false,
        finalThickness || originalThickness || 18,
        isOSLaminate
      );
      continue;
    }
  }

  return {
    plywoodSummary: plywoodSummary,
    laminateSummary: laminateSummary,
    edgeBandingByLaminate: edgeBandingByLaminate,
    totalSheets: totalSheets,
    totalAcrylicSides: totalAcrylicSides,
    totalInnerSheets: totalInnerSheets,
    summaryValues: summaryValues,
    summaryMap: summaryMap
  };
}

// ============================
// PROCESS HARDWARE (UPDATED)
// ============================
/**
 * Process hardware - reads directly from Hardware sheet
 * Only Fevicol - Probond and Fevicol - D3 are calculated
 * All other items taken as-is from Hardware sheet
 */
function processHardware(hardwareSheet, totalSheets, totalAcrylicSides) {
  var hardwareOutput = [['Description', 'Quantity']];

  // Items that should be calculated (not read from Hardware sheet)
  var calculatedItems = {
    '*Fevicol - Probond': true,
    '*Fevicol - D3': true
  };

  // Read all data from Hardware sheet
  if (hardwareSheet.getLastRow() < 2) {
    // No data in hardware sheet, return empty
    return hardwareOutput;
  }

  var hardwareData = hardwareSheet.getRange(1, 1, hardwareSheet.getLastRow(), 2).getValues();
  
  // Skip header row (row 0) and process each item
  for (var i = 1; i < hardwareData.length; i++) {
    var description = hardwareData[i][0];
    var quantity = hardwareData[i][1];
    
    if (!description || description === '') continue;
    
    var descStr = description.toString().trim();
    var qtyStr = quantity ? quantity.toString().trim() : '';
    
    // Check if this is a calculated item
    if (calculatedItems[descStr]) {
      // Calculate the value instead of using sheet value
      var calculatedQty = '';
      
      if (descStr === '*Fevicol - Probond') {
        calculatedQty = Math.round(totalAcrylicSides * 0.8);
        if (calculatedQty > 0) {
          hardwareOutput.push([descStr, calculatedQty + ' kgs\nProvided by NestUP & Bill accordingly']);
        } else {
          hardwareOutput.push([descStr, 'kgs\nProvided by NestUP & Bill accordingly']);
        }
      } else if (descStr === '*Fevicol - D3') {
        var grossFevicol = totalSheets * 1.6;
        var totalProbond = totalAcrylicSides * 0.8;
        var netFevicol = grossFevicol - totalProbond;
        calculatedQty = Math.round(netFevicol);
        if (calculatedQty > 0) {
          hardwareOutput.push([descStr, calculatedQty + ' kgs\nProvided by NestUP & Bill accordingly']);
        } else {
          hardwareOutput.push([descStr, 'kgs\nProvided by NestUP & Bill accordingly']);
        }
      }
    } else {
      // Use value directly from Hardware sheet
      hardwareOutput.push([descStr, qtyStr]);
    }
  }

  return hardwareOutput;
}

// ============================
// WRITE OUTPUT SHEET
// ============================
function writeOutputSheet(outputSheet, plywoodSummary, laminateSummary, edgeBandingByLaminate, hardwareOutput, summaryValues, summaryMap) {
  outputSheet.clear();

  var startRow = 1;
  var timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  outputSheet.getRange(startRow, 1, 1, 12).merge()
    .setValue('--- Estimate Generated on ' + timestamp + ' ---')
    .setHorizontalAlignment('center')
    .setFontWeight('bold')
    .setBackground('#f3f3f3');
  startRow += 2;

  var currentCol = 1;

  // ============================
  // PLYWOOD TABLE
  // ============================
  var plywoodOutput = [['Description', 'Quantity']];
  Object.keys(plywoodSummary).sort().forEach(function(key) {
    plywoodOutput.push([key, fmtQty(plywoodSummary[key]) + ' (8ftx4ft Sheets)']);
  });

  if (plywoodOutput.length > 1) {
    outputSheet.getRange(startRow, currentCol, plywoodOutput.length, 2)
      .setValues(plywoodOutput)
      .setBorder(true, true, true, true, true, true);
    outputSheet.getRange(startRow, currentCol, 1, 2).setFontWeight('bold');
  }
  currentCol += 3;

  // ============================
  // LAMINATE TABLE
  // ============================
  var laminateOutput = [['Description', 'Brand / Colour / Code', 'Quantity']];

  var sortedLaminateKeys = Object.keys(laminateSummary).sort(function(a, b) {
    var isInnerA = a.toLowerCase().includes('inner');
    var isInnerB = b.toLowerCase().includes('inner');
    if (!isInnerA && isInnerB) return -1;
    if (isInnerA && !isInnerB) return 1;
    return a.localeCompare(b);
  });

  sortedLaminateKeys.forEach(function(key) {
    var data = laminateSummary[key];
    if (!data) return;

    var isInner = key.toLowerCase().includes('inner') || data.colorCode === 'Inner';
    var quantity = fmtQty(isInner ? data.innerSheets || 0 : data.exteriorSheets || 0);

    if (quantity === 0) return;

    var description, finalColorCode;

    if (isInner) {
      description = key;
      finalColorCode = data.colorCode || key;
    } else {
      if (data.rooms && data.rooms.size > 0) {
        description = Array.from(data.rooms).sort().join(', ');
      } else {
        description = key;
      }
      finalColorCode = data.colorCode && data.colorCode !== 'NA' ? data.colorCode : key;
    }

    var codeColumn = 'NA / NA / ' + finalColorCode;
    laminateOutput.push([description, codeColumn, quantity + " No's"]);
  });

  if (laminateOutput.length > 1) {
    outputSheet.getRange(startRow, currentCol, laminateOutput.length, 3)
      .setValues(laminateOutput)
      .setBorder(true, true, true, true, true, true);
    outputSheet.getRange(startRow, currentCol, 1, 3).setFontWeight('bold');
  }
  currentCol += 4;

  // ============================
  // EDGE BANDING TABLE
  // ============================
  var ebTableStartRow = startRow;
  var edgeBandingOutput = [['Description', 'Brand / Colour / Code', 'Width*thickness', 'Quantity']];

  Object.keys(edgeBandingByLaminate).forEach(function(fullKey) {
    var ebData = edgeBandingByLaminate[fullKey];
    if (!ebData || ebData.totalMeters === 0) return;

    var laminateKey = fullKey.split('__')[0];

    if (!laminateKey || laminateKey === "NA" || laminateKey.trim() === "") return;

    var originalColorKey = "";
    for (var r = 1; r < summaryValues.length; r++) {
      var matStr = String(summaryValues[r][summaryMap["Material & Thickness"]] || "");
      var clean = getCleanColorCode(matStr);

      if (clean === laminateKey || clean.startsWith(laminateKey)) {
        originalColorKey = clean;
        break;
      }
    }

    if (originalColorKey.includes("@") || originalColorKey.includes("&")) {
      var firstColorFix = originalColorKey.split(/[@&]/)[0].trim();

      var matchedRooms = "";
      for (var r = 1; r < summaryValues.length; r++) {
        var matStr = String(summaryValues[r][summaryMap["Material & Thickness"]] || "");
        if (matStr.includes(firstColorFix)) {
          matchedRooms = String(summaryValues[r][summaryMap["Room Name(s)"]] || "").trim();
          break;
        }
      }

      var descFix = matchedRooms !== "" ? matchedRooms : firstColorFix;
      var codeFix = 'NA / NA / ' + firstColorFix;

      edgeBandingOutput.push([
        descFix,
        codeFix,
        ebData.ebWidth,
        fmtQty(ebData.totalMeters) + ' Meters'
      ]);

      return;
    }

    var laminateData = laminateSummary[laminateKey];

    var description;
    if (laminateData && laminateData.rooms && laminateData.rooms.size > 0) {
      description = Array.from(laminateData.rooms).sort().join(', ');
    } else {
      description = laminateKey;
    }

    var laminateCodeForDesc = 'NA / NA / NA';
    if (laminateData && laminateData.colorCode) {
      var finalColorCodePart = (laminateData.colorCode === 'Inner' || laminateData.colorCode === 'NA' || !laminateData.colorCode)
        ? laminateKey
        : laminateData.colorCode;
      laminateCodeForDesc = 'NA / NA / ' + finalColorCodePart;
      description += '\n(' + laminateCodeForDesc + ')';
    }

    var quantity = fmtQty(ebData.totalMeters);
    edgeBandingOutput.push([description, laminateCodeForDesc, ebData.ebWidth, quantity + ' Meters']);
  });

  if (edgeBandingOutput.length > 1) {
    outputSheet.getRange(ebTableStartRow, currentCol, edgeBandingOutput.length, 4)
      .setValues(edgeBandingOutput)
      .setBorder(true, true, true, true, true, true)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    outputSheet.getRange(ebTableStartRow, currentCol, 1, 4).setFontWeight('bold');
  }
  currentCol += 5;

  // ============================
  // HARDWARE TABLE
  // ============================
  if (hardwareOutput.length > 1) {
    outputSheet.getRange(startRow, currentCol, hardwareOutput.length, 2)
      .setValues(hardwareOutput)
      .setBorder(true, true, true, true, true, true)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    outputSheet.getRange(startRow, currentCol, 1, 2).setFontWeight('bold');
  }

  for (var i = 1; i <= outputSheet.getLastColumn(); i++) {
    outputSheet.autoResizeColumn(i);
  }
}

// ============================
// CREATE DOCUMENT
// ============================
function createDocument(outputSheet, totalSqFt) {
  var template = DriveApp.getFileById(ESTIMATE_CONFIG.TEMPLATE_ID);
  var folder = DriveApp.getFolderById(ESTIMATE_CONFIG.FOLDER_ID);
  var formattedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy");
  var newFileName = 'Material Estimate - ' + formattedDate;
  var newDocFile = template.makeCopy(newFileName, folder);
  var doc = DocumentApp.openById(newDocFile.getId());
  var body = doc.getBody();

  body.replaceText('{{date}}', formattedDate);
  body.replaceText('{{total_sq_ft}}', Math.round(totalSqFt) + ' Sq ft');

  var dataRange = outputSheet.getDataRange();
  var data = dataRange.getValues();

  function findTableData(header, startCol, numCols) {
    numCols = numCols || 2;
    var tableData = [];
    for (var r = 0; r < data.length; r++) {
      if (data[r][startCol] === header) {
        tableData.push(data[r].slice(startCol, startCol + numCols));
        for (var i = r + 1; i < data.length; i++) {
          var isEmpty = true;
          for (var c = startCol; c < startCol + numCols; c++) {
            if (data[i][c] !== '' && data[i][c] !== null && data[i][c] !== undefined) {
              isEmpty = false;
              break;
            }
          }
          if (isEmpty && i > r + 1) {
            var nextHeaderFound = false;
            for (var k = i; k < Math.min(i + 3, data.length); k++) {
              if (data[k][0] === 'Description' || data[k][3] === 'Description' ||
                  data[k][7] === 'Description' || data[k][12] === 'Description') {
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
            var nextHeaderFound = false;
            for (var k = i; k < Math.min(i + 3, data.length); k++) {
              if (data[k][0] === 'Description' || data[k][3] === 'Description' ||
                  data[k][7] === 'Description' || data[k][12] === 'Description') {
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
    while (tableData.length > 1 && tableData[tableData.length - 1].every(function(cell) { return cell === ''; })) {
      tableData.pop();
    }
    return tableData;
  }

  function replacePlaceholderWithTable(placeholder, tableData, numColumns) {
    var element = body.findText(placeholder);
    if (element && tableData.length > 0) {
      var paragraph = element.getElement().getParent();
      var index = body.getChildIndex(paragraph);
      paragraph.removeFromParent();
      var table = body.insertTable(index, tableData);
      table.setBorderColor('#000000');

      for (var i = 0; i < table.getNumRows(); i++) {
        for (var j = 0; j < table.getRow(i).getNumCells(); j++) {
          table.getRow(i).getCell(j).setPaddingLeft(5).setPaddingRight(5);
        }
      }

      if (table.getNumRows() > 0) {
        var headerRow = table.getRow(0);
        for (var i = 0; i < headerRow.getNumCells(); i++) {
          headerRow.getCell(i).editAsText().setBold(true);
        }
      }
    } else if (element) {
      element.getElement().removeFromParent();
    }
  }

  replacePlaceholderWithTable('{{plywood_table}}', findTableData('Description', 0, 2), 2);
  replacePlaceholderWithTable('{{laminate_table}}', findTableData('Description', 3, 3), 3);
  replacePlaceholderWithTable('{{edge_banding_table}}', findTableData('Description', 7, 4), 4);
  replacePlaceholderWithTable('{{hardware_table}}', findTableData('Description', 12, 2), 2);

  doc.saveAndClose();

  return newDocFile.getUrl();
}

// ============================
// SHOW SUCCESS DIALOG
// ============================
function showSuccessDialog(ui, docUrl) {
  var htmlOutput = HtmlService.createHtmlOutput(
    '<body style="font-family: Arial, sans-serif; text-align: center;">' +
    '<p style="font-size: 18px; font-weight: bold;">Success!</p>' +
    '<p>A new estimate document has been created.</p>' +
    '<p>Click the button below to open it directly.</p>' +
    '<a href="' + docUrl + '" target="_blank" ' +
    'style="font-size: 16px; text-decoration: none; background-color: #4CAF50; ' +
    'color: white; padding: 12px 24px; border-radius: 5px; ' +
    'display: inline-block; margin-top: 10px;">' +
    'Show Estimate</a></body>'
  ).setWidth(350).setHeight(220);

  ui.showModalDialog(htmlOutput, 'Document Generated Successfully');
}