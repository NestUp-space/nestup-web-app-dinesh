import { TaskTemplate } from '../types/projectTemplate.types';

// Define the task templates with all required fields
export const defaultProjectTaskTemplates: TaskTemplate[] = [
  // Site measurements Stage
  {
    stage: "Site measurements",
    taskName: "Book Site Visit",
    statusId: 1,
    uploaderRole: "Client",
    viewerRoles: ["All"],
    actionRequired: "Site visit is booked based on this the form.",
    subtasks: []
  },
   // Payment Stage
   {
    stage: "Payment",
    taskName: "Token Deposit",
    statusId: 1,
    uploaderRole: "Client",
    viewerRoles: ["All"], // Assuming "AII" was a typo for "All"
    actionRequired: "Client to make a payment - Token deposit.",
    subtasks: []
  },
  {
    stage: "Site measurements",
    taskName: "Site Visit",
    statusId: 1,
    uploaderRole: "BIM Engineer",
    viewerRoles: ["All"],
    actionRequired: "BIM engineer to Input site measurements.",
    metadataJson: null, // Moved frontendComponents to subtasks
    subtasks: [
      {
        name: "Collect Material Details",
        actionRequired: "BIM Engineer to input material specifications observed during site visit.",
        type: "data_collection",
        isSystemDefined: true,
        metadataJson: JSON.stringify({ frontendComponent: "frontend/src/components/dashboard/MaterialManagement.tsx" })
      },
      {
        name: "Record Model & Dimension Details",
        actionRequired: "BIM Engineer to input model selections and measured dimensions from site.",
        type: "data_collection",
        isSystemDefined: true,
        metadataJson: JSON.stringify({ frontendComponent: "frontend/src/components/dashboard/ModelSelector.tsx" })
      }
    ]
  },
  {
    stage: "Site measurements",
    taskName: "Design inputs",
    statusId: 1,
    uploaderRole: "Client",
    viewerRoles: ["BIM Engineer"],
    actionRequired: "Client to provide design inputs. BIM Engineer to validate.",
    subtasks: [
      {
        name: "Upload 2D Images",
        actionRequired: "Client to upload 2D site images.",
        type: "upload",
        metadataJson: null
      },
      {
        name: "Upload 3D Images",
        actionRequired: "Client to upload 3D site images.",
        type: "upload",
        metadataJson: null
      },
      {
        name: "Client Approval for Production",
        actionRequired: "Client to provide sign-off for production.",
        type: "approval",
        metadataJson: JSON.stringify({ documentType: "Sign off document" })
      }
    ]
  },
 
  

  // Design Stage
  {
    stage: "Design",
    taskName: "Site photos",
    statusId: 1,
    uploaderRole: "Client",
    viewerRoles: ["All"],
    actionRequired: "Client to upload site photos. BIM Engineer to validate.",
    subtasks: []
  },
  {
    stage: "Design",
    taskName: "Finalise designs",
    statusId: 1,
    uploaderRole: "BIM Engineer", 
    viewerRoles: ["All"],
    actionRequired: "BIM engineer Confirms the final designs.",
    subtasks: []
  },
  // Approval Stage
  {
    stage: "Approval",
    taskName: "Production document",
    statusId: 1,
    uploaderRole: "BIM Engineer",
    viewerRoles: ["All"],
    actionRequired: "BIM Engineer to prepare and upload production document. Client to approve.",
    subtasks: [
      {
        name: "Upload Production Document",
        actionRequired: "BIM Engineer to upload the production document.",
        type: "upload",
        metadataJson: JSON.stringify({ fileTypes: ["PDF", "SKP"] })
      },
      {
        name: "Client Approval of Production Document",
        actionRequired: "Client to approve the uploaded production document.",
        type: "approval",
        metadataJson: null
      }
    ]
  },
  {
    stage: "Approval",
    taskName: "Performa invoice",
    statusId: 1,
    uploaderRole: "BIM Engineer",
    viewerRoles: ["All"],
    actionRequired: "BIM Engineer to prepare and upload Proforma Invoices. Client to make payment.",
    subtasks: [
      {
        name: "Upload Proforma Invoice - MW",
        actionRequired: "BIM Engineer to upload Proforma Invoice for Modular Work.",
        type: "upload",
        metadataJson: JSON.stringify({ invoiceType: "MW - Modular Work" })
      },
      {
        name: "Upload Proforma Invoice - FFTL",
        actionRequired: "BIM Engineer to upload Proforma Invoice for Fixtures Fevicol Transport and Logistics.",
        type: "upload",
        metadataJson: JSON.stringify({ invoiceType: "FFTL - Fixtures Fevicol Transport and Logistics" })
      },
      {
        name: "Client Payment for Proforma Invoices",
        actionRequired: "Client to make payment against the Proforma Invoices.",
        type: "payment",
        metadataJson: null
      }
    ]
  },
  // Pre-Production Stage
  {
    stage: "Pre-Production",
    taskName: "Material estimation",
    statusId: 1,
    uploaderRole: "BIM Engineer",
    viewerRoles: ["All"],
    actionRequired: "Client to send the material. BIM Engineer to manage cuttist.",
    subtasks: [
      {
        name: "Upload Cuttist",
        actionRequired: "BIM Engineer to upload cuttist.",
        type: "upload",
        metadataJson: null
      }
    ]
  },
  // Production Stage
  {
    stage: "Production",
    taskName: "Input QA",
    statusId: 1,
    uploaderRole: "BIM Engineer",
    viewerRoles: ["Production Engineer", "BIM Engineer"],
    actionRequired: "Production associate to verify and Receive the material and update the status.",
    subtasks: []
  },
  {
    stage: "Payment",
    taskName: "First Installment",
    statusId: 1,
    uploaderRole: "Client",
    viewerRoles: ["All"],
    actionRequired: "Client to make a first installment payment.",
    subtasks: []
  },
  {
    stage: "Production",
    taskName: "Pressing list",
    statusId: 1,
    uploaderRole: "BIM Engineer",
    viewerRoles: ["Production Engineer", "BIM Engineer"],
    actionRequired: "Production associate to verify and Receive the material and update the status.",
    subtasks: []
  },
  {
    stage: "Production",
    taskName: "G code and cutting list",
    statusId: 1,
    uploaderRole: "BIM Engineer",
    viewerRoles: ["Production Engineer", "BIM Engineer"],
    actionRequired: "Production associate use this for CNC programming.",
    subtasks: []
  },
  {
    stage: "Production",
    taskName: "Output QA",
    statusId: 1,
    uploaderRole: "BIM Engineer",
    viewerRoles: ["Production Engineer", "BIM Engineer"],
    actionRequired: "Production associate uses this to verify the status.",
    subtasks: []
  },
  {
    stage: "Payment",
    taskName: "Last Installment",
    statusId: 1,
    uploaderRole: "Client",
    viewerRoles: ["All"],
    actionRequired: "Client to make a last installment payment.",
    subtasks: []
  },
  {
    stage: "Production",
    taskName: "Installation Guide",
    statusId: 1,
    uploaderRole: "BIM Engineer",
    viewerRoles: ["All"], 
    actionRequired: "BIM engineer to prepare and upload the installation guide.",
    subtasks: [
        {
            name: "Upload Installation Guide",
            actionRequired: "BIM Engineer to upload the installation guide.",
            type: "upload",
            metadataJson: null
        }
    ]
  }
];

