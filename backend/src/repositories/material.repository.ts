/**
 * Material Repository
 * Handles database operations for project materials
 */

import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '../config/db';
import { CreateMaterialDto, Material, UpdateMaterialDto } from '../bim/types/bim.types';

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
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * @description Create a new material for a project
   * @param projectId The ID of the project
   * @param materialData The material data
   * @returns The created material
   */
  async create(projectId: number, materialData: CreateMaterialDto): Promise<Material> {
    // Calculate overall thickness (inner laminate + ply thickness + outer laminate)
    // Assuming default laminate thickness of 1mm each
    const overallThickness = materialData.plyThickness + 2; // 1mm inner + ply + 1mm outer

    // Use any type to bypass TypeScript checking until Prisma client is generated
    const material = await (this.prisma as any).material.create({
      data: {
        projectId,
        materialId: materialData.materialId,
        plyThickness: materialData.plyThickness,
        innerLaminateCode: materialData.innerLaminateCode,
        outerLaminateCode: materialData.outerLaminateCode,
        overallThickness,
        plyType: materialData.plyType,
        grainDirection: materialData.grainDirection,
        edgebandingInnerCode: materialData.edgebandingInnerCode,
        edgebandingExposedCode: materialData.edgebandingExposedCode,
      },
    });
    
    return material as unknown as Material;
  }

  /**
   * @description Get all materials for a project
   * @param projectId The ID of the project
   * @returns Array of materials
   */
  async findAllByProject(projectId: number): Promise<Material[]> {
    // Use any type to bypass TypeScript checking until Prisma client is generated
    const materials = await (this.prisma as any).material.findMany({
      where: {
        projectId,
      },
      orderBy: {
        materialId: 'asc',
      },
    });
    
    return materials as unknown as Material[];
  }

  /**
   * @description Get a material by ID
   * @param id The ID of the material
   * @returns The material or null if not found
   */
  async findById(id: number): Promise<Material | null> {
    // Use any type to bypass TypeScript checking until Prisma client is generated
    const material = await (this.prisma as any).material.findUnique({
      where: {
        id,
      },
    });
    
    return material as unknown as Material | null;
  }

  /**
   * @description Get a material by project ID and material ID
   * @param projectId The ID of the project
   * @param materialId The material ID (user-defined)
   * @returns The material or null if not found
   */
  async findByProjectAndMaterialId(projectId: number, materialId: string): Promise<Material | null> {
    // Use any type to bypass TypeScript checking until Prisma client is generated
    const material = await (this.prisma as any).material.findFirst({
      where: {
        projectId,
        materialId,
      },
    });
    
    return material as unknown as Material | null;
  }

  /**
   * @description Update a material
   * @param id The ID of the material
   * @param materialData The material data to update
   * @returns The updated material
   */
  async update(id: number, materialData: UpdateMaterialDto): Promise<Material> {
    // Calculate new overall thickness if ply thickness is provided
    const updateData: any = { ...materialData };
    
    if (materialData.plyThickness !== undefined) {
      // Assuming default laminate thickness of 1mm each
      updateData.overallThickness = materialData.plyThickness + 2; // 1mm inner + ply + 1mm outer
    }

    // Use any type to bypass TypeScript checking until Prisma client is generated
    const material = await (this.prisma as any).material.update({
      where: {
        id,
      },
      data: updateData,
    });
    
    return material as unknown as Material;
  }

  /**
   * @description Delete a material
   * @param id The ID of the material
   * @returns The deleted material
   */
  async delete(id: number): Promise<Material> {
    // Use any type to bypass TypeScript checking until Prisma client is generated
    const material = await (this.prisma as any).material.delete({
      where: {
        id,
      },
    });
    
    return material as unknown as Material;
  }

  /**
   * @description Check if a material ID already exists in a project
   * @param projectId The ID of the project
   * @param materialId The material ID to check
   * @param excludeId Optional ID to exclude from the check (for updates)
   * @returns True if the material ID exists, false otherwise
   */
  async materialIdExists(projectId: number, materialId: string, excludeId?: number): Promise<boolean> {
    // Use any type to bypass TypeScript checking until Prisma client is generated
    const count = await (this.prisma as any).material.count({
      where: {
        projectId,
        materialId,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    
    return count > 0;
  }
}

// Export a singleton instance
export const materialRepository = new MaterialRepository();
