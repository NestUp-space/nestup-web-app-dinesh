# Project NestUp: Context, Architecture, and Future Roadmap

## 1. Project Genesis and Purpose

NestUp aims to be a comprehensive project management solution tailored for the interior design and modular furniture manufacturing industry. The system is designed to streamline workflows from initial client engagement, site visits, and design specification through to manufacturing, material estimation, and final installation.

The primary goal is to enhance efficiency, accuracy, and flexibility in managing complex custom furniture projects.

## 2. Current Architecture & Key Modules

### 2.1. Technology Stack

* **Frontend:** React, Next.js, TypeScript, Tailwind CSS, Radix UI, SWR
* **Backend:** Node.js, Express.js, TypeScript, PostgreSQL
* **ORM:** Prisma
* **File Storage:** AWS S3
* **Deployment:** Docker

### 2.2. Core Existing Modules (as of May 2025)

* **User Management & Authentication:** Handles user registration, login, roles (Admin, Designer, etc.), and permissions.
* **Project Management:** Core functionality for creating, tracking, and managing projects, including tasks and sub-tasks with status updates.
* **Client Management:** Associates clients with their respective projects.
* **File Management:** Allows uploading and associating various files (documents, images) with projects and tasks, utilizing AWS S3 for storage.
* **Material Management:** Basic tracking of project-specific materials.
* **Site Visit Management:** Facilitates capturing details from site visits, including box configurations (via `SiteVisitBox` model storing JSON inputs).
* **Original BIM Module (Legacy Aspects):** Contained some hardcoded logic (e.g., in `backend/src/bim/`) for model definitions and generation tasks. This is being progressively superseded by the new Model Management System.

### 2.3. Key Innovation: The Model Management System

A significant recent development is the **Model Management System** (`backend/src/catalogue/`).

* **Purpose:** To provide a dynamic, user-configurable system for defining furniture models (e.g., "Wardrobe Type A"), their input parameters (e.g., height, width, material), Bill of Materials (BOM), and the rules/logic for generating manufacturing outputs.
* **Core Idea:** Moves model-specific logic from hardcoded TypeScript into user-manageable data (JavaScript logic stored as strings in `BillOfMaterialItem.itemLogicScript` and processed by a `RuleService`).
* **Key Entities:** `ModelDefinition`, `ModelInputParameter`, `BillOfMaterialItem`, `ProjectModelInstance` (linking a model definition with runtime inputs to a specific project).
* **Current Capabilities (In Progress/Developed):**
  * Defining models and their parameters.
  * Defining BOM items with associated JavaScript logic for calculations.
    * **Enhanced UI (May 2023):** Implemented a user-friendly `ExpressionInput.tsx` component for defining plank calculation logic (width, length, material code). This component simplifies logic entry with features like auto-formatting, a code preview toggle with syntax highlighting, and clickable variable chips, abstracting direct JavaScript interaction for users.
  * Generating Plank Lists (CSV output) based on model definitions and runtime inputs.
  * Generating Material Estimates based on resolved BOMs.
* **Goal:** Increase flexibility, reduce hardcoding, improve maintainability, and allow for rapid definition and iteration of diverse furniture models.

### 2.4. Codebase Architectural Patterns (from LTM Analysis - May 2025)

This section details key architectural patterns and implementation details observed during the LTM Bootstrap Codebase Analysis conducted on 2025-05-11.

* **Backend Controllers & API Entry Points:**
  * **Mixed Patterns:** The backend employs a variety of controller patterns:
    * **Class-based controllers:** Used for core entities like User, Project, Task, Subtask (e.g., `backend/src/controllers/user.controller.ts`, `backend/src/controllers/project/project.controller.ts`).
    * **Static method controllers:** Seen in `RoleController` (`backend/src/controllers/role.controller.ts`).
    * **Direct service usage in route handlers:** For `ModelDefinition` and its sub-entities (`ModelInputParameter`, `ModelBomItem`), the route file `backend/src/catalogue/routes/model.routes.ts` directly invokes `ModelService` methods.
  * **Key Controller Locations & Responsibilities:**
    * **`backend/src/controllers/` (Top-Level):** Handles Auth, User, Role, File, SiteVisit, legacy BIM, and potentially Material & SiteVisitBox.
    * **`backend/src/controllers/project/` (Nested):** Active controllers for Project, Task, Subtask CRUD.
    * **`backend/src/catalogue/`:** `model.routes.ts` (using `ModelService`) for `ModelDefinition` CRUD; `project-model-instance.controller.ts` for `ProjectModelInstance` CRUD; `generation.controller.ts` for output generation.

* **Frontend Data Fetching (`frontend/src/lib/api/`):**
  * **Primary Mechanism:** An `ApiClient` class (`client.ts`) using `fetch`, handling JWT auth from `localStorage`, exported as `apiClient`.
  * **Usage:** `apiClient` is wrapped by `frontend/src/hooks/useApi.ts` and used directly as a fetcher for SWR.
  * **Alternative (Potentially Legacy/Unused):** Generic fetch helpers in `index.ts` and `auth.ts` in the same directory appear unused.
  * **Inconsistency Noted:** Different API base URL fallbacks in `client.ts`, `index.ts`, `auth.ts`.

