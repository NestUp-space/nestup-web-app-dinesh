# Likely Tickets for 2025-05-12

---
**Ticket ID:** 20250512-001
**Task Name:** Fix Login Error (Database Credentials & CORS) - SUPERSEDED
**Description:**
(Superseded by Ticket 20250512-002) The login functionality was failing due to `PrismaClientInitializationError` caused by placeholder database credentials (`your_database_user`) in `backend/.env`. This also led to a CORS error on the frontend. Multiple attempts to guide user to update `.env` and restart server were unsuccessful as backend continued to use placeholder credentials.
**Timestamps:**

- Created: 2025-05-12 09:17 AM
- Superseded: 2025-05-12 10:37 AM
**Status:** Superseded
**Assigned To:** cline
**Assigned By:** user
**Updates:**
- 2025-05-12 09:17 AM: Cache memory files (`CURRENT_CONTEXT.md`, `CURRENT_TODO.md`, `CURRENT_DECISIONS.md`) updated. Awaiting verification of login functionality.
- 2025-05-12 09:19 AM: User attempted login. Browser console still shows `NS_ERROR_CONNECTION_REFUSED` for `http://localhost:5001/api/auth/login`. This indicates the backend server is likely not running correctly or is inaccessible. Awaiting backend terminal logs for diagnosis.
- 2025-05-12 09:21 AM: Backend terminal logs provided by user *still* show the `PrismaClientInitializationError` with `User \`your_database_user\` was denied access...`. This confirms the backend is not picking up new credentials. Instructed user to re-verify`.env` file contents and ensure a full backend restart.
- 2025-05-12 09:24 AM: User confirmed re-verification and restart. Browser and backend logs *still* show the same `NS_ERROR_CONNECTION_REFUSED` and `PrismaClientInitializationError` with `your_database_user`. The backend is definitively not loading the updated `.env` file. Next step is to ask user to share `.env` content (masked) and detail their save/restart procedure.
- 2025-05-12 09:27 AM: User provided new logs after further attempts. Situation unchanged: backend still using placeholder credentials. Task is blocked pending user providing the *actual content* of `backend/.env` (masked) and a *detailed step-by-step* of their file saving and server restart process.
- 2025-05-12 09:32 AM: User confirmed they don't remember original DB credentials and requested a new DB setup. Original task to fix login with existing DB is now superseded.

---

---
**Ticket ID:** 20250512-002
**Task Name:** Create New Database & Admin User to Resolve Login Issues
**Description:**
User was unable to recall credentials for the existing `nestup_dev` database. New plan is to create a new PostgreSQL database (`nestup_app_db`) and a new PostgreSQL user (`nestup_db_user`). After DB/user creation by the user, Cline will guide updating `backend/.env`, running Prisma migrations, and seeding/creating an application admin user (`suryanestup@nestup.space` / `1234test`). This evolved into resetting password for existing user `suryateja` for database `nestupdb` and resolving `.env` loading issues.
**Timestamps:**

- Created: 2025-05-12 10:37 AM
**Status:** Done
**Assigned To:** cline
**Assigned By:** user
**Updates:**
- 2025-05-12 10:37 AM: User confirmed creation of new PostgreSQL DB/user and switched to ACT MODE. Cache files updated. Awaiting user to provide the chosen password for `nestup_db_user` to proceed with `.env` update.
- 2025-05-12 11:55 AM: User reset password for PG user `suryateja` to `96hrsla#31` (no special chars) for existing `nestupdb` database.
- 2025-05-12 11:58 AM: `backend/.env` updated with new credentials.
- 2025-05-12 12:01 PM: `backend/.env` updated again with simplified password `96hrsla31` after user changed it in PG.
- 2025-05-12 12:05 PM: Added debug `console.log` to `backend/src/config/env.ts` to trace `DATABASE_URL` loading issues.
- 2025-05-12 12:11 PM: User reported login success after restarting VS Code and browser, indicating a dev environment cache issue was preventing `.env` changes from taking effect.
- 2025-05-12 12:12 PM: Debug `console.log` removed from `backend/src/config/env.ts`. Login issue resolved. Roadmap document also updated with new priorities.

