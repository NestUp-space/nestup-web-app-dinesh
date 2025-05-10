# Business Context & User Journeys for Nestup Web App

**Last Updated:** 2025-05-11 (To be updated as content is provided)

## 1. Core Business Requirements & Goals
*(This section will capture the fundamental business objectives the Nestup Web App aims to achieve. E.g., streamline project management for interior design, improve client communication, automate material estimation, etc. User to provide this information.)*

### 1.1. Primary Business Problems Addressed
- [Problem 1]
- [Problem 2]
- ...

### 1.2. Key Business Goals
- [Goal 1: e.g., Reduce project turnaround time by X%]
- [Goal 2: e.g., Increase client satisfaction by Y points]
- ...

### 1.3. Target Market/Audience
- [Primary User Group 1: e.g., Interior Design Firms]
- [Primary User Group 2: e.g., Modular Furniture Manufacturers]
- [Secondary User Group 1: e.g., End Clients of Design Firms]
- ...

## 2. High-Level Operational Processes
*(This section will outline the main operational workflows that the Nestup Web App supports or digitizes. E.g., Client Onboarding, Project Initiation, Design Phase, Manufacturing, Installation, Post-Project Follow-up. User to provide details for these.)*

### 2.1. [Process Name 1: e.g., Client Acquisition & Site Visit Booking]
- Step 1: ...
- Step 2: ...

### 2.2. [Process Name 2: e.g., Project Design & Material Selection]
- Step 1: ...
- Step 2: ...
- ...

## 3. User Experience (UX) Goals & Principles
*(This section will define the desired user experience. E.g., Intuitive navigation, efficient task completion, clear information hierarchy, mobile responsiveness, etc. User to provide these.)*

- Principle 1: e.g., Simplicity and Ease of Use
- Principle 2: e.g., Transparency and Clear Communication
- ...

## 4. Key User Roles & Personas
*(This section will identify the primary types of users interacting with the system. We've already identified some roles like 'admin', 'superadmin', 'client', 'engineer' from the codebase. We can expand on these with persona details if provided by the user.)*

### 4.1. [Role/Persona 1: e.g., Interior Designer (Admin/Engineer)]
- Key Responsibilities: ...
- Main Goals using the App: ...
- Pain Points (current or addressed by app): ...

### 4.2. [Role/Persona 2: e.g., End Client]
- Key Responsibilities: ...
- Main Goals using the App: ...
- Pain Points: ...
- ...

## 5. Identified User Journeys
*(This is where we will detail specific user flows. We can start by listing them and then elaborate on each. Some initial journeys are identified below based on current understanding of the application.)*

### 5.1. Journey: New Client Site Visit Booking & Project Initiation
- **User Role(s):** Prospective Client, Admin/Sales Team
- **Goal:** Client books a site visit; system captures lead and creates a draft project.
- **High-Level Steps:**
    1. Client accesses public "Book Site Visit" form.
    2. Client submits details (name, contact, project info).
    3. System validates input (via `validateRequest` middleware and `bookSiteVisitSchema`).
    4. System creates/updates user record for the client (via `siteVisitService.createOrUpdateUser`).
    5. System creates a draft project linked to the client (via `siteVisitService.createDraftProject`).
    6. Admin/Sales team is notified (mechanism TBD, assumed).
- **Key API Endpoints Involved (Inferred):**
    - `POST /api/site-visit/book` (handled by `siteVisit.controller.bookSiteVisit`)
- **UX Considerations:** Simple form, clear confirmation, timely notification to internal team.

### 5.2. Journey: Admin Manages User Roles & Permissions
- **User Role(s):** Admin/Superadmin
- **Goal:** Admin defines and assigns roles and permissions to system users.
- **High-Level Steps:**
    1. Admin navigates to Role Management section.
    2. Admin creates a new role with specific permissions.
    3. Admin views existing roles.
    4. Admin updates a role's permissions.
    5. Admin deletes a role (with safeguards like checking user assignments and protecting 'superadmin').
- **Key API Endpoints Involved (Inferred from `role.routes.ts` and `RoleController`):**
    - `POST /api/roles`
    - `GET /api/roles`
    - `GET /api/roles/:id`
    - `PUT /api/roles/:id`
    - `DELETE /api/roles/:id`
- **UX Considerations:** Clear interface for managing complex permissions, safeguards against accidental deletion of critical roles. All these routes require admin authentication.

### 5.3. Journey: Project Manager/Engineer Manages Project Lifecycle
- **User Role(s):** Admin/Engineer (or Project Manager role if distinct)
- **Goal:** Create, update, and manage projects, tasks, and subtasks.
- **High-Level Steps:**
    1. PM creates a new project.
    2. PM defines tasks for the project (possibly from templates).
    3. PM assigns subtasks.
    4. PM updates status of tasks/subtasks.
    5. PM uploads/manages project files.
    6. PM defines project-specific materials.
- **Key API Endpoints Involved (Inferred from `project.routes.ts` and nested project controllers):**
    - `POST /api/projects`
    - `GET /api/projects`, `GET /api/projects/:projectId`
    - `PUT /api/projects/:projectId`
    - `POST /api/projects/:projectId/tasks`
    - `PUT /api/projects/tasks/:taskId`, `PUT /api/projects/tasks/:taskId/status`
    - (and corresponding subtask routes under `/api/projects/tasks/:taskId/subtasks` or `/api/projects/subtasks/:subtaskId`)
    - (and file routes like `POST /api/files/upload`, `GET /api/files/:taskId`)
    - (and material routes like `POST /api/projects/:projectId/materials`)
- **UX Considerations:** Efficient creation and management of hierarchical project data, clear status indicators, easy file and material association. All these routes require authentication.

*(Further user journeys to be identified and detailed by the user, e.g., Client Viewing Project Progress, Designer Using Catalogue System, Manufacturing Team Using Plank Lists, Admin Managing Users, etc.)*

## 6. Integration Points (If any)
*(Details about any external systems the Nestup Web App interacts with. E.g., Accounting software, CRM, manufacturing hardware, etc. User to provide this information.)*
- System 1: ...
- System 2: ...

---
*This document should be a living document, updated as business requirements evolve or new user journeys are defined.*
