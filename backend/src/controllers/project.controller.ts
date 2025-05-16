import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { CustomRequest } from '../middlewares/auth.middleware';
import { 
  ProjectCreateInput as ProjectCreateInputDto,
  ProjectUpdateInput as ProjectUpdateInputDto,
  ProjectShare,
  ProjectMaterialInput,
  projectIncludes
} from '../types/project.types';
import { PlyType, GrainDirection } from '@prisma/client'; // Import enums

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
            status: { select: { status: true } } 
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
      console.error('Error fetching projects:', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to fetch projects',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async createProject(req: CustomRequest, res: Response): Promise<Response> {
    try {
      const { name, description, projectStatus, clientId, address, location, sqft, engineerId }: ProjectCreateInputDto = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const statusStringToUse = projectStatus || 'DRAFT';
      const statusRecord = await prisma.status.findFirst({ where: { status: statusStringToUse } });
      if (!statusRecord) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Invalid project status: ${statusStringToUse}` });
      }
      
      const createData = {
        name,
        description,
        address,
        location,
        sqft,
        statusId: statusRecord.id,
        createdById: userId,
        updatedById: userId,
        clientId,
        engineerId,
        projectStatus: statusStringToUse
      } as any;

      const project = await prisma.project.create({ data: createData });
      
      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Project created successfully',
        project
      });
    } catch (err) {
      console.error('Error creating project:', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to create project',
        error: err instanceof Error ? err.message : 'Unknown error'
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
      const { name, description, projectStatus, clientId, address, location, sqft, engineerId }: ProjectUpdateInputDto = req.body;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      let statusId: number | undefined;
      if (projectStatus) {
        const statusRecord = await prisma.status.findFirst({ where: { status: projectStatus } });
        if (!statusRecord) {
          return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Invalid project status: ${projectStatus}` });
        }
        statusId = statusRecord.id;
      }

      const updateData = {
        name,
        description,
        address,
        location,
        sqft,
        updatedById: userId,
        ...(statusId !== undefined && { statusId }),
        ...(projectStatus !== undefined && { projectStatus }),
        ...(clientId !== undefined && { clientId }),
        ...(engineerId !== undefined && { engineerId })
      } as any;

      const project = await prisma.project.update({
        where: { id: projectId },
        data: updateData
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
        prisma.material.deleteMany({ where: { projectId } }), // Changed from projectMaterial
        prisma.clientProjectMapping.deleteMany({ where: { projectId } }), // Changed from projectShare
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
      const { userIds }: ProjectShare = req.body; // Removed 'permissions' from destructuring

      await prisma.$transaction(async (tx) => {
        await tx.clientProjectMapping.deleteMany({ // Changed from projectShare
          where: { projectId }
        });
        if (userIds && userIds.length > 0) {
          await tx.clientProjectMapping.createMany({ // Changed from projectShare
            data: userIds.map(uid => ({ // Changed userId to uid for clarity
              projectId,
              clientId: uid, // Mapped to clientId as per ClientProjectMapping schema
              // permissions field is not on ClientProjectMapping model
            }))
          });
        }
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Project shared successfully'
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

      const projectMaterials = await prisma.material.findMany({ // Changed from projectMaterial
        where: { projectId }
        // No include needed here if we are fetching Material records directly
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        materials: projectMaterials,
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
        await tx.material.deleteMany({ // Changed from projectMaterial
          where: { projectId }
        });

        if (materials && materials.length > 0) {
          // Ensure that the enums are correctly typed if they come as strings from the client
          const materialData = materials.map(m => ({
            projectId,
            materialId: m.materialId,
            plyThickness: m.plyThickness,
            innerLaminateCode: m.innerLaminateCode,
            outerLaminateCode: m.outerLaminateCode,
            overallThickness: m.overallThickness,
            plyType: m.plyType as PlyType, // Cast if necessary, ensure validation upstream
            grainDirection: m.grainDirection as GrainDirection, // Cast if necessary
            // quantity and unit are not part of the Material model for creation
          }));
          await tx.material.createMany({ // Changed from projectMaterial
            data: materialData
          });
        }
        return tx.material.findMany({ // Changed from projectMaterial
          where: { projectId }
          // No include needed here
        });
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Project materials updated successfully',
        materials: updatedMaterials
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