* **Frontend Custom Hooks (`frontend/src/hooks/`):**
  * **`useApi.ts`:** Provides foundational hooks (`useApi`, `useGet`, `usePost`, `usePut`, `useDelete`) wrapping `apiClient` and managing API request state.
  * **Entity-Specific Hooks (e.g., `useProject.ts`):** Build upon `useApi.ts` hooks for specific model CRUD operations, defining relevant TypeScript types.

* **Frontend Global State (`frontend/src/context/`):**
  * **`UserContext.tsx`:** Uses React Context API for global user authentication state (profile, loading, login/logout functions), interacting with `localStorage` and API helpers.
  * **Other State:** Server state not in `UserContext` is likely managed by SWR with `apiClient`. No other global state libraries (Redux, Zustand) were apparent.

## 3. Future Feature Roadmap (High-Level Overview)

The following features are planned for future development. A detailed implementation plan, including phases, dependencies, and effort estimates, will be formulated after clarifying questions (posed on 2025-05-10) are addressed.

### 3.1. Manufacturing & Production Pipeline

* **Box Wise Inputs Collection:** (Currently in progress via Model Management & `SiteVisitBox`)
  * *Goal:* Efficiently capture all necessary parameters for each furniture unit.
* **Plank List Generation Logic:** (Currently in progress via Model Management)
  * *Goal:* Automatically generate detailed lists of all planks required for a model instance.
* **Cutlist Generation Logic:**
  * *Goal:* Optimize plank cutting from standard sheets (e.g., 8x4 ft) and generate data for CNC machines.
  * *Key Considerations:* Requires 2D nesting algorithms and G-code (`.nc` format) generation capabilities (new libraries/logic needed).
* **Material Estimate:** (Partially supported by Model Management)
  * *Goal:* Provide comprehensive material lists (plywood, hardware, laminates) for costing and procurement.
  * *Key Considerations:* Integration with pricing sources.
* **G-code Generation:**
  * *Goal:* Output `.nc` files for CNC machines based on the cutlist.
  * *Key Considerations:* Specific G-code syntax, toolpath logic.

### 3.2. Documentation & Reporting

* **Production Documentation (Downloads):**
  * InputQA (CSV)
  * Pressing List (CSV)
  * OutputQA (CSV)
  * Cutlist (PDF) - Visual layout from nesting.
  * Planklabel (PDF) - Labels for individual planks.
  * Installation Guide (PDF)
  * *Key Considerations:* Requires PDF generation capabilities (new library needed), clear definition of content for each document.

### 3.3. Project & Financial Management

* **Proforma Invoice & Final Invoice:**
  * *Goal:* Generate professional invoices for clients.
  * *Key Considerations:* Pricing logic, tax calculations, PDF generation.
* **Payments Integration:**
  * *Goal:* Collect payments via a payment gateway.
  * *Key Considerations:* Choice of gateway, integration points, security.
* **Project Analytics Dashboard:**
  * *Goal:* Provide operations managers with insights into project status, timelines, and potential bottlenecks.
  * *Key Considerations:* Definition of key metrics, UI/UX for the dashboard.

### 3.4. User Experience & Advanced Features

* **Task Assignment & Backlog Management:**
  * *Goal:* Enhance task tracking by assigning tasks to specific users and providing backlog views.
* **3D Live Model Viewer:**
  * *Goal:* Allow users to visualize 3D models that update live based on input dimensions.
  * *Key Considerations:* Requires frontend 3D rendering libraries (e.g., Three.js/@react-three/fiber), model sourcing/generation strategy.
* **Additional Services (Packing, Transportation, etc.):**
  * *Goal:* Incorporate optional services into quotes, invoices, and potentially project tasks.

## 4. Next Steps for Roadmap Detailing

This document provides a high-level overview. The detailed implementation roadmap for the features listed in Section 3 will be developed once responses to the clarifying questions (sent separately, and also listed below in Section 6) are received. This will involve:

* Breaking down features into specific tasks.
* Identifying dependencies.
* Estimating effort.
* Prioritizing implementation phases.
* Selecting appropriate tools and libraries for new functionalities.

## 5. Identified Gaps and Key Considerations (as of 2025-05-10)

Based on the review of existing project files (`.mbk` files, `prisma/schema.prisma`, `package.json` for frontend and backend), the following gaps, dependencies, and key considerations have been identified concerning the requested future features:

* **Cutlist Generation (Nesting & G-code):**
  * **Nesting Algorithm:** The logic for optimizing plank layout on standard sheets (e.g., 8x4 ft) is a significant new requirement. No specialized libraries for 2D nesting (e.g., `deepnest`, `svgnest`) are currently included in the project dependencies. This will require research and integration or custom development of a suitable algorithm.
  * **G-code (`.nc`) Generation:** Direct generation of G-code from nested layouts is also a new capability. No G-code generation libraries are present. The specifics of G-code syntax, compatibility with target CNC machines, and inclusion of operations like drilling or dado cuts need to be defined.
