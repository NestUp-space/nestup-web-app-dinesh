/**
 * Project Controller
 * Handles HTTP requests for project operations
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { projectService } from '../../services/project';
import { CreateProjectDto, UpdateProjectDto } from '../../dtos/project.dto';
import { CustomRequest } from '../../middlewares/auth.middleware'; // Import CustomRequest

// Removed local AuthenticatedRequest interface

export class ProjectController {
  /**
   * Create a new project
   */
  async createProject(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      // Ensure customReq.user.role is treated as a simple string as per CustomRequest
      if (customReq.user.role === 'client') {
        res.status(StatusCodes.FORBIDDEN).json({ message: 'Client users are not allowed to create projects' });
        return;
      }

      // Extract values from request body
      const { name, projectDescription, description, engineerId } = customReq.body;
      
      // Use projectDescription or description (whichever is provided)
      const projectDesc = projectDescription || description;
      
      // Set default values for required fields that might be missing from frontend
      const address = customReq.body.address || 'N/A';
      const location = customReq.body.location || 'N/A';
      
      // Convert numeric values to integers
      const sqft = parseInt(customReq.body.sqft, 10) || 0;
      const estimatedTime = customReq.body.estimatedTime || new Date();
      const statusId = parseInt(customReq.body.statusId, 10) || 1; // Assuming 1 is a valid status ID
      const vbCount = parseInt(customReq.body.vbCount, 10) || 0;
      
      // Convert IDs to integers
      const engineerIdInt = engineerId ? parseInt(engineerId, 10) : undefined;
      
      // Get the user ID for createdById
      const createdById = customReq.user.id;

      if (!name) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Project name is required' });
        return;
      }

      const projectData: CreateProjectDto = {
        name,
        description: projectDesc || null,
        address: address || 'N/A',
        location: location || 'N/A',
        sqft: sqft || 0,
        estimatedTime: estimatedTime || new Date(),
        vbCount: vbCount || 0,
        statusId: statusId || 1,
        engineerId: engineerIdInt || undefined,
        createdById
      };

      const project = await projectService.createProject(projectData);

      res.status(StatusCodes.CREATED).json({ project, message: 'Project created with tasks and subtasks from template' });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Get all projects
   */
  async getProjects(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      // Prepare user object for service layer
      const serviceUser = {
        id: customReq.user.id,
        role: { 
          name: customReq.user.role // CustomRequest defines role as string
        }
      };

      const projects = await projectService.getProjects(serviceUser);
      
      // Transform projects to response DTOs
      const transformedProjects = projects.map(project => 
        projectService.transformToResponseDto(project)
      );

      res.status(StatusCodes.OK).json({ projects: transformedProjects });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Get a project by ID
   */
  async getProjectById(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }
      const projectId = parseInt(customReq.params.projectId, 10);
      if (isNaN(projectId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid project ID' });
        return;
      }

      // Prepare user object for service layer
      const serviceUser = {
        id: customReq.user.id,
        role: { 
          name: customReq.user.role // CustomRequest defines role as string
        }
      };

      const project = await projectService.getProjectById(projectId, serviceUser);

      if (!project) {
        // Service layer now handles permission checks and returns null if not found or not permitted
        res.status(StatusCodes.NOT_FOUND).json({ message: 'Project not found or access denied' });
        return;
      }
      
      // Transform project to response DTO
      const transformedProject = projectService.transformToResponseDto(project);

      res.status(StatusCodes.OK).json({ project: transformedProject });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Update a project
   */
  async updateProject(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const projectId = parseInt(customReq.params.projectId, 10);
      if (isNaN(projectId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid project ID' });
        return;
      }

      // Add updatedById to the request body
      const updateData: UpdateProjectDto = {
        ...customReq.body,
        updatedById: customReq.user.id // Assuming CustomRequest guarantees user.id if user exists
      };

      const project = await projectService.updateProject(projectId, updateData);
      res.status(StatusCodes.OK).json({ project });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(req: Request, res: Response): Promise<void> {
    const customReq = req as CustomRequest;
    try {
      if (!customReq.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }

      const projectId = parseInt(customReq.params.projectId, 10);
      if (isNaN(projectId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid project ID' });
        return;
      }

      await projectService.deleteProject(projectId);
      res.status(StatusCodes.OK).json({ message: 'Project deleted successfully' });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
    }
  }
}

// Export a singleton instance
export const projectController = new ProjectController();
