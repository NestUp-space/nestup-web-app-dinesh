/**
 * Formatted-to-Raw Plank ID Sync
 * When plank_id is edited or rows are deleted in Formatted_Plank_Data,
 * this syncs the existing plank_id column value to the raw data sheet's last column.
 * Match key: (room_name, box_name, plank_name, box_model, occurrence). No new IDs are generated.
 */

// ========================================
// CONFIG – sheet and column names as-is (exact header strings)
// ========================================

const FORMATTED_SHEET_NAME = 'Formatted_Plank_Data';
const RAW_SHEET_NAME = 'raw data';

// Formatted_Plank_Data column headers (used as-is)
const FORMATTED_COL_ROOM_NAME = 'room_name';
const FORMATTED_COL_BOX_NAME = 'box_name';
const FORMATTED_COL_PLANK_NAME = 'plank_name';
const FORMATTED_COL_BOX_MODEL = 'box_model';
const FORMATTED_COL_PLANK_ID = 'plank_id';

// Raw data: Entity Name, Level, Room_Name, Box_Model for (room, box_name, plank_name, box_model). Last column = plank_id.
const RAW_COL_ENTITY_NAME = 'Entity Name';
const RAW_COL_LEVEL = 'Level';
const RAW_COL_ROOM = 'Room_Name';
const RAW_COL_BOX_MODEL = 'Box_Model';

// ========================================
// HELPERS – column indices from headers (exact match)
// ========================================

/**
 * Returns column indices (0-based) for formatted sheet. Uses header names as-is.
 * @param {string[]} headers - First row of Formatted_Plank_Data
 * @returns {{ room_name: number, box_name: number, plank_name: number, box_model: number, plank_id: number } | null}
 */
function getFormattedColumnIndices(headers) {
  const room_name = headers.indexOf(FORMATTED_COL_ROOM_NAME);
  const box_name = headers.indexOf(FORMATTED_COL_BOX_NAME);
  const plank_name = headers.indexOf(FORMATTED_COL_PLANK_NAME);
  const box_model = headers.indexOf(FORMATTED_COL_BOX_MODEL);
  const plank_id = headers.indexOf(FORMATTED_COL_PLANK_ID);
  if (room_name === -1 || box_name === -1 || plank_name === -1 || plank_id === -1) return null;
  return { room_name, box_name, plank_name, box_model, plank_id };
}

/**
 * Returns list of Level-2 (plank) rows in raw data with derived (room, box_name, plank_name, box_model) and sheet row index.
 * Level 1 = box row (Entity Name, Room_Name, Box_Model); Level 2 = plank row.
 * @param {Array[]} rawValues - getDataRange().getValues() for raw sheet
 * @returns {{ sheetRow: number, room: string, box_name: string, plank_name: string, box_model: string }[]}
 */
function getRawPlankRows(rawValues) {
  if (!rawValues || rawValues.length < 2) return [];
  const headers = rawValues[0].map(function (h) { return String(h).trim(); });
  const colEntity = headers.indexOf(RAW_COL_ENTITY_NAME);
  const colLevel = headers.indexOf(RAW_COL_LEVEL);
  const colRoom = headers.indexOf(RAW_COL_ROOM);
  const colBoxModel = headers.indexOf(RAW_COL_BOX_MODEL);
  if (colEntity === -1 || colLevel === -1) return [];

  const result = [];
  let currentBox = '';
  let currentRoom = '';
  let currentBoxModel = '';

  for (let i = 1; i < rawValues.length; i++) {
    const level = rawValues[i][colLevel];
    const entityName = String(rawValues[i][colEntity] != null ? rawValues[i][colEntity] : '').trim();

    if (Number(level) === 1) {
      currentBox = entityName;
      currentRoom = colRoom >= 0 ? String(rawValues[i][colRoom] != null ? rawValues[i][colRoom] : '').trim() : '';
      currentBoxModel = colBoxModel >= 0 ? String(rawValues[i][colBoxModel] != null ? rawValues[i][colBoxModel] : '').trim() : '';
    } else if (Number(level) === 2) {
      result.push({
        sheetRow: i + 1,
        room: currentRoom,
        box_name: currentBox,
        plank_name: entityName,
        box_model: currentBoxModel
      });
    }
  }
  return result;
}

