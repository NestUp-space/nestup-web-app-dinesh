import { Request, Response, NextFunction } from 'express';
import { ProjectModelInstanceService } from '../services/project-model-instance.service';
import { CreateProjectModelInstanceDto, UpdateProjectModelInstanceDto } from '../dtos/model.dto';

export class ProjectModelInstanceController {
  private service: ProjectModelInstanceService;

  constructor() {
    this.service = new ProjectModelInstanceService();
    console.log('ProjectModelInstanceController initialized');
  }

  createProjectModelInstance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateProjectModelInstanceDto = req.body;
      const result = await this.service.create(dto);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  getProjectModelInstancesByProjectId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      const result = await this.service.findAllByProjectId(projectId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getProjectModelInstanceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.findById(id);
      if (!result) {
        return res.status(404).json({ message: 'ProjectModelInstance not found' });
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateProjectModelInstance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const dto: UpdateProjectModelInstanceDto = req.body;
      const result = await this.service.update(id, dto);
      if (!result) {
        return res.status(404).json({ message: 'ProjectModelInstance not found' });
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteProjectModelInstance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.delete(id);
      if (!result) {
        return res.status(404).json({ message: 'ProjectModelInstance not found' });
      }
      res.status(204).send(); // No content
    } catch (error) {
      next(error);
    }
  };

  getGeneratedPlankListsByInstanceId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { instanceId } = req.params;
      const result = await this.service.findGeneratedPlankListsByInstanceId(instanceId);
      // No 404 check here, an empty array is a valid response if no lists found
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
