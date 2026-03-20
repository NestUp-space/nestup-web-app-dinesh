/**
 * pdfGenerator.ts
 * Vector PDF generation for cutlist visualization
 * Matches AppScript's generateVectorPdf(); draws L-cuts (pink), Gola (purple), Incuts (cyan), features column, legend.
 */

import { jsPDF } from 'jspdf';
import { NestResult, SHEET_CONSTANTS } from '@/types/visualiser';

// Plank with optional L-cuts, Gola, Incuts (from cutlist 2D or enriched nest)
interface Triplet { start: { x: number; y: number }; center: { x: number; y: number }; end: { x: number; y: number };}
interface IncutPoints { point1: { x: number; y: number }; point2: { x: number; y: number }; point3?: { x: number; y: number }; point4?: { x: number; y: number }; }
interface NestResultPdf extends NestResult {
  l_cuts?: Triplet[];
  gola_profiles?: Triplet[];
  incut_cuts?: IncutPoints[];
}

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

/** Plank-local (x,y) to PDF coords; origin bottom-left, PDF Y down. */
function toPdfCoords(px: number, py: number, plankHeight: number, x: number, y: number, scale: number): [number, number] {
  return [px + x * scale, py + (plankHeight - y) * scale];
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

      const pp = p as NestResultPdf;
      // L-cuts: pink polyline start → center → end
      if (pp.l_cuts?.length) {
        doc.setDrawColor(255, 105, 180); // pink
        doc.setLineWidth(0.4);
        pp.l_cuts.forEach(lc => {
          const [sx, sy] = toPdfCoords(px, py, p.height, lc.start.x, lc.start.y, finalScale);
          const [cx, cy] = toPdfCoords(px, py, p.height, lc.center.x, lc.center.y, finalScale);
          const [ex, ey] = toPdfCoords(px, py, p.height, lc.end.x, lc.end.y, finalScale);
          doc.line(sx, sy, cx, cy);
          doc.line(cx, cy, ex, ey);
        });
      }
      // Gola: purple polyline start → center → end
      if (pp.gola_profiles?.length) {
        doc.setDrawColor(128, 0, 128); // purple
        doc.setLineWidth(0.4);
        pp.gola_profiles.forEach(gp => {
          const [sx, sy] = toPdfCoords(px, py, p.height, gp.start.x, gp.start.y, finalScale);
          const [cx, cy] = toPdfCoords(px, py, p.height, gp.center.x, gp.center.y, finalScale);
          const [ex, ey] = toPdfCoords(px, py, p.height, gp.end.x, gp.end.y, finalScale);
          doc.line(sx, sy, cx, cy);
          doc.line(cx, cy, ex, ey);
        });
      }
      // Incuts: cyan lines point1→point2, point3→point4 if present
      if (pp.incut_cuts?.length) {
        doc.setDrawColor(0, 188, 212); // cyan
        doc.setLineWidth(0.4);
        pp.incut_cuts.forEach(ic => {
          const [x1, y1] = toPdfCoords(px, py, p.height, ic.point1.x, ic.point1.y, finalScale);
          const [x2, y2] = toPdfCoords(px, py, p.height, ic.point2.x, ic.point2.y, finalScale);
          doc.line(x1, y1, x2, y2);
          if (ic.point3 && ic.point4) {
            const [x3, y3] = toPdfCoords(px, py, p.height, ic.point3.x, ic.point3.y, finalScale);
            const [x4, y4] = toPdfCoords(px, py, p.height, ic.point4.x, ic.point4.y, finalScale);
            doc.line(x3, y3, x4, y4);
          }
        });
      }
    });

    // 3. TABLE (Bottom) with Features column
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
    doc.text('Features', margin + 115, rowY);

    doc.line(margin, rowY + 1, pageW - margin, rowY + 1);
    rowY += 5;
    doc.setFont('helvetica', 'normal');

    const planksToShow = sheetPlanks.slice(0, 15);
    planksToShow.forEach(p => {
      const pp = p as NestResultPdf;
      const nH = p.holes?.length ?? 0;
      const nL = pp.l_cuts?.length ?? 0;
      const nG = pp.gola_profiles?.length ?? 0;
      const nI = pp.incut_cuts?.length ?? 0;
      const featuresStr = `${nH}H ${nL}L ${nG}G ${nI}I`;

      doc.text(String(p.id), margin, rowY);
      let name = p.name || '';
      if (name.length > 28) name = name.substring(0, 28) + '...';
      doc.text(name, margin + 15, rowY);
      doc.text(`${Math.round(p.width)} x ${Math.round(p.height)}`, margin + 70, rowY);
      doc.text(featuresStr, margin + 115, rowY);
      rowY += 4;
    });

    // 4. LEGEND (color key)
    let legendY = rowY + 4;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Legend:', margin, legendY);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(100);
    doc.setFillColor(200, 200, 200);
    doc.rect(margin + 22, legendY - 2.5, 3, 2, 'FD');
    doc.text('Holes', margin + 27, legendY);
    doc.setDrawColor(255, 140, 0);
    doc.setFillColor(255, 140, 0);
    doc.rect(margin + 45, legendY - 2.5, 3, 2, 'FD');
    doc.text('Grooves', margin + 50, legendY);
    doc.setDrawColor(255, 105, 180);
    doc.setLineWidth(0.5);
    doc.line(margin + 75, legendY - 1.5, margin + 78, legendY - 1.5);
    doc.text('L-cuts', margin + 80, legendY);
    doc.setDrawColor(128, 0, 128);
    doc.line(margin + 98, legendY - 1.5, margin + 101, legendY - 1.5);
    doc.text('Gola', margin + 103, legendY);
    doc.setDrawColor(0, 188, 212);
    doc.line(margin + 118, legendY - 1.5, margin + 121, legendY - 1.5);
    doc.text('Incuts', margin + 123, legendY);
    doc.setLineWidth(0.5);

    // 5. FOOTER
    doc.setFontSize(8);
    doc.text(`Page ${i + 1} of ${sheetsToPrint.length}`, pageW / 2, pageH - 5, { align: 'center' });
  }

  // Return as Blob
  return doc.output('blob');
}

