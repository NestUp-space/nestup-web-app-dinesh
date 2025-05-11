# LTM Bootstrap Codebase Analysis Summary

**Date of Analysis:** 2025-05-11

This document summarizes the key findings from the initial LTM Bootstrap Codebase Analysis.

## 1. Backend Controllers & API Entry Points

* **Mixed Patterns:** The backend employs a variety of controller patterns:
  * **Class-based controllers:** Used for core entities like User, Project, Task, Subtask (e.g., `backend/src/controllers/user.controller.ts`, `backend/src/controllers/project/project.controller.ts`).
  * **Static method controllers:** Seen in `RoleController` (`backend/src/controllers/role.controller.ts`).
  * **Direct service usage in route handlers:** For `ModelDefinition` and its sub-entities (`ModelInputParameter`, `ModelBomItem`), the route file `backend/src/catalogue/routes/model.routes.ts` directly invokes `ModelService` methods.
* **Key Controller Locations & Responsibilities:**
  * **`backend/src/controllers/` (Top-Level):**
    * `auth.controller.ts`: Authentication.
    * `user.controller.ts`: User CRUD and management.
    * `role.controller.ts`: Role and Permission CRUD.
    * `file.controller.ts`: File uploads.
    * `siteVisit.controller.ts`: Site visit bookings.
    * `bim.controller.ts`: Legacy BIM model templates, plank list generation.
    * `MaterialController`, `SiteVisitBoxController`: Appear to be shells or their methods were not fully identified by initial analysis.
  * **`backend/src/controllers/project/` (Nested - Active for Project Management):**
    * `project.controller.ts`: Project CRUD.
    * `task.controller.ts`: Task CRUD.
    * `subtask.controller.ts`: Subtask CRUD.
  * **`backend/src/catalogue/controllers/` & `backend/src/catalogue/routes/` (Catalogue System):**
    * `model.routes.ts`: Handles `ModelDefinition`, `ModelInputParameter`, `ModelBomItem` CRUD by directly using `ModelService`.
    * `project-model-instance.controller.ts`: Handles CRUD for `ProjectModelInstance`.
    * `generation.controller.ts`: Intended for output generation (e.g., documents); specific methods not yet fully analyzed.

## 2. Frontend Data Fetching (`frontend/src/lib/api/`)

* **Primary Mechanism:** An `ApiClient` class defined in `frontend/src/lib/api/client.ts`.
  * Uses native `fetch`.
  * Handles JWT authentication (retrieves token from `localStorage`).
  * Provides GET, POST, PUT, DELETE methods.
  * Exported as a singleton instance: `apiClient`.
* **Usage:**
  * `apiClient` is wrapped by a custom hook `frontend/src/hooks/useApi.ts`.
  * Also used directly as a fetcher function for SWR (Stale-While-Revalidate) hooks in various components.
* **Alternative (Potentially Legacy/Unused) Patterns:**
  * `frontend/src/lib/api/index.ts`: Defines generic `get`, `post`, `put`, `del` helper functions.
  * `frontend/src/lib/api/auth.ts`: Defines specific functions for authentication API calls.
  * These also use `fetch` and manual `localStorage` token handling. Searches did not find active imports of these helper functions, suggesting `ApiClient` is the dominant pattern.
* **Inconsistency Noted:** Different API base URL fallbacks are used in `client.ts`, `index.ts`, and `auth.ts`.

## 3. Frontend Custom Hooks (`frontend/src/hooks/`)

* **`useApi.ts`:**
  * Provides foundational hooks: `useApi` (generic), `useGet` (specialized for GET), and `usePost`, `usePut`, `useDelete` (these return an `execute` function for mutations).
  * These hooks wrap `apiClient` and manage API request state (data, loading, error).
* **Entity-Specific Hooks (e.g., `useProject.ts`):**
  * Build upon the foundational hooks from `useApi.ts`.
  * Encapsulate API endpoints and logic for specific data models (e.g., `useProjects` to fetch all projects, `createProject` function).
  * Define and export relevant TypeScript types for their data.
  * This pattern promotes reusability and separation of concerns for API interactions in UI components.
* **Other Hooks:** `useForm.ts` (likely for form handling), `useMaterial.ts`, `useSiteVisitBox.ts`, `useSubtask.ts`, `useTask.ts` (likely follow similar entity-specific patterns).

## 4. Frontend Global State (`frontend/src/context/`)

* **`UserContext.tsx`:**
  * Uses React Context API to manage global user authentication state.
  * Stores current user profile, loading status.
  * Provides `login` and `logout` functions.
  * Interacts with `localStorage` for JWT token persistence.
  * Uses API functions from `frontend/src/lib/api/auth.ts` (e.g., `getUserProfile`) for fetching user data.
* **Other State:** No other global state management libraries (like Redux, Zustand) were apparent. Server state not covered by `UserContext` is likely managed by SWR using `apiClient`.

This analysis provides a baseline understanding of the codebase's structure for future development and LTM refinement.
