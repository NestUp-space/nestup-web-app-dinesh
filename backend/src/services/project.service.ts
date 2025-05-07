import prisma from '../config/db';  // Prisma client

export const createProjectService = async (data: any) => {
  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      address: data.address,
      location: data.location,
      sqft: data.sqft,
      estimatedTime: data.estimatedTime,
      vbCount: data.vbCount || 0,
      status: { connect: { id: data.statusId } },
      engineer: { connect: { id: data.engineerId } },
      clientId: data.clientId || null,
      createdBy: { connect: { id: data.createdById } },
      updatedBy: { connect: { id: data.createdById } },
    },
  });
  return project;
};

export const getProjectsService = async (userId?: number) => {
  const whereClause: any = {};
  if (userId) {
    // If userId is provided, we need to check if this user is a client
    // and filter projects based on ClientProjectMapping
    // For now, let's assume if userId is provided, it's for filtering by createdById
    // This logic might need refinement based on how client-specific projects are fetched
    whereClause.createdById = userId; 
    // Or, if it's a client, you might filter by:
    // whereClause.client = { some: { clientId: userId } };
  }

  return await prisma.project.findMany({
    where: whereClause,
    include: {
      status: true, // Include status details
      engineer: { // Include engineer details
        select: { id: true, name: true, email: true }
      },
      client: { // Include client details through ClientProjectMapping
        select: {
          client: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      tasks: { // Include tasks and sort them
        orderBy: {
          createdAt: 'asc', // or 'desc' depending on desired order
        },
        include: {
          status: true // Include status for each task
        }
      },
    },
    orderBy: {
      createdAt: 'desc' // Sort projects by creation date
    }
  });
};

export const getProjectByIdService = async (projectId: number) => {
  return await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      status: true,
      engineer: {
        select: { id: true, name: true, email: true }
      },
      client: {
        select: {
          client: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      tasks: {
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          status: true,
          // Add other relations for tasks if needed, e.g., files, comments
        }
      },
      // Include other relations for the project if needed
    },
  });
};

export const updateProjectService = async (projectId: number, data: any) => {
  return await prisma.project.update({
    where: { id: projectId },
    data,
  });
};

export const deleteProjectService = async (projectId: number) => {
  return await prisma.project.delete({
    where: { id: projectId },
  });
};

export const createTaskService = async (projectId: number, templateData: any) => {
  // Map template data to the Task model structure
  const taskData = {
    name: templateData.taskName, // Map taskName to name
    projectId: projectId,
    statusId: templateData.statusId || 1, // Default to statusId 1 (e.g., 'Pending') if not provided
    // Add other fields from templateData if they exist in the Task model and are needed
    // For now, we only map 'name' and ensure 'projectId' and 'statusId' are set.
    // Fields like 'stage', 'uploadedBy', 'viewPermission', 'actionRequired' from the template
    // are not directly part of the Task model as per the current schema.
    // If these need to be stored, the Task model or related models would need to be updated.
  };

  return await prisma.task.create({
    data: taskData,
  });
};

export const getTasksService = async (projectId: number) => {
  return await prisma.task.findMany({
    where: { projectId },
  });
};

export const updateTaskService = async (taskId: number, data: any) => {
  return await prisma.task.update({
    where: { id: taskId },
    data,
  });
};

export const deleteTaskService = async (taskId: number) => {
  return await prisma.task.delete({
    where: { id: taskId },
  });
};

export const updateTaskStatusService = async (taskId: number, statusId: number) => {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: { connect: { id: statusId } } }, // Use nested connect for status
  });

  return task;
};
