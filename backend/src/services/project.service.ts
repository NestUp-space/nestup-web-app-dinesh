import prisma from '../config/db';  // Prisma client

export const createProjectService = async (data: any) => {
  const project = await prisma.project.create({
    data: {
      name: data.name,
      createdById: data.createdById,  // Foreign key to the user who created it
      clientId: data.clientId,
    },
  });
  // Optionally create default tasks here
  return project;
};

export const getProjectsService = async (userId: number) => {
  return await prisma.project.findMany({
    where: { createdById: userId },
    include: { tasks: true },  // Include associated tasks if needed
  });
};

export const updateTaskStatusService = async (taskId: number, status: string) => {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  return task;
};
