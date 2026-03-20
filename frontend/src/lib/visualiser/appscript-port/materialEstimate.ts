/**
 * Material Estimate Generator
 * 100% PORT from AppScript materia_ estimate.js v5.2
 *
 * Inner Laminate Logic:
 * - inner 5 sheets → 10 inner laminates (×2)
 * - color 5 sheets → 5 color + 5 inner laminates
 * - color & 123SF inner 10 sheets → 10 color + 10 123SF inner laminates
 * - 123SF inner 10 sheets → 20 123SF inner laminates (×2)
 *
 * Hardware Logic:
 * - Reads directly from Hardware data
 * - Only Fevicol - Probond and Fevicol - D3 are calculated from material data
 * - All other items taken as-is
 *
 * ALTERATION FROM APPSCRIPT: Only I/O changed.
 *   - Input: materialSummaryHeader/Rows + hardwareData + optional sftData
 *   - Output: structured tables (plywood, laminate, edgeBanding, hardware)
 *   - No SpreadsheetApp, no Google Docs
 */

export interface MaterialEstimateResult {
  timestamp: string;
  plywood: { header: string[]; rows: (string | number)[][] };
  laminate: { header: string[]; rows: (string | number)[][] };
  edgeBanding: { header: string[]; rows: (string | number)[][] };
  hardware: { header: string[]; rows: (string | number)[][] };
}

// =================================================================
// =================== HELPERS (EXACT COPY) ===================
// =================================================================

function getEbSize(thickness: number, isInner?: boolean): string {
  isInner = isInner || false;
  const t = Number(thickness) || 18;
  let width: string;
  if (t >= 16 && t <= 17) {
    width = '22mm';
  } else if (t >= 18 && t <= 21) {
    width = '25mm';
  } else if (t >= 22 && t <= 27) {
    width = '30mm';
  } else if (t > 27) {
    width = '45mm';
  } else {
    width = '22mm';
  }
  const ebThickness = isInner ? '0.8mm' : '2.0mm';
  return width + '*' + ebThickness;
}

function fmtQty(n: number): number {
  return Number.isInteger(n) ? n : Math.round(n);
}

function getCleanColorCode(rawString: string | number): string {
  if (!rawString) return 'NA';
  let str = String(rawString).trim();
  const removeWords = [
    'bwp', 'bb', 'hdhmr', 'mr', 'bwr', 'pvc', 'wpvc', 'hdhm',
    'wpc', 'mdf', 'hdf', 'ply', 'bsl', 'inner', 'veneer', 'wood', 'timber',
  ];
  removeWords.forEach((word) => {
    const regex = new RegExp('\\b' + word + '\\b', 'gi');
    str = str.replace(regex, '');
  });
  str = str.replace(/\(.*?\)/g, '');
  str = str.replace(/\(\s*\d+\s*mm\s*\)/gi, '');
  str = str.replace(/\b\d+mm\b/gi, '');
  str = str.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return str || 'NA';
}

function extractInnerColorCode(materialString: string, hasSymbol: boolean): string {
  if (!materialString) return 'NA';
  let str = materialString;
  if (hasSymbol) {
    const parts = str.split(/[@&]/);
    if (parts.length > 1) {
      str = parts[1];
    }
  }
  const removeWords = [
    'bwp', 'bb', 'hdhmr', 'mr', 'bwr', 'pvc', 'wpvc', 'hdhm',
    'wpc', 'mdf', 'hdf', 'ply', 'bsl', 'inner', 'veneer', 'wood', 'timber',
  ];
  removeWords.forEach((word) => {
    const regex = new RegExp('\\b' + word + '\\b', 'gi');
    str = str.replace(regex, '');
  });
  str = str.replace(/\(.*?\)/g, '');
  str = str.replace(/\(\s*\d+\s*mm\s*\)/gi, '');
  str = str.replace(/\b\d+mm\b/gi, '');
  str = str.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return str || 'NA';
}

