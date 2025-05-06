import { PrismaClient, Project, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @class ProjectRepository
 * @description Handles all database operations related to the Project model.
 */
export class ProjectRepository {
  /**
   * @method create
   * @description Creates a new project.
   * @param {Prisma.ProjectUncheckedCreateInput} projectData - The data for the new project.
   * @returns {Promise<Project>} The created project object.
   */
  async create(projectData: Prisma.ProjectUncheckedCreateInput): Promise<Project> {
    return prisma.project.create({
      data: projectData,
    });
  }

  // Add other project-related database methods here as needed
  // e.g., findById, findByClientId, update, delete, etc.
}

// Export an instance of the repository
export const projectRepository = new ProjectRepository();
