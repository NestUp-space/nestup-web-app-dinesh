# Project Decision Log

This log archives significant architectural and design decisions made throughout the project lifecycle.

---

## Decision_UnifiedUserModel_20250510

**Date:** 2025-05-10
**Decision:** Adopted a unified `User` model for both internal employees and external clients, with differentiation managed by the `UserRole` relationship.
**Rationale (Inferred):** This approach simplifies user identity management, authentication, and referencing across various parts of the application (e.g., project assignments, task updates, comments). It avoids data duplication and allows for consistent handling of user-related operations. Specific permissions and access levels are managed through the RBAC system linked to `UserRole`.
**Impacted Areas:** User management, authentication, authorization, project roles, team structures, client interactions.
**Related LTM:**
    - `CONTEXT_SNAPSHOTS/2025-05-10_PrismaSchema_DataModelOverview.md`

---

## Decision_Auth_JWTClaims_20250510

**Date:** 2025-05-10
**Decision:** JWT payload for authenticated users in Nestup Web App includes `id`, `email`, `name`, and `role.roleType`.
**Rationale (Inferred):** These claims provide essential user identification and role information directly in the token, potentially reducing database lookups for common authorization checks in downstream services or middleware. `roleType` is used for consistency in role checking.
**Impacted Areas:** JWT generation (`auth.service.ts`), JWT validation (middleware), any service relying on token claims for user data or authorization.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-10_AuthServiceAnalysis.md`

---

## Decision_AuthController_ZodValidation_ServiceResponse_20250511

**Date:** 2025-05-11
**Decision:** Backend controllers (exemplified by `auth.controller.ts`) will use Zod for input validation of request bodies and will rely on a standardized `ServiceResponse` object from the service layer to formulate HTTP responses.
**Rationale (Inferred):** Zod provides robust, type-safe validation and clear error reporting. Using a common `ServiceResponse` pattern from services ensures consistent response structures and status code handling in controllers, promoting separation of concerns (business logic in services, HTTP handling in controllers).
**Impacted Areas:** All backend controllers, service layer design, API error handling and response consistency.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_AuthControllerAnalysis.md`

---

## Decision_ProjectCreation_DefaultsAndAuth_20250511

**Date:** 2025-05-11
**Decision:** Project creation (`createProject` controller) enforces that 'client' role users cannot create projects. It also implements server-side defaulting for several project fields (e.g., address, location, sqft, statusId) if not provided in the request. `createdById` is automatically set from the authenticated user.
**Rationale (Inferred):** Role restriction prevents unauthorized project creation. Server-side defaults ensure essential fields have values, potentially simplifying frontend forms or handling cases where not all data is initially available. Auto-setting `createdById` ensures auditability.
**Impacted Areas:** Project creation API, frontend forms for project creation, user role permissions.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_ProjectControllerAnalysis.md` (Note: This snapshot refers to the top-level functional controller, which is now understood to be largely inactive for these routes. The active logic is in the nested class-based `ProjectController`).

---

## Decision_BimController_OpenAPI_SubtaskUpdate_20250511

**Date:** 2025-05-11
**Decision:** The `BimController` uses JSDoc comments for OpenAPI documentation. The `generatePlankListAndUpdateSubtask` endpoint directly calls `SubtaskRepository.update()` to mark a subtask as complete and store the generated plank list in its metadata.
**Rationale (Inferred):** OpenAPI comments facilitate API documentation generation. Direct repository call for subtask update might be for simplicity in this specific workflow, though typically service layers handle such updates. Storing generated data in subtask metadata links the output directly to the relevant task.
**Impacted Areas:** BIM functionality, API documentation, Subtask data model (`metadataJson` usage), service layer responsibilities.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_BimControllerAnalysis.md`

---

## Decision_FileController_Multer_TaskAssociation_20250511

