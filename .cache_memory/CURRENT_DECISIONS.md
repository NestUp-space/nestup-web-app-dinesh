## Cline's Session Decision Log

**Session Date:** 2025-05-20

---

**Decision ID:** 20250520-001
**Timestamp:** 2025-05-20, 18:57
**Task/Issue:** `TypeError: BomItemType is undefined` in `BillOfMaterialListEditor.tsx`
**Decision Made:**
Refactor shared Zod schemas and enums into `frontend/src/components/dashboard/model-management/modelSchemas.ts`.
**Rationale:** Resolve circular dependency.
**(Details omitted for brevity, see previous logs)**

---

**Decision ID:** 20250520-002
**Timestamp:** 2025-05-20, 20:07
**Task/Issue:** Fix 404 Error for Project Instances API (`GET /api/catalogue/project-instances/by-project/1`) on project details page.
**Decision Made:**
Update API endpoint in `frontend/src/app/dashboard/projects/[id]/components/ProjectDetails.tsx` to `/api/projects/:projectId/model-instances`.
**Rationale:** Align frontend with correct backend route.
**(Details omitted for brevity, see previous logs)**

---

**Decision ID:** 20250520-003
**Timestamp:** 2025-05-20, 20:24
**Task/Issue:** Resolve 404 Error for Model Instance API Endpoint (`GET` and `POST` to `/api/projects/1/model-instances`) on catalogue new page.
**Decision Made:**
Mount `projectModelInstanceRouter` within `projectRouter` in `backend/src/routes/project.routes.ts`.
**Rationale:** The sub-router for model instances was defined but not connected to the main project routes, causing 404s.
**Follow-up Actions:** Implemented the router mounting. This led to a new 400 Bad Request error.
**(Details omitted for brevity, see previous logs)**

---

**Decision ID:** 20250520-004
**Timestamp:** 2025-05-20, 20:57
**Task/Issue:** Resolve 400 Bad Request for Model Instance API Endpoint (`GET` and `POST` to `/api/projects/1/model-instances`) on catalogue new page.
**Decision Made:**
Initiate investigation into backend input validation failure.
**Rationale:**
The 400 error with message "Input validation failed" indicates a mismatch between the data sent by the frontend and the expectations defined in the backend's DTO validation schemas.
**Affected Files/Modules (Initial Investigation Scope):**
*   `backend/src/catalogue/dtos/project-model-instance.dto.ts` (to check Zod schemas)
*   `backend/src/catalogue/routes/project-model-instance.routes.ts` (to see how `validateRequest` middleware is used)
*   Frontend code sending the request (e.g., `ModelSelector.tsx`)
**Follow-up Actions:**
*   Request detailed validation error messages from the user.
*   Read `project-model-instance.dto.ts`.
*   Compare frontend payload with backend schemas.
*   Formulate and implement a fix.
*   Archive this decision to `DECISION_LOG.md` in LTM upon successful resolution.

---
