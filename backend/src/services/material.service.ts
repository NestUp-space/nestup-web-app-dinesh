/**
 * Material Service
 * Handles business logic for project materials
 */

import { ServiceResponse } from '../common/models/serviceResponse';
import { CreateMaterialDto, Material, UpdateMaterialDto } from '../bim/types/bim.types';
import { materialRepository } from '../repositories/material.repository';

export class MaterialService {
  /**
   * @description Create a new material for a project
   * @param projectId The ID of the project
   * @param materialData The material data
   * @returns ServiceResponse with the created material or error
   */
  async createMaterial(projectId: number, materialData: CreateMaterialDto): Promise<ServiceResponse<Material | null>> {
    try {
      // Check if material ID already exists in the project
      const exists = await materialRepository.materialIdExists(projectId, materialData.materialId);
      if (exists) {
        return ServiceResponse.failure(`Material ID "${materialData.materialId}" already exists in this project.`, null);
      }

      // Create the material
      const material = await materialRepository.create(projectId, materialData);
      return ServiceResponse.success('Material created successfully.', material);
    } catch (error) {
      console.error('Error creating material:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error creating material.',
        null
      );
    }
  }

  /**
   * @description Get all materials for a project
   * @param projectId The ID of the project
   * @returns ServiceResponse with the materials or error
   */
  async getMaterialsByProject(projectId: number): Promise<ServiceResponse<Material[] | null>> {
    try {
      const materials = await materialRepository.findAllByProject(projectId);
      return ServiceResponse.success('Materials retrieved successfully.', materials);
    } catch (error) {
      console.error('Error retrieving materials:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error retrieving materials.',
        null
      );
    }
  }

  /**
   * @description Get a material by ID
   * @param id The ID of the material
   * @returns ServiceResponse with the material or error
   */
  async getMaterialById(id: number): Promise<ServiceResponse<Material | null>> {
    try {
      const material = await materialRepository.findById(id);
      if (!material) {
        return ServiceResponse.failure(`Material with ID ${id} not found.`, null);
      }
      return ServiceResponse.success('Material retrieved successfully.', material);
    } catch (error) {
      console.error('Error retrieving material:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error retrieving material.',
        null
      );
    }
  }

  /**
   * @description Update a material
   * @param id The ID of the material
   * @param materialData The material data to update
   * @returns ServiceResponse with the updated material or error
   */
  async updateMaterial(id: number, materialData: UpdateMaterialDto): Promise<ServiceResponse<Material | null>> {
    try {
      // Check if the material exists
      const existingMaterial = await materialRepository.findById(id);
      if (!existingMaterial) {
        return ServiceResponse.failure(`Material with ID ${id} not found.`, null);
      }

      // If materialId is being changed, check if the new ID already exists
      if (materialData.materialId && materialData.materialId !== existingMaterial.materialId) {
        const exists = await materialRepository.materialIdExists(
          existingMaterial.projectId,
          materialData.materialId,
          id
        );
        if (exists) {
          return ServiceResponse.failure(
            `Material ID "${materialData.materialId}" already exists in this project.`,
            null
          );
        }
      }

      // Update the material
      const material = await materialRepository.update(id, materialData);
      return ServiceResponse.success('Material updated successfully.', material);
    } catch (error) {
      console.error('Error updating material:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error updating material.',
        null
      );
    }
  }

  /**
   * @description Delete a material
   * @param id The ID of the material
   * @returns ServiceResponse with the deleted material or error
   */
  async deleteMaterial(id: number): Promise<ServiceResponse<Material | null>> {
    try {
      // Check if the material exists
      const existingMaterial = await materialRepository.findById(id);
      if (!existingMaterial) {
        return ServiceResponse.failure(`Material with ID ${id} not found.`, null);
      }

      // TODO: Check if the material is being used by any boxes or planks
      // If so, return an error

      // Delete the material
      const material = await materialRepository.delete(id);
      return ServiceResponse.success('Material deleted successfully.', material);
    } catch (error) {
      console.error('Error deleting material:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error deleting material.',
        null
      );
    }
  }
}

// Export a singleton instance
export const materialService = new MaterialService();
