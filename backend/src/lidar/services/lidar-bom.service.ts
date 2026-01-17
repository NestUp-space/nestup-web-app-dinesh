/**
 * LiDAR BOM Service
 * Handles Bill of Materials generation from placed modules
 */

import { PrismaClient, LidarSessionStatus, Prisma } from '@prisma/client';
import {
  SessionBomResponse,
  BomMaterial,
  BomCutItem,
  BomHardware,
  BomSummary,
  ModuleDimensions,
} from '../types/lidar.types';

const prisma = new PrismaClient();

// Material constants
const PLYWOOD_SHEET_SIZE = { width: 2440, height: 1220, thickness: 18 }; // Standard 8x4 sheet
const PLYWOOD_WASTE_FACTOR = 1.15; // 15% waste factor

export class LidarBomService {
  /**
   * Generate BOM for a session
   */
  async generateBom(sessionId: string): Promise<SessionBomResponse> {
    // Verify session exists and has modules
    const session = await prisma.lidarSession.findUnique({
      where: { id: sessionId },
      include: {
        placedModules: {
          include: {
            template: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.placedModules.length === 0) {
      throw new Error('No modules placed in session');
    }

    // Generate materials list
    const materials = this.calculateMaterials(session.placedModules);

    // Generate cut list
    const cutList = this.generateCutList(session.placedModules);

    // Generate hardware list
    const hardware = this.calculateHardware(session.placedModules);

    // Generate summary
    const summary = this.generateSummary(session.placedModules, materials, cutList, hardware);

    // Store BOM in database
    const bom = await prisma.lidarSessionBom.upsert({
      where: { sessionId },
      create: {
        sessionId,
        materials: materials as unknown as Prisma.InputJsonValue,
        cutList: cutList as unknown as Prisma.InputJsonValue,
        hardware: hardware as unknown as Prisma.InputJsonValue,
        summary: summary as unknown as Prisma.InputJsonValue,
      },
      update: {
        materials: materials as unknown as Prisma.InputJsonValue,
        cutList: cutList as unknown as Prisma.InputJsonValue,
        hardware: hardware as unknown as Prisma.InputJsonValue,
        summary: summary as unknown as Prisma.InputJsonValue,
        generatedAt: new Date(),
      },
    });

    // Update session status
    await prisma.lidarSession.update({
      where: { id: sessionId },
      data: { status: LidarSessionStatus.COMPLETED },
    });

    return {
      id: bom.id,
      sessionId: bom.sessionId,
      materials,
      cutList,
      hardware,
      summary,
      generatedAt: bom.generatedAt,
    };
  }

  /**
   * Get existing BOM for a session
   */
  async getBom(sessionId: string): Promise<SessionBomResponse | null> {
    const bom = await prisma.lidarSessionBom.findUnique({
      where: { sessionId },
    });

    if (!bom) {
      return null;
    }

    return {
      id: bom.id,
      sessionId: bom.sessionId,
      materials: bom.materials as unknown as BomMaterial[],
      cutList: bom.cutList as unknown as BomCutItem[],
      hardware: bom.hardware as unknown as BomHardware[],
      summary: bom.summary as unknown as BomSummary,
      generatedAt: bom.generatedAt,
    };
  }

  /**
   * Calculate materials needed for all modules
   */
  private calculateMaterials(modules: any[]): BomMaterial[] {
    const materials: Map<string, BomMaterial> = new Map();

    for (const module of modules) {
      const dims = module.dimensions as ModuleDimensions;
      // const category = module.template?.category || 'STORAGE';

      // Calculate plywood needed
      const plywoodArea = this.calculatePlywoodArea(dims);
      const plywoodKey = `plywood_${PLYWOOD_SHEET_SIZE.thickness}mm`;

      if (materials.has(plywoodKey)) {
        const existing = materials.get(plywoodKey)!;
        existing.quantity += plywoodArea;
      } else {
        materials.set(plywoodKey, {
          category: 'Panel',
          specification: `Plywood ${PLYWOOD_SHEET_SIZE.thickness}mm Commercial Grade`,
          quantity: plywoodArea,
          unit: 'sqft',
          dimensions: `${PLYWOOD_SHEET_SIZE.width}x${PLYWOOD_SHEET_SIZE.height}x${PLYWOOD_SHEET_SIZE.thickness}mm`,
        });
      }

      // Add edge banding
      const edgeBandingLength = this.calculateEdgeBandingLength(dims);
      const edgeBandingKey = 'edge_banding_2mm';

      if (materials.has(edgeBandingKey)) {
        const existing = materials.get(edgeBandingKey)!;
        existing.quantity += edgeBandingLength;
      } else {
        materials.set(edgeBandingKey, {
          category: 'Edge Banding',
          specification: 'PVC Edge Band 2mm x 22mm',
          quantity: edgeBandingLength,
          unit: 'rft',
        });
      }

      // Add laminate for visible surfaces
      const laminateArea = this.calculateLaminateArea(dims);
      const laminateKey = 'laminate_1mm';

      if (materials.has(laminateKey)) {
        const existing = materials.get(laminateKey)!;
        existing.quantity += laminateArea;
      } else {
        materials.set(laminateKey, {
          category: 'Laminate',
          specification: 'HPL Laminate 1mm',
          quantity: laminateArea,
          unit: 'sqft',
        });
      }
    }

    // Apply waste factor and convert to sheets
    const materialsList = Array.from(materials.values()).map((m) => {
      if (m.unit === 'sqft') {
        m.quantity = Math.ceil(m.quantity * PLYWOOD_WASTE_FACTOR / 10.764) * 10.764; // Round up to nearest sqft
      }
      return m;
    });

    return materialsList;
  }

  /**
   * Generate cut list for all modules
   */
  private generateCutList(modules: any[]): BomCutItem[] {
    const cutList: BomCutItem[] = [];

    for (const module of modules) {
      const dims = module.dimensions as ModuleDimensions;
      const moduleId = module.id;
      const thickness = PLYWOOD_SHEET_SIZE.thickness;

      // Top and Bottom panels
      cutList.push({
        moduleId,
        part: 'Top Panel',
        quantity: 1,
        dimensions: {
          width: dims.width,
          height: dims.depth,
          depth: thickness,
          thickness,
        },
        material: 'Plywood',
        edgeBanding: ['front'],
      });

      cutList.push({
        moduleId,
        part: 'Bottom Panel',
        quantity: 1,
        dimensions: {
          width: dims.width,
          height: dims.depth,
          depth: thickness,
          thickness,
        },
        material: 'Plywood',
        edgeBanding: ['front'],
      });

      // Side panels
      cutList.push({
        moduleId,
        part: 'Left Side Panel',
        quantity: 1,
        dimensions: {
          width: dims.depth,
          height: dims.height - 2 * thickness,
          depth: thickness,
          thickness,
        },
        material: 'Plywood',
        edgeBanding: ['front'],
      });

      cutList.push({
        moduleId,
        part: 'Right Side Panel',
        quantity: 1,
        dimensions: {
          width: dims.depth,
          height: dims.height - 2 * thickness,
          depth: thickness,
          thickness,
        },
        material: 'Plywood',
        edgeBanding: ['front'],
      });

      // Back panel (4mm)
      cutList.push({
        moduleId,
        part: 'Back Panel',
        quantity: 1,
        dimensions: {
          width: dims.width - 10, // 5mm inset on each side
          height: dims.height - 10,
          depth: 4,
          thickness: 4,
        },
        material: 'MDF 4mm',
        edgeBanding: [],
      });

      // Shelves (based on height - 2 shelves per 600mm of height)
      const shelfCount = Math.floor(dims.height / 300) - 1;
      if (shelfCount > 0) {
        cutList.push({
          moduleId,
          part: 'Shelf',
          quantity: shelfCount,
          dimensions: {
            width: dims.width - 2 * thickness - 2,
            height: dims.depth - 20,
            depth: thickness,
            thickness,
          },
          material: 'Plywood',
          edgeBanding: ['front'],
        });
      }
    }

    return cutList;
  }

  /**
   * Calculate hardware needed for all modules
   */
  private calculateHardware(modules: any[]): BomHardware[] {
    const hardware: Map<string, BomHardware> = new Map();

    for (const module of modules) {
      const dims = module.dimensions as ModuleDimensions;
      const category = module.template?.category || 'STORAGE';

      // Cam locks for panel connections (4 per corner = 16 for box)
      this.addHardware(hardware, {
        item: 'Cam Lock',
        specification: '15mm Zinc Alloy',
        quantity: 16,
        unit: 'pcs',
      });

      // Shelf supports (4 per shelf)
      const shelfCount = Math.floor(dims.height / 300) - 1;
      if (shelfCount > 0) {
        this.addHardware(hardware, {
          item: 'Shelf Support',
          specification: '5mm Pin Type',
          quantity: shelfCount * 4,
          unit: 'pcs',
        });
      }

      // Hinges for doors (if applicable)
      if (category === 'KITCHEN' || category === 'WARDROBE' || category === 'BATHROOM') {
        const doorCount = Math.ceil(dims.width / 600); // One door per 600mm
        this.addHardware(hardware, {
          item: 'Soft-Close Hinge',
          specification: '35mm Cup Full Overlay',
          quantity: doorCount * 2, // 2 hinges per door
          unit: 'pairs',
        });

        // Handles
        this.addHardware(hardware, {
          item: 'Handle',
          specification: 'Stainless Steel Pull Handle 128mm',
          quantity: doorCount,
          unit: 'pcs',
        });
      }

      // Drawer slides for drawers (if applicable)
      if (category === 'KITCHEN' || category === 'OFFICE') {
        const drawerCount = Math.floor(dims.height / 200); // Estimate drawers
        if (drawerCount > 0) {
          this.addHardware(hardware, {
            item: 'Drawer Slide',
            specification: `Ball Bearing Full Extension ${Math.round(dims.depth)}mm`,
            quantity: drawerCount,
            unit: 'pairs',
          });
        }
      }

      // Wood screws for general assembly
      this.addHardware(hardware, {
        item: 'Wood Screw',
        specification: '#8 x 1.5" Coarse Thread',
        quantity: 50,
        unit: 'pcs',
      });
    }

    return Array.from(hardware.values());
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(
    modules: any[],
    materials: BomMaterial[],
    _cutList: BomCutItem[], // Used for future cut optimization stats
    hardware: BomHardware[]
  ): BomSummary {
    // Calculate total area
    let totalArea = 0;
    for (const module of modules) {
      const dims = module.dimensions as ModuleDimensions;
      totalArea += (dims.width * dims.depth) / 1000000; // Convert to m²
    }

    // Calculate total plywood sheets
    const plywoodMaterial = materials.find((m) => m.category === 'Panel');
    const totalPlywoodSqft = plywoodMaterial?.quantity || 0;
    const sheetArea = (PLYWOOD_SHEET_SIZE.width * PLYWOOD_SHEET_SIZE.height) / 92903; // sqft
    const totalPlywoodSheets = Math.ceil(totalPlywoodSqft / sheetArea);

    // Count hardware items
    const totalHardwareItems = hardware.reduce((sum, h) => sum + h.quantity, 0);

    return {
      totalModules: modules.length,
      totalAreaSqm: Math.round(totalArea * 100) / 100,
      totalPlywoodSheets,
      totalHardwareItems,
    };
  }

  // Helper methods
  private calculatePlywoodArea(dims: ModuleDimensions): number {
    const thickness = PLYWOOD_SHEET_SIZE.thickness;
    const shelfCount = Math.floor(dims.height / 300) - 1;

    // Top + Bottom
    let area = 2 * (dims.width * dims.depth);
    // Sides
    area += 2 * (dims.depth * (dims.height - 2 * thickness));
    // Shelves
    area += shelfCount * ((dims.width - 2 * thickness - 2) * (dims.depth - 20));

    return area / 92903; // Convert mm² to sqft
  }

  private calculateEdgeBandingLength(dims: ModuleDimensions): number {
    const thickness = PLYWOOD_SHEET_SIZE.thickness;
    const shelfCount = Math.floor(dims.height / 300) - 1;

    // Front edges of top, bottom, sides, shelves
    let length = dims.width * 2; // Top and bottom front
    length += (dims.height - 2 * thickness) * 2; // Sides front
    length += (dims.width - 2 * thickness - 2) * shelfCount; // Shelves front

    return length / 304.8; // Convert mm to rft
  }

  private calculateLaminateArea(dims: ModuleDimensions): number {
    // Laminate for visible surfaces (sides and top)
    let area = dims.height * dims.depth * 2; // Sides
    area += dims.width * dims.depth; // Top

    return area / 92903; // Convert mm² to sqft
  }

  private addHardware(
    hardware: Map<string, BomHardware>,
    item: BomHardware
  ): void {
    const key = `${item.item}_${item.specification}`;
    if (hardware.has(key)) {
      hardware.get(key)!.quantity += item.quantity;
    } else {
      hardware.set(key, { ...item });
    }
  }
}

// Export singleton instance
export const lidarBomService = new LidarBomService();
