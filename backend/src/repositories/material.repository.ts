/**
 * Material Repository
 * Handles database operations for project materials
 */

// Assuming Material model is defined in Prisma schema and generated
import { PrismaClient, Material as PrismaMaterial, Prisma } from '@prisma/client'; 
import prisma from '../config/db';
// Using a local Material type that should be compatible with PrismaMaterial
// For a cleaner approach, PrismaMaterial could be used directly or mapped to this local type.
import { CreateMaterialDto, UpdateMaterialDto } from '../bim/types/bim.types';
import { Material } from '../bim/types/bim.types';
import { PlyType, GrainDirection } from '@prisma/client';

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
      plyType: materialData.plyType as PlyType,
      grainDirection: materialData.grainDirection as GrainDirection,
      // Note: edgebandingInnerCode and edgebandingExposedCode are not in the Prisma schema
      // Assuming createdAt and updatedAt are handled by Prisma (@default(now())/@updatedAt)
    };
    
    console.log('[MaterialRepository] Attempting to create material with data:', JSON.stringify(prismaCreateData, null, 2));
    try {
      const material: PrismaMaterial = await this.prisma.material.create({
        data: prismaCreateData,
      });
      console.log('[MaterialRepository] Material successfully created in DB:', JSON.stringify(material, null, 2));
      // Assuming your local Material type is compatible with PrismaMaterial
      // If not, a mapping function would be needed here.
      return assertIsMaterial(material);
    } catch (error) {
      console.error('[MaterialRepository] Error creating material in DB:', error);
      throw error; // Re-throw the error to be caught by the service layer
    }
  }

  /**
   * @description Get all materials for a project
   * @param projectId The ID of the project
   * @returns Array of materials (typed as local Material)
   */
  async findAllByProject(projectId: number): Promise<Material[]> {
    console.log(`[MaterialRepository] Attempting to find all materials for project ID: ${projectId}`);
    try {
      const materials: PrismaMaterial[] = await this.prisma.material.findMany({
        where: {
          projectId,
        },
        orderBy: {
          materialId: 'asc',
        },
      });
      console.log(`[MaterialRepository] Found ${materials.length} materials for project ID: ${projectId}. Materials:`, JSON.stringify(materials, null, 2));
      return assertIsMaterialArray(materials);
    } catch (error) {
      console.error(`[MaterialRepository] Error finding materials for project ID ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * @description Get a material by ID
   * @param id The ID of the material
   * @returns The material or null if not found (typed as local Material)
   */
  async findById(id: number): Promise<Material | null> {
    console.log(`[MaterialRepository] Attempting to find material by ID: ${id}`);
    try {
      const material: PrismaMaterial | null = await this.prisma.material.findUnique({
        where: {
          id,
        },
      });
      console.log(`[MaterialRepository] Material found by ID ${id}:`, material ? JSON.stringify(material, null, 2) : null);
      return material ? assertIsMaterial(material) : null;
    } catch (error) {
      console.error(`[MaterialRepository] Error finding material by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * @description Get a material by project ID and material ID
   * @param projectId The ID of the project
   * @param materialId The material ID (user-defined)
   * @returns The material or null if not found (typed as local Material)
   */
  async findByProjectAndMaterialId(projectId: number, materialId: string): Promise<Material | null> {
    console.log(`[MaterialRepository] Attempting to find material by project ID ${projectId} and materialId ${materialId}`);
    try {
      const material: PrismaMaterial | null = await this.prisma.material.findFirst({
        where: {
          projectId,
          materialId,
        },
      });
      console.log(`[MaterialRepository] Material found by project ID ${projectId} and materialId ${materialId}:`, material ? JSON.stringify(material, null, 2) : null);
      return material ? assertIsMaterial(material) : null;
    } catch (error) {
      console.error(`[MaterialRepository] Error finding material by project ID ${projectId} and materialId ${materialId}:`, error);
      throw error;
    }
  }

  /**
   * @description Update a material
   * @param id The ID of the material
   * @param materialData The material data to update
   * @returns The updated material (typed as local Material)
   */
  async update(id: number, materialData: UpdateMaterialDto): Promise<Material> {
    // Create a properly typed update object
    const updateData: Prisma.MaterialUpdateInput = {};
    
    if (materialData.materialId !== undefined) {
      updateData.materialId = materialData.materialId;
    }
    
    if (materialData.plyThickness !== undefined) {
      updateData.plyThickness = materialData.plyThickness;
      updateData.overallThickness = materialData.plyThickness + 2;
    }
    
    if (materialData.innerLaminateCode !== undefined) {
      updateData.innerLaminateCode = materialData.innerLaminateCode;
    }
    
    if (materialData.outerLaminateCode !== undefined) {
      updateData.outerLaminateCode = materialData.outerLaminateCode;
    }
    
    if (materialData.plyType !== undefined) {
      updateData.plyType = materialData.plyType as PlyType;
    }
    
    if (materialData.grainDirection !== undefined) {
      updateData.grainDirection = materialData.grainDirection as GrainDirection;
    }
    
    // Note: edgebandingInnerCode and edgebandingExposedCode are not in the Prisma schema
    

    console.log(`[MaterialRepository] Attempting to update material ID ${id} with data:`, JSON.stringify(updateData, null, 2));
    try {
      const material: PrismaMaterial = await this.prisma.material.update({
        where: {
          id,
        },
        data: updateData,
      });
      console.log(`[MaterialRepository] Material successfully updated in DB:`, JSON.stringify(material, null, 2));
      return assertIsMaterial(material);
    } catch (error) {
      console.error(`[MaterialRepository] Error updating material ID ${id} in DB:`, error);
      throw error;
    }
  }

  /**
   * @description Delete a material
   * @param id The ID of the material
   * @returns The deleted material (typed as local Material)
   */
  async delete(id: number): Promise<Material> {
    console.log(`[MaterialRepository] Attempting to delete material ID: ${id}`);
    try {
      const material: PrismaMaterial = await this.prisma.material.delete({
        where: {
          id,
        },
      });
      console.log(`[MaterialRepository] Material successfully deleted from DB:`, JSON.stringify(material, null, 2));
      return assertIsMaterial(material);
    } catch (error) {
      console.error(`[MaterialRepository] Error deleting material ID ${id} from DB:`, error);
      throw error;
    }
  }

  /**
   * @description Check if a material ID already exists in a project
   * @param projectId The ID of the project
   * @param materialId The material ID to check
   * @param excludeId Optional ID to exclude from the check (for updates)
   * @returns True if the material ID exists, false otherwise
   */
  async materialIdExists(projectId: number, materialId: string, excludeId?: number): Promise<boolean> {
    console.log(`[MaterialRepository] Checking if materialId '${materialId}' exists in project ${projectId}, excluding ID ${excludeId}`);
    try {
      const count = await this.prisma.material.count({
        where: {
          projectId,
          materialId,
          id: excludeId ? { not: excludeId } : undefined,
        },
      });
      console.log(`[MaterialRepository] Count for materialId '${materialId}' in project ${projectId} (excluding ID ${excludeId}): ${count}`);
      return count > 0;
    } catch (error) {
      console.error(`[MaterialRepository] Error checking if materialId '${materialId}' exists in project ${projectId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const materialRepository = new MaterialRepository();
