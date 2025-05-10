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

A significant recent development is the **Model Management System** (`backend/src/model-management/`).

* **Purpose:** To provide a dynamic, user-configurable system for defining furniture models (e.g., "Wardrobe Type A"), their input parameters (e.g., height, width, material), Bill of Materials (BOM), and the rules/logic for generating manufacturing outputs.
* **Core Idea:** Moves model-specific logic from hardcoded TypeScript into user-manageable data (JavaScript logic stored as strings in `BillOfMaterialItem.itemLogicScript` and processed by a `RuleService`).
* **Key Entities:** `ModelDefinition`, `ModelInputParameter`, `BillOfMaterialItem`, `ProjectModelInstance` (linking a model definition with runtime inputs to a specific project).
* **Current Capabilities (In Progress/Developed):**
  * Defining models and their parameters.
  * Defining BOM items with associated JavaScript logic for calculations.
  * Generating Plank Lists (CSV output) based on model definitions and runtime inputs.
  * Generating Material Estimates based on resolved BOMs.
* **Goal:** Increase flexibility, reduce hardcoding, improve maintainability, and allow for rapid definition and iteration of diverse furniture models.

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
  * The `backend/src/model-management/config/globalConstants.json` file (e.g., for sheet sizes) will be important for features like cutlist generation. Its structure and management should be considered.

## 6. Pending Clarifications for Detailed Roadmap (as of 2025-05-10)

To draft a comprehensive and actionable implementation roadmap, the following points require clarification:

### I. Current State & General Context

1. **Existing BIM Module vs. New Model Management:**
    * Are there specific parts of the *old* BIM module (e.g., `backend/src/bim/services/bim.service.ts`, `backend/src/routes/bim.routes.ts`) that are still in active use for features *not yet* covered by the new Model Management system (like G-code generation, if any part of it exists)?
    * How complete is the data migration or feature parity from the old BIM system to the new Model Management system for "Box wise inputs" and "Plank list generation"?
2. **File Storage (S3):** Are there established conventions or a specific S3 bucket structure for different types of generated files?
3. **User Roles & Permissions:** Could you briefly outline the key roles (e.g., Admin, Designer, Factory Manager, Site Engineer, Client) and which roles are expected to interact with or be responsible for the new features?

### II. Feature-Specific Questions

**A. Box Wise Inputs Collection (In Progress)**
    1.  **Data Source:** Is the primary input method for these JSON blobs a frontend UI with dynamic forms based on `ModelInputParameter` definitions? Or is there any parsing from CAD files (e.g., DXF, SKP) planned or existing?
    2.  **Scope:** What's the typical complexity of `inputs` JSON? Simple dimensions, or does it include adjacencies, hardware choices, finish codes etc., directly within this JSON?

**B. Plank List Generation Logic (In Progress via Model Management)**
    1.  **Output Format:** Currently, it generates CSV. Is this sufficient, or will a more structured JSON/PDF also be needed directly from this service?

**C. Cutlist Generation Logic (New Major Feature)**
    1.  **Nesting Logic (Packing Planks into Sheets):**
        *Sheet size is a global constant (8x4 ft). Do you have a preferred algorithm (e.g., first-fit-decreasing, best-fit, or more advanced 2D nesting algorithms)?
        *   Are you looking to integrate an existing library (e.g., `deepnest`, `svgnest`, or a commercial one), or build this logic from scratch?
        *What are the optimization priorities (minimize waste, minimize cuts, processing time)?
    2.  **G-code Generation (`.nc` format):**
        *   Once planks are nested on a sheet, what level of detail is needed for G-code? (e.g., simple outlines, tool paths, drilling operations, specific machine controller compatibility - GRBL, Mach3, etc.)
        *Is there existing software (like VCarve, Fusion360, CAMotics) whose G-code output style you need to emulate, or is this a more generic G-code?
        *   Will the `itemLogicScript` in `BillOfMaterialItem` also define manufacturing operations (like drill holes, dado cuts) that need to translate to G-code?

