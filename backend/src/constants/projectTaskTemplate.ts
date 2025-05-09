import { TaskTemplate } from '../types/projectTemplate.types';

// Define a simple task template with all required fields
export const defaultProjectTaskTemplates: TaskTemplate[] = [
  {
    stage: "Initial Stage",
    taskName: "First Default Task",
    statusId: 1,
    uploaderRole: "Admin",
    viewerRoles: ["All"],
    actionRequired: "Complete this first task.",
    subtasks: [
      {
        name: "Subtask 1.1",
        actionRequired: "Complete this subtask.",
        type: "information",
        metadataJson: null
      }
    ]
  }
];

// Export a function to get the template to ensure it's always initialized
export function getDefaultProjectTaskTemplates(): TaskTemplate[] {
  console.log('!!! ENTERING getDefaultProjectTaskTemplates function !!!');
  if (!defaultProjectTaskTemplates) {
    console.error('!!! CRITICAL: defaultProjectTaskTemplates constant IS NULL OR UNDEFINED !!!');
    return [];
  }
  if (!Array.isArray(defaultProjectTaskTemplates)) {
    console.error('!!! CRITICAL: defaultProjectTaskTemplates constant IS NOT AN ARRAY !!! Type is:', typeof defaultProjectTaskTemplates);
    return [];
  }
  console.log('!!! defaultProjectTaskTemplates constant content:', JSON.stringify(defaultProjectTaskTemplates, null, 2));
  
  if (defaultProjectTaskTemplates.length > 0) {
    const firstTask = defaultProjectTaskTemplates[0];
    console.log('!!! First task in defaultProjectTaskTemplates:', JSON.stringify(firstTask, null, 2));
    if (!firstTask || typeof firstTask !== 'object') {
      console.error('!!! CRITICAL: First task in defaultProjectTaskTemplates is not a valid object !!!');
    } else if (typeof firstTask.taskName !== 'string' || firstTask.taskName.trim() === '') {
        console.error('!!! CRITICAL: First task taskName IS NOT A VALID STRING !!! Value:', firstTask.taskName);
    } else {
        console.log('!!! First task taskName seems VALID:', firstTask.taskName);
    }
  } else {
    console.warn('!!! defaultProjectTaskTemplates is an empty array !!!');
  }
  
  const templateCopy = [...defaultProjectTaskTemplates];
  console.log('!!! EXITING getDefaultProjectTaskTemplates, returning a copy. Length:', templateCopy.length);
  return templateCopy; 
}
