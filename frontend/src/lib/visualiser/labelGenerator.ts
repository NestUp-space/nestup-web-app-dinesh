/**
 * Label Generator for Cutlist Visualization
 * EXACT PORT from Apps Script "cutlist_visual.html" label generation
 * 
 * Features:
 * - 75mm x 50mm labels
 * - Plank minimap showing position on sheet
 * - Plank ID, name, dimensions
 * - Material info
 * - Customer details
 * - Sheet number
 * - Edge binding info
 */

import { NestResult, SHEET_CONSTANTS } from '@/types/visualiser';
import { CustomerDetails } from '@/stores/designerStore';

// ============================================
// TYPES
// ============================================

interface LabelData {
  plankId: string;
  plankName: string;
  material: string;
  thickness: number;
  sheetNum: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  ebValue: number;
  x: number;
  y: number;
  roomName?: string;
}

interface SheetLayout {
  sheetNum: number;
  planks: NestResult[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract room name from material string (format: "Material (Room)")
 */
function extractRoomName(material: string): string {
  const match = material.match(/\(([^)]+)\)/);
  return match ? match[1] : 'N/A';
}

/**
 * Clean material name (remove room and thickness)
 */
function cleanMaterial(material: string, thickness: number): string {
  let cleaned = material.replace(/\s*\([^)]+\)/g, '').trim();
  cleaned = cleaned.replace(new RegExp(`-\\s*${thickness}(mm)?`, 'i'), '').trim();
  return cleaned;
}

/**
 * Group nest results by sheet number
 */
function groupBySheet(nestResults: NestResult[]): Map<number, NestResult[]> {
  const sheets = new Map<number, NestResult[]>();
  
  nestResults.forEach((plank) => {
    const sheetNum = plank.sheetNum || 1;
    if (!sheets.has(sheetNum)) {
      sheets.set(sheetNum, []);
    }
    sheets.get(sheetNum)!.push(plank);
  });
  
  return sheets;
}

/**
 * Generate SVG minimap showing plank position on sheet
 */
function generateMiniMapSvg(
  currentPlank: NestResult,
  allPlanksOnSheet: NestResult[],
  sheetWidth: number,
  sheetHeight: number
): string {
  let otherPlanksSvg = '';
  
  allPlanksOnSheet.forEach((plank) => {
    // CNC coordinate correction: Y origin is bottom-left for CNC, top-left for SVG
    const svgY = sheetHeight - plank.y - plank.height;
    
    if (plank.id !== currentPlank.id) {
      otherPlanksSvg += `<rect x="${plank.x}" y="${svgY}" width="${plank.width}" height="${plank.height}" class="plank-other"/>`;
    }
  });

  // Current plank (highlighted)
  const currentSvgY = sheetHeight - currentPlank.y - currentPlank.height;

  return `
    <svg class="minimap" viewBox="0 0 ${sheetWidth} ${sheetHeight}">
      <rect x="0" y="0" width="${sheetWidth}" height="${sheetHeight}" class="sheet-bg"/>
      ${otherPlanksSvg}
      <rect x="${currentPlank.x}" y="${currentSvgY}" width="${currentPlank.width}" height="${currentPlank.height}" class="plank-highlight"/>
    </svg>
  `;
}

/**
 * Generate HTML for a single label
 */
function createLabelHTML(
  plank: NestResult,
  allPlanksOnSheet: NestResult[],
  customerDetails?: CustomerDetails,
  sheetWidth: number = SHEET_CONSTANTS.SHEET_WIDTH,
  sheetHeight: number = SHEET_CONSTANTS.SHEET_HEIGHT
): string {
  const roomName = extractRoomName(plank.material);
  const cleanedMaterial = cleanMaterial(plank.material, plank.thickness);
  const miniMapSvg = generateMiniMapSvg(plank, allPlanksOnSheet, sheetWidth, sheetHeight);

  // Use original dimensions if available
  const displayWidth = plank.originalWidth || plank.width;
  const displayHeight = plank.originalHeight || plank.height;
  const displayEB = plank.ebValue || 0;

  return `
    <div class="label-container">
      <div class="label-left">
        <div class="header-text">Nestup</div>
        <div class="plank-name">${plank.name || 'Unnamed'}</div>
        <div class="plank-material">${cleanedMaterial} - ${plank.thickness}mm</div>
        <div class="sheet-info">Sheet: ${plank.sheetNum}</div>
        <div class="plank-size">${parseFloat(String(displayWidth)).toFixed(1)} x ${parseFloat(String(displayHeight)).toFixed(1)}</div>
        <div class="room-name">${roomName}</div>
        ${customerDetails?.firmName ? `<div class="firm-name">${customerDetails.firmName}</div>` : ''}
        ${customerDetails?.customerName ? `<div class="customer-name">${customerDetails.customerName}</div>` : ''}
      </div>
      <div class="label-right">
        <div class="plank-id">${plank.id}</div>
        ${miniMapSvg}
        <div class="eb-info">EB - ${displayEB} mm</div>
      </div>
    </div>
  `;
}

/**
 * Generate the CSS styles for labels
 */
