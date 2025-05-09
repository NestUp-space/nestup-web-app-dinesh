import { CutList, CutOperation, MaterialProperties, Plank, SheetLayout } from '../types/bim.types';

// Standard sheet sizes by material type (in mm)
const STANDARD_SHEET_SIZES: Record<string, { width: number; height: number }> = {
  default: { width: 2440, height: 1220 }, // Standard plywood/MDF sheet
  HDHMR: { width: 2440, height: 1220 },
  Blockboard: { width: 2440, height: 1220 },
  MDF: { width: 2440, height: 1220 },
  Plywood: { width: 2440, height: 1220 }
};

// Minimum spacing between cuts (in mm)
const MIN_CUT_SPACING = 5;

/**
 * @description Generates a cutlist from a list of planks
 * @param planks The list of planks to cut
 * @param materialProperties Material properties for each material code
 * @returns A cutlist with optimized sheet layouts
 */
export function generateCutList(
  planks: Plank[],
  materialProperties: { [materialCode: string]: MaterialProperties }
): CutList {
  // Validate inputs
  if (!planks || planks.length === 0) {
    throw new Error('No planks provided for cutlist generation');
  }

  // Group planks by material code
  const planksByMaterial = groupPlanksByMaterial(planks);

  // Generate sheet layouts for each material group
  const sheets: SheetLayout[] = [];
  let totalPlanks = 0;
  let totalWastePercentage = 0;

  // Process each material group
  Object.entries(planksByMaterial).forEach(([materialCode, materialPlanks]) => {
    // Get the standard sheet size for this material
    const sheetSize = getSheetSizeForMaterial(materialCode, materialProperties);

    // Sort planks by area (descending) for better packing
    const sortedPlanks = [...materialPlanks].sort((a, b) => {
      const areaA = (a.width || 0) * (a.height || 0);
      const areaB = (b.width || 0) * (b.height || 0);
      return areaB - areaA;
    });

    // Pack planks into sheets
    const materialSheets = packPlanksIntoSheets(sortedPlanks, materialCode, sheetSize);
    sheets.push(...materialSheets);

    // Update totals
    totalPlanks += materialPlanks.length;
    totalWastePercentage += materialSheets.reduce((sum, sheet) => sum + sheet.wastePercentage, 0);
  });

  // Calculate average waste percentage
  const averageWastePercentage = sheets.length > 0 ?
    totalWastePercentage / sheets.length : 0;

  return {
    sheets,
    totalSheets: sheets.length,
    totalPlanks,
    averageWastePercentage
  };
}

/**
 * @description Groups planks by their material code
 * @param planks The list of planks
 * @returns An object with material codes as keys and arrays of planks as values
 */
function groupPlanksByMaterial(planks: Plank[]): { [materialCode: string]: Plank[] } {
  const groups: { [materialCode: string]: Plank[] } = {};

  planks.forEach(plank => {
    if (!plank.materialCode) {
      console.warn(`Plank ${plank.plankId} has no material code, skipping`);
      return;
    }

    if (!groups[plank.materialCode]) {
      groups[plank.materialCode] = [];
    }

    groups[plank.materialCode].push(plank);
  });

  return groups;
}

/**
 * @description Gets the standard sheet size for a material
 * @param materialCode The material code
 * @param materialProperties Material properties for each material code
 * @returns The sheet size (width and height)
 */
function getSheetSizeForMaterial(
  materialCode: string,
  materialProperties: { [materialCode: string]: MaterialProperties }
): { width: number; height: number } {
  // Try to determine the material type from properties
  if (materialProperties[materialCode] && materialProperties[materialCode].plyType) {
    const plyType = materialProperties[materialCode].plyType;
    if (plyType in STANDARD_SHEET_SIZES) {
      return STANDARD_SHEET_SIZES[plyType];
    }
  }

  // Default sheet size if material type not found
  return STANDARD_SHEET_SIZES.default;
}

