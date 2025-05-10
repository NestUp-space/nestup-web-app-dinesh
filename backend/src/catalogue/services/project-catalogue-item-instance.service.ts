import { ProjectCatalogueItemInstance, GeneratedPlankList } from '@prisma/client';
import { ProjectCatalogueItemInstanceRepository } from '../repositories/project-catalogue-item-instance.repository';
import { CreateProjectCatalogueItemInstanceDto, UpdateProjectCatalogueItemInstanceDto } from '../dtos/catalogue.dto';
import { CatalogueItemRepository } from '../repositories/catalogue-item.repository';
// import { ProjectRepository } from '../../repositories/project.repository'; // To check if Project exists

export class ProjectCatalogueItemInstanceService {
  private projectCatalogueItemInstanceRepository: ProjectCatalogueItemInstanceRepository;
  private catalogueItemRepository: CatalogueItemRepository;
  // private projectRepository: ProjectRepository; 

  constructor() {
    this.projectCatalogueItemInstanceRepository = new ProjectCatalogueItemInstanceRepository();
    this.catalogueItemRepository = new CatalogueItemRepository();
    console.log('ProjectCatalogueItemInstanceService initialized');
  }

  async create(data: CreateProjectCatalogueItemInstanceDto): Promise<ProjectCatalogueItemInstance> {
    // Validate if catalogueItemDefinitionId exists
    const catalogueItemDefinition = await this.catalogueItemRepository.findById(data.catalogueItemDefinitionId);
    if (!catalogueItemDefinition) {
      throw new Error(`CatalogueItemDefinition with ID ${data.catalogueItemDefinitionId} not found.`);
    }
    // TODO: Validate if projectId exists (Project.id is Int, DTO uses number)
    // This validation can be done by attempting to fetch the project or relying on DB constraints.

    // Data passed to repository create method should match its expectation
    // The DTO already has projectId as number and catalogueItemDefinitionId
    return this.projectCatalogueItemInstanceRepository.create({
      projectId: data.projectId,
      catalogueItemDefinitionId: data.catalogueItemDefinitionId,
      runtimeInputsJson: data.runtimeInputsJson,
    });
  }

  async findAllByProjectId(projectId: number): Promise<ProjectCatalogueItemInstance[]> { // Changed to number
    return this.projectCatalogueItemInstanceRepository.findAllByProjectId(projectId);
  }

  async findById(id: string): Promise<ProjectCatalogueItemInstance | null> {
    return this.projectCatalogueItemInstanceRepository.findById(id);
  }

  async update(id: string, data: UpdateProjectCatalogueItemInstanceDto): Promise<ProjectCatalogueItemInstance | null> {
    const instanceExists = await this.projectCatalogueItemInstanceRepository.findById(id);
    if (!instanceExists) {
      throw new Error(`ProjectCatalogueItemInstance with ID ${id} not found.`);
    }
    return this.projectCatalogueItemInstanceRepository.update(id, data);
  }

  async delete(id: string): Promise<ProjectCatalogueItemInstance | null> {
    const instanceExists = await this.projectCatalogueItemInstanceRepository.findById(id);
    if (!instanceExists) {
      throw new Error(`ProjectCatalogueItemInstance with ID ${id} not found.`);
    }
    return this.projectCatalogueItemInstanceRepository.delete(id);
  }

  async findGeneratedPlankListsByInstanceId(projectCatalogueItemInstanceId: string): Promise<GeneratedPlankList[]> {
    return this.projectCatalogueItemInstanceRepository.findGeneratedPlankListsByInstanceId(projectCatalogueItemInstanceId);
  }