function getLabelStyles(sheetWidth: number, sheetHeight: number): string {
  return `
    body { 
      font-family: 'Segoe UI', Tahoma, sans-serif; 
      margin: 0; 
      padding: 5mm; 
      background: #f0f0f0; 
    }
    .label-container {
      width: 75mm; 
      height: 50mm; 
      border: 1px dashed #999;
      margin: 2mm;
      padding: 3mm;
      display: flex;
      box-sizing: border-box;
      background: white;
      page-break-inside: avoid; 
      break-inside: avoid;
    }
    .label-left { 
      flex: 2; 
      display: flex; 
      flex-direction: column; 
      font-size: 10pt; 
      line-height: 1.4; 
      overflow: hidden; 
    }
    .label-right { 
      flex: 1.2; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      text-align: center; 
    }
    .header-text { 
      font-size: 8pt; 
      font-weight: bold; 
    }
    .plank-name { 
      font-size: 11pt; 
      font-weight: bold; 
      margin-top: 2mm; 
    }
    .plank-material { 
      font-size: 10pt; 
    }
    .plank-size { 
      font-size: 9pt; 
    }
    .sheet-info { 
      font-size: 10pt; 
      margin-top: auto; 
      font-weight: bold; 
    }
    .room-name { 
      font-size: 9pt; 
      font-weight: bold; 
    }
    .firm-name { 
      font-size: 14pt; 
      font-weight: 900; 
      margin-top: 1mm; 
    }
    .customer-name { 
      font-size: 14pt; 
      font-weight: 900; 
      margin-bottom: 1mm; 
    }
    .plank-id { 
      font-size: 24pt; 
      font-weight: bold; 
    }
    .minimap { 
      height: calc(100% - 32px);
      width: auto; 
      border: 1px solid #000;
      aspect-ratio: ${sheetWidth} / ${sheetHeight};
    }
    .sheet-bg { 
      fill: #fff; 
    }
    .plank-other { 
      fill: #fff; 
      stroke: #aaa; 
      stroke-width: 25px; 
    }
    .plank-highlight { 
      fill: #000; 
      stroke: #000; 
      stroke-width: 25px; 
    }
    .eb-info { 
      font-size: 7pt; 
      margin-top: 1mm; 
    }
    @media print {
      body { 
        background: #fff; 
        padding: 0; 
      }
      .label-container { 
        border: 1px solid #000; 
        margin: 0; 
      }
    }
  `;
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Generate labels HTML content
 */
export function generateLabelsHTML(
  nestResults: NestResult[],
  customerDetails?: CustomerDetails,
  sheetWidth: number = SHEET_CONSTANTS.SHEET_WIDTH,
  sheetHeight: number = SHEET_CONSTANTS.SHEET_HEIGHT
): string {
  if (nestResults.length === 0) {
    return '<p>No planks to generate labels for.</p>';
  }

  const sheetGroups = groupBySheet(nestResults);
  const sortedSheetNumbers = Array.from(sheetGroups.keys()).sort((a, b) => a - b);

  let labelsHTML = '';

  sortedSheetNumbers.forEach((sheetNum) => {
    const planksOnSheet = sheetGroups.get(sheetNum) || [];
    planksOnSheet.forEach((plank) => {
      labelsHTML += createLabelHTML(plank, planksOnSheet, customerDetails, sheetWidth, sheetHeight);
    });
  });

  return labelsHTML;
}

/**
 * Generate full HTML document for labels (for new window)
 */
export function generateLabelsDocument(
  nestResults: NestResult[],
  customerDetails?: CustomerDetails,
  sheetWidth: number = SHEET_CONSTANTS.SHEET_WIDTH,
  sheetHeight: number = SHEET_CONSTANTS.SHEET_HEIGHT
): string {
  const labelsContent = generateLabelsHTML(nestResults, customerDetails, sheetWidth, sheetHeight);
  const styles = getLabelStyles(sheetWidth, sheetHeight);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Labels</title>
      <meta charset="utf-8">
      <style>${styles}</style>
    </head>
    <body>
      ${labelsContent}
    </body>
    </html>
  `;
}

/**
 * Open labels in a new window for printing
 */
export function printLabels(
  nestResults: NestResult[],
  customerDetails?: CustomerDetails,
  autoPrint: boolean = true,
  sheetWidth: number = SHEET_CONSTANTS.SHEET_WIDTH,
  sheetHeight: number = SHEET_CONSTANTS.SHEET_HEIGHT
): void {
  if (nestResults.length === 0) {
    console.warn('No planks to print labels for');
    return;
  }

  const htmlContent = generateLabelsDocument(nestResults, customerDetails, sheetWidth, sheetHeight);
  
  const newWindow = window.open('', '_blank');
  if (!newWindow) {
    console.error('Could not open new window for printing');
    return;
  }

  newWindow.document.write(htmlContent);
  newWindow.document.close();
  newWindow.focus();

  if (autoPrint) {
    // Wait for content to load before printing
    setTimeout(() => {
      newWindow.print();
    }, 500);
  }
}

/**
 * View labels in a new window (without auto-print)
 */
export function viewLabels(
  nestResults: NestResult[],
  customerDetails?: CustomerDetails,
  sheetWidth: number = SHEET_CONSTANTS.SHEET_WIDTH,
  sheetHeight: number = SHEET_CONSTANTS.SHEET_HEIGHT
): void {
  printLabels(nestResults, customerDetails, false, sheetWidth, sheetHeight);
}

export default printLabels;