**D. Material Estimate (Leveraging Model Management)**
    1.  **Scope:** Does this estimate include only plywood/laminates derived from the BOM, or also hardware, edge banding, and potentially labor/overheads?
    2.  **Document Format:** PDF, CSV, or an interactive view in the UI?
    3.  **Pricing:** How are material prices determined? Is there a central "Material Master" with prices that this service should refer to, or are prices project-specific?

**E. Invoicing (Proforma & Final - New Major Feature)**
    1.  **Pricing Source:** Will item prices for invoices be derived from the material estimate, a separate product/service catalog, or manually entered per project?
    2.  **Invoice Structure:** What are the key sections and data points for proforma and final invoices?
    3.  **PDF Generation:** This will require a PDF generation solution.

**F. Production Documentation (New - Downloads)**
    1.  **InputQA (CSV):** What specific data fields/columns are needed?
    2.  **Pressing List (CSV):** What columns are required? How is this list different from the plank list?
    3.  **OutputQA (CSV):** What columns? Is this for post-production checks?
    4.  **Cutlist (PDF):** This would be the visual output of the nesting process.
    5.  **Planklabel (PDF):** What information should each plank label contain? How many labels per page?
    6.  **Installation Guide (PDF):** Is this a generic guide per model type, or a project-specific assembly instruction? Who creates the content?

**G. Task Management & Assignment (Enhancement)**
    1.  **Assignment Logic:** Should tasks/subtasks be assignable to individual users (`User.id`) or to teams (`Team.id`)?
    2.  **Backlog View:** Are you envisioning a Kanban-style board or a list view for user-specific task backlogs?
    3.  **Task Dependencies:** Do you need to define dependencies between tasks?

**H. Payments (New Major Feature)**
    1.  **Payment Gateway:** Do you have a preferred payment gateway provider?
    2.  **Integration Points:** When should payments be initiated?
    3.  **Payment Tracking:** How should payment status be tracked?

**I. Project Analytics Dashboard (New Feature)**
    1.  **Key Metrics:** What are the top 5-10 metrics the operations manager needs to see?
    2.  **Visualization:** Any preferences for charts/graphs?
    3.  **Filtering/Drill-down:** What filtering capabilities are essential?

**J. 3D Live Model Viewer (New Major Feature - Frontend Heavy)**
    1.  **Model Source:** Are the 3D models parametric or will you be using pre-built static models?
    2.  **Level of Detail:** How detailed should the 3D representation be?
    3.  **Technology Choice:** Given a React frontend, `@react-three/fiber` is common. Open to this or other preferences?
    4.  **Interaction:** Beyond viewing, should users be able to interact with the model?

**K. Additional Services (Packing, Transportation, etc. - New Feature)**
    1.  **Integration:** How should these be incorporated? As line items in quotes/invoices? Do they trigger separate tasks?
    2.  **Pricing:** How are these services priced?

### III. General & Roadmap Preferences

1. **PDF Generation Strategy:** Backend, client-side, or hybrid?
2. **Roadmap Format:** Structured document, table, or data for Gantt?
3. **Prioritization within Features:** Any MVP sub-components for large features?

## 7. Detailed Implementation Roadmap (Initial Phases)

This section outlines the initial phases of development, focusing on foundational refactoring and the Minimum Viable Product (MVP) for document generation using a "simple box" model.

### Phase 0: Preparatory Refactoring & Setup

**Goal:** Prepare the codebase and infrastructure for new feature development, including the system-wide rename of "Model Management" to "Catalogue" and setting up PDF generation.

