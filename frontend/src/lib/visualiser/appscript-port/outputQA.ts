/**
 * Output QA Sheet Generator
 * 100% PORT from AppScript createoutputQASheet.js
 *
 * Joins data from Plank List and Formatted_Plank_Data using plank_id.
 * Sorts by Room → Box Name → Color.
 *
 * ALTERATION FROM APPSCRIPT: Only I/O changed.
 *   - Input: plankListHeader/Rows + formattedHeader/Rows + customerDetails
 *   - Output: structured data matching the AppScript sheet layout
 *   - No SpreadsheetApp
 */

export interface OutputQAResult {
  sheetName: string;
  headerBlock: {
    customerName: string;
    siteAddress: string;
    contactNumber: string;
    totalItems: number;
    date: string;
  };
  tableHeader: string[];
  rows: (string | number | boolean)[][];
}

// =================================================================
// =================== MAIN FUNCTION ===================
// =================================================================

/**
 * 100% port of AppScript createOutputQASheet().
 * Input: plankListHeader/Rows, formattedHeader/Rows, customerDetails.
 * Output: OutputQAResult.
 */
export function createOutputQA(
  plankListHeader: string[],
  plankListRows: (string | number)[][],
  formattedHeader: string[],
  formattedRows: (string | number)[][],
  customerDetails?: Record<string, string>
): OutputQAResult {
  const customerName =
    customerDetails?.['customer name'] ||
    customerDetails?.['Customer Name'] ||
    customerDetails?.['firm name'] ||
    '';
  const siteAddress =
    customerDetails?.['site address'] ||
    customerDetails?.['Site Address'] ||
    customerDetails?.['location'] ||
    customerDetails?.['Location'] ||
    '';
  const contactNumber =
    customerDetails?.['contact number'] ||
    customerDetails?.['Contact Number'] ||
    '';

  // Parse Plank List columns
  const plHeaders = plankListHeader.map((h) => String(h).trim());
  const plankColIndices = {
    material: plHeaders.indexOf('Material'),
    thickness: plHeaders.indexOf('Thickness (mm)'),
    plankId: plHeaders.indexOf('Plank id'),
    width: plHeaders.indexOf('Width (mm)'),
    height: plHeaders.indexOf('Height (mm)'),
  };

  if (Object.values(plankColIndices).some((index) => index === -1)) {
    throw new Error(
      "Missing columns in 'Plank List'. Required: Material, Thickness (mm), Plank id, Width (mm), Height (mm)."
    );
  }

  // Parse Formatted_Plank_Data columns
  const fmtHeaders = formattedHeader.map((h) => String(h).trim());
  const formattedColIndices = {
    roomName: fmtHeaders.indexOf('room_name'),
    boxName: fmtHeaders.indexOf('box_name'),
    plankId: fmtHeaders.indexOf('plank_id'),
    plankMaterial: fmtHeaders.indexOf('plank_material'),
  };

  if (Object.values(formattedColIndices).some((index) => index === -1)) {
    throw new Error(
      "Missing columns in 'Formatted_Plank_Data'. Required: room_name, box_name, plank_id, plank_material."
    );
  }

  // Build lookup map from Formatted_Plank_Data
  const formattedLookup: Record<string, { roomName: string; boxName: string }> = {};
  for (const row of formattedRows) {
    const plankId = row[formattedColIndices.plankId];
    if (plankId !== '' && plankId !== null && plankId !== undefined) {
      formattedLookup[String(plankId)] = {
        roomName: String(row[formattedColIndices.roomName] || ''),
        boxName: String(row[formattedColIndices.boxName] || ''),
      };
    }
  }

  // Build data rows
  interface DataRow {
    roomName: string;
    boxName: string;
    color: string;
    thickness: string | number;
    plankId: string | number;
    width: string | number;
    height: string | number;
  }

  const dataRows: DataRow[] = [];
  for (const row of plankListRows) {
    const plankId = row[plankColIndices.plankId];
    if (plankId === '' || plankId === null || plankId === undefined) continue;

    const formattedInfo = formattedLookup[String(plankId)] || {
      roomName: 'Unknown',
      boxName: 'Unknown',
    };

    let color = String(row[plankColIndices.material] || '');
    color = color.replace(/\s*\([^)]*\)/g, '').trim();

    dataRows.push({
      roomName: formattedInfo.roomName,
      boxName: formattedInfo.boxName,
      color,
      thickness: row[plankColIndices.thickness],
      plankId,
      width: row[plankColIndices.width],
      height: row[plankColIndices.height],
    });
  }

  // Sort by Room → Box Name → Color
  dataRows.sort((a, b) => {
    if (a.roomName !== b.roomName) return String(a.roomName).localeCompare(String(b.roomName));
    if (a.boxName !== b.boxName) return String(a.boxName).localeCompare(String(b.boxName));
    return String(a.color).localeCompare(String(b.color));
  });

  // Build output
  const tableHeader = [
    'Room',
    'Unit/Box Name',
    'Color',
    'Thickness',
    'Labels',
    'Width',
    'Height',
    'QA',
    'Comments',
  ];

  const outputRows: (string | number | boolean)[][] = dataRows.map((row) => [
    row.roomName,
    row.boxName,
    row.color,
    row.thickness,
    row.plankId,
    row.width,
    row.height,
    false,
    '',
  ]);

  const sheetName = customerName ? `Output QA - ${customerName}` : 'Output QA';
  const date = new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });

  return {
    sheetName,
    headerBlock: {
      customerName,
      siteAddress: siteAddress || 'NA',
      contactNumber,
      totalItems: outputRows.length,
      date,
    },
    tableHeader,
    rows: outputRows,
  };
}