function detectPlywoodType(materialLower: string): string {
  if (materialLower.includes('bwp')) return 'BWP';
  if (materialLower.includes('bb')) return 'Blockboard';
  if (materialLower.includes('hdhmr')) return 'HDHMR';
  if (materialLower.includes('mdf')) return 'MDF';
  if (materialLower.includes('hdf')) return 'HDF';
  if (materialLower.includes('mr')) return 'MR';
  if (materialLower.includes('wpc')) return 'WPC';
  if (materialLower.includes('bwr')) return 'BWR';
  if (materialLower.includes('pvc')) return 'PVC';
  return 'Plywood';
}

function isOSLaminateCheck(material: string): boolean {
  return material.includes('(os') || /\bos\b/.test(material);
}

// =================================================================
// =================== PROCESS SFT DATA ===================
// =================================================================

function processSftData(sftData: (string | number)[][] | null): number {
  let totalSqFt = 0;
  if (!sftData || sftData.length === 0) return totalSqFt;

  for (let i = 0; i < sftData.length; i++) {
    for (let j = 0; j < sftData[i].length; j++) {
      const cellValue = sftData[i][j];
      if (cellValue && cellValue.toString().toLowerCase().includes('total square feet')) {
        if (i + 1 < sftData.length && typeof sftData[i + 1][j] === 'number') {
          totalSqFt = parseFloat(String(sftData[i + 1][j]));
          break;
        }
        if (j + 1 < sftData[i].length && typeof sftData[i][j + 1] === 'number') {
          totalSqFt = parseFloat(String(sftData[i][j + 1]));
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
          totalSqFt = parseFloat(String(cellValue));
          break;
        }
      }
      if (totalSqFt > 0) break;
    }
  }

  return totalSqFt;
}

// =================================================================
// =================== PROCESS MATERIAL SUMMARY ===================
// =================================================================

interface LaminateEntry {
  exteriorSheets: number;
  innerSheets: number;
  colorCode: string;
  rooms: Set<string>;
}

interface EbEntry {
  totalMeters: number;
  isInner: boolean;
  ebWidth: string;
}

