import prisma from '../config/db';  // Prisma client
// import * as fs from 'fs'; // No longer needed for JSON loading
// import * as path from 'path'; // No longer needed for JSON loading
import { getDefaultProjectTaskTemplates } from '../constants/projectTaskTemplate'; // Import the function to get templates
import { TaskTemplate } from '../types/projectTemplate.types'; // Import the types for the template

// Removed TaskTemplateSubtask and TaskTemplateItem interfaces as they are now in projectTemplate.types.ts
// Removed taskTemplateCache as direct import handles caching.
// Removed loadTaskTemplate function as it's no longer needed.

export const createProjectService = async (data: any) => {
  try {
    console.log('createProjectService called with data:', JSON.stringify(data, null, 2));
    
    // Use a try-catch block to handle any issues with getting the template
    let taskTemplate: TaskTemplate[] = [];
    console.log('!!! SERVICE: BEFORE calling getDefaultProjectTaskTemplates !!!');
    try {
      taskTemplate = getDefaultProjectTaskTemplates();
      console.log('!!! SERVICE: AFTER calling getDefaultProjectTaskTemplates !!!');
      console.log(`!!! SERVICE: Using task template. Length: ${taskTemplate ? taskTemplate.length : 'UNDEFINED'}. IsArray: ${Array.isArray(taskTemplate)}`);
      if (taskTemplate && Array.isArray(taskTemplate)) {
        console.log('!!! SERVICE: Task template content (first 500 chars):', JSON.stringify(taskTemplate, null, 2).substring(0, 500));
      } else {
        console.error('!!! SERVICE: taskTemplate is NULL, UNDEFINED, or NOT AN ARRAY after call !!!');
      }
    } catch (templateError) {
      console.error('!!! SERVICE: CRITICAL ERROR getting task template !!!', templateError);
      // Use a fallback template if there's an error
      taskTemplate = [{
        stage: "Fallback Stage",
        taskName: "Fallback Default Task",
        statusId: 1,
        uploaderRole: "Admin",
        viewerRoles: ["All"],
        subtasks: [{ name: "Fallback Default Subtask" }]
      }];
      console.log('!!! SERVICE: Using FALLBACK task template. Length:', taskTemplate.length);
    }

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

    // Create project with transaction to ensure all tasks are created
    const project = await prisma.$transaction(async (prisma) => {
      // Create the project
      const newProject = await prisma.project.create({
        data: projectInput,
      });

      console.log('Project created successfully:', newProject);

      // Create tasks and subtasks
      if (Array.isArray(taskTemplate) && taskTemplate.length > 0) {
        console.log(`!!! SERVICE: Attempting to create ${taskTemplate.length} default tasks...`);
        // console.log('!!! SERVICE: Full taskTemplate loaded before loop:', JSON.stringify(taskTemplate, null, 2)); 
        
        for (const templateTask of taskTemplate) {
          console.log('!!! SERVICE: LOOP START - Processing templateTask (first 200 chars):', JSON.stringify(templateTask, null, 2).substring(0,200)); 
          
          // Extremely verbose check for taskName before accessing it
          if (templateTask && typeof templateTask === 'object' && 'taskName' in templateTask && typeof templateTask.taskName === 'string' && templateTask.taskName.trim() !== '') {
            console.log('!!! SERVICE: templateTask.taskName is VALID:', templateTask.taskName);
          } else {
            console.error('!!! SERVICE: CRITICAL - templateTask.taskName IS INVALID OR MISSING !!!');
            console.error('!!! SERVICE: Failing templateTask object:', JSON.stringify(templateTask, null, 2));
            // Potentially throw an error here or skip, but the original error implies it's trying to read it
            // For now, let it proceed to hit the original error if this check doesn't catch it,
            // but this log should tell us if taskName is the problem.
          }

          // Create task
          const task = await prisma.task.create({
            data: {
              projectId: newProject.id,
              name: templateTask.taskName,
              stage: templateTask.stage,
              statusId: templateTask.statusId || 1,
              uploaderRole: templateTask.uploaderRole,
              viewerRoles: Array.isArray(templateTask.viewerRoles) 
                ? templateTask.viewerRoles.join(',') 
                : templateTask.viewerRoles,
              actionRequired: templateTask.actionRequired,
              updatedById: data.createdById // Task has optional updatedById field
            }
          });

          // Create subtasks
          if (Array.isArray(templateTask.subtasks)) {
            for (const subtask of templateTask.subtasks) {
              if (subtask && typeof subtask.name === 'string') {
                await prisma.subtask.create({
                  data: {
                    taskId: task.id,
                    name: subtask.name,
                    description: subtask.description,
                    actionRequired: subtask.actionRequired,
                    type: subtask.type,
                    metadataJson: subtask.metadataJson,
                    // Subtask doesn't have createdById/updatedById fields in schema
                  }
                });
              }
            }
          }
        }
      }

      return newProject;
    });

    return project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error(`Failed to create project: ${(error as Error).message}`);
  }
};