**Date:** 2025-05-11
**Decision:** File uploads are handled by `file.controller.ts` via a `POST /upload` route, and file retrieval by a `GET /:taskId` route, both protected by `isAuthenticated` middleware. The controller expects `req.file` (populated by Multer) for uploads and `req.body.taskId`.
**Rationale (Inferred):** Standard approach for file management. The `file.routes.ts` file itself does not explicitly show Multer middleware being applied to the `/upload` route; this configuration must exist where the file router is mounted or be added directly to the route definition for the controller to function as expected.
**Impacted Areas:** File upload functionality, task management, API design for file operations, middleware configuration for file routes.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_FileControllerAnalysis.md`, `CONTEXT_SNAPSHOTS/2025-05-11_FileRoutesAnalysis.md`

---

## Decision_MaterialRoutes_PublicAccess_20250511

**Date:** 2025-05-11
**Decision/Observation:** Material routes defined in `material.routes.ts` are currently public as the `authMiddleware` (presumably `isAuthenticated`) is commented out. This contrasts with OpenAPI documentation within the same file which lists 401 Unauthorized as a possible response for these routes.
**Rationale (To Investigate):** This might be an oversight, a temporary state during development, or intentional if materials are meant to be publicly queryable in some contexts (though CRUD operations being public is less common and a security risk). The discrepancy with OpenAPI docs suggests authentication was likely intended.
**Impacted Areas:** API security for material data, consistency with documentation, potential unauthorized access to material CRUD operations.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_MaterialRoutesAnalysis.md`, `CONTEXT_SNAPSHOTS/2025-05-11_MaterialControllerAnalysis.md`

---

## Decision_SiteVisitBoxRoutes_PublicAccess_20250511

**Date:** 2025-05-11
**Decision/Observation:** Site Visit Box routes defined in `siteVisitBox.routes.ts` are currently public as the `authMiddleware` is commented out. This includes routes for creating, reading, updating, deleting, reordering boxes, and generating/downloading plank lists. OpenAPI documentation for these routes lists 401 Unauthorized as a possible response, suggesting authentication was likely intended.
**Rationale (To Investigate):** This could be an oversight or a temporary state during development. Given the nature of the data (site-specific configurations, potentially sensitive project details in plank lists), these routes should typically require authentication.
**Impacted Areas:** API security for site visit box data and generated outputs, consistency with documentation.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_SiteVisitBoxRoutesAnalysis.md`, `CONTEXT_SNAPSHOTS/2025-05-11_SiteVisitBoxControllerAnalysis.md`

---

## Decision_MaterialController_UtilHelper_ServiceResponse_20250511

**Date:** 2025-05-11
**Decision:** The `MaterialController` utilizes a common utility function `handleServiceResponse` to process `ServiceResponse` objects from the `materialService` and send standardized HTTP responses. DTOs for material data (`CreateMaterialDto`, `UpdateMaterialDto`) are sourced from `../bim/types/bim.types`.
**Rationale (Inferred):** `handleServiceResponse` promotes DRY principles and consistent HTTP response formatting across controllers. Sourcing DTOs from `bim/types` might be historical or indicate a close relationship between general materials and BIM-defined material properties; this could be reviewed for better DTO organization if materials are a broader concept.
**Impacted Areas:** Material CRUD API, HTTP response handling consistency, DTO organization.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_MaterialControllerAnalysis.md`

---

## Decision_RoleController_DirectPrisma_Static_20250511

**Date:** 2025-05-11
**Decision:** The `RoleController` uses static methods and interacts directly with a locally instantiated Prisma client for all role and permission management logic, without a dedicated service layer. It includes protections for the 'superadmin' role and checks for user assignments before role deletion.
**Rationale (Inferred):** Direct Prisma usage might have been chosen for simplicity or expediency for this specific CRUD module. Static methods might be a stylistic choice. Superadmin protection and deletion constraints are important for system integrity. The local Prisma client instance is a deviation from the shared instance pattern and should be reviewed for potential connection pooling issues.
**Impacted Areas:** Role and permission management API, RBAC system, database interaction patterns (deviation from service layer pattern seen elsewhere), database connection management.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_RoleControllerAnalysis.md`

---

## Decision_SiteVisitBooking_CustomErrors_Next_20250511

**Date:** 2025-05-11
**Decision:** The `bookSiteVisit` controller in `siteVisit.controller.ts` uses custom error classes (`BadRequestError`, `NotFoundError`) for specific error responses and delegates core logic to `siteVisit.service`. It calls `next(error)` in its catch block, potentially after a response has already been sent.
**Rationale (Inferred):** Custom errors allow for more structured error handling from services. The `next(error)` call after `res.json()` might be an oversight or intended for a global error logging middleware that can accommodate scenarios where headers might have already been sent; this pattern should be reviewed for consistency with Express error handling best practices. The endpoint appears unauthenticated, suitable for public booking forms.
**Impacted Areas:** Site visit booking API, error handling consistency, global error middleware behavior, public-facing API design.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_SiteVisitControllerAnalysis.md`

