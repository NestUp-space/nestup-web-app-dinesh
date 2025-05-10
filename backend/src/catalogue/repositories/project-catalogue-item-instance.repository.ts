import { PrismaClient, ProjectCatalogueItemInstance } from '@prisma/client';

const prisma = new PrismaClient();

export class ProjectCatalogueItemInstanceRepository {
  constructor() {
    console.log('ProjectCatalogueItemInstanceRepository initialized');
  }

  async create(data: {
    projectId: number; // Changed to number to match schema
    catalogueItemDefinitionId: string; // Renamed from modelDefinitionId
    runtimeInputsJson: any; // Prisma expects JsonValue, DTO ensures it's provided
  }): Promise<ProjectCatalogueItemInstance> {
    return prisma.projectCatalogueItemInstance.create({
      data: {
        projectId: data.projectId,
        modelDefinitionId: data.catalogueItemDefinitionId, // Ensure this matches schema field name
        runtimeInputsJson: data.runtimeInputsJson,
      },
    });
  }

  async findAllByProjectId(projectId: number): Promise<ProjectCatalogueItemInstance[]> { // Changed projectId to number
    return prisma.projectCatalogueItemInstance.findMany({
      where: { projectId },
      include: { modelDefinition: true }, // modelDefinition is the relation name in Prisma schema
    });
  }

  async findById(id: string): Promise<ProjectCatalogueItemInstance | null> {
    return prisma.projectCatalogueItemInstance.findUnique({
      where: { id },
      include: { modelDefinition: true, generatedPlankLists: true }, // modelDefinition is the relation name
    });
  }

  async update(id: string, data: {
    runtimeInputsJson?: any; // Making this optional in the input data type
  }): Promise<ProjectCatalogueItemInstance | null> {
    const updateData: { runtimeInputsJson?: any } = {};
    if (data.hasOwnProperty('runtimeInputsJson')) {
      updateData.runtimeInputsJson = data.runtimeInputsJson;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    return prisma.projectCatalogueItemInstance.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<ProjectCatalogueItemInstance | null> {
    return prisma.projectCatalogueItemInstance.delete({
      where: { id },
    });
  }

  async findGeneratedPlankListsByInstanceId(projectCatalogueItemInstanceId: string) {
    return prisma.generatedPlankList.findMany({
      where: { projectModelInstanceId: projectCatalogueItemInstanceId }, // Corrected field name
      orderBy: { generatedAt: 'desc' },
    });
  }
}
