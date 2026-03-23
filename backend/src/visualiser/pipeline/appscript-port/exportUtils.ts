/**
 * Export utilities for pipeline results: CSV, Excel, and ZIP download.
 */

import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import type { PipelineResult } from './pipeline';
import type { GCodeResult } from './gcode';

/** Escape a cell value for CSV (wrap in quotes if contains comma or quote). */
function escapeCsvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Export a single table (header + rows) as CSV and trigger download.
 */
export function exportToCSV(
  header: string[],
  rows: unknown[][],
  filename: string
): void {
  const headerLine = header.map(escapeCsvCell).join(',');
  const dataLines = rows.map((row) =>
    row.map((cell) => escapeCsvCell(cell)).join(',')
  );
  const csv = [headerLine, ...dataLines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export multiple sheets as a single Excel workbook and trigger download.
 */
export function exportToExcel(
  sheets: { name: string; header: string[]; rows: unknown[][] }[],
  filename: string
): void {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const wsData = [sheet.header, ...sheet.rows] as (string | number)[][];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Build CSV content from header and rows (for use in ZIP).
 */
function toCsvString(header: string[], rows: unknown[][]): string {
  const headerLine = header.map(escapeCsvCell).join(',');
  const dataLines = rows.map((row) =>
    row.map((cell) => escapeCsvCell(cell)).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Bundle all pipeline outputs as CSV files in a single ZIP and trigger download.
 * If gcodeResults is provided, adds G-code NC files under G_CODES/Material/ThicknessMM/.
 */
export function exportAllAsZip(
  pipelineResult: PipelineResult,
  projectName: string,
  gcodeResults?: GCodeResult[]
): void {
  const zip = new JSZip();
  const safeName = (projectName || 'export').replace(/[^\w\s-]/g, '_').trim() || 'export';
  const date = new Date().toISOString().slice(0, 10);

  if (gcodeResults && gcodeResults.length > 0) {
    const gCodesFolder = zip.folder('G_CODES');
    if (gCodesFolder) {
      const matFolders: Record<string, JSZip> = {};
      const thickFolders: Record<string, JSZip> = {};
      for (const result of gcodeResults) {
        const matName = result.materialFolder;
        const thickName = `${result.thickness}MM`;
        let matFolder = matFolders[matName];
        if (!matFolder) {
          matFolder = gCodesFolder.folder(matName) ?? gCodesFolder;
          matFolders[matName] = matFolder;
        }
        const thickKey = `${matName}/${thickName}`;
        let thickFolder = thickFolders[thickKey];
        if (!thickFolder) {
          thickFolder = matFolder.folder(thickName) ?? matFolder;
          thickFolders[thickKey] = thickFolder;
        }
        thickFolder.file(result.fileName, result.content);
      }
    }
  }

  zip.file(
    `${safeName}_formatted_data_${date}.csv`,
    toCsvString(pipelineResult.formattedData.header, pipelineResult.formattedData.rows)
  );
  zip.file(
    `${safeName}_plank_list_${date}.csv`,
    toCsvString(pipelineResult.plankList.header, pipelineResult.plankList.rows)
  );
  zip.file(
    `${safeName}_cutlist_${date}.csv`,
    toCsvString(pipelineResult.cutlist.header, pipelineResult.cutlist.rows)
  );
  zip.file(
    `${safeName}_material_summary_${date}.csv`,
    toCsvString(pipelineResult.materialSummary.header, pipelineResult.materialSummary.rows)
  );
  zip.file(
    `${safeName}_pressing_list_${date}.csv`,
    toCsvString(pipelineResult.pressingList.tableHeader, pipelineResult.pressingList.rows)
  );
  zip.file(
    `${safeName}_material_estimate_plywood_${date}.csv`,
    toCsvString(pipelineResult.materialEstimate.plywood.header, pipelineResult.materialEstimate.plywood.rows)
  );
  zip.file(
    `${safeName}_material_estimate_laminate_${date}.csv`,
    toCsvString(pipelineResult.materialEstimate.laminate.header, pipelineResult.materialEstimate.laminate.rows)
  );
  zip.file(
    `${safeName}_material_estimate_edge_${date}.csv`,
    toCsvString(pipelineResult.materialEstimate.edgeBanding.header, pipelineResult.materialEstimate.edgeBanding.rows)
  );
  zip.file(
    `${safeName}_material_estimate_hardware_${date}.csv`,
    toCsvString(pipelineResult.materialEstimate.hardware.header, pipelineResult.materialEstimate.hardware.rows)
  );

  if (pipelineResult.inputQA.sections.length > 0) {
    const sec = pipelineResult.inputQA.sections[0];
    zip.file(
      `${safeName}_input_qa_${date}.csv`,
      toCsvString(sec.tableHeaders, sec.rows)
    );
  }
  zip.file(
    `${safeName}_output_qa_${date}.csv`,
    toCsvString(pipelineResult.outputQA.tableHeader, pipelineResult.outputQA.rows)
  );

  zip.generateAsync({ type: 'blob' }).then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}_all_${date}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  });
}
