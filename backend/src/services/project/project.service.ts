/**
 * Project Service
 * Handles business logic for projects
 */

import { Project } from '@prisma/client';
import { CreateProjectDto, ProjectResponseDto, UpdateProjectDto, CreateTaskDto, CreateSubtaskDto } from '../../dtos/project.dto';
import { IProjectRepository, projectRepository } from '../../repositories/project.repository';
import { ProjectWithRelations, UserContext } from '../../types/project.types';
import { defaultProjectTaskTemplates as taskTemplate } from '../../constants/projectTaskTemplate'; // Corrected import
import { TaskTemplate } from '../../types/projectTemplate.types'; // Import type for template items

export class ProjectService {
  constructor(
    private projectRepository: IProjectRepository
  ) {}

  // Inject taskService to avoid circular dependency
  private _taskService: any; // Consider typing this properly if TaskService type is available
  set taskService(service: any) {
    this._taskService = service;
  }

  /**
   * Creates a new project with default tasks from template
   */
  async createProject(data: CreateProjectDto): Promise<Project> {
    // Create the project
    const project = await this.projectRepository.create(data);

    // After project creation, create default tasks and their subtasks using TaskService
    if (!this._taskService) {
      console.error('TaskService not injected into ProjectService. Cannot create default tasks.');
      // Depending on requirements, either throw an error or return the project without tasks
      // For now, let's throw, as default tasks are likely expected.
      throw new Error('TaskService not available in ProjectService for creating default tasks.');
    }

    // Ensure taskTemplate is treated as TaskTemplate[]
    const typedTaskTemplate: TaskTemplate[] = taskTemplate;

    if (project && typedTaskTemplate && typedTaskTemplate.length > 0) {
      for (const templateTaskItem of typedTaskTemplate) { // Iterate over the correctly typed template
        if (!templateTaskItem || typeof templateTaskItem.taskName === 'undefined') {
          console.warn('Invalid task template item in ProjectService, skipping:', templateTaskItem);
          continue;
        }
        // TaskService.createTaskFromTemplate will handle creation of the task and its subtasks
        await this._taskService.createTaskFromTemplate(project.id, templateTaskItem);
      }
    }

    return project;
  }

  /**
   * Gets all projects, filtered by user role if provided
   */
  async getProjects(user?: UserContext): Promise<ProjectWithRelations[]> {
    const whereClause: any = {};

    if (user) {
      const roleName = user.role.name.toLowerCase();

      if (roleName === 'client') {
        // Clients see projects where they are directly assigned as the client
        whereClause.clientId = user.id;
      } else if (roleName === 'engineer') {
        // Engineers see projects where they are assigned as the engineer
        whereClause.engineerId = user.id;
      }
      // Admins/Superadmins see all projects by default
    }

    return this.projectRepository.findMany({ where: whereClause });
  }

  /**
   * Gets a project by ID, with permission check based on user role
   */
  async getProjectById(projectId: number, user?: UserContext): Promise<ProjectWithRelations | null> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      return null; // Project not found
    }

    if (user) {
      const roleName = user.role.name.toLowerCase();
      // Check if client has access
      if (roleName === 'client') {
        // Extract client ID from the client array
        const clientId = project.client && project.client.length > 0 
          ? project.client[0].client?.id 
          : null;
        
        if (clientId !== user.id) {
          return null; // Client does not have access
        }
      }
      
      // Check if engineer has access
      if (roleName === 'engineer' && project.engineer?.id !== user.id) {
        return null; // Engineer does not have access
      }
      // Admins/Superadmins can access any project by ID
    }

    return project;
  }

  /**
   * Updates a project by ID
   */
  async updateProject(projectId: number, data: UpdateProjectDto): Promise<Project> {
    return this.projectRepository.update(projectId, data);
  }

  /**
   * Deletes a project by ID
   */
  async deleteProject(projectId: number): Promise<Project> {
    return this.projectRepository.delete(projectId);
  }

  /**
   * Transforms a project with relations to a response DTO
   */
  transformToResponseDto(project: ProjectWithRelations): ProjectResponseDto {
    // Extract client data from the client array
    const clientData = project.client && project.client.length > 0 
      ? project.client[0].client 
      : null;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      address: project.address,
      location: project.location,
      sqft: project.sqft,
      vbCount: project.vbCount,
      status: project.status,
      engineer: project.engineer ? {
        id: project.engineer.id,
        name: project.engineer.name,
        email: project.engineer.email
      } : null,
      client: clientData,
      estimatedTime: project.estimatedTime?.toISOString(),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      tasks: project.tasks?.map(task => ({
        id: task.id,
        name: task.name,
        stage: task.stage,
        uploaderRole: task.uploaderRole,
        viewerRoles: task.viewerRoles,
        status: task.status,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        subtasks: task.subtasks?.map(subtask => ({
          id: subtask.id,
          name: subtask.name,
          description: subtask.description,
          actionRequired: subtask.actionRequired,
          type: subtask.type,
          metadataJson: subtask.metadataJson,
          completed: subtask.completed,
          createdAt: subtask.createdAt.toISOString(),
          updatedAt: subtask.updatedAt.toISOString(),
          taskId: subtask.taskId
        }))
      })) || []
    };
  }
}

// Create a singleton instance
export const projectService = new ProjectService(projectRepository);
