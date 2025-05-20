## Cline's Current Working Context

**Session Date:** 2025-05-20
**Last Updated:** 2025-05-20, 20:56

---

### Active Task: Resolve 400 Bad Request for Model Instance API Endpoint (Input Validation)

**Page Affected:** `/frontend/src/app/dashboard/catalogue/new/page.tsx`

**Error Message (from user logs):**
*   `API Error (400): Input validation failed`
*   `Response JSON data: Object { success: false, message: "Input validation failed", errors: (1) […] }`
    This occurs for both GET and POST requests to `http://localhost:5001/api/projects/1/model-instances`.

**Analysis:**
*   The previous 404 error (due to router mounting) is resolved.
*   The current 400 error indicates that the data sent by the frontend does not conform to the backend's validation schemas (defined in DTOs).
*   The `errors` array in the JSON response (not yet fully provided by the user) will contain specific details about which field(s) failed validation.

**Relevant Files for Investigation:**
*   `backend/src/catalogue/dtos/project-model-instance.dto.ts` (Contains Zod schemas like `createProjectModelInstanceSchema` and `getProjectModelInstancesSchema`)
*   `backend/src/catalogue/routes/project-model-instance.routes.ts` (Uses these DTOs for validation via `validateRequest` middleware)
*   Frontend code sending the request (e.g., `ModelSelector.tsx` as per user logs) to see the payload structure.

**Next Steps (from `CURRENT_TODO.md`):**
1.  Request detailed validation errors from the user (expansion of the `errors` array).
2.  Examine `backend/src/catalogue/dtos/project-model-instance.dto.ts`.
3.  Compare frontend payload with backend schema.
4.  Formulate and present a solution.

---

### Previous Task (Completed): Resolve 404 Error for Model Instance API Endpoint (Router Mounting)

**Page Affected:** `/frontend/src/app/dashboard/catalogue/new/page.tsx`
**Error Message (Original):** `Cannot GET /api/projects/1/model-instances`, `Cannot POST /api/projects/1/model-instances`
**Analysis & Solution:** The `projectModelInstanceRouter` was not mounted under `projectRouter`. Fixed by importing and using it in `backend/src/routes/project.routes.ts`.
**Status:** Completed. This led to the current 400 Bad Request error.

---

### Previous Task (Pending User Verification): Fix `TypeError: BomItemType is undefined`

**Page Affected:** `http://localhost:3000/dashboard/catalogue/new`
**Analysis & Solution:** Resolved by creating `modelSchemas.ts` and refactoring imports to break a circular dependency.
**Status:** Pending User Verification.

---

### Previous Task (User Verified Fix): Fix 404 Error for Project Instances API (Project Details Page)

**Page Affected:** `http://localhost:3000/dashboard/projects/1`
**Error Message (Original):** `Cannot GET /api/catalogue/project-instances/by-project/1`
**Analysis & Solution:** Corrected the API endpoint in `frontend/src/app/dashboard/projects/[id]/components/ProjectDetails.tsx` to use `/api/projects/:projectId/model-instances`.
**Status:** Done.

---
