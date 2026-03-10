/**
 * Material Estimate PDF Generator
 * EXACT PORT from Apps Script "materia_ estimate.js"
 * 
 * Generates a formal customer-facing Material Estimate PDF
 * with structured sections for:
 * - Plywood
 * - Laminates
 * - Edge Banding
 * - Hardware
 */

import { jsPDF } from 'jspdf';
import type { MaterialEstimate, MaterialSummary } from '@/types/visualiser';
import type { CustomerDetails } from '@/stores/designerStore';

// ============================================
// TYPES
// ============================================

interface PlywoodRow {
  description: string;
  quantity: string;
}

interface LaminateRow {
  description: string;
  brandColourCode: string;
  quantity: string;
}

interface EdgeBandingRow {
  description: string;
  brandColourCode: string;
  widthThickness: string;
  quantity: string;
}

interface HardwareRow {
  description: string;
  quantity: string;
}

interface EstimateData {
  plywood: PlywoodRow[];
  laminates: LaminateRow[];
  edgeBanding: EdgeBandingRow[];
  hardware: HardwareRow[];
  totalSqFt: number;
  totalSheets: number;
}

// ============================================
// CONSTANTS
// ============================================

const PAGE_MARGIN = 15;
const TABLE_START_Y = 50;
const ROW_HEIGHT = 8;
const HEADER_HEIGHT = 10;

// Brand colors
const BRAND_ORANGE = '#F97316';
const BRAND_BLUE = '#1E40AF';
const TEXT_DARK = '#1F2937';
const TEXT_GRAY = '#6B7280';
const BORDER_COLOR = '#E5E7EB';
const HEADER_BG = '#F3F4F6';

// ============================================
// HELPER: Get Edge Binding Size
// ============================================

function getEbSize(thickness: number, isInner: boolean = false): string {
  if (isInner) {
    if (thickness >= 16 && thickness <= 17) return '22mm*0.8mm';
    if (thickness >= 18 && thickness <= 20) return '25mm*0.8mm';
    if (thickness >= 23 && thickness <= 27) return '30mm*0.8mm';
    return '22mm*0.8mm'; // default
  }

  if (thickness >= 16 && thickness <= 17) return '22mm*2.0mm';
  if (thickness >= 18 && thickness <= 20) return '25mm*2.0mm';
  if (thickness >= 23 && thickness <= 27) return '30mm*2.0mm';
  if (thickness > 27) return '45mm*2.0mm';
  return '22mm*2.0mm'; // default
}

// ============================================
// HELPER: Clean Color Code
// ============================================

function getCleanColorCode(rawString: string): string {
  if (!rawString) return 'NA';

  let str = rawString.trim();

  // Remove material keywords
  const removeWords = ['bwp', 'bb', 'hdhmr', 'mdf', 'hdf', 'ply', 'bsl', 'inner', 'veneer', 'wood', 'timber'];
  removeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    str = str.replace(regex, '');
  });

  // Clean up
  str = str.replace(/\(.*?\)/g, '');
  str = str.replace(/\b\d+mm\b/gi, '');
  str = str.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

  return str || 'NA';
}

// ============================================
// PROCESS MATERIAL SUMMARY TO ESTIMATE DATA
// ============================================

