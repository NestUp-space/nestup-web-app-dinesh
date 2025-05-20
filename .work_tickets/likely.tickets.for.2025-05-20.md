# Work Tickets for 2025-05-20

## Ticket 1: Fix `next/image` src parsing error in ModelCatalogueCard

**Description:**
A runtime error "Error: Failed to parse src "url" on `next/image`..." was occurring on the `/dashboard/catalogue` page. This was due to the `model.imageUrl` prop in `frontend/src/components/dashboard/catalogue/ModelCatalogueCard.tsx` not always being a correctly formatted path (i.e., relative paths not starting with a leading `/`).

**Task:**
Modify `ModelCatalogueCard.tsx` to preprocess `model.imageUrl`. If it's a relative path not starting with `/` (and not an absolute HTTP/HTTPS URL), prepend a `/`. Use this corrected URL for the `next/image` component.

**Timestamps:**
- Created: 2025-05-20 18:52:00
- Updated: 2025-05-20 18:52:00

**Status:** In-Progress (Code fix applied, pending testing and completion)

**Assigned to:** cline
**Assigned by:** user (via error report)

**Updates:**
- 2025-05-20 18:51:56: Code modification applied to `frontend/src/components/dashboard/catalogue/ModelCatalogueCard.tsx`.

---

## Ticket 2: Fix `TypeError: BomItemType is undefined` in Model Management

**Description:**
A runtime error `TypeError: _ModelBuilderForm__WEBPACK_IMPORTED_MODULE_3__.BomItemType is undefined` was occurring on the `/dashboard/catalogue/new` page. This was caused by a circular dependency where `ModelBuilderForm.tsx` imported `BillOfMaterialListEditor.tsx`, which in turn imported `BomItemType` from `ModelBuilderForm.tsx`. Subsequent import errors also appeared in other files (`useCatalogue.ts`, `app/.../new/page.tsx`) due to incorrect import paths after `BomItemType` was moved.

**Task:**
1.  Create a new file `frontend/src/components/dashboard/model-management/modelSchemas.ts`.
2.  Move shared Zod schemas and enums (including `BomItemType`, `ModelInputParameterSchema`, `DiscriminatedBomItemSchema`, etc.) from `ModelBuilderForm.tsx` to `modelSchemas.ts`.
3.  Update import statements in `ModelBuilderForm.tsx`, `BillOfMaterialListEditor.tsx`, `BomItem.tsx`, `frontend/src/app/dashboard/catalogue/new/page.tsx`, and `frontend/src/hooks/useCatalogue.ts` to reference `modelSchemas.ts` for these shared definitions.

**Timestamps:**
- Created: 2025-05-20 19:15:00
- Updated: 2025-05-20 19:15:00

**Status:** Done (Fix applied and verified by successful compilation. User to verify functionality on `/dashboard/catalogue/new` page.)

**Assigned to:** cline
**Assigned by:** user (via error report)

**Updates:**
- 2025-05-20 18:55 - 19:15: Identified root cause, planned solution, created `modelSchemas.ts`, moved definitions, and updated all affected import paths. Frontend dev server compiled successfully after changes.

---

## Ticket 3: Fix 404 Error for Project Instances API (ProjectDetails Page)

**Description:**
A 404 Not Found error was occurring for the API endpoint `GET /api/catalogue/project-instances/by-project/1` on the page `http://localhost:3000/dashboard/projects/1`. This was caused by an incorrect API path being used in `frontend/src/app/dashboard/projects/[id]/components/ProjectDetails.tsx`. The correct backend route is `GET /api/projects/:projectId/model-instances`.

**Task:**
Modify `frontend/src/app/dashboard/projects/[id]/components/ProjectDetails.tsx` to use the correct API endpoint: `/api/projects/${project.id}/model-instances`.

**Timestamps:**
- Created: 2025-05-20 20:03:00
- Updated: 2025-05-20 20:03:00

**Status:** Done (Fix applied, user to verify functionality on project details page)

**Assigned to:** cline
**Assigned by:** user (via error report)

**Updates:**
- 2025-05-20 20:05: Corrected API endpoint in `frontend/src/app/dashboard/projects/[id]/components/ProjectDetails.tsx`.

---

## Ticket 4: Fix 400 Bad Request for Model Instance API (Catalogue New Page) - Previously 404

**Description:**
Initially a 404, now a 400 Bad Request ("Input validation failed: params.projectId is Required") occurs for `GET` and `POST` to `http://localhost:5001/api/projects/1/model-instances`.
The 404 was due to `projectModelInstanceRouter` not being mounted.
The 400 is due to a mismatch between the route parameter name (`:id`) defined in `project.routes.ts` and what the DTOs/controller for model instances expected (`projectId`).

**Task:**
1.  Modify `backend/src/routes/project.routes.ts` to mount `projectModelInstanceRouter`. (Done - led to 400 error)
2.  Modify `backend/src/catalogue/dtos/project-model-instance.dto.ts`: Change `params: z.object({ projectId: ... })` to `params: z.object({ id: ... })` in relevant schemas.
3.  Modify `backend/src/catalogue/controllers/project-model-instance.controller.ts`: Update controller functions to use `req.params.id` (parsed as `projectIdStr`) instead of `req.params.projectId`.

**Timestamps:**
- Created: 2025-05-20 20:28:00 (as 404 fix)
- Updated: 2025-05-20 21:00:00 (to reflect 400 error and subsequent fixes)

**Status:** In-Progress (DTO and Controller changes applied, pending verification)

**Assigned to:** cline
**Assigned by:** user (via error report)

**Updates:**
- 2025-05-20 20:41: Mounted `projectModelInstanceRouter` in `project.routes.ts`.
- 2025-05-20 21:00: Updated DTOs in `project-model-instance.dto.ts` to expect `params.id`.
- 2025-05-20 21:00: Updated controller `project-model-instance.controller.ts` to use `req.params.id`.

---