function processMaterialSummary(
  materialSummaryHeader: string[],
  materialSummaryRows: (string | number)[][]
): {
  plywoodSummary: Record<string, number>;
  laminateSummary: Record<string, LaminateEntry>;
  edgeBandingByLaminate: Record<string, EbEntry>;
  totalSheets: number;
  totalAcrylicSides: number;
  totalInnerSheets: number;
  summaryValues: (string | number)[][];
  summaryMap: Record<string, number>;
} {
  const plywoodSummary: Record<string, number> = {};
  const laminateSummary: Record<string, LaminateEntry> = {};
  const edgeBandingByLaminate: Record<string, EbEntry> = {};
  const laminateKeyMap: Record<string, string> = {};

  let totalSheets = 0;
  let totalAcrylicSides = 0;
  let totalInnerSheets = 0;

  const summaryHeaders = materialSummaryHeader;
  const summaryValues: (string | number)[][] = [materialSummaryHeader as (string | number)[], ...materialSummaryRows];

  const summaryMap: Record<string, number> = {};
  summaryHeaders.forEach((h, i) => {
    if (h) summaryMap[String(h).trim()] = i;
  });

  const reqCols = ['Material & Thickness', 'Sheets Used', 'Total Edge (m)', 'Room Name(s)'];
  for (const col of reqCols) {
    if (summaryMap[col] === undefined) {
      throw new Error(`Missing required column '${col}' in 'Material Summary' sheet.`);
    }
  }

  function addToEbSummary(
    key: string, ebAmount: number, isInner: boolean,
    thickness?: number, isOS?: boolean
  ) {
    thickness = thickness || 18;
    isOS = isOS || false;
    const keyLower = key.toLowerCase();
    if (keyLower.includes('(os') || keyLower.includes(' os') || keyLower.includes('os ')) return;
    if (isOS) return;
    if (ebAmount === 0 || !ebAmount) return;
    if (thickness <= 3) return;

    const ebWidth = getEbSize(thickness, isInner);
    const ebKey = isInner
      ? key + '__' + ebWidth + '__inner'
      : key + '__' + thickness + 'mm__' + ebWidth + '__outer';

    if (!edgeBandingByLaminate[ebKey]) {
      edgeBandingByLaminate[ebKey] = { totalMeters: 0, isInner, ebWidth };
    }
    edgeBandingByLaminate[ebKey].totalMeters += ebAmount;
  }

  for (let i = 0; i < materialSummaryRows.length; i++) {
    const row = materialSummaryRows[i];
    const materialString = String(row[summaryMap['Material & Thickness']] || '');
    const sheetsUsed = Number(row[summaryMap['Sheets Used']]);
    const totalEb = parseFloat(String(row[summaryMap['Total Edge (m)']])) || 0;
    const roomNamesString = String(row[summaryMap['Room Name(s)']] || '');

    if ((!materialString || isNaN(sheetsUsed) || sheetsUsed === 0) && totalEb === 0) continue;

    let originalThickness: number | null = null;
    let finalThickness: number | null = null;
    const thicknessMatch = materialString ? materialString.match(/\((\d+)mm?\)/i) : null;
    if (thicknessMatch && thicknessMatch[1]) {
      originalThickness = parseInt(thicknessMatch[1], 10);
      finalThickness = originalThickness - 2;
    }

    const isThinOnly = originalThickness !== null && originalThickness <= 3;
    const material = materialString ? materialString.toLowerCase() : '';
    const colorCode = getCleanColorCode(materialString);
    const isOSLaminate = isOSLaminateCheck(material);
    const hasBSL = material.includes('bsl');
    const hasInner = material.includes('inner');

    const roomsToAdd = roomNamesString
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r && r.toLowerCase() !== 'n/a');

    // PLYWOOD
    if (sheetsUsed > 0 && !isThinOnly) {
      totalSheets += sheetsUsed;
      if (originalThickness !== null) {
        const plywoodType = detectPlywoodType(material);
        const plywoodKey = plywoodType + ' - ' + finalThickness + 'mm';
        plywoodSummary[plywoodKey] = (plywoodSummary[plywoodKey] || 0) + sheetsUsed;
      }
      if (material.includes('acr')) {
        totalAcrylicSides += sheetsUsed;
      }
    }

    // LAMINATE
    let laminateKey = colorCode;
    if (colorCode !== 'NA') {
      const lowerKey = colorCode.toLowerCase();
      if (!laminateKeyMap[lowerKey]) laminateKeyMap[lowerKey] = colorCode;
      laminateKey = laminateKeyMap[lowerKey];
    }

    // CASE 1: Mixed outer + specific inner
    if (hasInner && (materialString.includes('@') || materialString.includes('&'))) {
      const parts = materialString.split(/[@&]/).map((p) => p.trim());
      const innerColorCode = extractInnerColorCode(materialString, true);
      if (!innerColorCode || innerColorCode === 'NA' || innerColorCode.trim() === '') {
        throw new Error(
          'Invalid material naming: cannot use @ with Inner. Use a specific inner color.'
        );
      }
      const specificInnerColor = innerColorCode + ' Inner';
      const exteriorParts = parts.slice(0, parts.length - 1);
      const ebPerExterior = exteriorParts.length > 0 ? totalEb / exteriorParts.length : 0;

      for (const extPart of exteriorParts) {
        const extColor = getCleanColorCode(extPart);
        if (extColor && extColor !== 'NA') {
          if (!laminateSummary[extColor]) {
            laminateSummary[extColor] = { exteriorSheets: 0, innerSheets: 0, colorCode: extColor, rooms: new Set() };
          }
          laminateSummary[extColor].exteriorSheets += sheetsUsed;
          roomsToAdd.forEach((r) => laminateSummary[extColor].rooms.add(r));
          addToEbSummary(extColor, ebPerExterior, false, originalThickness || 18, isOSLaminate);
        }
      }

      if (!laminateSummary[specificInnerColor]) {
        laminateSummary[specificInnerColor] = { exteriorSheets: 0, innerSheets: 0, colorCode: specificInnerColor, rooms: new Set() };
      }
      laminateSummary[specificInnerColor].innerSheets += sheetsUsed;
      totalInnerSheets += sheetsUsed;
      continue;
    }

    // CASE 2: Two colours with & (no inner)
    if (materialString.includes('&') && !hasInner) {
      const parts = colorCode.split(/\s*&\s*/);
      if (parts.length === 2) {
        const firstColor = parts[0].trim();
        const secondColor = parts[1].trim();
        if (!laminateSummary[firstColor])
          laminateSummary[firstColor] = { exteriorSheets: 0, innerSheets: 0, colorCode: firstColor, rooms: new Set() };
        laminateSummary[firstColor].exteriorSheets += sheetsUsed;
        roomsToAdd.forEach((r) => laminateSummary[firstColor].rooms.add(r));
        if (!laminateSummary[secondColor])
          laminateSummary[secondColor] = { exteriorSheets: 0, innerSheets: 0, colorCode: secondColor, rooms: new Set() };
        laminateSummary[secondColor].exteriorSheets += sheetsUsed;
        roomsToAdd.forEach((r) => laminateSummary[secondColor].rooms.add(r));
        addToEbSummary(firstColor, totalEb, false, originalThickness || 18, isOSLaminate);
        continue;
      }
    }

    // CASE 3: @ without inner
    if (materialString.includes('@') && !hasInner) {
      const atParts = colorCode.split(/\s*@\s*/).map((x) => x.trim()).filter((x) => x && x !== 'NA');
      const ebPerColor = atParts.length > 0 ? totalEb / atParts.length : 0;
      for (const atColor of atParts) {
        if (!laminateSummary[atColor])
          laminateSummary[atColor] = { exteriorSheets: 0, innerSheets: 0, colorCode: atColor, rooms: new Set() };
        laminateSummary[atColor].exteriorSheets += sheetsUsed;
        roomsToAdd.forEach((r) => laminateSummary[atColor].rooms.add(r));
        addToEbSummary(atColor, ebPerColor, false, originalThickness || 18, isOSLaminate);
      }
      if (!laminateSummary['Inner'])
        laminateSummary['Inner'] = { exteriorSheets: 0, innerSheets: 0, colorCode: 'Inner', rooms: new Set() };
      laminateSummary['Inner'].innerSheets += sheetsUsed;
      totalInnerSheets += sheetsUsed;
      continue;
    }

    // CASE 4: Specific inner only
    if (hasInner && !materialString.includes('@') && !materialString.includes('&')) {
      const specificInnerOnly = colorCode !== 'NA' ? colorCode + ' Inner' : 'Inner';
      if (!laminateSummary[specificInnerOnly])
        laminateSummary[specificInnerOnly] = { exteriorSheets: 0, innerSheets: 0, colorCode: specificInnerOnly, rooms: new Set() };
      const innerSheetsCount = sheetsUsed * 2;
      laminateSummary[specificInnerOnly].innerSheets += innerSheetsCount;
      totalInnerSheets += innerSheetsCount;
      addToEbSummary(specificInnerOnly, totalEb, true, finalThickness || originalThickness || 18, isOSLaminate);
      continue;
    }

    // CASE 5: BSL
    if (hasBSL) {
      if (!laminateSummary[laminateKey])
        laminateSummary[laminateKey] = { exteriorSheets: 0, innerSheets: 0, colorCode: laminateKey, rooms: new Set() };
      if (sheetsUsed > 0) {
        laminateSummary[laminateKey].exteriorSheets += sheetsUsed * 2;
        roomsToAdd.forEach((r) => laminateSummary[laminateKey].rooms.add(r));
      }
      addToEbSummary(laminateKey, totalEb, false, finalThickness || originalThickness || 18, isOSLaminate);
      continue;
    }

    // CASE 6: Regular colour
    if (!hasInner) {
      if (!laminateSummary[laminateKey])
        laminateSummary[laminateKey] = { exteriorSheets: 0, innerSheets: 0, colorCode: laminateKey, rooms: new Set() };
      if (sheetsUsed > 0) {
        laminateSummary[laminateKey].exteriorSheets += sheetsUsed;
        roomsToAdd.forEach((r) => laminateSummary[laminateKey].rooms.add(r));
        if (!laminateSummary['Inner'])
          laminateSummary['Inner'] = { exteriorSheets: 0, innerSheets: 0, colorCode: 'Inner', rooms: new Set() };
        laminateSummary['Inner'].innerSheets += sheetsUsed;
        totalInnerSheets += sheetsUsed;
      }
      addToEbSummary(laminateKey, totalEb, false, finalThickness || originalThickness || 18, isOSLaminate);
      continue;
    }
  }

  return {
    plywoodSummary, laminateSummary, edgeBandingByLaminate,
    totalSheets, totalAcrylicSides, totalInnerSheets,
    summaryValues, summaryMap,
  };
}

