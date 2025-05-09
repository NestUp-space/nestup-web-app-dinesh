/**
 * SiteVisitBox Service
 * Handles business logic for site visit box configurations
 */

import { ServiceResponse } from '../common/models/serviceResponse';
import { CreateSiteVisitBoxDto, SiteVisitBox, UpdateSiteVisitBoxDto } from '../bim/types/bim.types';
import { siteVisitBoxRepository } from '../repositories/siteVisitBox.repository';
import { BimService } from '../bim/services/bim.service';

export class SiteVisitBoxService {
  private bimService: BimService;

  constructor() {
    this.bimService = new BimService();
  }

  /**
   * @description Create a new site visit box configuration
   * @param taskId The ID of the task
   * @param boxData The box configuration data
   * @returns ServiceResponse with the created site visit box or error
   */
  async createSiteVisitBox(taskId: number, boxData: CreateSiteVisitBoxDto): Promise<ServiceResponse<SiteVisitBox | null>> {
    try {
      // Validate that the model type exists
      const modelInfoResponse = this.bimService.getModelTemplate(boxData.modelType);
      if (!modelInfoResponse.success) {
        return ServiceResponse.failure(`Invalid model type: ${boxData.modelType}`, null);
      }

      // If order is not provided, get the next order
      if (!boxData.order) {
        boxData.order = await siteVisitBoxRepository.getNextOrder(taskId);
      }

      // Create the box
      const box = await siteVisitBoxRepository.create(taskId, boxData);
      return ServiceResponse.success('Site visit box created successfully.', box);
    } catch (error) {
      console.error('Error creating site visit box:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error creating site visit box.',
        null
      );
    }
  }

  /**
   * @description Get all site visit boxes for a task
   * @param taskId The ID of the task
   * @returns ServiceResponse with the site visit boxes or error
   */
  async getBoxesByTask(taskId: number): Promise<ServiceResponse<SiteVisitBox[] | null>> {
    try {
      const boxes = await siteVisitBoxRepository.findAllByTask(taskId);
      return ServiceResponse.success('Site visit boxes retrieved successfully.', boxes);
    } catch (error) {
      console.error('Error retrieving site visit boxes:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error retrieving site visit boxes.',
        null
      );
    }
  }

  /**
   * @description Get a site visit box by ID
   * @param id The ID of the site visit box
   * @returns ServiceResponse with the site visit box or error
   */
  async getBoxById(id: number): Promise<ServiceResponse<SiteVisitBox | null>> {
    try {
      const box = await siteVisitBoxRepository.findById(id);
      if (!box) {
        return ServiceResponse.failure(`Site visit box with ID ${id} not found.`, null);
      }
      return ServiceResponse.success('Site visit box retrieved successfully.', box);
    } catch (error) {
      console.error('Error retrieving site visit box:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error retrieving site visit box.',
        null
      );
    }
  }

  /**
   * @description Update a site visit box
   * @param id The ID of the site visit box
   * @param boxData The box configuration data to update
   * @returns ServiceResponse with the updated site visit box or error
   */
  async updateBox(id: number, boxData: UpdateSiteVisitBoxDto): Promise<ServiceResponse<SiteVisitBox | null>> {
    try {
      // Check if the box exists
      const existingBox = await siteVisitBoxRepository.findById(id);
      if (!existingBox) {
        return ServiceResponse.failure(`Site visit box with ID ${id} not found.`, null);
      }

      // If model type is being changed, validate that it exists
      if (boxData.modelType && boxData.modelType !== existingBox.modelType) {
        const modelInfoResponse = this.bimService.getModelTemplate(boxData.modelType);
        if (!modelInfoResponse.success) {
          return ServiceResponse.failure(`Invalid model type: ${boxData.modelType}`, null);
        }
      }

      // Update the box
      const box = await siteVisitBoxRepository.update(id, boxData);
      return ServiceResponse.success('Site visit box updated successfully.', box);
    } catch (error) {
      console.error('Error updating site visit box:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error updating site visit box.',
        null
      );
    }
  }

