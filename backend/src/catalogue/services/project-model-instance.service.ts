import { ProjectModelInstance, GeneratedPlankList, Prisma } from '@prisma/client'; // Updated ProjectCatalogueItemInstance to ProjectModelInstance
import { ProjectModelInstanceRepository } from '../repositories/project-model-instance.repository'; // Updated repository name
import { CreateProjectModelInstanceDto, UpdateProjectModelInstanceDto } from '../dtos/model.dto'; // Updated DTO import and names
import { ModelRepository } from '../repositories/model.repository'; // Updated repository import
// import { ProjectRepository } from '../../repositories/project.repository'; // To check if Project exists

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
    return this.projectModelInstanceRepository.findAllByProjectId(projectId); // Updated repository method
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
}
