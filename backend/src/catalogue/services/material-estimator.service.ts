import { ModelBomItem } from '@prisma/client';

interface MaterialEstimate {
  [materialCode: string]: {
    description?: string; // Optional: from a material library
    totalQuantity: number;
    unitOfMeasure: string; // e.g., 'sqm', 'pcs', 'meters'
  };
}

export class MaterialEstimatorService {
  constructor() {
    console.log('MaterialEstimatorService initialized');
  }

  /**
   * Estimates materials required based on a list of calculated BOM items.
   * @param bomItems - Array of ModelBomItem objects with calculated properties.
   * @returns An object summarizing material quantities.
   */
  estimateMaterials(bomItems: Partial<ModelBomItem>[]): MaterialEstimate {
    console.log('Estimating materials (placeholder)...');
    const estimates: MaterialEstimate = {};

    if (!bomItems) {
      return estimates;
    }

    for (const item of bomItems) {
      const materialCode = (item as any).materialCode; // Assuming calculated property
      if (!materialCode) continue;

      let quantity = 0;
      let unit = 'pcs'; // Default unit

      if (item.itemType === 'PLANK') {
        // const length = (item as any).length || 0; // Assuming calculated property in mm
        // const width = (item as any).width || 0;   // Assuming calculated property in mm
        // Convert to square meters for area-based materials if needed
        // For now, let's assume planks are counted if not further specified
        quantity = (item as any).quantity || 1; // Assuming quantity is a calculated property or defaults to 1
        unit = 'pcs'; // Or 'sqm' if area is calculated: (length * width) / 1000000;
      } else if (item.itemType === 'HARDWARE') {
        quantity = (item as any).quantity || 1; // Assuming quantity is a calculated property
        unit = 'pcs';
      }
      // Add more types as needed (e.g., ADDON)

      if (quantity > 0) {
        if (!estimates[materialCode]) {
          estimates[materialCode] = {
            totalQuantity: 0,
            unitOfMeasure: unit,
            // description: "Fetch from material library if available"
          };
        }
        estimates[materialCode].totalQuantity += quantity;
        // Ensure unit consistency if different items of same material use different units (more complex)
      }
    }

    return estimates;
  }
}