---

---
**Ticket ID:** 20250512-003
**Task Name:** Implement Persistent Multi-Box Configuration in ModelSelector UI
**Description:**
Implement functionality in `frontend/src/components/dashboard/ModelSelector.tsx` to allow users to add, configure, reorder, and remove multiple "boxes". Each box represents a `ProjectModelInstance` with a selected catalogue model and specific input parameters. These configurations must be saved to and loaded from the backend. This feature is now Phase 0.5 in the project roadmap.
**Requirements & Plan:**

- **Chosen Approach:** Utilize existing `ProjectModelInstance` Prisma model. Add `uiDisplayOrder: Int? @default(0)` field for sequencing. Store `inputValues` in `inputValuesJson`.
- **Backend (Phase 0.5.A):**
  - `0.5.A.1`: Modify `ProjectModelInstance` Prisma Model (add `uiDisplayOrder`), create/run migration. (Status: Completed)
  - `0.5.A.2`: Implement/Update Backend Service (`project-model-instance.service.ts`) for individual and batch operations. (Status: Completed for individual CRUD, batch save exists)
  - `0.5.A.3`: Create/Verify Backend API Endpoints. Routes for individual CRUD (GET all, POST one, PUT one, DELETE one) and batch update (PUT batch) are now correctly mounted under `/api/projects/:projectId/model-instances`. (Status: Completed)
- **Frontend (`ModelSelector.tsx` - Phase 0.5.B):**
  - `0.5.B.1`: Update State Management for an array of `BoxItem` objects, including `isModified`, `isSaving`, `saveError`. (Status: Completed)
  - `0.5.B.2`: Fetch existing box configurations on load using `/api/projects/:projectId/model-instances`. (Status: Working)
  - `0.5.B.3`: Implement UI for adding, removing, reordering, and editing multiple boxes (model selection & inputs per box) via `BoxComponent.tsx`. Individual save/delete buttons per box. (Status: Completed)
  - `0.5.B.4`: Implement "Save Box Setup" button calling the batch PUT API (`/api/projects/:projectId/model-instances/batch`). (Status: Implemented, uses correct path)
  - `0.5.B.5`: Adapt "Generate Plank List" to use multi-box state. Validation for unsaved boxes added. Box number prefixing in plank IDs (backend) needs verification. (Status: Partially Done)
  - `0.5.B.6`: Adapt CSV Download for consolidated plank list with prefixed IDs. (Status: Pending)
**Timestamps:**
  - Created: 2025-05-12 01:10 PM
**Status:** In Progress
**Assigned To:** cline
**Assigned By:** user
**Updates:**
  - 2025-05-12 01:10 PM: Task created based on user request and detailed planning. Roadmap and cache files updated.
  - 2025-05-12 04:25 PM: User confirmed individual box saving is now working after backend route corrections (mounting `projectModelInstanceRoutes` under `/api/projects/:projectId/model-instances`) and frontend URL updates in `ModelSelector.tsx` to match these new paths. `numericProjectId` derivation and usage in API calls also refined.
  - 2025-05-12 04:40 PM: Plank list generation API (`/api/bim/plank-generation/projects/:projectId`) is being called correctly after `useApi` hook fix for refetch logic. User reports plank list is generated and downloadable as CSV, but all specific plank values (Width, Height, MC, etc.) are empty. This points to an issue in the `itemLogicScript` of `BillOfMaterialItem`s or the data provided to these scripts. Lingering incorrect initial GET request (`/api/catalogue/project-instances/by-project/70`) still observed but not blocking current focus. Next step: Debug `itemLogicScript` execution for plank generation.

---