function makeSyncKey(room, boxName, plankName, boxModel, occurrence) {
  return (room || '') + '\t' + (boxName || '') + '\t' + (plankName || '') + '\t' + (boxModel != null ? boxModel : '') + '\t' + occurrence;
}

/**
 * Finds the raw sheet row (1-based) for the given (room, box_name, plank_name, box_model) at the given occurrence.
 */
function findRawRowForPlank(ss, roomName, boxName, plankName, boxModel, occurrence) {
  const rawSheet = ss.getSheetByName(RAW_SHEET_NAME);
  if (!rawSheet) return null;
  const rawValues = rawSheet.getDataRange().getValues();
  const planks = getRawPlankRows(rawValues);
  let count = 0;
  for (let k = 0; k < planks.length; k++) {
    const p = planks[k];
    if ((p.room || '') === (roomName || '') && p.box_name === boxName && p.plank_name === plankName && (p.box_model || '') === (boxModel || '')) {
      count++;
      if (count === occurrence) return p.sheetRow;
    }
  }
  return null;
}

// ========================================
// onEdit – sync single or range edit in plank_id column to raw
// ========================================

/**
 * Trigger when user edits the spreadsheet. If the edit is in Formatted_Plank_Data
 * in the plank_id column, updates the matching raw row's last column to that value.
 */
function onEdit(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  if (sheet.getName() !== FORMATTED_SHEET_NAME) return;

  const ss = e.source;
  const formattedData = sheet.getDataRange().getValues();
  if (formattedData.length < 2) return;

  const headers = formattedData[0].map(function (h) { return String(h).trim(); });
  const cols = getFormattedColumnIndices(headers);
  if (!cols) return;

  const editedRow1 = e.range.getRow();
  const editedCol1 = e.range.getColumn();
  const numRows = e.range.getNumRows();
  const numCols = e.range.getNumColumns();

  // Check if edit is in plank_id column (1-based column index = cols.plank_id + 1)
  const plankIdColSheet = cols.plank_id + 1;
  if (editedCol1 !== plankIdColSheet) return;

  const rawSheet = ss.getSheetByName(RAW_SHEET_NAME);
  if (!rawSheet) return;

  const lastCol = rawSheet.getLastColumn();
  if (lastCol < 1) return;

  for (let r = 0; r < numRows; r++) {
    const sheetRow = editedRow1 + r;
    const dataIndex = sheetRow - 1;
    if (dataIndex < 1) continue;
    if (dataIndex >= formattedData.length) break;

    const rowData = formattedData[dataIndex];
    const room_name = String(rowData[cols.room_name] != null ? rowData[cols.room_name] : '').trim();
    const box_name = String(rowData[cols.box_name] != null ? rowData[cols.box_name] : '').trim();
    const box_model = cols.box_model >= 0 ? String(rowData[cols.box_model] != null ? rowData[cols.box_model] : '').trim() : '';
    const plank_name = String(rowData[cols.plank_name] != null ? rowData[cols.plank_name] : '').trim();
    const plankIdValue = rowData[cols.plank_id];
    const valueToWrite = (plankIdValue !== null && plankIdValue !== undefined && plankIdValue !== '')
      ? String(plankIdValue) : '';

    let occurrence = 0;
    for (let j = 1; j <= dataIndex; j++) {
      const rn = String(formattedData[j][cols.room_name] != null ? formattedData[j][cols.room_name] : '').trim();
      const bn = String(formattedData[j][cols.box_name] != null ? formattedData[j][cols.box_name] : '').trim();
      const bm = cols.box_model >= 0 ? String(formattedData[j][cols.box_model] != null ? formattedData[j][cols.box_model] : '').trim() : '';
      const pn = String(formattedData[j][cols.plank_name] != null ? formattedData[j][cols.plank_name] : '').trim();
      if (rn === room_name && bn === box_name && pn === plank_name && (bm || '') === (box_model || '')) occurrence++;
    }
    const rawRow = findRawRowForPlank(ss, room_name, box_name, plank_name, box_model, occurrence);
    if (rawRow != null) {
      rawSheet.getRange(rawRow, lastCol).setValue(valueToWrite);
    }
  }
}