---

## Decision_SiteVisitBox_CSVInController_20250511

**Date:** 2025-05-11
**Decision:** The `SiteVisitBoxController`'s `downloadPlankListCsv` method directly generates CSV content from data retrieved via `siteVisitBoxService`. DTOs (`CreateSiteVisitBoxDto`, `UpdateSiteVisitBoxDto`) are sourced from `../bim/types/bim.types`. An imported `formatCutListAsCsv` utility is not used in this specific CSV download method.
**Rationale (Inferred):** Direct CSV generation in the controller might have been implemented for expediency or specific formatting requirements for this endpoint. Sourcing DTOs from `bim/types` continues a pattern seen with `MaterialController`. The unused import might be a remnant or intended for other, perhaps more complex, CSV generation tasks.
**Impacted Areas:** Site Visit Box API (CSV download functionality), separation of concerns (presentation logic in controller), DTO organization, potential code duplication if CSV formatting is needed elsewhere.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_SiteVisitBoxControllerAnalysis.md`

---

## Decision_DuplicateProjectControllerLogic_ConfirmedActiveNested_20250511

**Date:** 2025-05-11
**Decision/Observation:** Analysis of `backend/src/routes/project.routes.ts` confirms that the **nested, class-based controllers** in `backend/src/controllers/project/` (i.e., `project.controller.ts`, `task.controller.ts`, and `subtask.controller.ts` within that directory) are the **active handlers** for project, task, and subtask CRUD operations. The top-level functional controller `backend/src/controllers/project.controller.ts` is **not used** for these primary routes and is considered legacy or inactive in this context.
**Rationale (Confirmed):** Route definitions explicitly import and use the nested controllers. This resolves the ambiguity about which controller set is authoritative.
**Impacted Areas:** API routing for projects, tasks, and subtasks; code maintainability (identifies unused code in the top-level functional controller); developer understanding of active controller responsibilities. The previously noted differences in logic (e.g., `updatedById` handling, `updateSubtask` service calls) between the top-level and nested controllers are now understood in the context of the nested controllers being the active ones.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_ProjectControllerAnalysis.md` (Note: This snapshot primarily details the inactive top-level controller but now includes a prominent note about the active nested controllers). MBKs for nested controllers should be prioritized.

---

## Decision_UserController_Static_Service_20250511

**Date:** 2025-05-11
**Decision:** The `UserController` is implemented with static methods and delegates all operations to a static `UserService`. It defines a local `CustomRequest` type where `req.user.role` is a string, which is inconsistent with the global `CustomRequest` from `auth.middleware.ts` (where `req.user.role` is an object `{ id: number; roleType: string; }`).
**Rationale (Inferred):** Static methods might be a stylistic choice for utility-like controllers or services. The local `CustomRequest` inconsistency is likely an oversight or from a different phase of development and should be reconciled for type safety and clarity.
**Impacted Areas:** User management API, authentication/authorization consistency, potential type errors if middleware and controller expectations for `req.user` diverge.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_UserControllerAnalysis.md`

---

## Decision_UserController_AuthChecks_FlawedLogic_20250511

**Date:** 2025-05-11
**Decision:** `UserController.updateUserPassword` includes an authorization check allowing only 'superadmin' or 'admin' roles (string comparison based on its local `CustomRequest.user.role` type) to proceed. `UserController.toggleUserActiveStatus` has a check intended to protect the 'superadmin' role, but its logic (`if (!user || user.role.roleType !== 'superadmin')`) appears flawed for this purpose and might incorrectly forbid action or misreport errors (e.g., returning 403 FORBIDDEN if user is not found, instead of 404).
**Rationale (Inferred):** Role-based restrictions are necessary for sensitive operations. The flawed logic in `toggleUserActiveStatus` is likely an implementation error requiring correction. The string-based role check in `updateUserPassword` depends on the local `CustomRequest` definition.
**Impacted Areas:** User password update security, user status management, superadmin account protection, error reporting consistency.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_UserControllerAnalysis.md`

