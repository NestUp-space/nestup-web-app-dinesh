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

      // Validate designer exists if provided
      let numDesignerId: number | undefined = undefined;
      if (designerId !== null && designerId !== undefined) {
        numDesignerId = typeof designerId === 'string' ? parseInt(designerId, 10) : designerId;
        if (isNaN(numDesignerId)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid designer ID format'
          });
        }
        const designerExists = await prisma.user.findFirst({
          where: { id: numDesignerId, role: { role: 'Designer' } }
        });
        if (!designerExists) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid designer ID or user is not a designer'
          });
        }
      }

      // Validate project manager exists if provided
      let numProjectManagerId: number | undefined = undefined;
      if (projectManagerId !== null && projectManagerId !== undefined) {
        numProjectManagerId = typeof projectManagerId === 'string' ? parseInt(projectManagerId, 10) : projectManagerId;
        if (isNaN(numProjectManagerId)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid project manager ID format'
          });
        }
        const projectManagerExists = await prisma.user.findFirst({
          where: { id: numProjectManagerId, role: { role: 'Project Manager' } }
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
        designerId: numDesignerId,
        projectManagerId: numProjectManagerId,
        engineerId: (typeof engineerId === 'string' && !isNaN(parseInt(engineerId,10))) ? parseInt(engineerId,10) : (typeof engineerId === 'number' && !isNaN(engineerId) ? engineerId : undefined),
        estimatedTime: req.body.estimatedTime ? new Date(req.body.estimatedTime) : undefined,
        vbCount: req.body.vbCount || 0
      };

      // Use the project service to create the project with tasks
      // Ensure statusId is 1 (Draft) for all new projects
      const project = await projectService.createProject({ ...projectData, statusId: 1 });
      
      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Project created successfully with tasks and subtasks from template, status set to Draft.',
        project
      });
    } catch (err) {
      console.error('Error creating project:', err); 
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An internal server error occurred while creating the project.'
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
      let numDesignerIdToUpdate: number | null | undefined = undefined; // undefined means no change, null means disconnect
      if (designerId !== undefined) {
        if (designerId === null) {
          numDesignerIdToUpdate = null;
        } else {
          const parsed = typeof designerId === 'string' ? parseInt(designerId, 10) : designerId;
          if (isNaN(parsed)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid designer ID format for update' });
          }
          numDesignerIdToUpdate = parsed;
          const designerExists = await prisma.user.findFirst({
            where: { id: numDesignerIdToUpdate, role: { role: 'Designer' } }
          });
          if (!designerExists) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              success: false,
              message: 'Invalid designer ID or user is not a designer'
            });
          }
        }
      } // Closing brace for if (designerId !== undefined)

      // Validate project manager if provided
      let numProjectManagerIdToUpdate: number | null | undefined = undefined;
      if (projectManagerId !== undefined) {
        if (projectManagerId === null) {
          numProjectManagerIdToUpdate = null;
        } else {
          const parsed = typeof projectManagerId === 'string' ? parseInt(projectManagerId, 10) : projectManagerId;
          if (isNaN(parsed)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid project manager ID format for update' });
          }
          numProjectManagerIdToUpdate = parsed;
          const projectManagerExists = await prisma.user.findFirst({
            where: { id: numProjectManagerIdToUpdate, role: { role: 'Project Manager' } }
          });
          if (!projectManagerExists) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              success: false,
              message: 'Invalid project manager ID or user is not a project manager'
            });
          }
        }
      } // Closing brace for if (projectManagerId !== undefined)

      const updateData: ProjectUpdateWithRelations = {
        ...(name && { name }),
        ...(description && { description }),
        ...(address && { address }),
        ...(location && { location }),
        ...(sqft && { sqft }),
        ...(statusId && { status: { connect: { id: statusId } } }),
        ...(designerId !== undefined && (numDesignerIdToUpdate === null ? { designer: { disconnect: true } } : { designer: { connect: { id: numDesignerIdToUpdate as number } } })),
        ...(projectManagerId !== undefined && (numProjectManagerIdToUpdate === null ? { projectManager: { disconnect: true } } : { projectManager: { connect: { id: numProjectManagerIdToUpdate as number } } })),
        ...(engineerId !== undefined && {
          engineer: engineerId === null 
            ? { disconnect: true } 
            : { connect: { id: (typeof engineerId === 'string' ? parseInt(engineerId, 10) : engineerId) as number } } // Assuming engineerId is validated if not null
        }),
        updatedBy: { connect: { id: userId } }
      };

      // Ensure engineerId is parsed and validated if provided for connection
      if (engineerId !== undefined && engineerId !== null) {
        const numEngineerIdToUpdate = typeof engineerId === 'string' ? parseInt(engineerId, 10) : engineerId;
        if (isNaN(numEngineerIdToUpdate)) {
          return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid engineer ID format for update' });
        }
        // Optional: Validate engineer role if needed, similar to designer/pm
        updateData.engineer = { connect: { id: numEngineerIdToUpdate } };
      } else if (engineerId === null) {
         updateData.engineer = { disconnect: true };
      }

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
      const { status: newStatusName } : { status?: string } = req.body; // Expecting status name e.g. "Active", "Completed", "Archived"

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'User not authenticated' });
      }
      if (!newStatusName) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'New project status is required.' });
      }

      const targetStatusRecord = await prisma.status.findFirst({ where: { status: newStatusName } });
      if (!targetStatusRecord) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Invalid target project status: ${newStatusName}` });
      }

      const currentProject = await prisma.project.findUnique({ where: { id: projectId }, include: { status: true }});
      if (!currentProject) {
        return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Project not found' });
      }
      
      if (!currentProject.status) { // Add null check for status
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Project status information is missing.' });
      }
      const currentStatusName = currentProject.status.status;

      // Define allowed transitions
      const allowedTransitions: Record<string, string[]> = {
        "Draft": ["Active"],
        "Active": ["Completed", "Archived"],
        "Completed": ["Archived"],
        // Archived projects cannot be moved to other statuses directly by this endpoint for now
      };

      if (!allowedTransitions[currentStatusName]?.includes(newStatusName)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          success: false, 
          message: `Cannot transition project from ${currentStatusName} to ${newStatusName}.` 
        });
      }
      
      // Additional logic for "Completed" status (e.g., check if all tasks are done) can be added here
      if (newStatusName === "Completed") {
        const tasks = await prisma.task.findMany({
          where: { projectId: projectId },
          include: { status: true }
        });
        const allTasksCompleted = tasks.every(task => task.status.status === 'Completed'); // Assuming 'Completed' is a status for tasks
        if (!allTasksCompleted && tasks.length > 0) { // only check if there are tasks
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Cannot mark project as Completed. Not all tasks are completed.'
          });
        }
      }

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: { 
          statusId: targetStatusRecord.id,
          updatedById: userId
        },
        include: projectIncludes // Ensure this includes the status relation
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: `Project status updated to ${newStatusName} successfully`,
        project: updatedProject
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

  // static async deleteProject ... (REMOVED as per requirements)

  static async shareProject(req: CustomRequest, res: Response): Promise<Response> {
    try {
      const projectId = parseInt(req.params.id);
      const { designerId, projectManagerId, engineerId }: ProjectAssign = req.body;

      // Validate the roles first
      const updateData: ProjectUpdateWithRelations = {};

      // Validate and set designer
      if (designerId !== undefined) {
        if (designerId === null) {
          updateData.designer = { disconnect: true };
        } else {
          const numDesignerIdShare = typeof designerId === 'string' ? parseInt(designerId, 10) : designerId;
          if (isNaN(numDesignerIdShare as number)) { return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid designer ID format for share' }); }
          const designerExists = await prisma.user.findFirst({ where: { id: numDesignerIdShare as number, role: { role: 'Designer' } } });
          if (!designerExists) { return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid designer ID or user is not a designer' });}
          updateData.designer = { connect: { id: numDesignerIdShare as number } };
        }
      }

      // Validate and set project manager
      if (projectManagerId !== undefined) {
        if (projectManagerId === null) {
          updateData.projectManager = { disconnect: true };
        } else {
          const numProjectManagerIdShare = typeof projectManagerId === 'string' ? parseInt(projectManagerId, 10) : projectManagerId;
          if (isNaN(numProjectManagerIdShare as number)) { return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid project manager ID format for share' }); }
          const pmExists = await prisma.user.findFirst({ where: { id: numProjectManagerIdShare as number, role: { role: 'Project Manager' } } });
          if (!pmExists) { return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid project manager ID or user is not a project manager' });}
          updateData.projectManager = { connect: { id: numProjectManagerIdShare as number } };
        }
      }

      // Validate and set engineer
      if (engineerId !== undefined) {
        if (engineerId === null) {
          updateData.engineer = { disconnect: true };
        } else {
          const numEngineerIdShare = typeof engineerId === 'string' ? parseInt(engineerId, 10) : engineerId;
          if (isNaN(numEngineerIdShare as number)) { return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid engineer ID format for share' }); }
          const engineerExists = await prisma.user.findFirst({ where: { id: numEngineerIdShare as number, role: { role: 'Site Engineer' } } });
          if (!engineerExists) { return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid engineer ID or user is not a site engineer' });}
          updateData.engineer = { connect: { id: numEngineerIdShare as number } };
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
          const materialData = materials.map(m => {
            // Calculate overallThickness: plyThickness + 1mm inner laminate + 1mm outer laminate
            const overallThickness = m.plyThickness + 2; 
            return {
              projectId,
              materialId: m.materialId,
              plyThickness: m.plyThickness,
              innerLaminateCode: m.innerLaminateCode,
              outerLaminateCode: m.outerLaminateCode,
              overallThickness, // Use calculated value
              plyType: m.plyType as PlyType,
              grainDirection: m.grainDirection as GrainDirection,
            };
          });
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
