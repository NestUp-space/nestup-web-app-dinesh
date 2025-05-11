// Placeholder for actual BOM item type with resolved properties after rule execution
interface ResolvedPlank {
  plankId?: string; // From rulesJson
  name: string; // From BillOfMaterialItem.itemName
  width: number | string | null;
  height: number | string | null;
  materialCode: string | null;
  grainDirection?: string | null; // From rulesJson
  hole?: { x: number; y: number; z: number; t: string | number; } | string | null; // Added
  groove?: { x1: number; y1: number; x2: number; y2: number; z: number; t: string | number; } | string | null; // Added
  // Add other relevant properties that might be calculated or static
  itemDescription?: string | null;
}

export class PlankListGeneratorService {
  constructor() {
    console.log('PlankListGeneratorService initialized');
  }

  /**
   * Generates a CSV string from a list of resolved planks.
   * @param planks Array of ResolvedPlank objects.
   * @returns A string in CSV format.
   */
  public generatePlankListCsv(planks: ResolvedPlank[]): string {
    if (!planks || planks.length === 0) {
      return ''; // Or throw an error, or return a CSV with headers only
    }

    const headers = [
      'Width- W',
      'Height - H',
      'Material Code - MC',
      'Plank ID ( Box Number - Plank Number - Plank Identifier )',
      'Hole ( x,y,z,t)',
      'Groove (x1,y1,x2,y2,z,t)',
    ];
    
    const csvRows = [headers.join(',')];

    for (const plank of planks) {
      const formatHole = (holeData: any): string => {
        if (!holeData) return '';
        if (typeof holeData === 'string') return `"${holeData.replace(/"/g, '""')}"`;
        if (typeof holeData === 'object') {
          return `"${[holeData.x, holeData.y, holeData.z, holeData.t].join(',').replace(/"/g, '""')}"`;
        }
        return '';
      };

      const formatGroove = (grooveData: any): string => {
        if (!grooveData) return '';
        if (typeof grooveData === 'string') return `"${grooveData.replace(/"/g, '""')}"`;
        if (typeof grooveData === 'object') {
          return `"${[grooveData.x1, grooveData.y1, grooveData.x2, grooveData.y2, grooveData.z, grooveData.t].join(',').replace(/"/g, '""')}"`;
        }
        return '';
      };

      const row = [
        plank.width ?? '',
        plank.height ?? '',
        `"${(plank.materialCode || '').replace(/"/g, '""')}"`,
        `"${(plank.plankId || 'N/A').replace(/"/g, '""')}"`,
        formatHole(plank.hole),
        formatGroove(plank.groove),
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\\n'); // Use \n for newline characters in CSV
  }
}