---

## Decision_ServiceLayerDTOTransformation_20250511

**Date:** 2025-05-11
**Decision:** Services (e.g., `projectService`, `taskService`, `subtaskService`) provide DTO transformation methods (e.g., `transformToResponseDto`) which are utilized by controllers (`project.controller.ts` - referring to the active nested one) to format data before sending HTTP responses.
**Rationale (Inferred):** Centralizes response formatting logic within the service layer, ensuring consistency and keeping controllers thinner. This pattern helps decouple the internal data representation from the API response structure.
**Impacted Areas:** All services that return data to controllers, all controllers that send entity data in responses, API contract consistency.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-11_ProjectControllerAnalysis.md` (and individual nested controller analyses if created separately).

---

## Decision_Auth_NewUserDefaults_20250510

**Date:** 2025-05-10
**Decision:** New users registered via `auth.service.ts` in Nestup Web App default to `roleId: 1` (assumed 'client'), `verified: false`, and `isActive: true`.
**Rationale (Inferred):** Simplifies initial registration flow, assuming most new sign-ups are clients. `isActive: true` allows immediate login post-registration (though email verification is planned). `verified: false` allows for a subsequent email verification step. The hardcoded `roleId` is noted as a temporary measure needing robust implementation.
**Impacted Areas:** User registration process, default user state, future implementation of role assignment and email verification.
**Related LTM:** `CONTEXT_SNAPSHOTS/2025-05-10_AuthServiceAnalysis.md`

---

## Decision_EnvVarManagement_Dotenv_20250510

**Date:** 2025-05-10
**Decision:** Backend configuration parameters (like database credentials and JWT secret) are managed via environment variables, loaded using the `dotenv` library from a `.env` file.
**Rationale (Inferred):** Standard practice for security (keeping secrets out of code) and for environment-specific configurations (dev, staging, prod). `dotenv` simplifies local development. Non-null assertions (`!`) in `env.ts` imply these are mandatory.
**Impacted Areas:** Application startup, database connection, authentication services, deployment configuration.
**Related LTM:**
    - `CONTEXT_SNAPSHOTS/2025-05-10_BackendConfigAnalysis.md`

---

## Decision_FrontendStack_NextJS_Tailwind_Radix_20250510

**Date:** 2025-05-10
**Decision:** The frontend for Nestup Web App is built using Next.js (React framework) with Tailwind CSS for styling, complemented by Radix UI primitives for accessible components. React Hook Form is used for forms, and SWR for data fetching.
**Rationale (Inferred):** Next.js provides a robust framework for modern React development (SSR, SSG, routing). Tailwind CSS allows for rapid UI development with utility classes. Radix UI ensures accessibility. React Hook Form and SWR are popular, performant choices for their respective tasks.
**Impacted Areas:** Entire frontend architecture, UI/UX development, data fetching patterns, form handling.
**Related LTM:**
    - `CONTEXT_SNAPSHOTS/2025-05-10_FrontendTechStack_PackageJsonAnalysis.md`

---

## Decision_Frontend_DrizzleORM_Usage_Investigate_20250510

**Date:** 2025-05-10
**Decision/Observation:** The frontend `package.json` includes Drizzle ORM and Neon serverless driver dependencies.
**Rationale (To Investigate):** This suggests a potential data persistence layer managed or accessed directly from the frontend/edge environment (e.g., via Vercel Functions, Vercel KV, or for specific features). This is distinct from the backend's Prisma/PostgreSQL setup and warrants understanding its specific role and interaction (if any) with the main backend.
**Impacted Areas:** Frontend data handling, potential edge functions, overall data architecture if there's a split in data sources.
**Related LTM:**
    - `CONTEXT_SNAPSHOTS/2025-05-10_FrontendTechStack_PackageJsonAnalysis.md`

---

## Decision_DualDateLibraries_MomentDateFns_20250510

**Date:** 2025-05-10
**Decision/Observation:** Both `moment` and `date-fns` are present in frontend dependencies.
**Rationale (To Investigate):** This could indicate a transition from `moment` (larger, legacy) to `date-fns` (smaller, modern, immutable), or different libraries being used in different parts of the codebase or by different sub-dependencies. Aiming for a single date library is usually preferable for consistency and bundle size.
**Impacted Areas:** Date/time handling throughout the frontend, bundle size, potential for inconsistencies.
**Related LTM:**
    - `CONTEXT_SNAPSHOTS/2025-05-10_FrontendTechStack_PackageJsonAnalysis.md`

---

## Decision_BackendStack_ExpressPrisma_20250510

**Date:** 2025-05-10
**Decision:** The backend for Nestup Web App is built using Express.js as the web framework and Prisma ORM with PostgreSQL for database interaction. Zod is used for data validation.
**Rationale (Inferred):** Express.js offers a minimalist and flexible foundation. Prisma provides strong typing, an intuitive query API, and robust migration management. Zod ensures data integrity with clear schema definitions. This combination allows for rapid development while maintaining type safety and data consistency.
**Impacted Areas:** Entire backend architecture, API development, database design, data validation strategies.
**Related LTM:**
    - `CONTEXT_SNAPSHOTS/2025-05-10_BackendTechStack_PackageJsonAnalysis.md`

---

## Decision_AuthStack_JWT_Bcrypt_20250510

**Date:** 2025-05-10
**Decision:** Authentication is implemented using JSON Web Tokens (JWTs) with bcrypt for password hashing. Standard security middleware like Helmet and CORS are employed.
**Rationale (Inferred):** JWTs are a common standard for stateless authentication in APIs. Bcrypt is a strong hashing algorithm. Helmet and CORS provide essential security layers for web applications.
**Impacted Areas:** User authentication, API security, session management.
**Related LTM:**
    - `CONTEXT_SNAPSHOTS/2025-05-10_BackendTechStack_PackageJsonAnalysis.md`

---

## Decision_AWSS3_FileUploads_20250510

**Date:** 2025-05-10
**Decision:** AWS S3 is utilized for file storage, accessed via the AWS SDK. Multer is used for handling file uploads in Express.
**Rationale (Inferred):** S3 provides scalable, durable, and cost-effective object storage, suitable for user-uploaded files and potentially generated assets like plank lists.
**Impacted Areas:** File upload functionality, storage architecture, any feature involving persistent file assets.
**Related LTM:**
    - `CONTEXT_SNAPSHOTS/2025-05-10_BackendTechStack_PackageJsonAnalysis.md`

---

## Decision_DualORM_SequelizePrisma_Investigate_20250510

**Date:** 2025-05-10
**Decision/Observation:** The presence of both Sequelize and Prisma ORM dependencies in `backend/package.json` is noted.
**Rationale (To Investigate):** This could indicate a transition phase from Sequelize to Prisma, or Sequelize might be used for specific legacy components or different database interactions. This needs clarification to understand the current data access strategy fully.
**Impacted Areas:** Database interaction layer, ORM usage consistency, developer onboarding.
**Related LTM:**
    - `CONTEXT_SNAPSHOTS/2025-05-10_BackendTechStack_PackageJsonAnalysis.md`

---

## Decision_DynamicCatalogueSystem_20250510

**Date:** 2025-05-10
**Decision:** Implemented a dynamic and scriptable Catalogue System. This system comprises `CatalogueItemDefinition` (templates), `CatalogueItemInputParameter` (configurable inputs), `CatalogueItemBomItem` (bill of materials with `itemLogicScript` for custom calculations), and `ProjectCatalogueItemInstance` (project-specific instances with `runtimeInputsJson`).
**Rationale (Inferred):** To provide maximum flexibility in defining complex, configurable project components (e.g., furniture, assemblies) without hardcoding specific item types. The scriptable nature of BOM items allows for dynamic property calculation, catering to diverse manufacturing needs and enabling features like automated plank list generation. This is a foundational element for the application's customization and automation capabilities.
**Impacted Areas:** Core product definition, project configuration, manufacturing output generation, Bill of Materials management, potentially costing and inventory.
**Related LTM:**
    - `CONTEXT_SNAPSHOTS/2025-05-10_PrismaSchema_DataModelOverview.md`

---

## Decision_JsonForExtensibleMetadata_20250510

**Date:** 2025-05-10
**Decision:** Utilized `Json` data type for various metadata fields (e.g., `Task.metadataJson`, `Subtask.metadataJson`, `SiteVisitBox.inputs`, `ProjectCatalogueItemInstance.runtimeInputsJson`, `CatalogueItemInputParameter.options`).
**Rationale (Inferred):** To allow for storing flexible, entity-specific structured data without requiring frequent database schema migrations. This enhances adaptability for diverse task types, catalogue item configurations, and other entities needing custom attributes, promoting extensibility.
**Impacted Areas:** Task management, catalogue system, site visit configurations, any system component requiring adaptable structured data.
**Related LTM:**
    - `CONTEXT_SNAPSHOTS/2025-05-10_PrismaSchema_DataModelOverview.md`

---

## Decision_S3BucketStructure_GeneratedDocuments_20250511

**Date:** 2025-05-11
**Decision:** The S3 bucket structure for storing generated files will be:

* Production Documents: `s3://<your-bucket-name>/projects/{projectId}/documents/production/{documentType}/{fileName}`
* Financial Documents: `s3://<your-bucket-name>/projects/{projectId}/documents/financial/{documentType}/{fileName}`
Where `{documentType}` can be a subfolder (e.g., `planklabels`, `cutlists`, `invoices`) for further organization.
**Rationale:** This structure provides clear organization by project, then by general category (production/financial), and then by specific document type. This facilitates easier browsing, access control (if needed at these levels), and management of generated files. Using `{fileName}` allows for unique identification of each document.
**Impacted Areas:** File storage logic (`FileService` or equivalent), `ModelOutputService` (when saving files), any feature that generates and stores documents to S3.
**Related LTM:** `docs/PROJECT_CONTEXT_AND_ROADMAP.md` (references S3 usage).