* **PDF Generation:**
  * Multiple features require PDF output (Cutlist, Planklabel, Installation Guide, Proforma & Final Invoices).
  * No PDF generation libraries (e.g., `Puppeteer`, `pdf-lib`, `jsPDF`, `react-pdf`) are currently in `backend/package.json` or `frontend/package.json`. A solution needs to be chosen and integrated (server-side, client-side, or hybrid).
* **3D Live Model Viewer:**
  * This is a major new frontend feature.
  * No 3D rendering libraries (e.g., `three`, `@react-three/fiber`, `babylonjs`) are present in `frontend/package.json`. These will need to be added and integrated.
  * The strategy for sourcing or generating 3D models (parametric vs. static) needs to be defined.
* **Payment Gateway Integration:**
  * This is a new backend integration. No payment gateway SDKs (e.g., Stripe, Razorpay) are present in `backend/package.json`.
* **Pricing Mechanisms:**
  * For Material Estimates and Invoicing, the source and management of material prices, service charges, and other costs need to be defined. The current schema does not show a dedicated "Material Master" or "Price List" table.
* **Task Dependencies:**
  * The current `Task` and `Subtask` models in `prisma/schema.prisma` do not explicitly support defining dependencies between tasks (e.g., Task B cannot start until Task A is complete). This might be needed for advanced project tracking in the Analytics Dashboard or for managing complex production workflows.
* **Prisma Schema - ProjectModelInstance.projectId:**
  * A minor inconsistency was noted: `ProjectModelInstance.projectId` is currently a `String`, while `Project.id` is an `Int`. This should be reconciled to `Int` for proper relational integrity.
* **Workflow Engines:**
  * No dedicated workflow engines (e.g., Temporal, BullMQ) are currently used. Complex, multi-stage processes are managed via the existing `Task`/`Subtask` structure. For highly complex future workflows, this might be an area for later consideration.
* **Global Constants:**
  * The `backend/src/catalogue/config/globalConstants.json` file (e.g., for sheet sizes) will be important for features like cutlist generation. Its structure and management should be considered.

## 6. Clarifications for Detailed Roadmap (Responses as of 2025-05-10)

This section incorporates the clarifications provided by the user, which will inform the detailed implementation roadmap in Section 7.

### I. Current State & General Context

1. **Existing BIM Module vs. New Model Management:**
    * **Old BIM Module Activity:** Specific parts of the *old* BIM module (e.g., `backend/src/bim/services/bim.service.ts`, `backend/src/routes/bim.routes.ts`) are **not** in active use for features like G-code generation (as G-code generation capability does not exist yet).
    * **Migration/Parity:** The new Model Management system is intended to fully cover "Box wise inputs" and "Plank list generation." Data migration and achieving full feature parity are key goals.
2. **File Storage (S3):**
    * **Conventions:** No specific S3 bucket structure or conventions for different types of generated files were detailed. This may need to be defined during implementation.
3. **User Roles & Permissions:**
    * **Master Administrator:** Can do and see everything.
    * **Client:** Access own project details (excluding Production documents), approve generated files, make payments, raise issues, book site measurements, make change requests, add comments.
    * **BIM Engineer:** Add projects, new clients, box details, plank details, Add-ons; Assign tasks.
    * **Project Manager:** Dashboard view; monitor and assign tasks; track customer tickets.
    * **Pressing Incharge:** Access and update status in the Pressing List file.
    * **Cutting Incharge:** Access/download and update status in G-code and Cutlist files.
    * **Output QA Incharge:** Access Output QA file, upload photos, verify material before packet-wise packing.
    * **Input QA Incharge:** Access and update status in the Pressing List file.
    * **Rework Incharge:** View and respond to tickets raised by clients.
    * **Customer Acquisition Agent:** Add projects and assign them to BIM Engineers.

### II. Feature-Specific Questions

**A. Material Repository**
    1.  **Data Source:** The primary input method is a frontend UI with dynamic forms based on `ModelInputParameter` definitions, utilizing central predefined data and existing Project details.
    2.  **Scope & Field Types:**
        *`Thickness` (IT): Integer
        *   `Laminate Code` (IC): String
        *`Photo`: Image
        *   `Grain` (Y/N): Dropdown ("y", "n")
        *   `PlyType`: Dropdown ("Plywood", "HDHMR", "Blockboard")

**B. Model Type repository**
    1.  **Data Source:** Primarily hardcoding, with flexibility for BIM Engineers to add/modify via a frontend UI with dynamic forms.
    2.  **Scope & Field Types:**
        *`Model Name`: String
        *   `Plank List`: (Structure to be detailed, likely an array of objects/strings)
        *`Plank wise details`: (Structure to be detailed)
        *   `Photo`: Image

**C. Add-on Repository**
    1.  **Data Source:** Primarily hardcoding, with flexibility for BIM Engineers to add/modify via a frontend UI with dynamic forms.
    2.  **Scope & Field Types:** (User input for scope was empty; to be detailed if further info provided)