// =================================================================
// =================== PROCESS HARDWARE ===================
// =================================================================

function processHardware(
  hardwareData: (string | number)[][],
  totalSheets: number,
  totalAcrylicSides: number
): (string | number)[][] {
  const hardwareOutput: (string | number)[][] = [['Description', 'Quantity']];
  const calculatedItems: Record<string, boolean> = {
    '*Fevicol - Probond': true,
    '*Fevicol - D3': true,
  };

  if (hardwareData.length < 2) return hardwareOutput;

  for (let i = 1; i < hardwareData.length; i++) {
    const description = hardwareData[i][0];
    const quantity = hardwareData[i][1];
    if (!description || description === '') continue;
    const descStr = description.toString().trim();
    const qtyStr = quantity ? quantity.toString().trim() : '';

    if (calculatedItems[descStr]) {
      if (descStr === '*Fevicol - Probond') {
        const calculatedQty = Math.round(totalAcrylicSides * 0.8);
        if (calculatedQty > 0) {
          hardwareOutput.push([descStr, calculatedQty + ' kgs\nProvided by NestUP & Bill accordingly']);
        } else {
          hardwareOutput.push([descStr, 'kgs\nProvided by NestUP & Bill accordingly']);
        }
      } else if (descStr === '*Fevicol - D3') {
        const grossFevicol = totalSheets * 1.6;
        const totalProbond = totalAcrylicSides * 0.8;
        const netFevicol = grossFevicol - totalProbond;
        const calculatedQty = Math.round(netFevicol);
        if (calculatedQty > 0) {
          hardwareOutput.push([descStr, calculatedQty + ' kgs\nProvided by NestUP & Bill accordingly']);
        } else {
          hardwareOutput.push([descStr, 'kgs\nProvided by NestUP & Bill accordingly']);
        }
      }
    } else {
      hardwareOutput.push([descStr, qtyStr]);
    }
  }
  return hardwareOutput;
}