---

## Decision_TSConfig_NodeTypes_20250511

**Date:** 2025-05-11
**Decision:** Added `"node"` to the `compilerOptions.types` array in `backend/tsconfig.json`.
**Rationale:** Resolved a TypeScript error ("Cannot find name 'process'") in `backend/prisma/seed.ts`. The `types` array was previously `["vitest/globals"]`, which restricted TypeScript from recognizing Node.js global types even though `@types/node` was installed. Explicitly adding "node" makes these types available.
**Impacted Areas:** TypeScript compilation and type-checking for the backend, specifically for files relying on Node.js globals like `process` (e.g., `prisma/seed.ts`).
**Related LTM:** None directly, but relates to overall backend TypeScript configuration
---

## Decision_CatalogueItemImageUploadAPI_20250511

**Date:** 2025-05-11
**Decision:** Implemented backend API for Catalogue Item (ModelDefinition) image uploads.
    1. Added route `POST /catalogue/:modelId/image-upload` to `backend/src/catalogue/routes/model.routes.ts`.
    2. Secured route with `isAuthenticated` middleware.
    3. Used `multer` for `multipart/form-data` handling (field name 'catalogueImage', memory storage, image file filter).
    4. Added `uploadModelImage(modelId: string, file: Express.Multer.File)` method to `backend/src/catalogue/services/model.service.ts`.
    5. Service method uses `uploadToS3` utility for S3 storage and updates `ModelDefinition.imageUrl`.
