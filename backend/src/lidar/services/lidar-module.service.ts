/**
 * LiDAR Module Service
 * Handles module template management and module placement
 */

import { ModuleCategory, LidarSessionStatus, Prisma } from '@prisma/client';
import prisma from '../../config/db';
import {
  ModuleTemplateResponse,
  PlaceModuleInput,
  PlacedModuleResponse,
  ModuleDimensions,
} from '../types/lidar.types';

export class LidarModuleService {
  /**
   * Get all module templates
   */
  async getModuleTemplates(options?: {
    category?: ModuleCategory;
    isActive?: boolean;
  }): Promise<ModuleTemplateResponse[]> {
    const where: Prisma.LidarModuleTemplateWhereInput = {};

    if (options?.category) {
      where.category = options.category;
    }
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const templates = await prisma.lidarModuleTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return templates.map(this.mapTemplateToResponse);
  }

  /**
   * Get a single module template
   */
  async getModuleTemplate(templateId: string): Promise<ModuleTemplateResponse | null> {
    const template = await prisma.lidarModuleTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return null;
    }

    return this.mapTemplateToResponse(template);
  }

  /**
   * Place a module in a session
   */
  async placeModule(
    sessionId: string,
    data: PlaceModuleInput
  ): Promise<PlacedModuleResponse> {
    // Verify session exists and is in correct state
    const session = await prisma.lidarSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (
      session.status !== LidarSessionStatus.PROCESSED &&
      session.status !== LidarSessionStatus.DESIGNING
    ) {
      throw new Error(
        `Cannot place modules in session with status ${session.status}`
      );
    }

    // Verify template exists
    const template = await prisma.lidarModuleTemplate.findUnique({
      where: { id: data.templateId },
    });

    if (!template) {
      throw new Error('Module template not found');
    }

    // Verify wall exists if wallId provided
    if (data.wallId) {
      const wall = await prisma.lidarWall.findFirst({
        where: { id: data.wallId, sessionId },
      });

      if (!wall) {
        throw new Error('Wall not found in this session');
      }
    }

    // Check for collisions with existing modules
    const existingModules = await prisma.lidarPlacedModule.findMany({
      where: { sessionId },
    });

    const hasCollision = this.checkCollision(data.position, data.dimensions, existingModules);
    if (hasCollision) {
      throw new Error('Module placement would collide with existing module');
    }

    // Create placed module
    const placedModule = await prisma.lidarPlacedModule.create({
      data: {
        sessionId,
        templateId: data.templateId,
        wallId: data.wallId,
        position: data.position as unknown as Prisma.InputJsonValue,
        dimensions: data.dimensions as unknown as Prisma.InputJsonValue,
        rotation: data.rotation || 0,
        parameters: (data.parameters || {}) as unknown as Prisma.InputJsonValue,
      },
      include: {
        template: true,
      },
    });

    // Update session status to DESIGNING if it was PROCESSED
    if (session.status === LidarSessionStatus.PROCESSED) {
      await prisma.lidarSession.update({
        where: { id: sessionId },
        data: { status: LidarSessionStatus.DESIGNING },
      });
    }

    return this.mapPlacedModuleToResponse(placedModule);
  }

  /**
   * Update a placed module
   */
  async updatePlacedModule(
    sessionId: string,
    moduleId: string,
    data: Partial<PlaceModuleInput>
  ): Promise<PlacedModuleResponse | null> {
    // Verify module exists and belongs to session
    const existing = await prisma.lidarPlacedModule.findFirst({
      where: { id: moduleId, sessionId },
    });

    if (!existing) {
      return null;
    }

    // Verify wall if provided
    if (data.wallId) {
      const wall = await prisma.lidarWall.findFirst({
        where: { id: data.wallId, sessionId },
      });

      if (!wall) {
        throw new Error('Wall not found in this session');
      }
    }

    // Check for collisions if position or dimensions changed
    if (data.position || data.dimensions) {
      const newPosition = data.position || (existing.position as unknown as { x: number; y: number; z: number });
      const newDimensions = data.dimensions || (existing.dimensions as unknown as ModuleDimensions);

      const existingModules = await prisma.lidarPlacedModule.findMany({
        where: { sessionId, id: { not: moduleId } },
      });

      const hasCollision = this.checkCollision(newPosition, newDimensions, existingModules);
      if (hasCollision) {
        throw new Error('Module placement would collide with existing module');
      }
    }

    const updateData: Prisma.LidarPlacedModuleUpdateInput = {};

    if (data.wallId !== undefined) {
      updateData.wall = data.wallId ? { connect: { id: data.wallId } } : { disconnect: true };
    }
    if (data.position) {
      updateData.position = data.position as unknown as Prisma.InputJsonValue;
    }
    if (data.dimensions) {
      updateData.dimensions = data.dimensions as unknown as Prisma.InputJsonValue;
    }
    if (data.rotation !== undefined) {
      updateData.rotation = data.rotation;
    }
    if (data.parameters) {
      updateData.parameters = data.parameters as unknown as Prisma.InputJsonValue;
    }

    const updated = await prisma.lidarPlacedModule.update({
      where: { id: moduleId },
      data: updateData,
      include: {
        template: true,
      },
    });

    return this.mapPlacedModuleToResponse(updated);
  }

  /**
   * Delete a placed module
   */
  async deletePlacedModule(sessionId: string, moduleId: string): Promise<boolean> {
    const existing = await prisma.lidarPlacedModule.findFirst({
      where: { id: moduleId, sessionId },
    });

    if (!existing) {
      return false;
    }

    await prisma.lidarPlacedModule.delete({
      where: { id: moduleId },
    });

    return true;
  }

  /**
   * Get all placed modules for a session
   */
  async getPlacedModules(sessionId: string): Promise<PlacedModuleResponse[]> {
    const modules = await prisma.lidarPlacedModule.findMany({
      where: { sessionId },
      include: {
        template: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return modules.map(this.mapPlacedModuleToResponse);
  }

  /**
   * Check for collision between modules
   */
  private checkCollision(
    position: { x: number; y: number; z: number },
    dimensions: ModuleDimensions,
    existingModules: any[]
  ): boolean {
    const newBox = {
      minX: position.x - dimensions.width / 2,
      maxX: position.x + dimensions.width / 2,
      minY: position.y - dimensions.depth / 2,
      maxY: position.y + dimensions.depth / 2,
      minZ: position.z,
      maxZ: position.z + dimensions.height,
    };

    for (const module of existingModules) {
      const pos = module.position as { x: number; y: number; z: number };
      const dims = module.dimensions as ModuleDimensions;

      const existingBox = {
        minX: pos.x - dims.width / 2,
        maxX: pos.x + dims.width / 2,
        minY: pos.y - dims.depth / 2,
        maxY: pos.y + dims.depth / 2,
        minZ: pos.z,
        maxZ: pos.z + dims.height,
      };

      // Check for overlap
      if (
        newBox.minX < existingBox.maxX &&
        newBox.maxX > existingBox.minX &&
        newBox.minY < existingBox.maxY &&
        newBox.maxY > existingBox.minY &&
        newBox.minZ < existingBox.maxZ &&
        newBox.maxZ > existingBox.minZ
      ) {
        return true;
      }
    }

    return false;
  }

  private mapTemplateToResponse(template: any): ModuleTemplateResponse {
    return {
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
      thumbnailUrl: template.thumbnailUrl,
      modelUrl: template.modelUrl,
      defaultDimensions: template.defaultDimensions,
      constraints: template.constraints,
      parameters: template.parameters || {},
      placementRules: template.placementRules,
      isActive: template.isActive,
    };
  }

  private mapPlacedModuleToResponse(module: any): PlacedModuleResponse {
    return {
      id: module.id,
      sessionId: module.sessionId,
      templateId: module.templateId,
      wallId: module.wallId,
      position: module.position,
      dimensions: module.dimensions,
      rotation: module.rotation,
      parameters: module.parameters || {},
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
      template: module.template ? this.mapTemplateToResponse(module.template) : undefined,
    };
  }
}

// Export singleton instance
export const lidarModuleService = new LidarModuleService();