  /**
   * @description Delete a site visit box
   * @param id The ID of the site visit box
   * @returns ServiceResponse with the deleted site visit box or error
   */
  async deleteBox(id: number): Promise<ServiceResponse<SiteVisitBox | null>> {
    try {
      // Check if the box exists
      const existingBox = await siteVisitBoxRepository.findById(id);
      if (!existingBox) {
        return ServiceResponse.failure(`Site visit box with ID ${id} not found.`, null);
      }

      // Delete the box
      const box = await siteVisitBoxRepository.delete(id);
      
      // Reorder the remaining boxes
      const remainingBoxes = await siteVisitBoxRepository.findAllByTask(box.taskId);
      const orderedIds = remainingBoxes.map(b => b.id);
      await siteVisitBoxRepository.reorder(box.taskId, orderedIds);
      
      return ServiceResponse.success('Site visit box deleted successfully.', box);
    } catch (error) {
      console.error('Error deleting site visit box:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error deleting site visit box.',
        null
      );
    }
  }

  /**
   * @description Reorder site visit boxes in a task
   * @param taskId The ID of the task
   * @param orderedIds Array of box IDs in the desired order
   * @returns ServiceResponse with success or error
   */
  async reorderBoxes(taskId: number, orderedIds: number[]): Promise<ServiceResponse<null>> {
    try {
      // Validate that all boxes exist and belong to the task
      const boxes = await siteVisitBoxRepository.findAllByTask(taskId);
      const boxIds = new Set(boxes.map(b => b.id));
      
      for (const id of orderedIds) {
        if (!boxIds.has(id)) {
          return ServiceResponse.failure(`Box with ID ${id} not found in task ${taskId}.`, null);
        }
      }
      
      // Check if all boxes are included in the ordered IDs
      if (orderedIds.length !== boxes.length) {
        return ServiceResponse.failure(
          `Ordered IDs count (${orderedIds.length}) does not match the number of boxes in the task (${boxes.length}).`,
          null
        );
      }
      
      // Reorder the boxes
      await siteVisitBoxRepository.reorder(taskId, orderedIds);
      return ServiceResponse.success('Site visit boxes reordered successfully.', null);
    } catch (error) {
      console.error('Error reordering site visit boxes:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error reordering site visit boxes.',
        null
      );
    }
  }

  /**
   * @description Generate a plank list from all boxes in a task
   * @param taskId The ID of the task
   * @returns ServiceResponse with the combined plank list or error
   */
  async generateCombinedPlankList(taskId: number): Promise<ServiceResponse<any>> {
    try {
      // Get all boxes for the task
      const boxes = await siteVisitBoxRepository.findAllByTask(taskId);
      if (boxes.length === 0) {
        return ServiceResponse.failure('No boxes found for this task.', null);
      }

      // Generate plank list for each box and combine them
      const allPlanks: any[] = [];
      
      for (const box of boxes) {
        const plankListResponse = this.bimService.createPlankList(box.modelType, box.inputs);
        if (!plankListResponse.success || !plankListResponse.responseObject) {
          return ServiceResponse.failure(
            `Error generating plank list for box ${box.id}: ${plankListResponse.message}`,
            null
          );
        }
        
        // Add box identifier to each plank
        const planksWithBoxId = plankListResponse.responseObject.map((plank: any) => ({
          ...plank,
          boxId: box.id,
          boxModelType: box.modelType,
        }));
        
        allPlanks.push(...planksWithBoxId);
      }
      
      return ServiceResponse.success('Combined plank list generated successfully.', allPlanks);
    } catch (error) {
      console.error('Error generating combined plank list:', error);
      return ServiceResponse.failure(
        error instanceof Error ? error.message : 'Unknown error generating combined plank list.',
        null
      );
    }
  }
}

// Export a singleton instance
export const siteVisitBoxService = new SiteVisitBoxService();
