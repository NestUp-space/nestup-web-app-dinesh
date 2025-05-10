## LTM Bootstrapping Initiative (Parent Ticket: TICKET-LTM-001)

**Overall Goal:** Populate Long-Term Memory (LTM) by systematically analyzing the project codebase. This involves:
1.  Extracting non-redundant, high-value information: architectural decisions, design rationales, core business logic summaries, data model insights, and key integration points.
2.  Differentiating between **project-specific knowledge** (stored in `.long_term_memory/*`) and **generic/reusable learnings** (stored in `.long_term_memory/GENERIC_KNOWLEDGE_BASE/*`).
3.  Indexing this information effectively in the respective `INDEX.md` files.
4.  Potentially updating existing `.mbk` files if analysis reveals gaps or areas for improvement.
5.  Existing project source code and old ticket files will only be read for analysis and not modified (unless an `.mbk` file is updated).
6.  Ultimately, creating a `MEMORY_SYSTEM_BLUEPRINT.md` file to document this entire memory system.

**Current Focus:** Actively working on Sub-Task 7: Analyze `backend/src/controllers/` (Identify main API entry points and request flows).
**Last Completed Sub-Task:** Sub-Task 6: Analyze `backend/src/services/auth.service.ts`.
    - Created LTM Snapshot: `.long_term_memory/CONTEXT_SNAPSHOTS/2025-05-10_AuthServiceAnalysis.md`.
    - Added Decisions to Log (`.long_term_memory/DECISION_LOG.md`): `Decision_Auth_JWTClaims_20250510`, `Decision_Auth_NewUserDefaults_20250510`.
    - Added Generic Knowledge: "Token-Based Authentication Flow" to `DESIGN_PATTERNS_OBSERVED.md`; "Secure Password Handling" to `BEST_PRACTICES_LEARNED.md`.
    - Updated MBK: `backend/.memory_bank/TECHARCH.mbk` with more details on authentication. (No separate `auth.service.mbk` was created at this stage, pending deeper dive or if existing MBKs cover it sufficiently).
    - Updated Indexes: `.long_term_memory/INDEX.md` and `.long_term_memory/GENERIC_KNOWLEDGE_BASE/INDEX.md`.
**Next Sub-Task (from CURRENT_TODO.md):** Sub-Task 8: Analyze `frontend/src/services/` or `frontend/src/lib/api/` (Frontend data fetching logic).
**Notes for `backend/src/controllers/` analysis (Sub-Task 7):**
- List all controller files in `backend/src/controllers/` (and its subdirectories like `project/`).
- For each significant controller (e.g., `auth.controller.ts`, `project.controller.ts`, `catalogue/generation.controller.ts`):
    - Identify the main routes/endpoints it handles (often inferred from method names and decorators if using a framework like NestJS, or from route definitions if plain Express).
    - Note the primary HTTP methods used (GET, POST, PUT, DELETE).
    - Identify the main services it calls to fulfill requests.
    - Summarize the typical request flow for its key operations (e.g., Request -> Validation DTO -> Controller Method -> Service Call -> Service Response -> HTTP Response).
    - Note any specific request/response DTOs used (these might be defined in `dtos/` directory).
    - Identify any middleware used specifically by these controllers/routes (e.g., auth middleware, admin middleware).
- Consider if the organization of controllers (e.g., by feature, by resource) reveals an architectural pattern.
- Check if `TECHARCH.mbk` or other `.mbk` files adequately cover the API structure and controller responsibilities. Propose updates if needed.
- Propose entries for LTM (project-specific `CONTEXT_SNAPSHOTS` for an overview of API structure, `DECISION_LOG.md` if controller design reveals specific architectural choices) and Generic Knowledge Base (`DESIGN_PATTERNS_OBSERVED.md` for patterns like MVC/Controller-Service).
**Notes for `auth.service.ts` analysis (Sub-Task 6):**
- Read `backend/src/services/auth.service.ts`.
- Identify key public methods (e.g., `registerUser`, `loginUser`, `generateToken`, `verifyToken`, `hashPassword`, `comparePassword`).
- Summarize the logic for each key method:
    - How does registration handle existing users? Password hashing? Default role assignment?
    - How does login validate credentials? What information is included in the JWT payload?
    - What are the token expiry settings? Is there a refresh token mechanism (may not be visible in this service alone)?
