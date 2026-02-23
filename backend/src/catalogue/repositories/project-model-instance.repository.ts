import { ProjectModelInstance, GeneratedPlankList } from '@prisma/client';
import prisma from '../../config/db';

export class ProjectModelInstanceRepository {
  constructor() {
    console.log('ProjectModelInstanceRepository initialized');
  }

  async create(data: {
    projectId: number;
    modelDefinitionId: string;
    runtimeInputsJson: any;
  }): Promise<ProjectModelInstance> {
    return prisma.projectModelInstance.create({
      data,
      include: { modelDefinition: true } 
    });
  }

  async findAllByProjectId(projectId: number): Promise<ProjectModelInstance[]> {
    return prisma.projectModelInstance.findMany({
      where: { projectId },
      include: { modelDefinition: true, generatedPlankLists: true },
      orderBy: { uiDisplayOrder: 'asc' } // Added ordering
    });
  }

  async findById(id: string): Promise<ProjectModelInstance | null> {
    return prisma.projectModelInstance.findUnique({
      where: { id },
      include: { modelDefinition: true, generatedPlankLists: true } 
    });
  }

  async update(id: string, data: { runtimeInputsJson?: any }): Promise<ProjectModelInstance | null> {
    return prisma.projectModelInstance.update({
      where: { id },
      data,
      include: { modelDefinition: true } 
    });
  }

  async delete(id: string): Promise<ProjectModelInstance | null> {
    // Need to handle related GeneratedPlankList records if onDelete: Cascade is not set or not working as expected
    // For now, assuming cascade delete or manual deletion elsewhere if necessary
    return prisma.projectModelInstance.delete({
      where: { id },
    });
  }
  
  async findGeneratedPlankListsByInstanceId(projectModelInstanceId: string): Promise<GeneratedPlankList[]> {
    return prisma.generatedPlankList.findMany({
      where: { projectModelInstanceId },
    });
  }
}