export function processToEstimateData(
  materialSummary: MaterialSummary[],
  totalSqFt: number = 0
): EstimateData {
  const plywoodMap: Record<string, number> = {};
  const laminateMap: Record<string, { exteriorSheets: number; innerSheets: number; colorCode: string; rooms: Set<string> }> = {};
  const edgeBandingMap: Record<string, { totalMeters: number; isInner: boolean; ebWidth: string }> = {};
  
  let totalSheets = 0;
  let totalInnerSheets = 0;

  materialSummary.forEach((row) => {
    const materialString = row.materialThickness || '';
    const sheetsUsed = row.sheetsUsed || 0;
    const totalEb = row.totalEdge || 0;
    const roomNames = row.roomNames || '';

    if (!materialString || (sheetsUsed === 0 && totalEb === 0)) return;

    // Extract thickness
    const thicknessMatch = materialString.match(/\((\d+)mm?\)/i);
    let originalThickness = 18;
    let finalThickness = 16;
    if (thicknessMatch && thicknessMatch[1]) {
      originalThickness = parseInt(thicknessMatch[1], 10);
      finalThickness = originalThickness - 2;
    }

    // Skip thin materials (<=3mm) for plywood
    const isThinOnly = originalThickness <= 3;

    if (sheetsUsed > 0 && !isThinOnly) {
      totalSheets += sheetsUsed;

      // Determine plywood type
      const materialLower = materialString.toLowerCase();
      let plywoodType = 'Plywood';
      if (materialLower.includes('bwp')) plywoodType = 'BWP';
      else if (materialLower.includes('bb')) plywoodType = 'Blockboard';
      else if (materialLower.includes('hdhmr')) plywoodType = 'HDHMR';
      else if (materialLower.includes('mdf')) plywoodType = 'MDF';
      else if (materialLower.includes('hdf')) plywoodType = 'HDF';

      const plywoodKey = `${plywoodType} - ${finalThickness}mm`;
      plywoodMap[plywoodKey] = (plywoodMap[plywoodKey] || 0) + sheetsUsed;
    }

    // Process laminates
    const material = materialString.toLowerCase();
    const isInner = material.includes('inner');
    const hasBSL = material.includes('bsl');
    const colorCode = getCleanColorCode(materialString);
    const roomsArray = roomNames.split(',').map(r => r.trim()).filter(r => r && r.toLowerCase() !== 'n/a');

    // Determine laminate key
    let laminateKey = colorCode !== 'NA' ? colorCode : materialString;

    if (isInner) {
      const innerKey = 'Inner Laminates';
      if (!laminateMap[innerKey]) {
        laminateMap[innerKey] = { exteriorSheets: 0, innerSheets: 0, colorCode: 'Inner', rooms: new Set() };
      }
      laminateMap[innerKey].innerSheets += sheetsUsed * 2;
      totalInnerSheets += sheetsUsed * 2;

      // Inner EB
      const ebKey = `Inner__${getEbSize(finalThickness, true)}__inner`;
      if (!edgeBandingMap[ebKey]) {
        edgeBandingMap[ebKey] = { totalMeters: 0, isInner: true, ebWidth: getEbSize(finalThickness, true) };
      }
      edgeBandingMap[ebKey].totalMeters += totalEb;
    } else if (hasBSL) {
      if (!laminateMap[laminateKey]) {
        laminateMap[laminateKey] = { exteriorSheets: 0, innerSheets: 0, colorCode: laminateKey, rooms: new Set() };
      }
      laminateMap[laminateKey].exteriorSheets += sheetsUsed * 2;
      roomsArray.forEach(r => laminateMap[laminateKey].rooms.add(r));

      // Outer EB
      const ebKey = `${laminateKey}__${finalThickness}mm__${getEbSize(finalThickness)}__outer`;
      if (!edgeBandingMap[ebKey]) {
        edgeBandingMap[ebKey] = { totalMeters: 0, isInner: false, ebWidth: getEbSize(finalThickness) };
      }
      edgeBandingMap[ebKey].totalMeters += totalEb;
    } else {
      if (!laminateMap[laminateKey]) {
        laminateMap[laminateKey] = { exteriorSheets: 0, innerSheets: 0, colorCode: laminateKey, rooms: new Set() };
      }
      laminateMap[laminateKey].exteriorSheets += sheetsUsed;
      roomsArray.forEach(r => laminateMap[laminateKey].rooms.add(r));

      // Add inner sheets
      if (!laminateMap['Inner Laminates']) {
        laminateMap['Inner Laminates'] = { exteriorSheets: 0, innerSheets: 0, colorCode: 'Inner', rooms: new Set() };
      }
      laminateMap['Inner Laminates'].innerSheets += sheetsUsed;
      totalInnerSheets += sheetsUsed;

      // Outer EB
      const ebKey = `${laminateKey}__${finalThickness}mm__${getEbSize(finalThickness)}__outer`;
      if (!edgeBandingMap[ebKey]) {
        edgeBandingMap[ebKey] = { totalMeters: 0, isInner: false, ebWidth: getEbSize(finalThickness) };
      }
      edgeBandingMap[ebKey].totalMeters += totalEb;
    }
  });

  // Convert maps to arrays
  const plywood: PlywoodRow[] = Object.entries(plywoodMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, qty]) => ({
      description: key,
      quantity: `${Math.round(qty)} (8ftx4ft Sheets)`,
    }));

  const laminates: LaminateRow[] = Object.entries(laminateMap)
    .filter(([, data]) => (data.exteriorSheets || data.innerSheets) > 0)
    .sort(([a], [b]) => {
      const isInnerA = a.toLowerCase().includes('inner');
      const isInnerB = b.toLowerCase().includes('inner');
      if (!isInnerA && isInnerB) return -1;
      if (isInnerA && !isInnerB) return 1;
      return a.localeCompare(b);
    })
    .map(([key, data]) => {
      const isInner = key.toLowerCase().includes('inner');
      const qty = Math.round(isInner ? data.innerSheets : data.exteriorSheets);
      const description = isInner
        ? 'Inner Laminates'
        : data.rooms.size > 0
          ? Array.from(data.rooms).sort().join(', ')
          : key;
      const colorCode = isInner ? 'Inner' : data.colorCode;
      return {
        description,
        brandColourCode: `NA / NA / ${colorCode}`,
        quantity: `${qty} No's`,
      };
    });

  const edgeBanding: EdgeBandingRow[] = Object.entries(edgeBandingMap)
    .filter(([, data]) => data.totalMeters > 0)
    .map(([fullKey, data]) => {
      const laminateKey = fullKey.split('__')[0];
      const lamData = laminateMap[laminateKey];
      const description = lamData?.rooms?.size
        ? Array.from(lamData.rooms).sort().join(', ')
        : laminateKey;
      const colorCode = lamData?.colorCode || laminateKey;
      return {
        description,
        brandColourCode: `NA / NA / ${colorCode}`,
        widthThickness: data.ebWidth,
        quantity: `${Math.round(data.totalMeters)} Meters`,
      };
    });

  // Standard hardware list (simplified)
  const hardware: HardwareRow[] = [
    { description: 'Fevicol - D3', quantity: `${Math.round(totalSheets * 1.6)} kgs` },
    { description: 'HeatX', quantity: `${Math.round(totalSheets * 0.5)} kgs` },
    { description: 'VB Fittings', quantity: '' },
    { description: 'PTA Screws (4mm x 16mm)', quantity: '' },
    { description: 'PTA Screws (4mm x 20mm)', quantity: '' },
    { description: 'Hinges Soft Close', quantity: '' },
  ].filter(h => h.description);

  return {
    plywood,
    laminates,
    edgeBanding,
    hardware,
    totalSqFt,
    totalSheets,
  };
}