// =================================================================
// =================== BUILD OUTPUT ===================
// =================================================================

function buildOutput(
  plywoodSummary: Record<string, number>,
  laminateSummary: Record<string, LaminateEntry>,
  edgeBandingByLaminate: Record<string, EbEntry>,
  hardwareOutput: (string | number)[][],
  summaryValues: (string | number)[][],
  summaryMap: Record<string, number>
): MaterialEstimateResult {
  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Plywood table
  const plywoodRows: (string | number)[][] = [];
  Object.keys(plywoodSummary).sort().forEach((key) => {
    plywoodRows.push([key, fmtQty(plywoodSummary[key]) + ' (8ftx4ft Sheets)']);
  });

  // Laminate table
  const sortedLaminateKeys = Object.keys(laminateSummary).sort((a, b) => {
    const isInnerA = a.toLowerCase().includes('inner');
    const isInnerB = b.toLowerCase().includes('inner');
    if (!isInnerA && isInnerB) return -1;
    if (isInnerA && !isInnerB) return 1;
    return a.localeCompare(b);
  });

  const laminateRows: (string | number)[][] = [];
  sortedLaminateKeys.forEach((key) => {
    const data = laminateSummary[key];
    if (!data) return;
    const isInner = key.toLowerCase().includes('inner') || data.colorCode === 'Inner';
    const quantity = fmtQty(isInner ? data.innerSheets || 0 : data.exteriorSheets || 0);
    if (quantity === 0) return;

    let description: string;
    let finalColorCode: string;
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
    const codeColumn = 'NA / NA / ' + finalColorCode;
    laminateRows.push([description, codeColumn, quantity + " No's"]);
  });

  // Edge Banding table
  const ebRows: (string | number)[][] = [];
  Object.keys(edgeBandingByLaminate).forEach((fullKey) => {
    const ebData = edgeBandingByLaminate[fullKey];
    if (!ebData || ebData.totalMeters === 0) return;
    const laminateKey = fullKey.split('__')[0];
    if (!laminateKey || laminateKey === 'NA' || laminateKey.trim() === '') return;

    let originalColorKey = '';
    for (let r = 1; r < summaryValues.length; r++) {
      const matStr = String(summaryValues[r][summaryMap['Material & Thickness']] || '');
      const clean = getCleanColorCode(matStr);
      if (clean === laminateKey || clean.startsWith(laminateKey)) {
        originalColorKey = clean;
        break;
      }
    }

    if (originalColorKey.includes('@') || originalColorKey.includes('&')) {
      const firstColorFix = originalColorKey.split(/[@&]/)[0].trim();
      let matchedRooms = '';
      for (let r = 1; r < summaryValues.length; r++) {
        const matStr = String(summaryValues[r][summaryMap['Material & Thickness']] || '');
        if (matStr.includes(firstColorFix)) {
          matchedRooms = String(summaryValues[r][summaryMap['Room Name(s)']] || '').trim();
          break;
        }
      }
      const descFix = matchedRooms !== '' ? matchedRooms : firstColorFix;
      const codeFix = 'NA / NA / ' + firstColorFix;
      ebRows.push([descFix, codeFix, ebData.ebWidth, fmtQty(ebData.totalMeters) + ' Meters']);
      return;
    }

    const laminateData = laminateSummary[laminateKey];
    let description: string;
    if (laminateData && laminateData.rooms && laminateData.rooms.size > 0) {
      description = Array.from(laminateData.rooms).sort().join(', ');
    } else {
      description = laminateKey;
    }

    let laminateCodeForDesc = 'NA / NA / NA';
    if (laminateData && laminateData.colorCode) {
      const finalColorCodePart =
        laminateData.colorCode === 'Inner' || laminateData.colorCode === 'NA' || !laminateData.colorCode
          ? laminateKey
          : laminateData.colorCode;
      laminateCodeForDesc = 'NA / NA / ' + finalColorCodePart;
      description += '\n(' + laminateCodeForDesc + ')';
    }
    ebRows.push([description, laminateCodeForDesc, ebData.ebWidth, fmtQty(ebData.totalMeters) + ' Meters']);
  });

  return {
    timestamp,
    plywood: { header: ['Description', 'Quantity'], rows: plywoodRows },
    laminate: { header: ['Description', 'Brand / Colour / Code', 'Quantity'], rows: laminateRows },
    edgeBanding: { header: ['Description', 'Brand / Colour / Code', 'Width*thickness', 'Quantity'], rows: ebRows },
    hardware: { header: hardwareOutput[0] as string[], rows: hardwareOutput.slice(1) },
  };
}

// =================================================================
// =================== MAIN FUNCTION ===================
// =================================================================

/**
 * 100% port of AppScript generateMaterialEstimate().
 * Input: materialSummaryHeader/Rows, hardwareData, optional sftData.
 * Output: MaterialEstimateResult with plywood, laminate, edgeBanding, hardware tables.
 */
export function generateMaterialEstimate(
  materialSummaryHeader: string[],
  materialSummaryRows: (string | number)[][],
  hardwareData: (string | number)[][],
  sftData?: (string | number)[][] | null
): MaterialEstimateResult {
  processSftData(sftData || null);

  const materialResult = processMaterialSummary(materialSummaryHeader, materialSummaryRows);

  const hardwareOutput = processHardware(
    hardwareData,
    materialResult.totalSheets,
    materialResult.totalAcrylicSides
  );

  return buildOutput(
    materialResult.plywoodSummary,
    materialResult.laminateSummary,
    materialResult.edgeBandingByLaminate,
    hardwareOutput,
    materialResult.summaryValues,
    materialResult.summaryMap
  );
}