**D. Box Wise Inputs Collection (In Progress)**
    1.  **Data Source:** A frontend UI with dynamic forms based on `ModelInputParameter` definitions, using central predefined data, existing Material details, Model types, and Add-on data.
    2.  **Scope & Field Types:**
        *`Box Height` (BH): Integer (Min: 250mm, Max: 2400mm)
        *   `Box Width` (BW): Integer (Min: 250mm, Max: 2400mm)
        *`Box Depth` (BD): Integer (Min: 250mm, Max: 750mm)
        *   `Left Expose` (LE): Dropdown ("Wall", "Expose", "Box") - String
        *`Right Expose` (RE): Dropdown ("Wall", "Expose", "Box") - String
        *   `Add on` (AD): Dropdown (List from Add-on Repository)
        *`Model Type`: Dropdown (List from Model Type Repository)
        *   `Inner Material Code`: Array of strings (Imported from Material Repository via dropdown)
        *`Expose Material Code`: Array of strings (Imported from Material Repository via dropdown)
        *   `Back Material Code`: Array of strings (Imported from Material Repository via dropdown)
    3.  **Material Selection:** For Inner, Expose, and Back Material Codes, users select from dropdowns populated from the Material Repository.

**E. Plank List Generation Logic (In Progress via Model Management)**
    1.  **Output Format:** CSV is sufficient.
    2.  **Plank List Details:** For each Box, based on box type and Add-on, the number of planks is generated with attributes:
        *`Width` (W)
        *   `Height` (H)
        *`Material Code` (MC)
        *   `Plank ID` (BoxNumber-PlankNumber-PlankIdentifier)
        *`Hole` (x,y,z,t) - (Assuming t is type or thickness)
        *   `Groove` (x1,y1,x2,y2,z,t) - (Assuming z is depth, t is type)

**F. Cutlist Generation Logic (New Major Feature)**
    1.  **Nesting Logic (Packing Planks into Sheets):**
        *Sheet size: 2440mm x 1220mm (Global constant).
        *   Preferred algorithm: MaxRects Algorithm.
        *Implementation: Open to integrating an existing library (e.g., `deepnest`, `svgnest`) or building from scratch.
        *   Optimization priority: Minimize waste.
    2.  **G-code Generation (`.nc` format):**
        *Operations Grouping: Group all tool-related operations (drilling, groove, cutting).
        *   Machine Control: Include operations like starting vacuum bed, starting/stopping spindle, tool changes, and resetting job work.
        *Format: A specific G-code format for Nestup is required.
        *   Manufacturing Ops from BOM: Yes, the `itemLogicScript` in `BillOfMaterialItem` will define manufacturing operations (like drill holes, dado cuts) that need to translate to G-code.
        *   **G-code Syntax Example Provided:**
            ```gcode
            ; 🔧 HEADER / TOOL SETUP
            G300                  ; Nestup machine startup code
            T{ToolNumber}         ; Select tool (e.g., T1 = cutter, T3 = drill)
            G43 H{ToolNumber}     ; Apply tool height offset
            M03 S{RPM}            ; Start spindle at given RPM

            ; 🚀 SAFE TRAVEL MOVE
            G00 X{x} Y{y} Z26.0000    ; Rapid move to starting point with safe Z height

            ; 🔽 Z-AXIS PLUNGE
            G01 Z{Depth} F{Feedrate}  ; Controlled plunge to cut depth or drilling depth

            ; ✂️ RECTANGLE / PERIMETER CUT (multi-pass optional)
            G01 X{x1} Y{y1} Z0.0000 F{Feedrate}
            G01 X{x2} Y{y2} Z0.0000
            G01 X{x3} Y{y3} Z0.0000
            G01 X{x4} Y{y4} Z0.0000
            G01 X{x1} Y{y1} Z0.0000    ; Close loop

            ; 🔘 HOLE DRILLING
            G00 X{cx} Y{cy} Z26.0000
            G01 Z{HoleDepth} F{DrillFeed}
            G00 Z26.0000

            ; ➖ GROOVE OR SLOT CUT
            G00 X{x_start} Y{y_start} Z26.0000
            G01 Z{-grooveDepth} F{EntryFeed}
            G01 X{x_end} Y{y_end} Z{-grooveDepth} F{CutFeed}
            G00 Z26.0000

            ; 🛑 RETRACT / END
            G00 Z26.0000           ; Retract to safe height
            M05                    ; Stop spindle
            M30                    ; End program
            ```

**G. Material Estimate (Leveraging Model Management)**
    1.  **Scope & Output (CSV):**
        ***Section 1: Base Material:** Description, Thickness, Count, Checkbox, Comments.
        *   **Section 2: Laminates:** Description, Brand, Color Code, Count, Comments, Photo.
        ***Section 3: Edge Banding:** Description, Color Code, Length, Width, Comments. (Note: "Length" appears twice, assuming one is a typo or refers to a different aspect).
        *   **Section 4: Hardware List:** Description, Brand, Count, Comments, Photo.
    2.  **Inputs and Rules:**
        *Base Material & Laminates: Derived from sheet numbers, Material codes, and Material Repository.
        *   Hardware List: Detailed rules provided based on Model Types, Box Types, Add-ons, customer choices, and specific quantities for items like PTA screws (various sizes), Legs, VB Fittings, Hinges, L Clamps, Hydraulics, PVC Gitty, Gola Profiles, Tower Bolts, Locks, Oval Brackets/Rods, Magic Corners, Shelf Buttons, Sliding Channels, Tandem Baskets, Abro Tapes, HeatX, Fevicol (D3 & Probond per sheet/add-on), Drawer Channels (various sizes based on box depth).
    3.  **Pricing:**
        *Jobwork Price: Depends on overall sqft calculated from box-wise inputs.
        *   Additional Services: Each type of service will have a formula.

