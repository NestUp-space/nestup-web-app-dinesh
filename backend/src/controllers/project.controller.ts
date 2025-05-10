import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { projectService } from '../services/project/project.service';
import { taskService } from '../services/project/task.service';
import { subtaskService } from '../services/project/subtask.service';
import { CreateSubtaskDto, UpdateSubtaskDto } from '../dtos/project.dto'; // For typing controller payloads
import { TaskTemplate } from '../types/projectTemplate.types'; // For createTask controller
import { CustomRequest } from '../middlewares/auth.middleware'; // Import CustomRequest

// Extend Request type to include user
// Assuming role might be a simple string or an object.
// For service compatibility, we'll ensure role.name is passed.
// interface AuthenticatedRequest extends Request { // Removed local AuthenticatedRequest
//   user?: { id: number; role: string | { name: string; /* other role props */ } };
// }

export const createProject = async (req: Request, res: Response) => {
  const customReq = req as CustomRequest;
  console.log('Entering createProject controller with body:', JSON.stringify(customReq.body, null, 2));
  try {
    if (!customReq.user || !customReq.user.role) { // Added check for customReq.user.role
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized or user role missing' });
    }

    if (customReq.user.role === 'client') {
      return res.status(StatusCodes.FORBIDDEN).json({ message: 'Client users are not allowed to create projects' });
    }

    // Extract values from request body
    const { name, projectDescription, description, engineerId, clientId } = customReq.body;
    
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
    
    // Convert IDs to integers and handle NaN values
    const parsedEngineerId = parseInt(engineerId, 10);
    const finalEngineerId = !isNaN(parsedEngineerId) ? parsedEngineerId : undefined;

    const parsedClientId = parseInt(clientId, 10);
    const finalClientId = !isNaN(parsedClientId) ? parsedClientId : undefined;
    
    // Get the user ID for createdById and updatedById
    const createdById = customReq.user.id; // customReq.user.id is guaranteed by CustomRequest if customReq.user exists

    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Project name is required' });
    }

    try {
      console.log('About to call projectService.createProject with data:', {
        name,
        description: projectDesc || null,
        address: address || 'N/A',
        location: location || 'N/A',
        sqft: sqft || 0,
        estimatedTime: estimatedTime || new Date(),
        vbCount: vbCount || 0,
        statusId: statusId || 1,
        engineerId: finalEngineerId,
        clientId: finalClientId,
        createdById
      });

      const project = await projectService.createProject({
        name,
        description: projectDesc || null,
        address: address || 'N/A',
        location: location || 'N/A',
        sqft: sqft || 0,
        estimatedTime: estimatedTime || new Date(),
        vbCount: vbCount || 0,
        statusId: statusId || 1,
        engineerId: finalEngineerId,
        clientId: finalClientId,
        createdById
      });

      // Note: Task and subtask creation is now handled in createProjectService

      res.status(StatusCodes.CREATED).json({ project, message: 'Project created with tasks and subtasks from template' });
    } catch (serviceError) {
      console.error('Error in projectService.createProject:', serviceError);
      throw serviceError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    const err = error as Error;
    console.error('Error in createProject controller:', err); // Also log it on the backend
    res.status(StatusCodes.BAD_REQUEST).json({ 
      message: err.message, 
      name: err.name, 
      stack: err.stack, 
      details: JSON.stringify(err, Object.getOwnPropertyNames(err)) // Attempt to serialize more details
    });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  const customReq = req as CustomRequest;
  try {
    if (!customReq.user || !customReq.user.role) { // Added check for customReq.user.role
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized or user role missing' });
    }

    // Prepare user object for service layer
    // The service expects role: { name: string }
    // CustomRequest ensures customReq.user.role is a string
    const serviceUser = {
      id: customReq.user.id, // customReq.user.id is guaranteed by CustomRequest if customReq.user exists
      role: { 
        name: customReq.user.role 
      }
    };

    const projectsWithRelations = await projectService.getProjects(serviceUser);
    
    // Transform the client data to be directly accessible
    // Also, use the DTO transformation from the service for consistency if available,
    // but for now, manual transformation is kept.
    // ProjectService.transformToResponseDto could be used if we map over results here.
    const projects = projectsWithRelations.map(p => projectService.transformToResponseDto(p));
    
    // The old transformation logic:
    // const transformedProjects = projects.map(project => {
    //   const clientData = project.client.length > 0 ? project.client[0].client : null;
    //   return {
    //     ...project,
    //     client: clientData, // Replace the array with the direct client object or null
    //   };
    // });

    res.status(StatusCodes.OK).json({ projects }); // projects are now DTOs
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  const customReq = req as CustomRequest;
  try {
    if (!customReq.user || !customReq.user.role) { // Added check for customReq.user.role
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized or user role missing' });
    }
    const projectId = parseInt(customReq.params.projectId, 10);
    if (isNaN(projectId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid project ID' });
    }

    // Prepare user object for service layer
    // CustomRequest ensures customReq.user.role is a string
    const serviceUser = {
      id: customReq.user.id, // customReq.user.id is guaranteed by CustomRequest if customReq.user exists
      role: { 
        name: customReq.user.role
      }
    };

    const projectWithRelations = await projectService.getProjectById(projectId, serviceUser);

    if (!projectWithRelations) {
      // Service layer now handles permission checks and returns null if not found or not permitted
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Project not found or access denied' });
    }
    
    const project = projectService.transformToResponseDto(projectWithRelations);

    // Optional: Add authorization check here if needed (e.g., client can only see their own projects)

    console.log('Backend controller getProjectById, project data being sent:', JSON.stringify(project, null, 2));
    res.status(StatusCodes.OK).json({ project });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

export const updateProject = async (req: Request, res: Response) => { 
  const customReq = req as CustomRequest;
  try {
    // customReq.body should conform to UpdateProjectDto
    // Ensure customReq.user is checked if logic depends on it
    // const updatedById = customReq.user?.id; // Example: Get user ID for audit - Service does not currently support this
    const project = await projectService.updateProject(Number(customReq.params.projectId), customReq.body); // Service currently expects 2 arguments
    // Consider transforming to DTO if not already done by service
    res.status(200).json({ project });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteProject = async (req: Request, res: Response) => { 
  const customReq = req as CustomRequest;
  try {
    // Add permission checks if necessary based on customReq.user.role or customReq.user.id
    await projectService.deleteProject(Number(customReq.params.projectId));
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const createTask = async (req: Request, res: Response) => { 
  const customReq = req as CustomRequest;
  try {
    // customReq.body should conform to TaskTemplate type
    // Add permission checks if necessary
    const taskTemplateItem = customReq.body as TaskTemplate;
    const task = await taskService.createTaskFromTemplate(Number(customReq.params.projectId), taskTemplateItem);
    // Consider transforming to DTO
    res.status(201).json({ task });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getTasks = async (req: Request, res: Response) => { 
  const customReq = req as CustomRequest;
  try {
    // Add permission checks if necessary
    const tasksWithSubtasks = await taskService.getTasks(Number(customReq.params.projectId));
    const tasks = tasksWithSubtasks.map(t => taskService.transformToResponseDto(t));
    res.status(200).json({ tasks });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const updateTask = async (req: Request, res: Response) => { 
  const customReq = req as CustomRequest;
  try {
    // customReq.body should conform to UpdateTaskDto
    // Add permission checks if necessary
    const task = await taskService.updateTask(Number(customReq.params.taskId), customReq.body);
    // Consider transforming to DTO
    res.status(200).json({ task });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteTask = async (req: Request, res: Response) => { 
  const customReq = req as CustomRequest;
  try {
    // Add permission checks if necessary
    await taskService.deleteTask(Number(customReq.params.taskId));
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => { 
  const customReq = req as CustomRequest;
  try {
    // Assuming customReq.body is { statusId: number }
    // Add permission checks if necessary
    const statusId = customReq.body.statusId; 
    if (typeof statusId !== 'number') {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'statusId is required and must be a number.' });
    }
    await taskService.updateTaskStatus(Number(customReq.params.taskId), statusId);
    res.status(StatusCodes.OK).json({ message: 'Task status updated successfully' });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

// Subtask Controllers

export const createSubtask = async (req: Request, res: Response) => { 
  const customReq = req as CustomRequest;
  try {
    // customReq.user is available due to CustomRequest and isAuthenticated middleware
    if (!customReq.user) { // Should not happen if isAuthenticated is used
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'User not authenticated.' });
    }
    // TODO: Add permission checks if necessary (e.g., only project members can add subtasks)
    const taskId = parseInt(customReq.params.taskId, 10);
    // customReq.body should conform to CreateSubtaskDto, excluding taskId which is from params
    const { name, description, actionRequired, type, metadataJson } = customReq.body;


    if (isNaN(taskId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID.' });
    }
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Subtask name is required.' });
    }

    const subtaskDto: CreateSubtaskDto = { 
      taskId, 
      name, 
      description,
      actionRequired, // Optional
      type,           // Optional
      metadataJson    // Optional
    };
    const subtask = await subtaskService.createSubtask(subtaskDto);
    res.status(StatusCodes.CREATED).json({ subtask: subtaskService.transformToResponseDto(subtask), message: 'Subtask created successfully.' });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

export const getSubtasksForTask = async (req: Request, res: Response) => { 
  const customReq = req as CustomRequest;
  try {
    // Add permission checks if necessary
    const taskId = parseInt(customReq.params.taskId, 10);
    if (isNaN(taskId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid task ID.' });
    }

    const subtasksData = await subtaskService.getSubtasksByTaskId(taskId);
    const subtasks = subtasksData.map(s => subtaskService.transformToResponseDto(s));
    res.status(StatusCodes.OK).json({ subtasks });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

export const updateSubtask = async (req: Request, res: Response) => { 
  const customReq = req as CustomRequest;
  try {
    // TODO: Add permission checks
    // customReq.user will be available if isAuthenticated middleware passed
    const subtaskId = parseInt(customReq.params.subtaskId, 10);
    // customReq.body should conform to UpdateSubtaskDto
    const subtaskData = customReq.body as UpdateSubtaskDto;


    if (isNaN(subtaskId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid subtask ID.' });
    }

    // Ensure at least one updatable field is provided
    if (Object.keys(subtaskData).length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No update data provided.' });
    }
    
    // Use taskService to handle potential parent task status updates
    const { task: updatedParentTask, subtask: updatedSubtask } = await taskService.updateSubtaskAndPotentiallyParent(subtaskId, subtaskData);
    
    res.status(StatusCodes.OK).json({ 
      subtask: subtaskService.transformToResponseDto(updatedSubtask), 
      // Optionally include the parent task if it was affected
      ...(updatedParentTask && { parentTask: taskService.transformToResponseDto(updatedParentTask) }),
      message: 'Subtask updated successfully.' 
    });
  } catch (error) {
    // Handle specific error from service (e.g., parent task completion blocked)
    if ((error as Error).message.includes('Cannot mark task as completed')) {
        return res.status(StatusCodes.CONFLICT).json({ message: (error as Error).message });
    }
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};

export const deleteSubtask = async (req: Request, res: Response) => { 
  const customReq = req as CustomRequest;
  try {
    // TODO: Add permission checks
    // customReq.user will be available if isAuthenticated middleware passed
    const subtaskId = parseInt(customReq.params.subtaskId, 10);
    if (isNaN(subtaskId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid subtask ID.' });
    }

    await subtaskService.deleteSubtask(subtaskId);
    res.status(StatusCodes.OK).json({ message: 'Subtask deleted successfully.' });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: (error as Error).message });
  }
};
