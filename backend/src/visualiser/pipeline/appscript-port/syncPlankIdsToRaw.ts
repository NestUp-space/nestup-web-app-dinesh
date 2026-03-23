/**
 * Sync plank_id from formatted data (Formatted_Plank_Data style) back to raw 2D array.
 * Match by (room_name, box_name, plank_name, box_model) with occurrence.
 * Ensures raw has a plank_id column (appends if missing).
 * Port of AppScript foramtteddatasync.js syncAllPlankIds / getRawPlankRows.
 */

export interface FormattedData2D {
  header: string[];
  rows: unknown[][];
}

function trim(s: unknown): string {
  return String(s ?? '').trim();
}

function findHeaderIndex(headers: string[], names: string[]): number {
  const normalized = headers.map((h) => trim(h).toLowerCase().replace(/\s+/g, '_'));
  for (const name of names) {
    const n = name.toLowerCase();
    const i = normalized.findIndex((h) => h === n || h.replace(/_/g, '') === n.replace(/_/g, ''));
    if (i >= 0) return i;
  }
  return -1;
}

interface RawPlankRow {
  rowIndex: number;
  room: string;
  box_name: string;
  plank_name: string;
  box_model: string;
}

function getRawPlankRows(rawValues: unknown[][], rawHeaders: string[]): RawPlankRow[] {
  if (!rawValues || rawValues.length < 2) return [];
  const colEntity = findHeaderIndex(rawHeaders, ['Entity Name', 'entity_name']);
  const colLevel = findHeaderIndex(rawHeaders, ['Level', 'level']);
  const colRoom = findHeaderIndex(rawHeaders, ['Room_Name', 'Room_name', 'room_name']);
  const colBoxModel = findHeaderIndex(rawHeaders, ['Box_Model', 'Box_model', 'box_model']);
  if (colEntity === -1 || colLevel === -1) return [];

  const result: RawPlankRow[] = [];
  let currentBox = '';
  let currentRoom = '';
  let currentBoxModel = '';

  for (let i = 1; i < rawValues.length; i++) {
    const row = rawValues[i] as unknown[];
    const level = row[colLevel];
    const entityName = trim(row[colEntity]);

    if (Number(level) === 1) {
      currentBox = entityName;
      currentRoom = colRoom >= 0 ? trim(row[colRoom]) : '';
      currentBoxModel = colBoxModel >= 0 ? trim(row[colBoxModel]) : '';
    } else if (Number(level) === 2) {
      result.push({
        rowIndex: i,
        room: currentRoom,
        box_name: currentBox,
        plank_name: entityName,
        box_model: currentBoxModel,
      });
    }
  }
  return result;
}

function makeSyncKey(room: string, boxName: string, plankName: string, boxModel: string, occurrence: number): string {
  return `${room}\t${boxName}\t${plankName}\t${boxModel}\t${occurrence}`;
}

/**
 * Syncs plank_id from formatted data into raw data rows.
 * Matches Level-2 raw rows to formatted rows by (room_name, box_name, plank_name, box_model) and occurrence.
 * Returns a new raw 2D array with plank_id column updated (or appended).
 */
export function syncPlankIdsToRaw(
  formattedData: FormattedData2D,
  rawValues: unknown[][]
): unknown[][] {
  if (!rawValues.length) return rawValues;
  const rawHeaders = rawValues[0].map((h) => trim(String(h))) as string[];
  const formattedHeader = formattedData.header.map((h) => trim(String(h)));
  const roomCol = findHeaderIndex(formattedHeader, ['room_name']);
  const boxNameCol = findHeaderIndex(formattedHeader, ['box_name']);
  const plankNameCol = findHeaderIndex(formattedHeader, ['plank_name']);
  const plankIdCol = findHeaderIndex(formattedHeader, ['plank_id']);
  const boxModelCol = findHeaderIndex(formattedHeader, ['box_model']);

  if (roomCol === -1 || boxNameCol === -1 || plankNameCol === -1 || plankIdCol === -1) {
    return rawValues;
  }

  // Build map (room, box_name, plank_name, box_model, occurrence) -> plank_id from formatted
  const formattedMap = new Map<string, string>();
  const countTriple: Record<string, number> = {};
  for (let i = 0; i < formattedData.rows.length; i++) {
    const row = formattedData.rows[i] as unknown[];
    const room_name = trim(row[roomCol]);
    const box_name = trim(row[boxNameCol]);
    const plank_name = trim(row[plankNameCol]);
    const box_model = boxModelCol >= 0 ? trim(row[boxModelCol]) : '';
    const plank_id = row[plankIdCol];
    const tripleKey = `${room_name}\t${box_name}\t${plank_name}\t${box_model}`;
    countTriple[tripleKey] = (countTriple[tripleKey] || 0) + 1;
    const occurrence = countTriple[tripleKey];
    const key = makeSyncKey(room_name, box_name, plank_name, box_model, occurrence);
    const value = plank_id != null && plank_id !== '' ? String(plank_id).trim() : '';
    formattedMap.set(key, value);
  }

  // Ensure raw has plank_id column
  let rawPlankIdCol = findHeaderIndex(rawHeaders, ['plank_id', 'Plank ID', 'plank id']);
  const outRows = rawValues.map((row) => (row as unknown[]).slice());
  const outHeaders = rawHeaders.slice();

  if (rawPlankIdCol === -1) {
    outHeaders.push('plank_id');
    rawPlankIdCol = outHeaders.length - 1;
    for (let r = 1; r < outRows.length; r++) {
      outRows[r].push('');
    }
    outRows[0] = outHeaders;
  }

  const planks = getRawPlankRows(rawValues, rawHeaders);
  const rawCountTriple: Record<string, number> = {};
  for (const pl of planks) {
    const tripleKey = `${pl.room}\t${pl.box_name}\t${pl.plank_name}\t${pl.box_model}`;
    rawCountTriple[tripleKey] = (rawCountTriple[tripleKey] || 0) + 1;
    const occurrence = rawCountTriple[tripleKey];
    const key = makeSyncKey(pl.room, pl.box_name, pl.plank_name, pl.box_model, occurrence);
    const plankIdValue = formattedMap.get(key) ?? '';
    const row = outRows[pl.rowIndex];
    if (row && rawPlankIdCol < row.length) {
      row[rawPlankIdCol] = plankIdValue;
    }
  }

  outRows[0] = outHeaders;
  return outRows;
}
