import { Request, Response } from 'express';
import { createProjectService, getProjectsService, updateProjectService, deleteProjectService, createTaskService, getTasksService, updateTaskService, deleteTaskService, updateTaskStatusService } from '../services/project.service';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: { id: number };
}

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, address, location, sqft, estimatedTime, vbCount, statusId, engineerId, clientId } = req.body;

    if (!name || !address || !location || !sqft || !estimatedTime || !statusId || !engineerId || !clientId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const project = await createProjectService(req.body);
    // Add standard tasks to the project
    const standardTasks = [
      { stage: 'Site measurements', name: 'Details of project (form shared)', uploadedBy: 'Client', viewPermission: 'All', actionRequired: 'Site visit is booked based on this the form' },
      { stage: 'Site measurements', name: 'Site Visit', uploadedBy: 'BIM Engineer', viewPermission: 'All', actionRequired: 'BIM engineer to upload site measurements' },
      { stage: 'Site measurements', name: 'Design inputs', uploadedBy: 'Client', viewPermission: 'BIM engineer', actionRequired: 'To be validated by BIM engineer' },
      { stage: 'Design', name: 'Site photos', uploadedBy: 'Client', viewPermission: 'All', actionRequired: 'To be validated by BIM engineer' },
      { stage: 'Approval', name: 'Production document', uploadedBy: 'BIM engineer', viewPermission: 'All', actionRequired: 'To be approved by client' },
      { stage: 'Approval', name: 'Performa invoice', uploadedBy: 'BIM engineer', viewPermission: 'All', actionRequired: 'Payment to be made by the customer - Client' },
      { stage: 'Pre-Production', name: 'Material estimation', uploadedBy: 'BIM engineer', viewPermission: 'All', actionRequired: 'Client to send the material' },
      { stage: 'Production', name: 'Input QA', uploadedBy: 'BIM engineer', viewPermission: 'Production Engineer, BIM engineer', actionRequired: 'Production associate to verify and Receive the material and update the status' },
      { stage: 'Production', name: 'Pressing list', uploadedBy: 'BIM engineer', viewPermission: 'Production Engineer, BIM engineer', actionRequired: 'Production associate to verify and Receive the material and update the status' },
      { stage: 'Production', name: 'G code and cutting list', uploadedBy: 'BIM engineer', viewPermission: 'Production Engineer, BIM engineer', actionRequired: 'Production associate use this for CNC programming' },
      { stage: 'Production', name: 'Output QA', uploadedBy: 'BIM engineer', viewPermission: 'Production Engineer, BIM engineer', actionRequired: 'Production associate uses this to verify the status' },
      { stage: 'Production', name: 'Installation Guide', uploadedBy: 'BIM engineer', viewPermission: 'All', actionRequired: 'Installation team and client should be able to access this file' },
    ];

    for (const task of standardTasks) {
      await createTaskService(project.id, task);
    }

    res.status(201).json({ project, message: 'Project created with standard tasks' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const projects = await getProjectsService(req.user.id);  // Use req.user.id
    res.status(200).json({ projects });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const project = await updateProjectService(Number(req.params.projectId), req.body);
    res.status(200).json({ project });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    await deleteProjectService(Number(req.params.projectId));
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const task = await createTaskService(Number(req.params.projectId), req.body);
    res.status(201).json({ task });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await getTasksService(Number(req.params.projectId));
    res.status(200).json({ tasks });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const task = await updateTaskService(Number(req.params.taskId), req.body);
    res.status(200).json({ task });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    await deleteTaskService(Number(req.params.taskId));
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    await updateTaskStatusService(Number(req.params.taskId), req.body.status);  // Ensure taskId is a number
    res.status(200).json({ message: 'Task status updated successfully' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