/**
 * @description Packs planks into sheets using a simple 2D bin packing algorithm
 * @param planks The list of planks to pack
 * @param materialCode The material code
 * @param sheetSize The sheet size (width and height)
 * @returns An array of sheet layouts
 */
function packPlanksIntoSheets(
  planks: Plank[],
  materialCode: string,
  sheetSize: { width: number; height: number }
): SheetLayout[] {
  const sheets: SheetLayout[] = [];
  const remainingPlanks = [...planks];

  // Continue until all planks are assigned to sheets
  while (remainingPlanks.length > 0) {
    // Create a new sheet
    const sheetId = `${materialCode}_Sheet${sheets.length + 1}`;
    const newSheet: SheetLayout = {
      sheetId,
      materialCode,
      width: sheetSize.width,
      height: sheetSize.height,
      cuts: [],
      wastePercentage: 0
    };

    // Create a representation of the available space on the sheet
    // For simplicity, we'll use a guillotine cutting approach
    // This is a simple approach and not the most efficient for complex layouts
    const spaces = [{ x: 0, y: 0, width: sheetSize.width, height: sheetSize.height }];

    // Try to place each remaining plank on the current sheet
    let i = 0;
    while (i < remainingPlanks.length) {
      const plank = remainingPlanks[i];

      // Skip planks with null dimensions
      if (plank.width === null || plank.height === null) {
        console.warn(`Plank ${plank.plankId} has null dimensions, skipping`);
        i++;
        continue;
      }

      // Add spacing for the saw kerf
      const cutWidth = plank.width + MIN_CUT_SPACING;
      const cutHeight = plank.height + MIN_CUT_SPACING;

      // Try to find a space for this plank
      let placed = false;
      for (let j = 0; j < spaces.length; j++) {
        const space = spaces[j];

        // Check if the plank fits in this space
        if (cutWidth <= space.width && cutHeight <= space.height) {
          // Place the plank in this space
          newSheet.cuts.push({
            plankId: plank.plankId,
            materialCode: plank.materialCode || materialCode,
            width: plank.width,
            height: plank.height,
            sheetId,
            position: { x: space.x, y: space.y },
            rotation: false
          });

          // Update the available spaces
          // Remove the current space
          spaces.splice(j, 1);

          // Add two new spaces (right and below the placed plank)
          if (space.width - cutWidth > 0) {
            spaces.push({
              x: space.x + cutWidth,
              y: space.y,
              width: space.width - cutWidth,
              height: cutHeight
            });
          }

          if (space.height - cutHeight > 0) {
            spaces.push({
              x: space.x,
              y: space.y + cutHeight,
              width: space.width,
              height: space.height - cutHeight
            });
          }

          // Mark the plank as placed and remove it from the remaining planks
          placed = true;
          remainingPlanks.splice(i, 1);
          break;
        }

        // Try rotating the plank if it doesn't fit
        if (cutHeight <= space.width && cutWidth <= space.height) {
          // Place the rotated plank in this space
          newSheet.cuts.push({
            plankId: plank.plankId,
            materialCode: plank.materialCode || materialCode,
            width: plank.width,
            height: plank.height,
            sheetId,
            position: { x: space.x, y: space.y },
            rotation: true
          });

          // Update the available spaces
          // Remove the current space
          spaces.splice(j, 1);

          // Add two new spaces (right and below the placed plank)
          if (space.width - cutHeight > 0) {
            spaces.push({
              x: space.x + cutHeight,
              y: space.y,
              width: space.width - cutHeight,
              height: cutWidth
            });
          }

          if (space.height - cutWidth > 0) {
            spaces.push({
              x: space.x,
              y: space.y + cutWidth,
              width: space.width,
              height: space.height - cutWidth
            });
          }

          // Mark the plank as placed and remove it from the remaining planks
          placed = true;
          remainingPlanks.splice(i, 1);
          break;
        }
      }

      // If the plank couldn't be placed on this sheet, move to the next plank
      if (!placed) {
        i++;
      }
    }

    // Calculate waste percentage for this sheet
    const totalSheetArea = sheetSize.width * sheetSize.height;
    const usedArea = newSheet.cuts.reduce((sum, cut) => {
      return sum + ((cut.width || 0) * (cut.height || 0));
    }, 0);

    newSheet.wastePercentage = ((totalSheetArea - usedArea) / totalSheetArea) * 100;

    // Add the sheet to the list
    sheets.push(newSheet);
  }

  return sheets;
}