// ========================================
// syncAllPlankIds – full sync from Formatted_Plank_Data to raw last column
// ========================================

/**
 * Reads Formatted_Plank_Data and sets each Level-2 raw row's last column to the
 * matching plank_id (or empty if not in formatted). Use after deleting rows in Formatted_Plank_Data.
 */
function syncAllPlankIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formattedSheet = ss.getSheetByName(FORMATTED_SHEET_NAME);
  const rawSheet = ss.getSheetByName(RAW_SHEET_NAME);

  if (!formattedSheet) {
    SpreadsheetApp.getUi().alert('Sheet "' + FORMATTED_SHEET_NAME + '" not found.');
    return;
  }
  if (!rawSheet) {
    SpreadsheetApp.getUi().alert('Sheet "' + RAW_SHEET_NAME + '" not found.');
    return;
  }

  const formattedValues = formattedSheet.getDataRange().getValues();
  if (formattedValues.length < 2) {
    SpreadsheetApp.getUi().alert('Formatted_Plank_Data has no data rows.');
    return;
  }

  const rawValues = rawSheet.getDataRange().getValues();
  const lastCol = rawSheet.getLastColumn();
  if (lastCol < 1) return;

  const headers = formattedValues[0].map(function (h) { return String(h).trim(); });
  const cols = getFormattedColumnIndices(headers);
  if (!cols) {
    SpreadsheetApp.getUi().alert('Formatted_Plank_Data missing column: room_name, box_name, plank_name, or plank_id.');
    return;
  }

  // Build map (room, box_name, plank_name, box_model, occurrence) -> plank_id from Formatted_Plank_Data
  const formattedMap = {};
  const countTriple = {};
  for (let i = 1; i < formattedValues.length; i++) {
    const row = formattedValues[i];
    const room_name = String(row[cols.room_name] != null ? row[cols.room_name] : '').trim();
    const box_name = String(row[cols.box_name] != null ? row[cols.box_name] : '').trim();
    const box_model = cols.box_model >= 0 ? String(row[cols.box_model] != null ? row[cols.box_model] : '').trim() : '';
    const plank_name = String(row[cols.plank_name] != null ? row[cols.plank_name] : '').trim();
    const plank_id = row[cols.plank_id];
    const tripleKey = (room_name || '') + '\t' + (box_name || '') + '\t' + (plank_name || '') + '\t' + (box_model || '');
    countTriple[tripleKey] = (countTriple[tripleKey] || 0) + 1;
    const occurrence = countTriple[tripleKey];
    const key = makeSyncKey(room_name, box_name, plank_name, box_model, occurrence);
    formattedMap[key] = (plank_id !== null && plank_id !== undefined && plank_id !== '')
      ? String(plank_id) : '';
  }

  // Get Level-2 raw rows and set last column from map (same key with occurrence by raw order)
  const planks = getRawPlankRows(rawValues);
  const numRawRows = rawValues.length;
  const lastColValues = [];
  for (let i = 1; i < numRawRows; i++) {
    lastColValues.push(rawValues[i][lastCol - 1]);
  }

  const rawCountTriple = {};
  for (let p = 0; p < planks.length; p++) {
    const pl = planks[p];
    const tripleKey = (pl.room || '') + '\t' + (pl.box_name || '') + '\t' + (pl.plank_name || '') + '\t' + (pl.box_model || '');
    rawCountTriple[tripleKey] = (rawCountTriple[tripleKey] || 0) + 1;
    const occurrence = rawCountTriple[tripleKey];
    const key = makeSyncKey(pl.room, pl.box_name, pl.plank_name, pl.box_model, occurrence);
    const plankIdValue = formattedMap[key] !== undefined ? formattedMap[key] : '';
    const dataRowIndex = pl.sheetRow - 2;
    if (dataRowIndex >= 0 && dataRowIndex < lastColValues.length) {
      lastColValues[dataRowIndex] = plankIdValue;
    }
  }

  if (lastColValues.length > 0) {
    rawSheet.getRange(2, lastCol, lastColValues.length, 1).setValues(
      lastColValues.map(function (v) { return [v]; })
    );
  }

  SpreadsheetApp.getUi().alert('Synced plank_id from Formatted_Plank_Data to raw data (last column).');
}
