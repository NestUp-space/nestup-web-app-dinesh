/**
 * SiteVisitBox Repository
 * Handles database operations for site visit box configurations
 */

import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '../config/db';
import { CreateSiteVisitBoxDto, SiteVisitBox, UpdateSiteVisitBoxDto } from '../bim/types/bim.types';

export interface ISiteVisitBoxRepository {
  create(taskId: number, data: CreateSiteVisitBoxDto): Promise<SiteVisitBox>;
  findAllByTask(taskId: number): Promise<SiteVisitBox[]>;
  findById(id: number): Promise<SiteVisitBox | null>;
  update(id: number, data: UpdateSiteVisitBoxDto): Promise<SiteVisitBox>;
  delete(id: number): Promise<SiteVisitBox>;
  getNextOrder(taskId: number): Promise<number>;
  reorder(taskId: number, orderedIds: number[]): Promise<void>;
}

export class SiteVisitBoxRepository implements ISiteVisitBoxRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * @description Create a new site visit box configuration
   * @param taskId The ID of the task
   * @param boxData The box configuration data
   * @returns The created site visit box
   */
  async create(taskId: number, boxData: CreateSiteVisitBoxDto): Promise<SiteVisitBox> {
    // Use any type to bypass TypeScript checking until Prisma client is generated
    const box = await (this.prisma as any).siteVisitBox.create({
      data: {
        taskId,
        order: boxData.order,
        modelType: boxData.modelType,
        inputs: boxData.inputs,
      },
    });
    
    return box as unknown as SiteVisitBox;
  }

  /**
   * @description Get all site visit boxes for a task
   * @param taskId The ID of the task
   * @returns Array of site visit boxes
   */
  async findAllByTask(taskId: number): Promise<SiteVisitBox[]> {
    // Use any type to bypass TypeScript checking until Prisma client is generated
    const boxes = await (this.prisma as any).siteVisitBox.findMany({
      where: {
        taskId,
      },
      orderBy: {
        order: 'asc',
      },
    });
    
    return boxes as unknown as SiteVisitBox[];
  }

  /**
   * @description Get a site visit box by ID
   * @param id The ID of the site visit box
   * @returns The site visit box or null if not found
   */
  async findById(id: number): Promise<SiteVisitBox | null> {
    // Use any type to bypass TypeScript checking until Prisma client is generated
    const box = await (this.prisma as any).siteVisitBox.findUnique({
      where: {
        id,
      },
    });
    
    return box as unknown as SiteVisitBox | null;
  }

  /**
   * @description Update a site visit box
   * @param id The ID of the site visit box
   * @param boxData The box configuration data to update
   * @returns The updated site visit box
   */
  async update(id: number, boxData: UpdateSiteVisitBoxDto): Promise<SiteVisitBox> {
    // Use any type to bypass TypeScript checking until Prisma client is generated
    const box = await (this.prisma as any).siteVisitBox.update({
      where: {
        id,
      },
      data: boxData,
    });
    
    return box as unknown as SiteVisitBox;
  }

  /**
   * @description Delete a site visit box
   * @param id The ID of the site visit box
   * @returns The deleted site visit box
   */
  async delete(id: number): Promise<SiteVisitBox> {
    // Use any type to bypass TypeScript checking until Prisma client is generated
    const box = await (this.prisma as any).siteVisitBox.delete({
      where: {
        id,
      },
    });
    
    return box as unknown as SiteVisitBox;
  }

  /**
   * @description Get the next order value for a new box in a task
   * @param taskId The ID of the task
   * @returns The next order value
   */
  async getNextOrder(taskId: number): Promise<number> {
    // Use any type to bypass TypeScript checking until Prisma client is generated
    const maxOrderBox = await (this.prisma as any).siteVisitBox.findFirst({
      where: {
        taskId,
      },
      orderBy: {
        order: 'desc',
      },
    });
    
    return maxOrderBox ? maxOrderBox.order + 1 : 1;
  }

  /**
   * @description Reorder boxes in a task
   * @param taskId The ID of the task
   * @param orderedIds Array of box IDs in the desired order
   */
  async reorder(taskId: number, orderedIds: number[]): Promise<void> {
    // Use a transaction to ensure all updates succeed or fail together
    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await (tx as any).siteVisitBox.update({
          where: {
            id: orderedIds[i],
            taskId, // Ensure the box belongs to the task
          },
          data: {
            order: i + 1,
          },
        });
      }
    });
  }
}

// Export a singleton instance
export const siteVisitBoxRepository = new SiteVisitBoxRepository();
