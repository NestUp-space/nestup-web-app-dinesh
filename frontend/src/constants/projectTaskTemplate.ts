// This file is derived from backend/src/constants/projectTaskTemplate.ts
// It provides the frontend with the necessary task order for UI logic.

export interface FrontendTaskTemplate {
  stage: string;
  taskName: string;
}

export const defaultProjectTaskTemplates: FrontendTaskTemplate[] = [
  // Site measurements Stage
  {
    stage: "Site measurements",
    taskName: "Book Site Visit",
  },
  // Payment Stage
  {
    stage: "Payment",
    taskName: "Token Deposit",
  },
  {
    stage: "Site measurements",
    taskName: "Site Visit",
  },
  {
    stage: "Site measurements",
    taskName: "Design inputs",
  },
  // Design Stage
  {
    stage: "Design",
    taskName: "Finalise designs",
  },
  // Approval Stage
  {
    stage: "Approval",
    taskName: "Production document",
  },
  {
    stage: "Approval",
    taskName: "Proforma invoice",
  },
  // Pre-Production Stage
  {
    stage: "Pre-Production",
    taskName: "Material estimation",
  },
  // Production Stage
  {
    stage: "Production",
    taskName: "Input QA",
  },
  {
    stage: "Payment",
    taskName: "First Installment",
  },
  {
    stage: "Production",
    taskName: "Pressing list",
  },
  {
    stage: "Production",
    taskName: "G code and cutting list",
  },
  {
    stage: "Production",
    taskName: "Output QA",
  },
  {
    stage: "Payment",
    taskName: "Last Installment",
  },
  {
    stage: "Production",
    taskName: "Installation Guide",
  }
];