- Note interactions with `User` model/repository (e.g., `userRepository.create`, `userRepository.findByEmail`).
- Identify security mechanisms used (e.g., bcrypt rounds for hashing, JWT algorithm, use of `JWT_SECRET` from env).
- Note error handling patterns (e.g., specific error types for invalid credentials, user not found).
- Determine if any logic represents a significant design decision (e.g., "Decision: JWT payload includes user ID, email, and role. Rationale: Minimizes DB lookups for common auth checks.") or a reusable pattern.
- Check if an `auth.service.mbk` exists. If so, compare its content. Propose updates to MBK or creation if it doesn't exist, focusing on detailed internal logic.
- Propose entries for LTM (project-specific `CONTEXT_SNAPSHOTS` for service overview, `DECISION_LOG.md` for key choices) and Generic Knowledge Base (`DESIGN_PATTERNS_OBSERVED.md` for token auth flow, `BEST_PRACTICES_LEARNED.md` for secure password handling).
**Notes for `TECHARCH.mbk` analysis (Sub-Task 5):**
- Read `TECHARCH.mbk`.
- Compare its content with the information gathered in LTM so far (Prisma schema, package.json analyses, config analyses).
- Identify:
    - Key architectural aspects already well-documented in `TECHARCH.mbk`.
    - Information in `TECHARCH.mbk` that might be outdated or could be clarified/expanded based on recent findings (e.g., ensuring all key technologies are listed, role of Catalogue System is clear).
    - Areas where LTM (e.g., `PROJECT_CONTEXT_AND_ROADMAP.md` or specific `DECISION_LOG.md` entries) can provide complementary information not suitable for `TECHARCH.mbk`'s high-level focus.
- Propose updates to `TECHARCH.mbk` to ensure accuracy and alignment with current understanding.
**Notes for `frontend/src/config/` analysis (Sub-Task 4):**
- Check for a `frontend/src/config/` directory or common configuration files (e.g., `config.ts`, `constants.ts`, `env.ts`, or how Next.js handles environment variables via `NEXT_PUBLIC_` prefixes in `.env.local` or environment-specific files).
- If configuration files are found:
    - Summarize their purpose.
    - Identify key configuration parameters (e.g., API base URLs, feature flags, third-party service keys used on the client-side like `NEXT_PUBLIC_EMAILJS_SERVICE_ID`).
    - Note how environment variables are accessed/managed in the Next.js context (e.g., `process.env.NEXT_PUBLIC_...`).
- Determine if any frontend configurations imply significant architectural decisions.
- Extract any generalizable best practices for frontend configuration management, especially within a Next.js application.
- Check if `TECHARCH.mbk` adequately covers frontend configuration; if not, note for MBK update.
- Propose entries for LTM (project-specific `DECISION_LOG.md` or `CONTEXT_SNAPSHOTS`) and Generic Knowledge Base (`BEST_PRACTICES_LEARNED.md` or `TECHNOLOGY_INSIGHTS.md`).
**Notes for `backend/src/config/` analysis (Sub-Task 3):**
- List all files in `backend/src/config/`.
- For each configuration file (e.g., `env.ts`, `db.ts`):
    - Summarize its purpose.
    - Identify key configuration parameters it manages (e.g., database connection strings, API keys, feature flags, logging levels).
    - Note how environment variables are loaded and validated (e.g., use of `dotenv`, `envalid`).
    - Determine if any configurations imply significant architectural decisions (e.g., choice of specific cloud services, security settings, default behaviors).
    - Extract any generalizable best practices for configuration management (e.g., separation of concerns, environment-specific configs, validation of env vars).
