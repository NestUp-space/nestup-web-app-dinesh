import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { CustomRequest } from '../middlewares/auth.middleware';
import { 
  ProjectCreateInput as ProjectCreateInputDto,
  ProjectUpdateInput as ProjectUpdateInputDto,
  ProjectAssign,
  ProjectMaterialInput,
  projectIncludes,
  ProjectUpdateWithRelations
} from '../types/project.types';
import { PlyType, GrainDirection } from '@prisma/client'; // Import enums
import { projectService } from '../services/project'; // Import project service

const prisma = new PrismaClient();

export class ProjectController {
  static async getProjects(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string;

      const where: Prisma.ProjectWhereInput = search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      } : {};

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            createdBy: { select: { id: true, name: true } },
            updatedBy: { select: { id: true, name: true } },
            status: { select: { status: true } },
            tasks: {
              include: {
                status: true,
                subtasks: true
              }
            }
          }
        }),
        prisma.project.count({ where })
      ]);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          projects,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (err) {
      console.error('Error creating project:', err); // Log the full error for server-side diagnosis
      // Send a very simple, guaranteed valid JSON response
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An internal server error occurred while creating the project.'
        // Avoid sending the raw error message to the client in case it's complex or causes serialization issues
      });
    }
  }

  static async createProject(req: CustomRequest, res: Response): Promise<Response> {
    try {
      const { 
        name, 
        description, 
        statusId: requestedStatusId, 
        designerId,
        projectManagerId,
        address, 
        location, 
        sqft, 
        engineerId 
      }: ProjectCreateInputDto = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Determine the statusId to use
      const finalStatusId = requestedStatusId ?? 1; // Default to 1 if not provided, matching Prisma schema default

      // Validate the finalStatusId
      const statusRecord = await prisma.status.findUnique({ where: { id: finalStatusId } });
      if (!statusRecord) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Invalid statusId: ${finalStatusId}` });
      }
      
      // Validate designer exists if provided
      if (designerId) {
        const designerExists = await prisma.user.findFirst({
          where: { id: designerId, role: { role: 'Designer' } }
        });
        if (!designerExists) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid designer ID or user is not a designer'
          });
        }
      }

      // Validate project manager exists if provided
      if (projectManagerId) {
        const projectManagerExists = await prisma.user.findFirst({
          where: { id: projectManagerId, role: { role: 'Project Manager' } }
        });
        if (!projectManagerExists) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid project manager ID or user is not a project manager'
          });
        }
      }

      // Create project data for the service
      const projectData = {
        name,
        description,
        address,
        location,
        sqft: sqft || 0,
        statusId: finalStatusId,
        createdById: userId,
        updatedById: userId,
        designerId,
        projectManagerId,
        engineerId,
        estimatedTime: req.body.estimatedTime ? new Date(req.body.estimatedTime) : undefined,
        vbCount: req.body.vbCount || 0
      };

      // Use the project service to create the project with tasks
      const project = await projectService.createProject(projectData);
      
      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Project created successfully with tasks and subtasks from template',
        project
      });
    } catch (err) {
      console.error('Error creating project:', err); // Log the full error for server-side diagnosis
      // Send a very simple, guaranteed valid JSON response
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An internal server error occurred while creating the project.'
        // Avoid sending the raw error message to the client in case it's complex or causes serialization issues
      });
    }
  }

  static async getProjectById(req: Request, res: Response): Promise<Response> {
    try {
      const projectId = parseInt(req.params.id);
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: projectIncludes 
      });

      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }
      return res.status(StatusCodes.OK).json({ success: true, project });
    } catch (err) {
      console.error('Error fetching project:', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to fetch project',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async updateProject(req: CustomRequest, res: Response): Promise<Response> {
    try {
      const projectId = parseInt(req.params.id);
      const userId = req.user?.id;
      const { 
        name, 
        description, 
        statusId,
        designerId, 
        projectManagerId,
        address, 
        location, 
        sqft, 
        engineerId
      }: ProjectUpdateInputDto = req.body;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      // Validate status if provided
      if (statusId) {
        const statusRecord = await prisma.status.findUnique({ where: { id: statusId } });
        if (!statusRecord) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: `Invalid statusId: ${statusId}`
          });
        }
      }

      // Validate designer if provided
      if (designerId) {
        const designerExists = await prisma.user.findFirst({
          where: { id: designerId, role: { role: 'Designer' } }
        });
        if (!designerExists) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid designer ID or user is not a designer'
          });
        }
      }

      // Validate project manager if provided
      if (projectManagerId) {
        const projectManagerExists = await prisma.user.findFirst({
          where: { id: projectManagerId, role: { role: 'Project Manager' } }
        });
        if (!projectManagerExists) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid project manager ID or user is not a project manager'
          });
        }
      }

      const updateData: ProjectUpdateWithRelations = {
        ...(name && { name }),
        ...(description && { description }),
        ...(address && { address }),
        ...(location && { location }),
        ...(sqft && { sqft }),
        ...(statusId && { status: { connect: { id: statusId } } }),
        ...(designerId !== undefined && {
          designer: designerId === null ? { disconnect: true } : { connect: { id: designerId } }
        }),
        ...(projectManagerId !== undefined && {
          projectManager: projectManagerId === null ? { disconnect: true } : { connect: { id: projectManagerId } }
        }),
        ...(engineerId !== undefined && {
          engineer: engineerId === null ? { disconnect: true } : { connect: { id: engineerId } }
        }),
        updatedBy: { connect: { id: userId } }
      };

      const project = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
        include: projectIncludes
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Project updated successfully',
        project
      });
    } catch (err) {
      console.error('Error updating project:', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to update project',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async updateProjectStatus(req: CustomRequest, res: Response): Promise<Response> {
    try {
      const projectId = parseInt(req.params.id);
      const userId = req.user?.id;
      const { projectStatus } : { projectStatus?: string } = req.body; 

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!projectStatus) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Project status is required.' });
      }

      const statusRecord = await prisma.status.findFirst({ where: { status: projectStatus } });
      if (!statusRecord) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Invalid project status: ${projectStatus}` });
      }

      const updateData = {
        statusId: statusRecord.id,
        projectStatus,
        updatedById: userId
      } as any;

      const project = await prisma.project.update({
        where: { id: projectId },
        data: updateData
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Project status updated successfully',
        project
      });
    } catch (err) {
      console.error('Error updating project status:', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to update project status',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async deleteProject(req: Request, res: Response): Promise<Response> {
    try {
      const projectId = parseInt(req.params.id);
      
      await prisma.$transaction([
        prisma.material.deleteMany({ where: { projectId } }),
        prisma.engineerProjectMapping.deleteMany({ where: { projectId } }),
        prisma.comment.deleteMany({ where: { projectId } }),
        prisma.project.delete({ where: { id: projectId } })
      ]);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting project:', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to delete project',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async shareProject(req: CustomRequest, res: Response): Promise<Response> {
    try {
      const projectId = parseInt(req.params.id);
      const { designerId, projectManagerId, engineerId }: ProjectAssign = req.body;

      // Validate the roles first
      const updateData: ProjectUpdateWithRelations = {};

      // Validate and set designer
      if (designerId !== undefined) {
        if (designerId !== null) {
          const designerExists = await prisma.user.findFirst({
            where: { id: designerId, role: { role: 'Designer' } }
          });
          if (!designerExists) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              success: false,
              message: 'Invalid designer ID or user is not a designer'
            });
          }
          updateData.designer = { connect: { id: designerId } };
        } else {
          updateData.designer = { disconnect: true };
        }
      }

      // Validate and set project manager
      if (projectManagerId !== undefined) {
        if (projectManagerId !== null) {
          const pmExists = await prisma.user.findFirst({
            where: { id: projectManagerId, role: { role: 'Project Manager' } }
          });
          if (!pmExists) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              success: false,
              message: 'Invalid project manager ID or user is not a project manager'
            });
          }
          updateData.projectManager = { connect: { id: projectManagerId } };
        } else {
          updateData.projectManager = { disconnect: true };
        }
      }

      // Validate and set engineer
      if (engineerId !== undefined) {
        if (engineerId !== null) {
          const engineerExists = await prisma.user.findFirst({
            where: { id: engineerId, role: { role: 'Site Engineer' } }
          });
          if (!engineerExists) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              success: false,
              message: 'Invalid engineer ID or user is not a site engineer'
            });
          }
          updateData.engineer = { connect: { id: engineerId } };
        } else {
          updateData.engineer = { disconnect: true };
        }
      }

      // Update project with new assignments
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
        include: projectIncludes
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Project shared successfully',
        project: updatedProject
      });
    } catch (err) {
      console.error('Error sharing project:', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to share project',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async addComment(req: CustomRequest, res: Response): Promise<Response> {
    try {
      const projectId = parseInt(req.params.id);
      const userId = req.user?.id;
      const { content, isInternal = false } = req.body;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const comment = await prisma.comment.create({
        data: {
          commentText: content,
          isInternal,
          projectId,
          createdBy: userId // Using the correct foreign key name from schema
        },
        include: {
          createdByUser: { // Using the correct relation name from schema
            select: { id: true, name: true, email: true }
          }
        }
      });

      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Comment added successfully',
        comment
      });
    } catch (err) {
      console.error('Error adding comment:', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to add comment',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async getProjectActivity(req: Request, res: Response): Promise<Response> {
    try {
      const projectId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const activities = await prisma.comment.findMany({
        where: { 
          projectId,
          isInternal: false 
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          createdByUser: { // Using the correct relation name from schema
            select: { id: true, name: true, email: true }
          }
        }
      });

      const total = await prisma.comment.count({
        where: {
          projectId,
          isInternal: false
        }
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          activities,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (err) {
      console.error('Error fetching project activity:', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to fetch project activity',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async getProjectMaterials(req: Request, res: Response): Promise<Response> {
    try {
      const projectId = parseInt(req.params.id);
      
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true } 
      });

      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found',
        });
      }

      const projectMaterials = await prisma.material.findMany({
        where: { projectId }
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Project materials fetched successfully',
        responseObject: projectMaterials,
        projectName: project.name
      });
    } catch (err) {
      console.error('Error fetching project materials:', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to fetch project materials',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async updateProjectMaterials(req: CustomRequest, res: Response): Promise<Response> {
    try {
      const projectId = parseInt(req.params.id);
      const userId = req.user?.id; 
      const { materials }: { materials: ProjectMaterialInput[] } = req.body;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      const updatedMaterials = await prisma.$transaction(async (tx) => {
        await tx.material.deleteMany({
          where: { projectId }
        });

        if (materials && materials.length > 0) {
          const materialData = materials.map(m => ({
            projectId,
            materialId: m.materialId,
            plyThickness: m.plyThickness,
            innerLaminateCode: m.innerLaminateCode,
            outerLaminateCode: m.outerLaminateCode,
            overallThickness: m.overallThickness,
            plyType: m.plyType as PlyType,
            grainDirection: m.grainDirection as GrainDirection,
          }));
          await tx.material.createMany({
            data: materialData
          });
        }
        return tx.material.findMany({
          where: { projectId }
        });
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Project materials updated successfully',
        responseObject: updatedMaterials
      });
    } catch (err) {
      console.error('Error updating project materials:', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to update project materials',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }
}
