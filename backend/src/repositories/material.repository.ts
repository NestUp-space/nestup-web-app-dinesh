/**
 * Material Repository
 * Handles database operations for project materials
 */

// Assuming Material model is defined in Prisma schema and generated
import { PrismaClient, Material as PrismaMaterial, Prisma } from '@prisma/client'; 
import prisma from '../config/db';
// Using a local Material type that should be compatible with PrismaMaterial
// For a cleaner approach, PrismaMaterial could be used directly or mapped to this local type.
import { CreateMaterialDto, Material, UpdateMaterialDto } from '../bim/types/bim.types';

// Type assertion helper (optional, for clarity if needed later)
function assertIsMaterial(material: PrismaMaterial): Material {
  // This function would perform runtime checks or transformations if your local Material type
  // significantly differs from PrismaMaterial. For now, we assume they are compatible.
  // If they are identical or PrismaMaterial can be used directly, this can be simplified.
  return material as unknown as Material; // Cast if structure is compatible
}

function assertIsMaterialArray(materials: PrismaMaterial[]): Material[] {
  return materials.map(m => assertIsMaterial(m));
}


export interface IMaterialRepository {
  create(projectId: number, data: CreateMaterialDto): Promise<Material>;
  findAllByProject(projectId: number): Promise<Material[]>;
  findById(id: number): Promise<Material | null>;
  findByProjectAndMaterialId(projectId: number, materialId: string): Promise<Material | null>;
  update(id: number, data: UpdateMaterialDto): Promise<Material>;
  delete(id: number): Promise<Material>;
  materialIdExists(projectId: number, materialId: string, excludeId?: number): Promise<boolean>;
}

export class MaterialRepository implements IMaterialRepository {
  // Use the PrismaClient type directly
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * @description Create a new material for a project
   * @param projectId The ID of the project
   * @param materialData The material data
   * @returns The created material (typed as local Material)
   */
  async create(projectId: number, materialData: CreateMaterialDto): Promise<Material> {
    const overallThickness = materialData.plyThickness + 2; // 1mm inner + ply + 1mm outer

    // Prepare data according to Prisma.MaterialCreateInput
    const prismaCreateData: Prisma.MaterialCreateInput = {
      project: { connect: { id: projectId } }, // Link to project
      materialId: materialData.materialId,
      plyThickness: materialData.plyThickness,
      innerLaminateCode: materialData.innerLaminateCode,
      outerLaminateCode: materialData.outerLaminateCode,
      overallThickness, // This is calculated and should be part of the model
      plyType: materialData.plyType,
      grainDirection: materialData.grainDirection,
      edgebandingInnerCode: materialData.edgebandingInnerCode,
      edgebandingExposedCode: materialData.edgebandingExposedCode,
      // Assuming createdAt and updatedAt are handled by Prisma (@default(now())/@updatedAt)
    };
    
    console.log('[MaterialRepository] Creating material with data:', prismaCreateData);
    const material: PrismaMaterial = await this.prisma.material.create({
      data: prismaCreateData,
    });
    console.log('[MaterialRepository] Material created:', material);
    
    // Assuming your local Material type is compatible with PrismaMaterial
    // If not, a mapping function would be needed here.
    return assertIsMaterial(material);
  }

  /**
   * @description Get all materials for a project
   * @param projectId The ID of the project
   * @returns Array of materials (typed as local Material)
   */
  async findAllByProject(projectId: number): Promise<Material[]> {
    console.log(`[MaterialRepository] Finding all materials for project ID: ${projectId}`);
    const materials: PrismaMaterial[] = await this.prisma.material.findMany({
      where: {
        projectId,
      },
      orderBy: {
        materialId: 'asc',
      },
    });
    console.log(`[MaterialRepository] Found ${materials.length} materials for project ID: ${projectId}`, materials);
    return assertIsMaterialArray(materials);
  }

  /**
   * @description Get a material by ID
   * @param id The ID of the material
   * @returns The material or null if not found (typed as local Material)
   */
  async findById(id: number): Promise<Material | null> {
    console.log(`[MaterialRepository] Finding material by ID: ${id}`);
    const material: PrismaMaterial | null = await this.prisma.material.findUnique({
      where: {
        id,
      },
    });
    console.log(`[MaterialRepository] Material found by ID ${id}:`, material);
    return material ? assertIsMaterial(material) : null;
  }

  /**
   * @description Get a material by project ID and material ID
   * @param projectId The ID of the project
   * @param materialId The material ID (user-defined)
   * @returns The material or null if not found (typed as local Material)
   */
  async findByProjectAndMaterialId(projectId: number, materialId: string): Promise<Material | null> {
    console.log(`[MaterialRepository] Finding material by project ID ${projectId} and materialId ${materialId}`);
    const material: PrismaMaterial | null = await this.prisma.material.findFirst({
      where: {
        projectId,
        materialId,
      },
    });
    console.log(`[MaterialRepository] Material found by project/materialId:`, material);
    return material ? assertIsMaterial(material) : null;
  }

  /**
   * @description Update a material
   * @param id The ID of the material
   * @param materialData The material data to update
   * @returns The updated material (typed as local Material)
   */
  async update(id: number, materialData: UpdateMaterialDto): Promise<Material> {
    const updateData: Prisma.MaterialUpdateInput = { ...materialData };
    
    if (materialData.plyThickness !== undefined) {
      updateData.overallThickness = materialData.plyThickness + 2;
    }
    
    // Remove projectId from updateData if present, as it shouldn't be changed here
    if ('projectId' in updateData) {
      delete (updateData as any).projectId;
    }

    console.log(`[MaterialRepository] Updating material ID ${id} with data:`, updateData);
    const material: PrismaMaterial = await this.prisma.material.update({
      where: {
        id,
      },
      data: updateData,
    });
    console.log(`[MaterialRepository] Material updated:`, material);
    return assertIsMaterial(material);
  }

  /**
   * @description Delete a material
   * @param id The ID of the material
   * @returns The deleted material (typed as local Material)
   */
  async delete(id: number): Promise<Material> {
    console.log(`[MaterialRepository] Deleting material ID: ${id}`);
    const material: PrismaMaterial = await this.prisma.material.delete({
      where: {
        id,
      },
    });
    console.log(`[MaterialRepository] Material deleted:`, material);
    return assertIsMaterial(material);
  }

  /**
   * @description Check if a material ID already exists in a project
   * @param projectId The ID of the project
   * @param materialId The material ID to check
   * @param excludeId Optional ID to exclude from the check (for updates)
   * @returns True if the material ID exists, false otherwise
   */
  async materialIdExists(projectId: number, materialId: string, excludeId?: number): Promise<boolean> {
    console.log(`[MaterialRepository] Checking if materialId ${materialId} exists in project ${projectId}, excluding ID ${excludeId}`);
    const count = await this.prisma.material.count({
      where: {
        projectId,
        materialId,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    console.log(`[MaterialRepository] Count for materialId ${materialId} in project ${projectId}: ${count}`);
    return count > 0;
  }
}

// Export a singleton instance
export const materialRepository = new MaterialRepository();
