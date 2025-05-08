import prisma from '../config/db';  // Prisma client
import taskTemplate from '../constants/taskTemplate.json'; // Import the template

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

  // After project creation, create default tasks and their subtasks
  if (project && taskTemplate && taskTemplate.length > 0) {
    for (const templateTask of taskTemplate) {
      // Type assertion for templateTask if needed, or define a type for it
      await createTaskService(project.id, templateTask as any); 
    }
  }

  return project;
};

// Updated to accept a user object with id and role
export const getProjectsService = async (user?: { id: number; role: { name: string } }) => {
  const whereClause: any = {};

  if (user) {
    // Assuming user.role.name contains 'client', 'engineer', 'admin', etc.
    // Adjust user.role.name to user.role.roleType or similar if that's the actual structure
    const roleName = user.role.name.toLowerCase(); 

    if (roleName === 'client') {
      // Clients see projects where they are directly assigned as the client
      whereClause.clientId = user.id;
    } else if (roleName === 'engineer') {
      // Engineers see projects where they are assigned as the engineer
      whereClause.engineerId = user.id;
    }
    // Admins/Superadmins (or other roles not specified) will not have user-specific where clauses,
    // thus seeing all projects by default. Add explicit checks if needed.
  } else {
    // If no user context is provided (e.g., system call or public endpoint),
    // this might return all projects or be restricted.
    // For now, assume it means no user-specific filtering.
    // Consider throwing an error if user context is always required for this service.
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
        include: { 
          status: true,
          subtasks: { // Include subtasks for each task
            orderBy: { createdAt: 'asc' }
          }
        }
      },
    },
    orderBy: { createdAt: 'desc' }
  });
};

// Updated to accept a user object for permission checks
export const getProjectByIdService = async (projectId: number, user?: { id: number; role: { name: string } }) => {
  const project = await prisma.project.findUnique({
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
        include: { 
          status: true,
          subtasks: { // Include subtasks for each task
            orderBy: { createdAt: 'asc' }
          }
        }
      },
    },
  });

  if (!project) {
    return null; // Project not found
  }

  if (user) {
    const roleName = user.role.name.toLowerCase();
    if (roleName === 'client' && project.clientId !== user.id) {
      return null; // Client does not have access
    }
    if (roleName === 'engineer' && project.engineerId !== user.id) {
      return null; // Engineer does not have access
    }
    // Admins/Superadmins can access any project by ID
  } else {
    // If no user context, and project is found, return it.
    // Or, if user context is mandatory, throw error or return null.
    // For now, assume public access if no user, but this should be reviewed.
  }

  return project;
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

export const createTaskService = async (projectId: number, templateTaskData: any) => {
  const taskDataToCreate: any = {
    projectId: projectId,
    name: templateTaskData.taskName,
    stage: templateTaskData.stage,
    statusId: templateTaskData.statusId || 1, // Default to statusId 1 (e.g., 'Pending')
    uploaderRole: templateTaskData.uploaderRole,
    // viewerRoles could be stored as JSON string or comma-separated.
    // If it's an array in template, convert to string:
    viewerRoles: Array.isArray(templateTaskData.viewerRoles) ? templateTaskData.viewerRoles.join(',') : templateTaskData.viewerRoles,
    // updatedById can be set if the user creating the project/task is known here
  };

  const createdTask = await prisma.task.create({
    data: taskDataToCreate,
  });

  // If the template task has subtasks, create them
  if (templateTaskData.subtasks && templateTaskData.subtasks.length > 0) {
    for (const subtaskTemplate of templateTaskData.subtasks) {
      await createSubtaskService(createdTask.id, {
        name: subtaskTemplate.name,
        description: subtaskTemplate.description, // Optional
        actionRequired: subtaskTemplate.actionRequired,
        type: subtaskTemplate.type,
        metadataJson: subtaskTemplate.metadataJson
      });
    }
  }

  return createdTask;
};

export const getTasksService = async (projectId: number) => {
  return await prisma.task.findMany({
    where: { projectId },
    include: { 
      status: true,
      subtasks: { // Include subtasks for each task
        orderBy: { createdAt: 'asc' }
      } 
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const updateTaskService = async (taskId: number, data: any) => {
  // When updating a task, especially its status to 'completed',
  // we might need to check if all its subtasks are completed.
  if (data.statusId) {
    const taskWithSubtasks = await prisma.task.findUnique({
      where: { id: taskId },
      include: { subtasks: true }
    });

    if (taskWithSubtasks) {
      // Assuming 'completed' status has a specific ID (e.g., 3)
      // This ID should come from a constant or config
      const COMPLETED_STATUS_ID = 3; // Placeholder: replace with actual ID for "Completed"
      
      // Check if the task is being marked as completed
      // And if it has subtasks, ensure all are completed
      if (data.statusId === COMPLETED_STATUS_ID && taskWithSubtasks.subtasks.length > 0) {
        const allSubtasksCompleted = taskWithSubtasks.subtasks.every(st => st.completed);
        if (!allSubtasksCompleted) {
          throw new Error('Cannot mark task as completed: Not all subtasks are completed.');
        }
      }
    }
  }

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
      status: true, // Include the updated status details in the response
      subtasks: { orderBy: { createdAt: 'asc' } }
    }
  });
  return updatedTask;
};

// Subtask Services

export const createSubtaskService = async (
  taskId: number, 
  data: { 
    name: string; 
    description?: string;
    actionRequired?: string;
    type?: string;
    metadataJson?: string;
  }
) => {
  return await prisma.subtask.create({
    data: {
      taskId,
      name: data.name,
      description: data.description,
      actionRequired: data.actionRequired,
      type: data.type,
      metadataJson: data.metadataJson,
      // 'completed' defaults to false as per schema
    },
  });
};

export const getSubtasksByTaskIdService = async (taskId: number) => {
  return await prisma.subtask.findMany({
    where: { taskId },
    orderBy: { createdAt: 'asc' },
  });
};

export const updateSubtaskService = async (subtaskId: number, data: { name?: string; description?: string; completed?: boolean }) => {
  const subtask = await prisma.subtask.update({
    where: { id: subtaskId },
    data,
  });

  // After updating a subtask, check if all subtasks for the parent task are now completed.
  // If so, and the parent task is not yet completed, consider updating the parent task's status.
  // This logic can be complex and might involve business rules (e.g., auto-completing tasks).
  // For now, this is a basic update. More advanced logic can be added if required.
  
  // Example: Check if all subtasks are complete
  if (data.completed === true) {
    const parentTask = await prisma.task.findUnique({
      where: { id: subtask.taskId },
      include: { subtasks: true, status: true }
    });

    if (parentTask) {
      const allSubtasksCompleted = parentTask.subtasks.every(st => st.completed);
      // Placeholder: ID for "Completed" and "In Progress" statuses
      const COMPLETED_STATUS_ID = 3; 
      const IN_PROGRESS_STATUS_ID = 2; 

      // If all subtasks are complete and task is not yet completed,
      // you might want to change its status to "Completed" or "Ready for Review"
      // This is an example and needs to be aligned with actual status IDs and workflow.
      if (allSubtasksCompleted && parentTask.statusId !== COMPLETED_STATUS_ID) {
        // Potentially update parentTask.statusId here
        // console.log(`All subtasks for task ${parentTask.id} are complete. Consider updating task status.`);
        // await updateTaskStatusService(parentTask.id, COMPLETED_STATUS_ID); // Example auto-completion
      }
    }
  }
  return subtask;
};

export const deleteSubtaskService = async (subtaskId: number) => {
  return await prisma.subtask.delete({
    where: { id: subtaskId },
  });
};
