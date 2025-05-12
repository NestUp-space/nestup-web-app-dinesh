import { ProjectModelInstance, GeneratedPlankList, Prisma, PrismaClient } from '@prisma/client'; // Added PrismaClient
import { ProjectModelInstanceRepository } from '../repositories/project-model-instance.repository'; // Updated repository name
import { CreateProjectModelInstanceDto, UpdateProjectModelInstanceDto } from '../dtos/model.dto'; // Updated DTO import and names
import { ModelRepository } from '../repositories/model.repository'; // Updated repository import
// import { ProjectRepository } from '../../repositories/project.repository'; // To check if Project exists

// Interface for the data expected from the frontend for each box configuration
interface BoxConfigDto {
  id?: string; // Existing instance ID (if updating)
  modelDefinitionId: string;
  runtimeInputsJson: Prisma.InputJsonValue;
  uiDisplayOrder: number;
  // projectId will be passed as a separate parameter to the service method
}

export class ProjectModelInstanceService { // Updated class name
  private projectModelInstanceRepository: ProjectModelInstanceRepository; // Updated repository type
  private modelRepository: ModelRepository; // Updated repository type
  // private projectRepository: ProjectRepository; 

  constructor() {
    this.projectModelInstanceRepository = new ProjectModelInstanceRepository(); // Updated repository instantiation
    this.modelRepository = new ModelRepository(); // Updated repository instantiation
    console.log('ProjectModelInstanceService initialized'); // Updated log message
  }

  async create(data: CreateProjectModelInstanceDto): Promise<ProjectModelInstance> { // Updated DTO and return type
    // Validate if modelDefinitionId exists
    const modelDefinition = await this.modelRepository.findById(data.modelDefinitionId); // Updated repository method and DTO field
    if (!modelDefinition) {
      throw new Error(`ModelDefinition with ID ${data.modelDefinitionId} not found.`); // Updated error message and DTO field
    }
    // TODO: Validate if projectId exists (Project.id is Int, DTO uses number)
    // This validation can be done by attempting to fetch the project or relying on DB constraints.

    // Data passed to repository create method should match its expectation
    // The DTO already has projectId as number and modelDefinitionId
    return this.projectModelInstanceRepository.create({ // Updated repository method
      projectId: data.projectId,
      modelDefinitionId: data.modelDefinitionId, // Updated DTO field
      runtimeInputsJson: data.runtimeInputsJson,
    });
  }

  async findAllByProjectId(projectId: number): Promise<ProjectModelInstance[]> { // Updated return type
    // TODO: Ensure the repository method fetches ordered by uiDisplayOrder
    // For now, assuming the repository method will be updated or handles this.
    // If not, add { orderBy: { uiDisplayOrder: 'asc' } } to the findMany call in the repository.
    return this.projectModelInstanceRepository.findAllByProjectId(projectId); 
  }

  async findById(id: string): Promise<ProjectModelInstance | null> { // Updated return type
    return this.projectModelInstanceRepository.findById(id); // Updated repository method
  }

  async update(id: string, data: UpdateProjectModelInstanceDto): Promise<ProjectModelInstance | null> { // Updated DTO and return type
    const instanceExists = await this.projectModelInstanceRepository.findById(id); // Updated repository method
    if (!instanceExists) {
      throw new Error(`ProjectModelInstance with ID ${id} not found.`); // Updated error message
    }
    return this.projectModelInstanceRepository.update(id, data); // Updated repository method
  }

  async delete(id: string): Promise<ProjectModelInstance | null> { // Updated return type
    const instanceExists = await this.projectModelInstanceRepository.findById(id); // Updated repository method
    if (!instanceExists) {
      throw new Error(`ProjectModelInstance with ID ${id} not found.`); // Updated error message
    }
    return this.projectModelInstanceRepository.delete(id); // Updated repository method
  }

  async findGeneratedPlankListsByInstanceId(projectModelInstanceId: string): Promise<GeneratedPlankList[]> { // Updated parameter name
    return this.projectModelInstanceRepository.findGeneratedPlankListsByInstanceId(projectModelInstanceId); // Updated repository method
  }

  async batchUpdateInstancesForProject(
    projectId: number,
    boxConfigs: BoxConfigDto[],
  ): Promise<ProjectModelInstance[]> {
    const prisma = new PrismaClient(); // TODO: Refactor to use injected or repository's prisma instance

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Fetch existing instances for the project
      const existingInstances = await tx.projectModelInstance.findMany({
        where: { projectId },
      });
      const existingInstanceIds = existingInstances.map((inst: ProjectModelInstance) => inst.id);

      const incomingConfigIds = boxConfigs.filter((conf) => conf.id).map((conf) => conf.id as string);

      // 2. Determine instances to delete
      const idsToDelete = existingInstanceIds.filter((id: string) => !incomingConfigIds.includes(id));
      if (idsToDelete.length > 0) {
        await tx.projectModelInstance.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }

      // 3. Upsert (Create or Update) instances
      const upsertPromises: Promise<ProjectModelInstance>[] = [];
      for (const config of boxConfigs) {
        const dataToUpsert = {
          projectId,
          modelDefinitionId: config.modelDefinitionId,
          runtimeInputsJson: config.runtimeInputsJson,
          uiDisplayOrder: config.uiDisplayOrder,
        };

        if (config.id && existingInstanceIds.includes(config.id)) {
          // Update existing instance
          upsertPromises.push(
            tx.projectModelInstance.update({
              where: { id: config.id },
              data: dataToUpsert,
            }),
          );
        } else {
          // Create new instance
          // If config.id was provided but not found, it implies a new client-side ID,
          // so we let Prisma generate a new ID.
          upsertPromises.push(
            tx.projectModelInstance.create({
              data: dataToUpsert, // Prisma will generate 'id'
            }),
          );
        }
      }
      await Promise.all(upsertPromises);

      // 4. Fetch and return the updated list of instances, ordered
      return tx.projectModelInstance.findMany({
        where: { projectId },
        orderBy: { uiDisplayOrder: 'asc' },
        include: { modelDefinition: true, generatedPlankLists: true }, // Consistent with findAllByProjectId
      });
    });
  }
}