// Updated to accept a user object with id and role
export const getProjectsService = async (user?: { id: number; role: { name: string } }) => {
  try {
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
  } catch (error) {
    console.error('Error getting projects:', error);
    throw new Error(`Failed to get projects: ${(error as Error).message}`);
  }
};

// Updated to accept a user object for permission checks
export const getProjectByIdService = async (projectId: number, user?: { id: number; role: { name: string } }) => {
  try {
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
      // If no user context is provided (e.g., system call or public endpoint),
      // this might return all projects or be restricted.
    }

    return project;
  } catch (error) {
    console.error('Error getting project by ID:', error);
    throw new Error(`Failed to get project by ID: ${(error as Error).message}`);
  }
};

export const updateProjectService = async (projectId: number, data: any) => {
  try {
    return await prisma.project.update({
      where: { id: projectId },
      data, // Ensure 'data' only contains fields present in the Project model
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error(`Failed to update project: ${(error as Error).message}`);
  }
};

export const deleteProjectService = async (projectId: number) => {
  try {
    return await prisma.project.delete({
      where: { id: projectId },
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error(`Failed to delete project: ${(error as Error).message}`);
  }
};

export const createTaskService = async (projectId: number, templateTaskData: any) => {
  console.log('createTaskService called with templateTaskData:', JSON.stringify(templateTaskData, null, 2));
  
  // Add a robust check for templateTaskData and essential properties
  if (!templateTaskData) {
    console.error('templateTaskData is undefined or null in createTaskService');
    throw new Error('Task template data is undefined or null');
  }
  
  // Safely check for taskName property
  if (!templateTaskData || typeof templateTaskData !== 'object' || typeof templateTaskData.taskName !== 'string') {
    console.error('templateTaskData missing or invalid taskName property:', JSON.stringify(templateTaskData, null, 2));
    throw new Error(`Task template data is missing or has invalid 'taskName' property`);
  }
  
  // Safely check for subtasks property
  if (!templateTaskData.subtasks) {
    console.error('templateTaskData missing subtasks property:', JSON.stringify(templateTaskData, null, 2));
    // Create an empty array instead of throwing an error
    templateTaskData.subtasks = [];
  }
  
  if (!Array.isArray(templateTaskData.subtasks)) {
    console.error('templateTaskData.subtasks is not an array:', JSON.stringify(templateTaskData, null, 2));
    // Convert to array if not already an array
    templateTaskData.subtasks = [templateTaskData.subtasks].filter(Boolean);
  }

  try {
    const taskDataToCreate: any = {
      projectId: projectId,
      name: templateTaskData.taskName,
      stage: templateTaskData.stage,
      statusId: templateTaskData.statusId || 1, // Default to statusId 1 (e.g., 'Pending')
      uploaderRole: templateTaskData.uploaderRole,
      // viewerRoles could be stored as JSON string or comma-separated.
      // If it's an array in template, convert to string:
      viewerRoles: Array.isArray(templateTaskData.viewerRoles) ? templateTaskData.viewerRoles.join(',') : templateTaskData.viewerRoles,
      // Include actionRequired if present
      ...(templateTaskData.actionRequired && { actionRequired: templateTaskData.actionRequired }),
      // updatedById can be set if the user creating the project/task is known here
    };

    const createdTask = await prisma.task.create({
      data: taskDataToCreate,
    });

    // Corrected and safer subtask creation loop
    if (templateTaskData.subtasks.length > 0) {
      for (const subtaskTemplate of templateTaskData.subtasks) {
        if (subtaskTemplate && typeof subtaskTemplate.name !== 'undefined') {
          // Clean up metadataJson if it contains file types
          let cleanedMetadataJson = subtaskTemplate.metadataJson;
          if (cleanedMetadataJson) {
            try {
              const metadata = JSON.parse(cleanedMetadataJson);
              if (metadata.allowedFileTypes) {
                // Remove dots from file extensions if present
                metadata.allowedFileTypes = metadata.allowedFileTypes.map((type: string) => 
                  type.startsWith('.') ? type.substring(1) : type
                );
                cleanedMetadataJson = JSON.stringify(metadata);
              }
            } catch (e) {
              console.warn('Failed to parse metadataJson, using as-is:', e);
            }
          }

          await createSubtaskService(createdTask.id, {
            name: subtaskTemplate.name,
            description: subtaskTemplate.description,
            actionRequired: subtaskTemplate.actionRequired,
            type: subtaskTemplate.type,
            metadataJson: cleanedMetadataJson
          });
        } else {
          console.warn('Encountered an invalid subtask template item. Skipping:', subtaskTemplate);
        }
      }
    }

    return createdTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error(`Failed to create task: ${(error as Error).message}`);
  }
};

export const getTasksService = async (projectId: number) => {
  try {
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
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw new Error(`Failed to get tasks: ${(error as Error).message}`);
  }
};

export const updateTaskService = async (taskId: number, data: any) => {
  try {
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
  } catch (error) {
    console.error('Error updating task:', error);
    throw new Error(`Failed to update task: ${(error as Error).message}`);
  }
};

export const deleteTaskService = async (taskId: number) => {
  try {
    return await prisma.task.delete({
      where: { id: taskId },
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error(`Failed to delete task: ${(error as Error).message}`);
  }
};

export const updateTaskStatusService = async (taskId: number, newStatusId: number) => {
  try {
    // Ensure newStatusId is a number; the parameter is already typed as number.
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        statusId: newStatusId, // Directly update the scalar foreign key
        // Or, if you prefer connect syntax (both achieve similar results for scalar FKs):
        // status: { connect: { id: taskId },
      },
      include: {
        status: true, // Include the updated status details in the response
        subtasks: { orderBy: { createdAt: 'asc' } }
      }
    });
    return updatedTask;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw new Error(`Failed to update task status: ${(error as Error).message}`);
  }
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
  try {
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
  } catch (error) {
    console.error('Error creating subtask:', error);
    throw new Error(`Failed to create subtask: ${(error as Error).message}`);
  }
};

export const getSubtasksByTaskIdService = async (taskId: number) => {
  try {
    return await prisma.subtask.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    console.error('Error getting subtasks:', error);
    throw new Error(`Failed to get subtasks: ${(error as Error).message}`);
  }
};

export const updateSubtaskService = async (subtaskId: number, data: { name?: string; description?: string; completed?: boolean }) => {
  try {
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
  } catch (error) {
    console.error('Error updating subtask:', error);
    throw new Error(`Failed to update subtask: ${(error as Error).message}`);
  }
};

export const deleteSubtaskService = async (subtaskId: number) => {
  try {
    return await prisma.subtask.delete({
      where: { id: subtaskId },
    });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    throw new Error(`Failed to delete subtask: ${(error as Error).message}`);
  }
};
