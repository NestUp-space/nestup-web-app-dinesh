// Placeholder for actual BOM item type with resolved properties after rule execution
interface ResolvedPlank {
  plankId?: string; // From rulesJson
  name: string; // From BillOfMaterialItem.itemName
  width: number | string | null;
  height: number | string | null;
  materialCode: string | null;
  grainDirection?: string | null; // From rulesJson
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
      'PlankID',
      'Name',
      'Description',
      'Width',
      'Height',
      'MaterialCode',
      'GrainDirection',
    ];
    
    const csvRows = [headers.join(',')];

    for (const plank of planks) {
      const row = [
        plank.plankId || 'N/A',
        `"${(plank.name || '').replace(/"/g, '""')}"`, // Escape double quotes
        `"${(plank.itemDescription || '').replace(/"/g, '""')}"`,
        plank.width ?? '', // Handle null/undefined
        plank.height ?? '',
        `"${(plank.materialCode || '').replace(/"/g, '""')}"`,
        `"${(plank.grainDirection || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\\n'); // Use \n for newline characters in CSV
  }
}
