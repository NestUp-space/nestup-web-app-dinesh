/**
 * Project Service
 * Handles business logic for projects
 */

import { Project } from '@prisma/client'; // Removed unused Task, Subtask
import { CreateProjectDto, ProjectResponseDto, UpdateProjectDto } from '../../dtos/project.dto';
import { IProjectRepository, projectRepository } from '../../repositories/project.repository';
import { ProjectWithDetails, UserContext } from '../../types/project.types';
import { defaultProjectTaskTemplates as taskTemplate } from '../../constants/projectTaskTemplate';
import { TaskTemplate } from '../../types/projectTemplate.types';
import { TaskResponseDto as TaskDto, SubtaskResponseDto as SubtaskDto } from '../../dtos/project.dto'; // For explicit typing in map

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
  async getProjects(user?: UserContext): Promise<ProjectWithDetails[]> {
    const whereClause: any = {};

    if (user) {
      const roleName = user.role.name.toLowerCase();

      if (roleName === 'client') {
        // A client might see projects where they are the designer, project manager, or engineer
        whereClause.OR = [
          { designerId: user.id },
          { projectManagerId: user.id },
          { engineerId: user.id },
          // { createdById: user.id } // If clients can also be creators and see their created projects
        ];
      } else if (roleName === 'engineer') {
        whereClause.engineerId = user.id;
      } else if (roleName === 'designer') {
        whereClause.designerId = user.id;
      } else if (roleName === 'projectmanager') { // Assuming role name is 'projectmanager'
        whereClause.projectManagerId = user.id;
      }
      // Admins/Superadmins see all projects by default
    }

    return this.projectRepository.findMany({ where: whereClause });
  }

  /**
   * Gets a project by ID, with permission check based on user role
   */
  async getProjectById(projectId: number, user?: UserContext): Promise<ProjectWithDetails | null> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      return null; // Project not found
    }

    if (user) {
      const roleName = user.role.name.toLowerCase();
      let canAccess = false;

      // Admins/Superadmins can access any project
      if (['admin', 'superadmin'].includes(roleName)) {
        canAccess = true;
      } else if (roleName === 'client') {
        // Client can access if they are the designer, PM, engineer, or creator of the project
        if (project.designerId === user.id ||
            project.projectManagerId === user.id ||
            project.engineerId === user.id ||
            project.createdById === user.id) {
          canAccess = true;
        }
      } else if (roleName === 'engineer' && project.engineerId === user.id) {
        canAccess = true;
      } else if (roleName === 'designer' && project.designerId === user.id) {
        canAccess = true;
      } else if (roleName === 'projectmanager' && project.projectManagerId === user.id) {
        canAccess = true;
      }
      
      if (!canAccess) {
        return null; // User does not have access
      }
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
  transformToResponseDto(project: ProjectWithDetails): ProjectResponseDto {
    // Ensure tasks and subtasks are correctly typed
    type TaskFromPayload = ProjectWithDetails['tasks'][number];
    type SubtaskFromPayload = TaskFromPayload['subtasks'][number];

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      address: project.address,
      location: project.location,
      sqft: project.sqft,
      vbCount: project.vbCount,
      status: project.status,
      designer: project.designer ? {
        id: project.designer.id,
        name: project.designer.name,
        email: project.designer.email
      } : null,
      projectManager: project.projectManager ? {
        id: project.projectManager.id,
        name: project.projectManager.name,
        email: project.projectManager.email
      } : null,
      engineer: project.engineer ? {
        id: project.engineer.id,
        name: project.engineer.name,
        email: project.engineer.email
      } : null,
      estimatedTime: project.estimatedTime?.toISOString(),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      tasks: project.tasks?.map((task: TaskFromPayload): TaskDto => ({
        id: task.id,
        name: task.name,
        stage: task.stage,
        uploaderRole: task.uploaderRole,
        viewerRoles: task.viewerRoles,
        status: task.status,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        metadataJson: task.metadataJson,
        subtasks: task.subtasks?.map((subtask: SubtaskFromPayload): SubtaskDto => ({
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