// ============================================
// GENERATE FORMAL PDF
// ============================================

export function generateMaterialEstimatePDF(
  estimateData: EstimateData,
  customerDetails?: CustomerDetails,
  projectName: string = 'Project'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = PAGE_MARGIN;

  // ============================================
  // HEADER
  // ============================================
  
  // Company Name / Logo area
  doc.setFontSize(20);
  doc.setTextColor(BRAND_ORANGE);
  doc.setFont('helvetica', 'bold');
  doc.text('NESTUP', PAGE_MARGIN, currentY + 8);
  
  doc.setFontSize(10);
  doc.setTextColor(TEXT_GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('Material Estimate', PAGE_MARGIN, currentY + 14);

  // Date and Customer
  const date = new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });
  doc.setFontSize(10);
  doc.setTextColor(TEXT_DARK);
  doc.text(`Date: ${date}`, pageWidth - PAGE_MARGIN, currentY + 8, { align: 'right' });
  
  if (customerDetails?.customerName) {
    doc.text(`Customer: ${customerDetails.customerName}`, pageWidth - PAGE_MARGIN, currentY + 14, { align: 'right' });
  }
  if (customerDetails?.firmName) {
    doc.text(`Firm: ${customerDetails.firmName}`, pageWidth - PAGE_MARGIN, currentY + 20, { align: 'right' });
  }

  currentY += 30;

  // Divider line
  doc.setDrawColor(BRAND_ORANGE);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGIN, currentY, pageWidth - PAGE_MARGIN, currentY);
  currentY += 10;

  // ============================================
  // SUMMARY STATS
  // ============================================
  
  doc.setFillColor('#FFF7ED'); // Light orange background
  doc.roundedRect(PAGE_MARGIN, currentY, pageWidth - PAGE_MARGIN * 2, 15, 3, 3, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(BRAND_BLUE);
  doc.setFont('helvetica', 'bold');
  
  const statsY = currentY + 10;
  doc.text(`Total Square Feet: ${Math.round(estimateData.totalSqFt)} sq ft`, PAGE_MARGIN + 10, statsY);
  doc.text(`Total Sheets: ${estimateData.totalSheets}`, pageWidth / 2, statsY);
  doc.text(`Project: ${projectName}`, pageWidth - PAGE_MARGIN - 50, statsY);
  
  currentY += 25;

  // ============================================
  // PLYWOOD TABLE
  // ============================================
  
  if (estimateData.plywood.length > 0) {
    currentY = drawSectionHeader(doc, 'PLYWOOD', currentY, pageWidth);
    currentY = drawTable(doc, ['Description', 'Quantity'], estimateData.plywood.map(p => [p.description, p.quantity]), currentY, pageWidth, [0.6, 0.4]);
    currentY += 10;
  }

  // ============================================
  // LAMINATES TABLE
  // ============================================
  
  if (estimateData.laminates.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = PAGE_MARGIN;
    }
    
    currentY = drawSectionHeader(doc, 'LAMINATES', currentY, pageWidth);
    currentY = drawTable(
      doc,
      ['Description', 'Brand / Colour / Code', 'Quantity'],
      estimateData.laminates.map(l => [l.description, l.brandColourCode, l.quantity]),
      currentY,
      pageWidth,
      [0.4, 0.35, 0.25]
    );
    currentY += 10;
  }

  // ============================================
  // EDGE BANDING TABLE
  // ============================================
  
  if (estimateData.edgeBanding.length > 0) {
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = PAGE_MARGIN;
    }
    
    currentY = drawSectionHeader(doc, 'EDGE BANDING', currentY, pageWidth);
    currentY = drawTable(
      doc,
      ['Description', 'Brand / Colour / Code', 'Width*Thickness', 'Quantity'],
      estimateData.edgeBanding.map(e => [e.description, e.brandColourCode, e.widthThickness, e.quantity]),
      currentY,
      pageWidth,
      [0.3, 0.3, 0.2, 0.2]
    );
    currentY += 10;
  }

  // ============================================
  // HARDWARE TABLE
  // ============================================
  
  if (estimateData.hardware.length > 0) {
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = PAGE_MARGIN;
    }
    
    currentY = drawSectionHeader(doc, 'HARDWARE', currentY, pageWidth);
    currentY = drawTable(
      doc,
      ['Description', 'Quantity'],
      estimateData.hardware.map(h => [h.description, h.quantity]),
      currentY,
      pageWidth,
      [0.7, 0.3]
    );
  }

  // ============================================
  // FOOTER
  // ============================================
  
  doc.setFontSize(8);
  doc.setTextColor(TEXT_GRAY);
  doc.text(
    `Generated by Nestup • ${date}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save the PDF
  const fileName = customerDetails?.customerName
    ? `Material_Estimate_${customerDetails.customerName.replace(/\s+/g, '_')}_${date.replace(/\s+/g, '_')}.pdf`
    : `Material_Estimate_${date.replace(/\s+/g, '_')}.pdf`;
  
  doc.save(fileName);
}

// ============================================
// HELPER: Draw Section Header
// ============================================

function drawSectionHeader(doc: jsPDF, title: string, y: number, pageWidth: number): number {
  doc.setFontSize(12);
  doc.setTextColor(BRAND_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text(title, PAGE_MARGIN, y);
  
  doc.setDrawColor(BRAND_BLUE);
  doc.setLineWidth(0.3);
  doc.line(PAGE_MARGIN, y + 2, PAGE_MARGIN + 30, y + 2);
  
  return y + 8;
}

// ============================================
// HELPER: Draw Table
// ============================================

function drawTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  startY: number,
  pageWidth: number,
  colWidths: number[]
): number {
  const tableWidth = pageWidth - PAGE_MARGIN * 2;
  const colAbsWidths = colWidths.map(w => tableWidth * w);
  
  let currentY = startY;
  let currentX = PAGE_MARGIN;

  // Draw header row
  doc.setFillColor(HEADER_BG);
  doc.rect(PAGE_MARGIN, currentY, tableWidth, HEADER_HEIGHT, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  
  headers.forEach((header, i) => {
    doc.text(header, currentX + 2, currentY + 6);
    currentX += colAbsWidths[i];
  });
  
  currentY += HEADER_HEIGHT;

  // Draw data rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  rows.forEach((row, rowIndex) => {
    currentX = PAGE_MARGIN;
    
    // Alternate row background
    if (rowIndex % 2 === 1) {
      doc.setFillColor('#FAFAFA');
      doc.rect(PAGE_MARGIN, currentY, tableWidth, ROW_HEIGHT, 'F');
    }
    
    row.forEach((cell, i) => {
      // Truncate long text
      let text = String(cell || '');
      const maxWidth = colAbsWidths[i] - 4;
      while (doc.getTextWidth(text) > maxWidth && text.length > 3) {
        text = text.slice(0, -4) + '...';
      }
      doc.text(text, currentX + 2, currentY + 5);
      currentX += colAbsWidths[i];
    });
    
    currentY += ROW_HEIGHT;
  });

  // Draw table border
  doc.setDrawColor(BORDER_COLOR);
  doc.setLineWidth(0.2);
  doc.rect(PAGE_MARGIN, startY, tableWidth, currentY - startY);
  
  // Draw column lines
  currentX = PAGE_MARGIN;
  colAbsWidths.slice(0, -1).forEach((w) => {
    currentX += w;
    doc.line(currentX, startY, currentX, currentY);
  });

  // Draw row lines
  let lineY = startY + HEADER_HEIGHT;
  rows.forEach(() => {
    doc.line(PAGE_MARGIN, lineY, PAGE_MARGIN + tableWidth, lineY);
    lineY += ROW_HEIGHT;
  });

  return currentY;
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

/**
 * Generate and download Material Estimate PDF
 */
export function downloadMaterialEstimatePDF(
  materialSummary: MaterialSummary[],
  totalSqFt: number = 0,
  customerDetails?: CustomerDetails,
  projectName: string = 'Project'
): void {
  const estimateData = processToEstimateData(materialSummary, totalSqFt);
  generateMaterialEstimatePDF(estimateData, customerDetails, projectName);
}
