import prisma from '../config/db';  // Prisma client

export const createProjectService = async (data: any) => {
  const project = await prisma.project.create({
    data: {
      name: data.name,
      address: data.address,
      location: data.location,
      sqft: data.sqft,
      estimatedTime: data.estimatedTime,
      vbCount: data.vbCount || 0, // Default to 0 if not provided
      status: { connect: { id: data.statusId } }, // Connect to existing status
      engineer: { connect: { id: data.engineerId } }, // Connect to existing engineer
      createdBy: { connect: { id: data.createdById } }, // Connect to user who created it
      updatedBy: { connect: { id: data.createdById } }, // Initially same as createdBy
      clientId: data.clientId,
    },
  });
  return project;
};

export const getProjectsService = async (userId: number) => {
  return await prisma.project.findMany({
    where: { createdById: userId },
    include: { tasks: true },  // Include associated tasks if needed
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

export const createTaskService = async (projectId: number, data: any) => {
  return await prisma.task.create({
    data: {
      ...data,
      projectId,
    },
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
