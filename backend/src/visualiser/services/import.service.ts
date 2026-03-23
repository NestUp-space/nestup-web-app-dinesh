/**
 * Import Service — parse CSV / Excel uploads into raw pipeline grids.
 */

import * as XLSX from 'xlsx';
import type { ImportResult } from '../types/visualiser.types';

const REQUIRED_HEADERS = [
  'entity_name',
  'Level',
  'material',
  'Room_name',
  'Unit_location',
  'box_model',
  'box_type',
  'LenX',
  'LenY',
  'LenZ',
  'X',
  'Y',
  'Z',
];

function parseCSV(text: string): unknown[][] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      lines.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  if (current) lines.push(current);

  return lines.map((line) => {
    const row: string[] = [];
    let cell = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        q = !q;
      } else if (c === ',' && !q) {
        row.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    row.push(cell.trim());
    return row;
  });
}

function parseExcelBuffer(buffer: Buffer): unknown[][] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) return [];
  const ws = wb.Sheets[firstSheet];
  const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
  return data as unknown[][];
}

function normalizeHeader(h: unknown): string {
  return String(h ?? '').trim();
}

function validateHeaders(header: string[]): { ok: boolean; missing: string[] } {
  const normalized = header.map((h) => normalizeHeader(h).toLowerCase().replace(/\s+/g, '_'));
  const missing = REQUIRED_HEADERS.filter((req) => {
    const r = req.toLowerCase();
    return !normalized.some((n) => n === r || n === req);
  });
  return { ok: missing.length === 0, missing };
}

const PREVIEW_ROWS = 20;

export class ImportService {
  static parseFile(buffer: Buffer, mimetype: string, originalName: string): ImportResult {
    const ext = originalName.split('.').pop()?.toLowerCase() ?? '';
    let data: unknown[][];

    const isCsv =
      ext === 'csv' ||
      mimetype === 'text/csv' ||
      mimetype === 'application/csv' ||
      mimetype === 'text/plain';

    const isExcel =
      ext === 'xlsx' ||
      ext === 'xls' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimetype === 'application/vnd.ms-excel';

    if (isCsv) {
      data = parseCSV(buffer.toString('utf-8'));
    } else if (isExcel) {
      data = parseExcelBuffer(buffer);
    } else {
      throw new Error('Unsupported file type. Use .csv, .xlsx, or .xls');
    }

    if (!data.length) {
      throw new Error('File is empty');
    }

    const headers = (data[0] as unknown[]).map((h) => normalizeHeader(h));
    const validationErrors: string[] = [];

    if (data.length > 1) {
      const v = validateHeaders(headers);
      if (!v.ok) {
        validationErrors.push(`Missing columns: ${v.missing.join(', ')}`);
      }
    } else {
      validationErrors.push('File must include a header row and at least one data row.');
    }

    const preview = data.slice(0, PREVIEW_ROWS + 1);

    return {
      rawValues: data,
      headers,
      rowCount: Math.max(0, data.length - 1),
      validationErrors,
      preview,
    };
  }
}