* **Task 0.1: System-Wide Rename: "Model Management" to "Catalogue"**
  * **Description:** Rename all occurrences of "Model Management" (and related terms like `ModelDefinition`) to "Catalogue" (and `CatalogueItemDefinition`, etc.) across the entire codebase and documentation. This is a significant refactoring effort.
  * **Sub-tasks:**
    * **Backend:**
      * Rename directory: `backend/src/model-management/` to `backend/src/catalogue/` (or `backend/src/catalogue-management/`).
      * Update service names (e.g., `ModelService` to `CatalogueService`).
      * Update controller names (e.g., `ModelController` to `CatalogueController`).
      * Update route paths (e.g., `/api/model-definitions` to `/api/catalogue-definitions`).
      * Update DTO names and content (e.g., `ModelDefinitionDto` to `CatalogueItemDto`).
      * **Prisma Schema:** Rename models (e.g., `ModelDefinition` to `CatalogueItemDefinition`, `ModelInputParameter` to `CatalogueItemInputParameter`, `BillOfMaterialItem` to `CatalogueItemBomItem`, `ProjectModelInstance` to `ProjectCatalogueItemInstance`). This will necessitate a database migration.
      * Update all internal variable names, function names, comments, and log messages.
    * **Frontend:**
      * Rename relevant directory structures.
      * Update component names (e.g., `ModelListTable` to `CatalogueListTable`).
      * Update hook names (e.g., `useModel` to `useCatalogueItem`).
      * Update API call paths and associated data types.
      * Update state management variables and types.
      * Update all UI text displayed to the user (e.g., navigation links, page titles, button labels).
      * Update internal variable names, comments, and log messages.
    * **Database:**
      * Execute Prisma migration to reflect renamed models (table names, potentially column names).
    * **Documentation:**
      * Rename `backend/.memory_bank/ModelManagement.mbk` to `backend/.memory_bank/Catalogue.mbk` (or similar).
      * Update all references in `docs/PROJECT_CONTEXT_AND_ROADMAP.md` (this document) and any other `.mbk` files or project documentation.
  * **Note:** This task should be performed systematically and tested thoroughly.

* **Task 0.2: Add PDF Generation Library to Backend**
  * **Description:** Integrate a library for server-side PDF generation.
  * **Action:** Add `puppeteer` to `backend/package.json` dependencies.
  * **Rationale:** Puppeteer allows using HTML/CSS for templating, offering good control over PDF layout.

* **Task 0.3: Create `PdfGenerationService` Utility in Backend**
  * **Description:** Develop a reusable service for converting HTML content to PDF.
  * **Action:** Implement `PdfGenerationService` in the backend (e.g., `backend/src/utils/pdf.service.ts` or `backend/src/common/services/pdf.service.ts`). This service will encapsulate Puppeteer logic.
  * **Interface:** Method like `generatePdfFromHtml(htmlContent: string, options?: any): Promise<Buffer>`.

* **Task 0.4: Define/Create `GeneratedDocument` Prisma Model (Decision Point)**
  * **Description:** Determine how to store metadata for various generated documents.
  * **Action:**
    * Option A: Adapt the existing `GeneratedPlankList` model to be more generic.
    * Option B (Recommended): Create a new Prisma model, e.g., `GeneratedDocument`, with fields like `documentType` (enum: `PLANKLIST_CSV`, `CUTLIST_PDF`, etc.), `fileName`, `filePath` (S3 path), `generatedAt`, `projectId` (or `projectCatalogueItemInstanceId`).
  * **Outcome:** Updated `prisma/schema.prisma` and a new migration if Option B is chosen.

* **Task 0.5: Create `CatalogueOutputService` in Backend**
  * **Description:** Establish a dedicated service to handle the business logic for generating various outputs (CSV, PDF) from the catalogue system.
  * **Action:** Create `CatalogueOutputService.ts` within the (newly named) `backend/src/catalogue/services/` directory. This service will use `PdfGenerationService`, `RuleService`, etc.