**H. Invoicing (Proforma & Final - New Major Feature)**
    1.  **Pricing Source:** Derived from inputs at the Project level and Box-wise inputs.
    2.  **Invoice Structure:** Jobwork price multiplied by 220 (Nestup pricing factor) plus 9% GST.
    3.  **PDF Generation:** Required.

**I. Production Documentation (New - Downloads)**
    1.  **InputQA (CSV):** Same structure as Material Estimate Sections 1-4:
        *Section 1: Base Material (Description, Thickness, Count, Checkbox, Comments)
        *   Section 2: Laminates (Description, Brand, Color Code, Count, Comments, Photo)
        *Section 3: Edge Banding (Description, Color Code, Length, Width, Comments)
        *   Section 4: Hardware List (Description, Brand, Count, Comments, Photo)
    2.  **Pressing List (CSV):**
        *Columns: To be defined.
        *   Purpose: Manages the process of joining inner laminate and color laminate with plywood sheets (standard 2440mm x 1220mm sheets). Differs from plank list which details smaller cut pieces.
    3.  **OutputQA (CSV):**
        *Columns: To be defined.
        *   Purpose: Essentially the plank list separated by packet. Used to check if all planks are correctly extracted before packing into predefined packets based on similar Plank IDs.
    4.  **Cutlist (PDF):**
        *Content: Visual output of the nesting process. Should contain List of Planks, Sheet Name, Sheet Number, and Wastage %.
        *   Logic: If wastage is more than 50%, suggest partial pressing.
    5.  **Planklabel (PDF):**
        *Size: Each label is 70mm x 50mm.
        *   Content: Plank ID, Box name, and Model type.
        *Format: Downloadable and printable, accessible to the cutting engineer. Multiple labels per page.
    6.  **Installation Guide (PDF):**
        *   Content Generation: Auto-generated based on box-wise inputs.
        *Content Details: Specific information packet-wise and basic box visualization.
        *   Creator: System-generated.

**J. Task Management & Assignment (Enhancement)**
    1.  **Assignment Logic:** Tasks/subtasks should be assignable to individual users (`User.id`) or clients.
    2.  **Backlog View:** (User to specify preference: Kanban-style board or a list view).
    3.  **Task Dependencies:** Yes, need to define dependencies between tasks.

**K. Payments (New Major Feature)** (Previously H)
    1.  **Payment Gateway:** RazorPay.
    2.  **Integration Points:**
        *₹5000 on project creation.
        *   50% of total payment after Input QA.
        *   Remaining 50% before dispatch.
    3.  **Payment Tracking:** Only online payments will be accepted and tracked.

**L. Project Analytics Dashboard (New Feature)** (Previously I)
    1.  **Key Metrics (Top 5-10):**
        *Total SFT of Production (current month).
        *   Total Revenue (current month to date).
        *Total number of new registrations (current month so far).
        *   Ongoing projects list (grouped by Priority).
        *   Total number of plywood sheets processed.
    2.  **Visualization:** Project tracking chart.
    3.  **Filtering/Drill-down:** Essential (specific filtering capabilities to be defined).

**M. 3D Live Model Viewer (New Major Feature - Frontend Heavy)** (Previously J)
    1.  **Model Source:** Parametric modeling.
    2.  **Level of Detail:** Should contain Plank ID, Length, Width, and basic box representation.
    3.  **Technology Choice:** Open to `@react-three/fiber` or other preferences.
    4.  **Interaction:** Users should be able to make changes to the box-wise inputs form and see the 3D model render live.

**N. Additional Services (Packing, Transportation, etc. - New Feature)** (Previously K)
    1.  **Integration:**
        *As line items in quotes/invoices.
        *   Should trigger separate tasks.
        *User should be prompted with required questions upon requesting invoices for these services.
    2.  **Pricing:**
        *   Jobwork cost = Total SFT *220 rupees/SFT + 9% GST.
        *   Packing = 15 rupees / Total SFT.
        *   Fevicol = 190 rupees/kg + 18% GST.

### III. General & Roadmap Preferences