**Rationale:** Provides a dedicated and secure endpoint for managing catalogue item images, integrating with existing S3 infrastructure and service patterns.
**Impacted Areas:** Catalogue item management, backend API for catalogue, S3 storage for images.
**Related LTM:** `backend/src/catalogue/routes/model.routes.ts`, `backend/src/catalogue/services/model.service.ts`
---

## Decision_PlankLogicUI_Evolution_20250513

**Date:** 2025-05-13
**Decision:** Iteratively refined the UI for defining plank calculation logic within the Model Builder.
    1.  **Initial Enhancement:** `CollapsibleVariables.tsx` improved for clarity. Default logic scripts updated in `plankScripts.ts`. `BillOfMaterialListEditor.tsx` set to auto-populate standard planks. `PlankLogicEditor.tsx` initially showed the full `itemLogicScript`.
    2.  **Reversion to Individual Fields:** `PlankLogicEditor.tsx` was changed to use three separate `LogicInput.tsx` instances for Width, Length, and Material Code, pre-filled with default JavaScript. This was due to user feedback on the complexity of editing full scripts.
    3.  **Introduction of `ExpressionInput.tsx`:** A new component, `ExpressionInput.tsx`, was created to replace `LogicInput.tsx` for these calculation fields. It offers a more user-friendly text area with a "Format" button, a "Show/Hide Code" toggle (with syntax highlighting for the preview), and clickable variable chips.
