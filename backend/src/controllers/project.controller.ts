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
    res.status(201).json({ project });
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
