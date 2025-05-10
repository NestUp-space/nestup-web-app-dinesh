# Long-Term Memory Index (Project Specific: Nestup Web App)

This index helps navigate key documents and insights specific to the Nestup Web App project.

## Core Project Documentation
- [Project Context and Roadmap](PROJECT_CONTEXT_AND_ROADMAP.md) (To be populated/updated by user)
- [Business Context & User Journeys](BUSINESS_CONTEXT.md)
- [Guardrails & Coding Standards](GUARDRAILS.md)
- [Decision Log](DECISION_LOG.md)
- [History Log](HISTORY_LOG.md) (To be populated with significant events)
- [History of Cline's Core Instructions](INSTRUCTION_HISTORY/)

## Key Architectural Decisions
- [Unified User Model (2025-05-10)](DECISION_LOG.md#Decision_UnifiedUserModel_20250510)
- [Dynamic & Scriptable Catalogue System (2025-05-10)](DECISION_LOG.md#Decision_DynamicCatalogueSystem_20250510)
- [Use of JSON for Extensible Metadata (2025-05-10)](DECISION_LOG.md#Decision_JsonForExtensibleMetadata_20250510)
- [Backend Technology Stack (Express, Prisma) (2025-05-10)](DECISION_LOG.md#Decision_BackendStack_ExpressPrisma_20250510)
- [Authentication Stack (JWT, Bcrypt) (2025-05-10)](DECISION_LOG.md#Decision_AuthStack_JWT_Bcrypt_20250510)
- [File Storage with AWS S3 (2025-05-10)](DECISION_LOG.md#Decision_AWSS3_FileUploads_20250510)
- [Observation: Dual ORM Usage (Prisma/Sequelize) (2025-05-10)](DECISION_LOG.md#Decision_DualORM_SequelizePrisma_Investigate_20250510)
- [Frontend Technology Stack (Next.js, Tailwind, Radix) (2025-05-10)](DECISION_LOG.md#Decision_FrontendStack_NextJS_Tailwind_Radix_20250510)
- [Observation: Frontend Drizzle ORM Usage (2025-05-10)](DECISION_LOG.md#Decision_Frontend_DrizzleORM_Usage_Investigate_20250510)
- [Observation: Dual Date Libraries (Moment.js, date-fns) in Frontend (2025-05-10)](DECISION_LOG.md#Decision_DualDateLibraries_MomentDateFns_20250510)
- [Environment Variable Management with Dotenv (2025-05-10)](DECISION_LOG.md#Decision_EnvVarManagement_Dotenv_20250510)
- [JWT Payload Structure for Authentication (2025-05-10)](DECISION_LOG.md#Decision_Auth_JWTClaims_20250510)
- [Default State for New User Registration (2025-05-10)](DECISION_LOG.md#Decision_Auth_NewUserDefaults_20250510)
- [Controller Input Validation with Zod & ServiceResponse Pattern (2025-05-11)](DECISION_LOG.md#Decision_AuthController_ZodValidation_ServiceResponse_20250511)
- [Project Creation Defaults & Authorization Logic (2025-05-11)](DECISION_LOG.md#Decision_ProjectCreation_DefaultsAndAuth_20250511) <!-- Relates to active nested ProjectController -->
- [Service-Layer DTO Transformation for API Responses (2025-05-11)](DECISION_LOG.md#Decision_ServiceLayerDTOTransformation_20250511) <!-- Relevant for active nested controllers -->
- [BIM Controller OpenAPI Documentation & Direct Subtask Update (2025-05-11)](DECISION_LOG.md#Decision_BimController_OpenAPI_SubtaskUpdate_20250511)
- [File Upload Handling with Multer & Task Association (2025-05-11)](DECISION_LOG.md#Decision_FileController_Multer_TaskAssociation_20250511)
- [Material Controller using Centralized Response Handler (2025-05-11)](DECISION_LOG.md#Decision_MaterialController_UtilHelper_ServiceResponse_20250511)
- [Role Controller Direct Prisma Usage & Static Methods (2025-05-11)](DECISION_LOG.md#Decision_RoleController_DirectPrisma_Static_20250511)
- [Site Visit Booking with Custom Errors & Service Layer (2025-05-11)](DECISION_LOG.md#Decision_SiteVisitBooking_CustomErrors_Next_20250511)
- [Site Visit Box CSV Generation in Controller (2025-05-11)](DECISION_LOG.md#Decision_SiteVisitBox_CSVInController_20250511)
- [User Controller Static Methods & Service Delegation (2025-05-11)](DECISION_LOG.md#Decision_UserController_Static_Service_20250511)
- [User Controller Authorization Checks & Logic Review (2025-05-11)](DECISION_LOG.md#Decision_UserController_AuthChecks_FlawedLogic_20250511)
- [Active Project/Task/Subtask Controllers Confirmed (Nested Class-Based) (2025-05-11)](DECISION_LOG.md#Decision_DuplicateProjectControllerLogic_ConfirmedActiveNested_20250511)

## Context Snapshots & Analyses
- [Data Model Overview & Prisma Schema Analysis (2025-05-10)](CONTEXT_SNAPSHOTS/2025-05-10_PrismaSchema_DataModelOverview.md)
- [Backend Technology Stack Overview (from package.json) (2025-05-10)](CONTEXT_SNAPSHOTS/2025-05-10_BackendTechStack_PackageJsonAnalysis.md)
- [Frontend Technology Stack Overview (from package.json) (2025-05-10)](CONTEXT_SNAPSHOTS/2025-05-10_FrontendTechStack_PackageJsonAnalysis.md)
- [Backend Configuration Analysis (env.ts) (2025-05-10)](CONTEXT_SNAPSHOTS/2025-05-10_BackendConfigAnalysis.md)
- [Authentication Service (auth.service.ts) Analysis (2025-05-10)](CONTEXT_SNAPSHOTS/2025-05-10_AuthServiceAnalysis.md)
- [Authentication Controller (auth.controller.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_AuthControllerAnalysis.md)
- [Authentication Routes (auth.routes.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_AuthRoutesAnalysis.md)
- [Project Controllers Analysis (Top-Level Functional [Inactive] & Active Nested Class-Based) (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_ProjectControllerAnalysis.md) <!-- Retaining this, as it now contains info on both -->
- [BIM Controller (bim.controller.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_BimControllerAnalysis.md)
- [BIM Routes (bim.routes.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_BimRoutesAnalysis.md)
- [File Controller (file.controller.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_FileControllerAnalysis.md)
- [File Routes (file.routes.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_FileRoutesAnalysis.md)
- [Material Controller (material.controller.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_MaterialControllerAnalysis.md)
- [Material Routes (material.routes.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_MaterialRoutesAnalysis.md)
- [Role Controller (role.controller.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_RoleControllerAnalysis.md)
- [Role Routes (role.routes.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_RoleRoutesAnalysis.md)
- [Site Visit Controller (siteVisit.controller.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_SiteVisitControllerAnalysis.md)
- [Site Visit Routes (site-visit.routes.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_SiteVisitRoutesAnalysis.md)
- [Site Visit Box Controller (siteVisitBox.controller.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_SiteVisitBoxControllerAnalysis.md)
- [Site Visit Box Routes (siteVisitBox.routes.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_SiteVisitBoxRoutesAnalysis.md)
- [User Controller (user.controller.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_UserControllerAnalysis.md)
- [User Routes (user.routes.ts) Analysis (2025-05-11)](CONTEXT_SNAPSHOTS/2025-05-11_UserRoutesAnalysis.md)
<!-- MBK links for nested project controllers will be added once their MBKs are confirmed/created -->

## Generic Knowledge Base
- [Link to Generic Knowledge Base Index](GENERIC_KNOWLEDGE_BASE/INDEX.md)

*(This index will be updated as more LTM entries are created.)*