/**
 * Enrich SheetPdfData planks with l_cuts, gola_profiles, incut_cuts from cutlist 2D array.
 * Use when PDF is generated from pipeline result so the cutlist has L_cut_*, Gola_profile_*, Incut_cut_* columns.
 */
export function enrichSheetPdfDataFromCutlist(
  sheets: SheetPdfData[],
  cutlistHeader: string[],
  cutlistRows: unknown[][]
): SheetPdfData[] {
  const headers = cutlistHeader.map((h) => String(h).trim());
  const sheetIdx = headers.findIndex((h) => h === 'Sheet' || h.toLowerCase() === 'sheet');
  const idIdx = headers.findIndex((h) => h === 'Plank ID' || h.toLowerCase() === 'plank id');
  if (sheetIdx === -1 || idIdx === -1) return sheets;

  const parseNum = (v: unknown) => (v !== undefined && v !== null && v !== '' ? parseFloat(String(v)) : NaN);
  const key = (sheetNum: number, plankId: string) => `${sheetNum}_${String(plankId).trim()}`;
  const map = new Map<string, { l_cuts: Triplet[]; gola_profiles: Triplet[]; incut_cuts: IncutPoints[] }>();

  for (let r = 0; r < cutlistRows.length; r++) {
    const row = cutlistRows[r] as unknown[];
    const sheetNum = Math.floor(parseNum(row[sheetIdx])) || 0;
    const plankId = String(row[idIdx] ?? '').trim();
    if (!plankId) continue;

    const l_cuts: Triplet[] = [];
    const gola_profiles: Triplet[] = [];
    const incut_cuts: IncutPoints[] = [];

    for (let i = 1; i <= 20; i++) {
      const sx = headers.indexOf(`L_cut_${i}_start_X`);
      if (sx === -1) break;
      const sy = headers.indexOf(`L_cut_${i}_start_Y`);
      const cx = headers.indexOf(`L_cut_${i}_center_X`);
      const cy = headers.indexOf(`L_cut_${i}_center_Y`);
      const ex = headers.indexOf(`L_cut_${i}_end_X`);
      const ey = headers.indexOf(`L_cut_${i}_end_Y`);
      if (sy === -1 || cx === -1 || cy === -1 || ex === -1 || ey === -1) continue;
      const startX = parseNum(row[sx]); const startY = parseNum(row[sy]);
      const centerX = parseNum(row[cx]); const centerY = parseNum(row[cy]);
      const endX = parseNum(row[ex]); const endY = parseNum(row[ey]);
      if (Number.isNaN(startX) || Number.isNaN(startY) || Number.isNaN(centerX) || Number.isNaN(centerY) || Number.isNaN(endX) || Number.isNaN(endY)) continue;
      if (startX === 0 && startY === 0 && centerX === 0 && centerY === 0 && endX === 0 && endY === 0) continue;
      l_cuts.push({ start: { x: startX, y: startY }, center: { x: centerX, y: centerY }, end: { x: endX, y: endY } });
    }
    for (let i = 1; i <= 20; i++) {
      const sx = headers.indexOf(`Gola_profile_${i}_start_X`);
      if (sx === -1) break;
      const sy = headers.indexOf(`Gola_profile_${i}_start_Y`);
      const cx = headers.indexOf(`Gola_profile_${i}_center_X`);
      const cy = headers.indexOf(`Gola_profile_${i}_center_Y`);
      const ex = headers.indexOf(`Gola_profile_${i}_end_X`);
      const ey = headers.indexOf(`Gola_profile_${i}_end_Y`);
      if (sy === -1 || cx === -1 || cy === -1 || ex === -1 || ey === -1) continue;
      const startX = parseNum(row[sx]); const startY = parseNum(row[sy]);
      const centerX = parseNum(row[cx]); const centerY = parseNum(row[cy]);
      const endX = parseNum(row[ex]); const endY = parseNum(row[ey]);
      if (Number.isNaN(startX) || Number.isNaN(startY) || Number.isNaN(centerX) || Number.isNaN(centerY) || Number.isNaN(endX) || Number.isNaN(endY)) continue;
      if (startX === 0 && startY === 0 && centerX === 0 && centerY === 0 && endX === 0 && endY === 0) continue;
      gola_profiles.push({ start: { x: startX, y: startY }, center: { x: centerX, y: centerY }, end: { x: endX, y: endY } });
    }
    for (let i = 1; i <= 20; i++) {
      const p1x = headers.indexOf(`Incut_cut_${i}_point1_X`);
      if (p1x === -1) break;
      const p1y = headers.indexOf(`Incut_cut_${i}_point1_Y`);
      const p2x = headers.indexOf(`Incut_cut_${i}_point2_X`);
      const p2y = headers.indexOf(`Incut_cut_${i}_point2_Y`);
      if (p1y === -1 || p2x === -1 || p2y === -1) continue;
      const p1X = parseNum(row[p1x]); const p1Y = parseNum(row[p1y]);
      const p2X = parseNum(row[p2x]); const p2Y = parseNum(row[p2y]);
      if (Number.isNaN(p1X) || Number.isNaN(p1Y) || Number.isNaN(p2X) || Number.isNaN(p2Y)) continue;
      if (p1X === 0 && p1Y === 0 && p2X === 0 && p2Y === 0) continue;
      const p3x = headers.indexOf(`Incut_cut_${i}_point3_X`);
      const p3y = headers.indexOf(`Incut_cut_${i}_point3_Y`);
      const p4x = headers.indexOf(`Incut_cut_${i}_point4_X`);
      const p4y = headers.indexOf(`Incut_cut_${i}_point4_Y`);
      let point3: { x: number; y: number } | undefined;
      let point4: { x: number; y: number } | undefined;
      if (p3x !== -1 && p3y !== -1 && p4x !== -1 && p4y !== -1) {
        const p3X = parseNum(row[p3x]); const p3Y = parseNum(row[p3y]);
        const p4X = parseNum(row[p4x]); const p4Y = parseNum(row[p4y]);
        if (!Number.isNaN(p3X) && !Number.isNaN(p3Y)) point3 = { x: p3X, y: p3Y };
        if (!Number.isNaN(p4X) && !Number.isNaN(p4Y)) point4 = { x: p4X, y: p4Y };
      }
      incut_cuts.push({ point1: { x: p1X, y: p1Y }, point2: { x: p2X, y: p2Y }, point3, point4 });
    }

    if (l_cuts.length > 0 || gola_profiles.length > 0 || incut_cuts.length > 0)
      map.set(key(sheetNum, plankId), { l_cuts, gola_profiles, incut_cuts });
  }

  return sheets.map((sheet) => ({
    ...sheet,
    planks: sheet.planks.map((p) => {
      const en = map.get(key(sheet.sheetNum, p.id));
      if (!en) return p;
      return { ...p, ...en } as NestResultPdf;
    }),
  }));
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