/**
 * @description Formats a cutlist as a CSV string for download
 * @param cutList The cutlist to format
 * @returns A CSV string representation of the cutlist
 */
export function formatCutListAsCsv(cutList: CutList): string {
  // CSV header
  let csv = 'Sheet ID,Material Code,Plank ID,Width (mm),Height (mm),X Position,Y Position,Rotated,Plank Name\n';

  // Add each cut to the CSV
  cutList.sheets.forEach(sheet => {
    sheet.cuts.forEach(cut => {
      csv += `${sheet.sheetId},${sheet.materialCode},${cut.plankId},${cut.width},${cut.height},${cut.position.x},${cut.position.y},${cut.rotation ? 'Yes' : 'No'},${cut.plankId.split('_').pop() || ''}\n`;
    });
  });

  return csv;
}

/**
 * @description Formats a cutlist as a JSON string for download
 * @param cutList The cutlist to format
 * @returns A JSON string representation of the cutlist
 */
export function formatCutListAsJson(cutList: CutList): string {
  return JSON.stringify(cutList, null, 2);
}

/**
 * @description Generates a visual representation of the cutlist as an SVG
 * @param cutList The cutlist to visualize
 * @returns An SVG string representation of the cutlist
 */
export function visualizeCutList(cutList: CutList): string {
  let svg = '';

  // Define colors for visualization
  const colors = [
    '#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d',
    '#43aa8b', '#577590', '#277da1', '#9d4edd', '#ff99c8'
  ];

  // Generate SVG for each sheet
  cutList.sheets.forEach((sheet, sheetIndex) => {
    // Create SVG for this sheet
    svg += `<svg width="${sheet.width + 100}" height="${sheet.height + 100}" xmlns="http://www.w3.org/2000/svg">\n`;

    // Add sheet background
    svg += `  <rect x="50" y="50" width="${sheet.width}" height="${sheet.height}" fill="#f5f5f5" stroke="#333" stroke-width="2" />\n`;

    // Add sheet title
    svg += `  <text x="${sheet.width / 2 + 50}" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">${sheet.sheetId} (${sheet.materialCode})</text>\n`;

    // Add waste percentage
    svg += `  <text x="${sheet.width + 50}" y="70" text-anchor="end" font-family="Arial" font-size="12">Waste: ${sheet.wastePercentage.toFixed(1)}%</text>\n`;

    // Add each cut
    sheet.cuts.forEach((cut, cutIndex) => {
      // Determine position and dimensions based on rotation
      const x = cut.position.x + 50; // Add 50px margin
      const y = cut.position.y + 50; // Add 50px margin
      const width = cut.rotation ? cut.height : cut.width;
      const height = cut.rotation ? cut.width : cut.height;

      // Choose color based on cut index
      const colorIndex = cutIndex % colors.length;

      // Add cut rectangle
      svg += `  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${colors[colorIndex]}" stroke="#333" stroke-width="1" />\n`;

      // Add cut label (plank ID)
      svg += `  <text x="${x + width / 2}" y="${y + height / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="10" fill="white">${cut.plankId}</text>\n`;

      // Add dimensions
      svg += `  <text x="${x + width / 2}" y="${y + height / 2 + 12}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="8" fill="white">${cut.width}×${cut.height}mm</text>\n`;
    });

    // Close SVG
    svg += `</svg>\n\n`;
  });

  return svg;
}