- Check if `TECHARCH.mbk` or other `.mbk` files adequately cover configuration management; if not, note for MBK update.
- Propose entries for LTM (project-specific `DECISION_LOG.md` or `CONTEXT_SNAPSHOTS`) and Generic Knowledge Base (`BEST_PRACTICES_LEARNED.md`).
**Notes for `package.json` analysis (Sub-Task 2):**
- Identify major frameworks (e.g., Next.js, Express).
- List key ORMs (already covered Prisma), state management libraries, UI component libraries, utility libraries (e.g., date handling, validation, HTTP clients).
- For each significant library:
    - Briefly state its purpose in the context of this project.
    - Consider if its choice represents a notable architectural decision for this project (for project-specific `DECISION_LOG.md`).
    - Extract any general pros/cons or common usage patterns for that type of library (for `GENERIC_KNOWLEDGE_BASE/TECHNOLOGY_INSIGHTS.md`).
- Note any particularly large, less common, or deprecated dependencies that might warrant further investigation or documentation.
- Check if `backend/.memory_bank/TECHARCH.mbk` already lists these key technologies; if so, ensure LTM entries provide additional rationale or context. If `TECHARCH.mbk` is missing key technologies, note them for potential MBK updates.
- Differentiate between `dependencies` and `devDependencies`, focusing primarily on runtime dependencies for architectural significance but noting key development tools (linters, formatters, testing frameworks) for generic best practices.
**Notes for `prisma/schema.prisma` analysis:**
- Identify main data models and their fields.
- Note key relationships (one-to-one, one-to-many, many-to-many) and how they are defined (e.g., relation fields, `@relation` attributes).
- Look for attributes with special comments, constraints (e.g., `@unique`, `@default`), or data types that might imply specific business rules.
- Determine if any model structures or specific fields imply significant past design decisions or rationales that should be captured (for project-specific `DECISION_LOG.md`).
- Identify any generalizable data modeling patterns or Prisma-specific insights (for `GENERIC_KNOWLEDGE_BASE/TECHNOLOGY_INSIGHTS.md` or `DESIGN_PATTERNS_OBSERVED.md`).
- Consider what overview or insights would be valuable for a new developer trying to understand the data architecture (for a project-specific `CONTEXT_SNAPSHOTS` file).
- Check if `backend/.memory_bank/TECHARCH.mbk` or other relevant `.mbk` files already cover the data model. If so, identify what *additional* high-level context, decision rationale, or cross-model insights the LTM can provide, or if the MBK itself needs updates/clarifications.

**General Process for Each Sub-Task (Revised for MBK updates & Dual Memory):**
1.  Update this `CURRENT_CONTEXT.md` to reflect the active sub-task, including specific analysis notes.
2.  Read and analyze the target file(s)/directory and its associated `.mbk` file (if one exists).
3.  Extract relevant information, distinguishing between project-specific insights and generic/reusable learnings.
4.  Check against already populated LTM (project-specific and generic) and the target `.mbk` file to avoid redundancy and identify gaps.
5.  Propose creation of:
    *   New project-specific LTM entries (e.g., `CONTEXT_SNAPSHOTS/*.md`, additions to `DECISION_LOG.md`).
    *   New generic knowledge entries (e.g., additions to `GENERIC_KNOWLEDGE_BASE/DESIGN_PATTERNS_OBSERVED.md`, etc.).
    *   Specific changes/additions to the relevant `.mbk` file.
6.  Upon user approval, write new LTM entries (project-specific and generic) and/or update the `.mbk` file.
7.  Propose updates to the relevant `INDEX.md` file(s) (project-specific and/or generic) to link to new entries.
8.  Upon user approval, update the `INDEX.md` file(s).
9.  Mark sub-task as complete in `CURRENT_TODO.md`.
10. Update this `CURRENT_CONTEXT.md` with completion status and pointer to the next sub-task.
