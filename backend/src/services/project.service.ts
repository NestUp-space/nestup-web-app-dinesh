import prisma from '../config/db';  // Prisma client

export const createProjectService = async (data: any) => {
  const projectInput: any = { // More flexible input type for construction
    name: data.name,
    description: data.description ?? null,
    estimatedTime: data.estimatedTime ? new Date(data.estimatedTime) : new Date(),
    vbCount: data.vbCount || 0,
    statusId: data.statusId || 1, // Default status
    createdById: parseInt(data.createdById),
    updatedById: parseInt(data.createdById), // Initially same as createdBy
    engineerId: data.engineerId ? parseInt(data.engineerId) : undefined,
    clientId: data.clientId ? parseInt(data.clientId) : undefined, // Corrected based on previous errors
  };

  // For fields with @default in schema, only set them if explicitly provided,
  // otherwise Prisma will use the default.
  if (data.address !== undefined) {
    projectInput.address = data.address;
  }
  if (data.location !== undefined) {
    projectInput.location = data.location;
  }
  if (data.sqft !== undefined) {
    projectInput.sqft = data.sqft;
  }
  // Note: description is String? without @default, so `?? null` is appropriate.
  // engineerId and clientId are Int? without @default, so `? parseInt(...) : undefined` is appropriate.

  const project = await prisma.project.create({
    data: projectInput,
  });
  return project;
};

export const getProjectsService = async (userId?: number) => {
  const whereClause: any = {};
  if (userId) {
    // This logic might need refinement based on actual roles and access patterns
    whereClause.createdById = userId; 
    // Example for client-specific view if ClientProjectMapping is primary:
    // whereClause.client = { some: { clientId: userId } };
  }

  return await prisma.project.findMany({
    where: whereClause,
    include: {
      status: true, 
      engineer: { select: { id: true, name: true, email: true } },
      client: { // Fetches ClientProjectMapping records
        select: {
          client: { // Access the related User record for the client
            select: { id: true, name: true, email: true }
          }
        }
      },
      tasks: { 
        orderBy: { createdAt: 'asc' },
        include: { status: true }
      },
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getProjectByIdService = async (projectId: number) => {
  return await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      status: true,
      engineer: { select: { id: true, name: true, email: true } },
      client: { 
        select: { 
          client: { select: { id: true, name: true, email: true } }
        } 
      },
      tasks: {
        orderBy: { createdAt: 'asc' },
        include: { status: true }
      },
    },
  });
};

export const updateProjectService = async (projectId: number, data: any) => {
  return await prisma.project.update({
    where: { id: projectId },
    data, // Ensure 'data' only contains fields present in the Project model
  });
};

export const deleteProjectService = async (projectId: number) => {
  return await prisma.project.delete({
    where: { id: projectId },
  });
};

export const createTaskService = async (projectId: number, templateData: any) => {
  const taskData = {
    name: templateData.taskName, 
    projectId: projectId,
    statusId: templateData.statusId || 1, // Default to statusId 1 (e.g., 'Pending')
  };
  return await prisma.task.create({
    data: taskData,
  });
};

export const getTasksService = async (projectId: number) => {
  return await prisma.task.findMany({
    where: { projectId },
    include: { status: true }, // Include task status
    orderBy: { createdAt: 'asc' },
  });
};

export const updateTaskService = async (taskId: number, data: any) => {
  return await prisma.task.update({
    where: { id: taskId },
    data, // Ensure 'data' only contains fields present in the Task model
  });
};

export const deleteTaskService = async (taskId: number) => {
  return await prisma.task.delete({
    where: { id: taskId },
  });
};

export const updateTaskStatusService = async (taskId: number, newStatusId: number) => {
  // Ensure newStatusId is a number; the parameter is already typed as number.
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { 
      statusId: newStatusId, // Directly update the scalar foreign key
      // Or, if you prefer connect syntax (both achieve similar results for scalar FKs):
      // status: { connect: { id: newStatusId } } 
    },
    include: {
      status: true // Include the updated status details in the response
    }
  });
  return updatedTask;
};