// Export a function to get the template to ensure it's always initialized
export function getDefaultProjectTaskTemplates(): TaskTemplate[] {
  // It's good practice to log entry and exit, and potentially the content being returned,
  // especially during development or if issues are suspected with this data.
  console.log('!!! ENTERING getDefaultProjectTaskTemplates function !!!');
  
  // Basic validation of the templates array
  if (!defaultProjectTaskTemplates) {
    console.error('!!! CRITICAL: defaultProjectTaskTemplates constant IS NULL OR UNDEFINED !!!');
    return []; // Return an empty array to prevent downstream errors
  }
  if (!Array.isArray(defaultProjectTaskTemplates)) {
    console.error('!!! CRITICAL: defaultProjectTaskTemplates constant IS NOT AN ARRAY !!! Type is:', typeof defaultProjectTaskTemplates);
    return []; // Return an empty array
  }

  // Optional: Log the content being served if debugging is needed
  // console.log('!!! defaultProjectTaskTemplates constant content:', JSON.stringify(defaultProjectTaskTemplates, null, 2));
  
  // Deep-copying the array and its objects to prevent modification of the original templates
  const templateCopy = defaultProjectTaskTemplates.map(task => ({
    ...task,
    subtasks: task.subtasks ? task.subtasks.map(subtask => ({ ...subtask })) : []
  }));
  
  console.log('!!! EXITING getDefaultProjectTaskTemplates, returning a deep copy. Length:', templateCopy.length);
  return templateCopy; 
}