* **Task 0.6: Define and Create "Simple Box" `CatalogueItemDefinition`**
  * **Description:** Ensure a representative "simple box" model is defined in the catalogue system for testing document generation.
  * **Action:**
    * If not already present, use the UI (or a seed script) to create a `CatalogueItemDefinition` for a "simple box".
    * Define its necessary `CatalogueItemInputParameters` (e.g., height, width, depth, material type).
    * Define its `CatalogueItemBomItem`s, including appropriate `itemLogicScript` for calculating plank dimensions and hardware quantities.

### Phase 1: MVP - Document Generation for "Simple Box" Model

**Goal:** Implement the generation of all specified documents for a single "simple box" `ProjectCatalogueItemInstance`.

* **Task 1.1: Implement InputQA CSV Generation**
  * **Service:** `CatalogueOutputService`.
  * **Logic:** Fetch `ProjectCatalogueItemInstance` and its `CatalogueItemDefinition` with `CatalogueItemInputParameters`. Format parameter names and their runtime values as CSV.
  * **Output:** CSV file, stored via `FileService` (or new `GeneratedDocument` model).

* **Task 1.2: Finalize/Verify Plank List CSV Generation**
  * **Service:** `PlankListGeneratorService` (within the catalogue module).
  * **Logic:** Ensure the existing CSV output for plank lists (based on resolved BOM from `RuleService`) is robust and meets requirements.
  * **Output:** CSV file.

* **Task 1.3: Implement Pressing List CSV Generation**
  * **Service:** `CatalogueOutputService`.
  * **Logic:** Based on the resolved BOM for the "simple box", extract panel details (e.g., PanelID, MaterialCode, PlyThickness, LaminateCodes, FinalThickness). Format as CSV.
  * **Output:** CSV file.
  * **Clarification Needed:** Precise definition of "pressing list" items and their derivation from BOM.

* **Task 1.4: Implement OutputQA CSV Generation**
  * **Service:** `CatalogueOutputService`.
  * **Logic:** Generate a CSV template with check items (e.g., "Overall Height"), expected values (from resolved BOM), and empty columns for "ActualValue" and "Status".
  * **Output:** CSV file.
  * **Clarification Needed:** Standard QA check items for a "simple box".

* **Task 1.5: Implement Cutlist PDF Generation (MVP)**
  * **Service:** `CatalogueOutputService`, using `PdfGenerationService`.
  * **Logic:**
    * Get resolved planks for the "simple box".
    * **MVP Nesting:** For the "simple box" MVP, create a simple HTML template to visually arrange its (few) planks on a scaled 8x4 sheet representation. No complex algorithm for this iteration. If too complex, list planks with dimensions.
    * Convert HTML to PDF.
  * **Output:** PDF file.

* **Task 1.6: Implement Planklabel PDF Generation**
  * **Service:** `CatalogueOutputService`, using `PdfGenerationService`.
  * **Logic:**
    * Get resolved planks.
    * Create an HTML template for a single plank label (Project ID, Model Name, Plank ID, Dimensions, Material, Edge Banding).
    * Generate an HTML page repeating this label for each plank, formatted for printing (multiple labels per page).
    * Convert HTML to PDF.
  * **Output:** PDF file.

* **Task 1.7: Implement Installation Guide PDF Generation (MVP)**
  * **Service:** `CatalogueOutputService`, using `PdfGenerationService`.
  * **Logic:**
    * For MVP, use a pre-written HTML/Markdown template associated with the "simple box" `CatalogueItemDefinition`.
    * Convert this template to PDF. Dynamic content can be added later.
  * **Output:** PDF file.
  * **Clarification Needed:** Source/management of installation guide content/templates.

* **Task 1.8: UI Integration for Document Generation**
  * **Description:** Add UI elements (e.g., buttons) on the relevant frontend page (e.g., project details page showing a "simple box" instance) to trigger the generation and download of these documents.
  * **Action:** Modify frontend components to call the new backend API endpoints for document generation.

* **Task 1.9: Testing**
  * **Description:** Thoroughly test the generation of all documents for the "simple box" model, verifying content, format, and download functionality.

---
*This document will be updated as the project evolves and the roadmap is refined.*