**Rationale:** To significantly improve the user experience for defining complex calculation logic by abstracting direct JavaScript interaction while still providing transparency and control. This iterative approach responded to user feedback to find a balance between power and ease of use.
**Impacted Areas:** `frontend/src/components/dashboard/model-management/` (specifically `PlankLogicEditor.tsx`, `CollapsibleVariables.tsx`, `BillOfMaterialListEditor.tsx`, `LogicInput.tsx`, and the new `ExpressionInput.tsx`), `frontend/src/components/dashboard/model-management/templates/plankScripts.ts`.
**Related LTM:** `CURRENT_CONTEXT.md` (for 2025-05-13), `CURRENT_TODO.md` (for 2025-05-13)
---

## Decision_PlankLogicFix_BasicBox_20250520

**Date:** 2025-05-20
**Decision:** Corrected the plank generation logic in `Reference/BasicBox.yaml` to align with `Reference/TestCase.yaml`.
**Rationale:** The existing logic strings for calculating plank dimensions (`plankWidthLogic`, `plankHeightLogic`) and material codes (`plankMaterialCodeLogic`) in `Reference/BasicBox.yaml` did not produce the expected outputs as defined in `Reference/TestCase.yaml`. The corrections involved:
    1.  Adding `backPanelGrooveDepth: 10` to `modelScopedVariables` for use in calculations.
    2.  Ensuring that material properties (e.g., `.thickness`, `.Outerlaminate`) are correctly accessed from the (assumed to be parsed by the execution engine) input material code objects (e.g., `exposeMaterialCode`, `innerMaterialCode`).
    3.  Applying the correct edge banding thicknesses (`exposeEdgeBandingThickness: 2`, `innerEdgeBandingThickness: 1`) based on plank adjacency and specific panel requirements.
    4.  Adjusting calculations for Top and Bottom panels to account for the `backPanelGrooveDepth`.
    5.  Ensuring `plankMaterialCodeLogic` assigns the specific laminate string (e.g., `exposeMaterialCode.Outerlaminate`) rather than the entire material object.
The updated logic was manually verified against `Reference/TestCase.yaml` and all calculations matched.
**Impacted Areas:** Plank generation for the "Simple Box" model defined in `Reference/BasicBox.yaml`. Any system component that consumes this YAML to generate plank lists.
**Related LTM:** `Reference/BasicBox.yaml`, `Reference/TestCase.yaml`, `createModelSimpleBoxTest.js`, `docs/test_cases/simple_box_plank_calculation.md`.
**Cache Memory Snapshots:** `CURRENT_CONTEXT.md` (2025-05-20, 21:28), `CURRENT_DECISIONS.md` (20250520-005), `CURRENT_TODO.md` (2025-05-20, after this task).

---
