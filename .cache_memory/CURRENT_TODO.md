## Cline's Current TODO List

**Session Date:** 2025-05-20

---

### Task: Fix Plank Generation Logic for Simple Box Model

**Status:** Completed
**Summary:**

- User confirmed their updated version of `Reference/BasicBox.yaml` is correct and user-friendly.
- The logic in this user-verified `Reference/BasicBox.yaml` is understood to align with `Reference/TestCase.yaml` and the "materials first, then dimensions" calculation principle.
- No code changes were applied by Cline in the final resolution as the user's version was deemed final.
- Updated `.work_tickets/likely.tickets.for.2025-05-20.md` (Ticket 5).
- Updated `.cache_memory/CURRENT_CONTEXT.md` and `.cache_memory/CURRENT_DECISIONS.md` (Decision ID 20250520-005).
- Archived decision to `.long_term_memory/DECISION_LOG.md` (Decision_PlankLogicFix_BasicBox_20250520).
**Next Steps:** None for this specific task.

---

### Task: Fix `TypeError: BomItemType is undefined` in `BillOfMaterialListEditor.tsx` (and subsequent import errors)

**Status:** Pending User Verification

**Root Cause Identified:** Circular dependency between `ModelBuilderForm.tsx` and `BillOfMaterialListEditor.tsx`, and incorrect import paths in other files.
**Plan & Actions:** (Completed, details omitted for brevity, see previous logs)

---

### Task: Resolve 404 Error for Model Instance API Endpoint (Router Mounting)

**Status:** Completed (Fix applied, new issue "400 Bad Request" emerged)

**Issue (Original):** Unable to save model box in `/frontend/src/app/dashboard/catalogue/new/page.tsx`. Console showed 404 errors for GET and POST requests to `http://localhost:5001/api/projects/1/model-instances`.
**Root Cause Identified:** The `projectModelInstanceRouter` was not mounted under `projectRouter`.
**Solution Implemented:**

1. Modified `backend/src/routes/project.routes.ts` to import and mount `projectModelInstanceRouter` from `../catalogue/routes/project-model-instance.routes.ts` at the `/:id/model-instances` path.
2. Updated `backend/src/routes/project.routes.mbk`.
3. Updated work ticket.

---

### Task: Resolve 400 Bad Request for Model Instance API Endpoint (Input Validation)

**Status:** Pending Investigation

**Issue:** After fixing the 404, GET and POST requests to `http://localhost:5001/api/projects/1/model-instances` now return a "400 Bad Request" with the message "Input validation failed".
**Error Details (from user logs):** `Response JSON data: Object { success: false, message: "Input validation failed", errors: (1) […] }`

**Plan:**

1. **Request detailed validation errors** from the user (expansion of the `errors` array in the console).
2. **Examine Backend DTOs**: Read `backend/src/catalogue/dtos/project-model-instance.dto.ts` to understand `createProjectModelInstanceSchema` and `getProjectModelInstancesSchema`.
3. **Compare Frontend Payload with Backend Schema**: Identify the mismatch.
4. **Formulate a Solution**: Propose changes to either the frontend payload or backend DTO/validation logic.
5. **Present the Plan** to the user.

---

**Secondary/Background Tasks:**
- Review `GUARDRAILS.md` for any new project-specific guidelines. (Done for this session)
- Check `.long_term_memory/PROJECT_CONTEXT_AND_ROADMAP.md` for alignment. (Ongoing)

---