1. **PDF Generation Strategy:** (User to specify: Backend, client-side, or hybrid).
2. **Roadmap Format:** Structured document with a standard Nestup Header and Footer, and Terms & Conditions pages appended at the end.
3. **Prioritization within Features:** Any MVP sub-components for large features (user's detailed input helps define these).

## 7. Detailed Implementation Roadmap

This section outlines the planned phases for developing the features discussed in this document. It incorporates the clarifications from Section 6 and aims to provide a structured approach to implementation. The roadmap will be presented in a structured document format, and will eventually include the standard Nestup Header, Footer, and Terms & Conditions pages as per user preference.

**Effort Estimation Key:**

* **S:** Small (e.g., 1-3 days)
* **M:** Medium (e.g., 3-7 days)
* **L:** Large (e.g., 1-2 weeks)
* **XL:** Extra Large (e.g., 2-4 weeks+)

### Phase 0: Foundational Setup & Preparatory Refactoring

#### **Status: Completed**

**Goal:** Prepare the codebase and infrastructure for new feature development, including the previously discussed system-wide rename of "Model Management" to "Catalogue" and setting up robust PDF generation.

* **Task 0.1: System-Wide Rename: "Model Management" to "Catalogue"**
  * **Description:** Complete the rename of all occurrences of "Model Management" (and related terms like `ModelDefinition`) to "Catalogue" (and `CatalogueItemDefinition`, etc.) across the entire codebase (frontend, backend), database schema, and all documentation.
  * **Effort:** L (due to cross-cutting nature and need for thorough testing)
  * **Dependencies:** None.
  * **Sub-tasks:** (As previously detailed in earlier version of this document - backend, frontend, database, documentation updates).
  * **Note:** This is a critical prerequisite for clarity and consistency moving forward.

* **Task 0.2: PDF Generation Strategy Finalization & Library Integration**
  * **Description:** Decide on the PDF generation strategy (backend, client-side, or hybrid) based on complexity, performance, and template management needs. Integrate the chosen library.
  * **Effort:** S
  * **Dependencies:** None.
  * **Action (if backend chosen, as previously leaned towards):** Add `puppeteer` to `backend/package.json`.
  * **Decision Point:** Confirm if backend PDF generation using Puppeteer is the final choice. If hybrid, specify which parts are client/server.

* **Task 0.3: Implement `PdfGenerationService` (Backend)**
  * **Description:** Develop a reusable backend service for converting HTML content to PDF using the chosen library (e.g., Puppeteer).
  * **Effort:** M
  * **Dependencies:** Task 0.2.
  * **Interface:** `generatePdfFromHtml(htmlContent: string, options?: any): Promise<Buffer>`.
  * **Considerations:** Error handling, options for page size, orientation, margins.

* **Task 0.4: `GeneratedDocument` Prisma Model**
  * **Description:** Implement the `GeneratedDocument` Prisma model (Option B from previous discussion) to store metadata for various generated documents.
  * **Effort:** S
  * **Dependencies:** None (can be parallel to 0.1).
  * **Schema:** `documentType` (Enum: e.g., `INPUT_QA_CSV`, `PRESSING_LIST_CSV`, `OUTPUT_QA_CSV`, `CUTLIST_PDF`, `PLANKLABEL_PDF`, `INSTALLATION_GUIDE_PDF`, `PROFORMA_INVOICE_PDF`, `FINAL_INVOICE_PDF`), `fileName`, `filePath` (S3 path), `generatedAt`, `userId` (who generated), `projectId`, `projectCatalogueItemInstanceId` (if applicable).
  * **Action:** Update `prisma/schema.prisma`, create and run migration.

* **Task 0.5: `CatalogueOutputService` (Backend)**
  * **Description:** Create the initial `CatalogueOutputService` in `backend/src/catalogue/services/`. This service will orchestrate the generation of various outputs.
  * **Effort:** S (for initial structure)
  * **Dependencies:** Task 0.1 (for correct naming), Task 0.3, Task 0.4.

* **Task 0.6: "Simple Box" `CatalogueItemDefinition` Seeding/Creation**
  * **Description:** Ensure a well-defined "Simple Box" `CatalogueItemDefinition` exists with parameters (H, W, D, Material) and basic BOM (e.g., 6 planks, screws) for MVP testing.
  * **Effort:** S
  * **Dependencies:** Task 0.1.
  * **Action:** Create via UI or a seed script.

* **Task 0.7: S3 Bucket Structure Definition**
  * **Description:** Define and document a clear S3 bucket structure for storing different types of generated files (e.g., `/projects/{projectId}/documents/production/`, `/projects/{projectId}/documents/financial/`).
  * **Effort:** S
  * **Dependencies:** None.
  * **Output:** Decision logged in `DECISION_LOG.md`, potentially update `TECHARCH.mbk`.

### Phase 0.5: Prerequisite - Persistent Multi-Box Configuration UI with Individual Box Operations

**Status: Largely Completed, pending plank data investigation.**

**Goal:** Implement functionality in `ModelSelector.tsx` to allow users to add, configure, reorder, and remove multiple "boxes" (each a `ProjectModelInstance`), with these configurations saved to and loaded from the backend. Each box should have individual save/delete functionality, and plank IDs should be prefixed with box numbers. This is a prerequisite for effectively generating consolidated outputs like Plank Lists for multiple boxes.

**Phase A: Backend Modifications**

* **Task 0.5.A.1: Modify `ProjectModelInstance` Prisma Model**
  * **Description:** Add a `uiDisplayOrder` field to `ProjectModelInstance`.
  * **Status: Completed.**
  * **Effort:** S

* **Task 0.5.A.2: Backend API Endpoints for Individual Box Operations**
  * **Description:** Create/Verify CRUD and batch endpoints for `ProjectModelInstance`.
  * **Details:** Routes now correctly mounted under `/api/projects/:projectId/model-instances`.
  * **Status: Completed.**
  * **Effort:** L

* **Task 0.5.A.3: Update Plank Generation Service for Box Number Prefixing**
  * **Description:** Modify the plank generation service to prefix each plank's identifier with its box number.
  * **Status: Completed (Backend Verified).**
  * **Effort:** M

**Phase B: Frontend `ModelSelector.tsx` Modifications**

* **Task 0.5.B.1: Update BoxItem Interface & State Management**
  * **Description:** Refactor state for `BoxItem` array, including modification and saving states.
  * **Status: Completed.**
  * **Effort:** M

* **Task 0.5.B.2: Extract Box Component**
  * **Description:** Create reusable `BoxComponent` for individual box UI and actions.
  * **Status: Completed.**
  * **Effort:** M

* **Task 0.5.B.3: Implement Individual Box Operations**
  * **Description:** Implement save, delete, move up/down handlers. API calls updated to use `/api/projects/...` paths. `projectId` handling refined.
  * **Status: Completed (User confirmed box saving works).**
  * **Effort:** L

* **Task 0.5.B.4: Update "Generate Plank List" Functionality**
  * **Description:**
    * Ensure plank list generation only occurs when all boxes are saved. (Status: Completed)
    * Ensure box numbers are used for plank ID prefixing (Backend handles, frontend CSV displays). (Status: Completed)
    * Ensure CSV download handles prefixed IDs. (Status: Frontend CSV structured to handle)
    * **Current Issue:** Plank list generates and CSV downloads, but specific plank data fields (Width, Height, Material Code, etc.) are empty. (Status: Paused - Investigation pending user input on `itemLogicScript` and related data).
  * **Effort:** M

* **Task 0.5.B.5: Unit Tests**
  * **Description:** Create unit tests for `ModelSelector.tsx` and related services.
  * **Status: Sample unit test for `ModelSelector.tsx` (save functionality) created. Full coverage deferred by user.**
  * **Effort:** M (for full coverage)

### Phase 1: MVP - Core Production Document Generation & Initial Manufacturing Outputs (Revised)

**Goal:** Implement the generation of essential production documents and initial manufacturing outputs (PlankList, CutList CSV, G-code MVP), leveraging the multi-box configuration.

* **Task 1.1: PlankList CSV Generation (Consolidated)**
  * **Description:** Generate a consolidated Plank List CSV for all configured boxes (Section 6.II.E). The `/bim/generate-plank-list` API should return data structured for this.
  * **Effort:** M
  * **Dependencies:** Phase 0.5 (Multi-Box UI), Catalogue system.
  * **Service:** `CatalogueOutputService` (backend).

* **Task 1.2: CutList CSV Generation (Consolidated)**
  * **Description:** Generate a consolidated CSV representation of the cut list for all boxes.
  * **Effort:** M
  * **Dependencies:** Task 1.1.
  * **Service:** `CatalogueOutputService` (backend).

* **Task 1.3: G-code Generation Service (`.nc` files) - MVP (Consolidated)**
  * **Description:** Develop an MVP service to generate `.nc` G-code for all configured boxes (Section 6.II.F.2).
  * **Effort:** XL
  * **Dependencies:** Task 1.2.
  * **Logic:** Translate simplified cutlist geometry for all boxes into G-code.

* **Task 1.4: InputQA CSV Generation**
  * **Description:** Generate InputQA CSV as per Section 6.II.I.1. **Status: WIP - Issue: create planks api not returing 200 response in the model selector ui needs resolution (This issue might be resolved or change with the new multi-box plank list generation).**
  * **Effort:** M
  * **Dependencies:** Phase 0, Phase 0.5, Material Repository.

* **Task 1.5: Pressing List CSV Generation**
  * **Description:** Generate Pressing List CSV as per Section 6.II.I.2.
  * **Effort:** M
  * **Dependencies:** Phase 0, Phase 0.5, Material Repository.

* **Task 1.6: OutputQA CSV Generation**
  * **Description:** Generate OutputQA CSV as per Section 6.II.I.3.
  * **Effort:** M
  * **Dependencies:** Phase 0, Phase 0.5, Task 1.1.

* **Task 1.7: Planklabel PDF Generation**
  * **Description:** Generate Planklabel PDF as per Section 6.II.I.5.
  * **Effort:** M
  * **Dependencies:** Phase 0, Phase 0.5, Task 1.1.

* **Task 1.8: Cutlist PDF Generation (MVP - Visual List)**
  * **Description:** Generate a simplified Cutlist PDF (visual list, no complex nesting) for all boxes (Section 6.II.I.4).
  * **Effort:** M
  * **Dependencies:** Phase 0, Phase 0.5, Task 1.2.

* **Task 1.9: Installation Guide PDF Generation (MVP - Static Template)**
  * **Description:** Generate Installation Guide PDF using a static template for "Simple Box" concept, adaptable if multiple simple boxes are configured (Section 6.II.I.6).
  * **Effort:** S
  * **Dependencies:** Phase 0, Phase 0.5.

* **Task 1.10: UI for Document Download (Consolidated)**
  * **Description:** Ensure UI elements for download handle consolidated documents.
  * **Effort:** M
  * **Dependencies:** Backend endpoints for consolidated documents.

* **Task 1.11: Testing & Refinement (Phase 1 - Revised)**
  * **Description:** Thoroughly test all Phase 1 document and G-code generation features with multi-box configurations.
  * **Effort:** L

### Phase 2: Advanced Manufacturing & Estimation (Revised)

**Goal:** Implement full Cutlist generation with nesting, enhance G-code, and a comprehensive Material Estimate.

* **Task 2.1: Nesting Algorithm Integration/Development**
  * **Description:** Integrate/develop a 2D nesting algorithm (MaxRects preferred) for Cutlist generation (Section 6.II.F.1).
  * **Effort:** XL
  * **Dependencies:** Plank List data (Task 1.1).
  * **Action:** Research libraries or plan custom implementation.
  * **Output:** Service/module for nested layouts.

* **Task 2.2: Full Cutlist PDF Generation (with Nesting Visual)**
  * **Description:** Enhance Cutlist PDF to include visual representation of nested planks on sheets (Section 6.II.I.4).
  * **Effort:** L
  * **Dependencies:** Task 2.1.
  * **Service:** `CatalogueOutputService`.
  * **Logic:** Use nesting output for HTML visualization, then PDF.

* **Task 2.3: Material Estimate CSV Generation (Full)**
  * **Description:** Implement comprehensive Material Estimate CSV including all rules (Section 6.II.G).
  * **Effort:** L
  * **Dependencies:** Material Repository, Model Type Repository, Add-on Repository, BOM logic.
  * **Service:** `CatalogueOutputService`.

* **Task 2.4: Material & Model Type Repositories - UI & Backend**
  * **Description:** Build UI and backend CRUD for BIM Engineers to manage Material, Model Type, and Add-On repositories (Sections 6.II.A, B, C).
  * **Effort:** L
  * **Dependencies:** Phase 0 setup.

* **Task 2.5: Box Wise Inputs Collection - UI & Backend**
  * **Description:** Develop dynamic UI and backend for Box Wise Inputs collection (Section 6.II.D).
  * **Effort:** L
  * **Dependencies:** Task 2.4.

### Phase 3: Financials, Payments & Advanced UX

**Goal:** Implement invoicing, payment gateway integration, and the 3D live model viewer.

* **Task 3.1: Invoicing (Proforma & Final) - PDF Generation**
  * **Description:** Generate Proforma and Final Invoices in PDF format (Section 6.II.H).
  * **Effort:** L
  * **Dependencies:** Pricing logic, `PdfGenerationService`.

* **Task 3.2: Payment Gateway Integration (RazorPay)**
  * **Description:** Integrate RazorPay for online payments (Section 6.II.K).
  * **Effort:** L
  * **Dependencies:** Backend infrastructure.

* **Task 3.3: 3D Live Model Viewer (Frontend)**
  * **Description:** Develop the parametric 3D model viewer (Section 6.II.M).
  * **Effort:** XL
  * **Dependencies:** Box Wise Inputs data, frontend 3D library.

* **Task 3.4: Additional Services Integration**
  * **Description:** Integrate additional services into quotes/invoices and task system (Section 6.II.N).
  * **Effort:** M
  * **Dependencies:** Invoicing system, Task Management.

### Phase 4: Analytics, Task Management Enhancements & Optimizations

**Goal:** Implement the Project Analytics Dashboard and enhance Task Management.

* **Task 4.1: Task Management Enhancements**
  * **Description:** Implement assignment, backlog view, and task dependencies (Section 6.II.J).
  * **Effort:** L
  * **Dependencies:** Existing task system.

* **Task 4.2: Project Analytics Dashboard - Backend Data Aggregation**
  * **Description:** Develop backend logic for key metrics (Section 6.II.L).
  * **Effort:** L
  * **Dependencies:** Various data sources.

* **Task 4.3: Project Analytics Dashboard - Frontend Visualization**
  * **Description:** Build UI for the dashboard (Section 6.II.L).
  * **Effort:** L
  * **Dependencies:** Task 4.2.

* **Task 4.4: Define Columns for Pressing List & OutputQA CSV**
  * **Description:** Finalize columns based on operational needs (Section 6.II.I.2, 6.II.I.3).
  * **Effort:** S
  * **Dependencies:** Operational feedback from MVP.

* **Task 4.5: Refine Installation Guide Generation**
  * **Description:** Move to fully auto-generated Installation Guide (Section 6.II.I.6).
  * **Effort:** L
  * **Dependencies:** Box Wise Inputs, `PdfGenerationService`.

### Potential Risks and Mitigation Strategies

(Content remains the same)

---
*This document will be updated as the project evolves and the roadmap is refined.*
