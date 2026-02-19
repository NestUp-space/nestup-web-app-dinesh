/**
 * pdfGenerator.ts
 * Vector PDF generation for cutlist visualization
 * Matches AppScript's generateVectorPdf() function
 */

import { jsPDF } from 'jspdf';
import { NestResult, SHEET_CONSTANTS } from '@/types/visualiser';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get clean material name (remove room info and thickness)
 */
function getCleanMaterial(material: string): string {
  if (!material) return 'Sheet';
  return String(material).replace(/\s*\([^)]+\)/g, '').replace(/-\s*\d+mm/i, '').trim();
}

// ============================================
// PDF GENERATION TYPES
// ============================================

export interface SheetPdfData {
  sheetNum: number;
  planks: NestResult[];
  displayTitle: string;
  material: string;
  utilization: number;
}

export interface PdfGenerationOptions {
  clientName?: string;
  projectName?: string;
  sheets: SheetPdfData[];
  printAll?: boolean;
  selectedSheet?: number;
}

// ============================================
// MAIN PDF GENERATION FUNCTION
// ============================================

/**
 * Generate vector PDF for cutlist visualization
 * Matches AppScript's generateVectorPdf() function
 */
export async function generateCutlistPdf(options: PdfGenerationOptions): Promise<Blob> {
  const { 
    clientName = 'Client',
    projectName = 'Cutlist',
    sheets,
    printAll = true,
    selectedSheet = 1
  } = options;

  const doc = new jsPDF({ 
    orientation: 'portrait', 
    unit: 'mm', 
    format: 'a4' 
  });

  const pageW = 210;
  const pageH = 297;
  const margin = 10;
  
  // Define areas
  const headerH = 30;
  const tableH = 80; // Reserve space for the table at bottom
  const vizAreaH = pageH - margin * 2 - headerH - tableH;
  const vizAreaW = pageW - margin * 2;

  const sheetWidth = SHEET_CONSTANTS.SHEET_WIDTH;
  const sheetHeight = SHEET_CONSTANTS.SHEET_HEIGHT;

  // Determine sheets to print
  const sheetsToPrint = printAll 
    ? sheets 
    : sheets.filter(s => s.sheetNum === selectedSheet);

  if (sheetsToPrint.length === 0) {
    throw new Error('No sheets to print');
  }

  // Loop through sheets
  for (let i = 0; i < sheetsToPrint.length; i++) {
    if (i > 0) doc.addPage();

    const sheetData = sheetsToPrint[i];
    const sheetPlanks = sheetData.planks;

    // 1. HEADER
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(sheetData.displayTitle, margin, margin + 8);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Material: ${sheetData.material}`, margin, margin + 14);

    doc.text(clientName, pageW - margin, margin + 8, { align: 'right' });
    doc.text(new Date().toLocaleDateString(), pageW - margin, margin + 14, { align: 'right' });

    doc.setLineWidth(0.5);
    doc.line(margin, margin + 22, pageW - margin, margin + 22);

    // 2. DRAW SHEET (Vector Geometry)
    // Calculate Scale to fit A4 width/height constraints
    const scaleX = vizAreaW / sheetWidth;
    const scaleY = vizAreaH / sheetHeight;
    const finalScale = Math.min(scaleX, scaleY);

    // Centering Logic
    const drawW = sheetWidth * finalScale;
    const drawH = sheetHeight * finalScale;
    const startX = margin + (vizAreaW - drawW) / 2;
    const startY = margin + headerH + (vizAreaH - drawH) / 2;

    // Draw Sheet Border
    doc.setDrawColor(0);
    doc.rect(startX, startY, drawW, drawH);

    // Draw Planks
    sheetPlanks.forEach(p => {
      const px = startX + (p.x * finalScale);
      // CNC FIX: Flip Y for sheet placement
      // Origin (0,0) is bottom-left, so Y increases UP.
      // PDF Y increases DOWN.
      const py = startY + ((sheetHeight - p.y - p.height) * finalScale);

      const pw = p.width * finalScale;
      const ph = p.height * finalScale;

      // Fill Plank
      doc.setFillColor(240, 240, 240); // Light Grey
      doc.setDrawColor(50);
      doc.rect(px, py, pw, ph, 'FD');

      // Draw ID (Only if it fits)
      if (pw > 5 && ph > 4) {
        doc.setFontSize(Math.min(8, ph));
        doc.setTextColor(0);
        doc.text(String(p.id), px + pw / 2, py + ph / 2, { 
          align: 'center', 
          baseline: 'middle' 
        } as any);
      }

      // Draw Holes (Vector)
      if (p.holes) {
        p.holes.forEach(h => {
          let rawW: number, rawH: number;

          if (h.isRectangular) {
            rawW = h.length || 10;
            rawH = h.width || 5;
          } else {
            rawW = h.diameter || 5;
            rawH = h.diameter || 5;
          }

          const finalHoleW = rawW * finalScale;
          const finalHoleH = rawH * finalScale;

          // CNC FIX: Flip Y inside plank
          const hx = px + (h.x * finalScale);
          const hy = py + ((p.height - h.y - rawH) * finalScale);

          if (h.isRectangular) {
            const type = (h.type || '').toLowerCase();
            if (type.includes('groove')) {
              doc.setDrawColor(255, 140, 0); // Orange Stroke
              doc.setFillColor(255, 140, 0); // Orange Fill
              doc.rect(hx, hy, finalHoleW, finalHoleH, 'FD');
            } else {
              doc.setDrawColor(100);
              doc.rect(hx, hy, finalHoleW, finalHoleH);
            }
          } else {
            // Circle
            doc.setDrawColor(100);
            const r = finalHoleW / 2;
            doc.circle(hx + r, hy + r, r);
          }
        });
      }
    });

    // 3. TABLE (Bottom)
    const tableTop = pageH - margin - tableH;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Part List (First 15)', margin, tableTop);

    let rowY = tableTop + 5;
    doc.setFontSize(8);
    doc.text('ID', margin, rowY);
    doc.text('Name', margin + 15, rowY);
    doc.text('Size (mm)', margin + 70, rowY);

    doc.line(margin, rowY + 1, pageW - margin, rowY + 1);
    rowY += 5;
    doc.setFont('helvetica', 'normal');

    // Limit table to fit (approx 15 lines)
    const planksToShow = sheetPlanks.slice(0, 15);
    planksToShow.forEach(p => {
      doc.text(String(p.id), margin, rowY);

      let name = p.name || '';
      if (name.length > 35) name = name.substring(0, 35) + '...';
      doc.text(name, margin + 15, rowY);

      doc.text(`${Math.round(p.width)} x ${Math.round(p.height)}`, margin + 70, rowY);
      rowY += 4;
    });

    // 4. FOOTER
    doc.setFontSize(8);
    doc.text(`Page ${i + 1} of ${sheetsToPrint.length}`, pageW / 2, pageH - 5, { align: 'center' });
  }

  // Return as Blob
  return doc.output('blob');
}

/**
 * Download PDF directly
 */
export async function downloadCutlistPdf(options: PdfGenerationOptions): Promise<void> {
  const blob = await generateCutlistPdf(options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options.printAll 
    ? `${options.projectName || 'Cutlist'}_AllSheets.pdf`
    : `${options.projectName || 'Cutlist'}_Sheet${options.selectedSheet}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
