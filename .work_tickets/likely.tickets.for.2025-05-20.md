# Task: Refactor frontend/src/app/dashboard/projects/page.tsx

**Description:** Refactor the ProjectsPage into smaller, more maintainable components as per the approved plan.

**Assigned to:** cline
**Assigned by:** user
**Timestamp (Created):** 2025-05-20 10:10:00

---

## Ticket 1: Create ProjectCard Component

**Status:** Done
**Description:** Extract the `ProjectCard` component from `page.tsx` and move it to `frontend/src/components/dashboard/projects/ProjectCard.tsx`.
**Files to be created/modified:**

- `frontend/src/components/dashboard/projects/ProjectCard.tsx` (new)
- `frontend/src/app/dashboard/projects/page.tsx` (modified - remove ProjectCard, import new one)
**Timestamp (Updated):** 2025-05-20 10:14:00

---

## Ticket 2: Create CreateProjectDialog Component

**Status:** Done
**Description:** Create the `CreateProjectDialog.tsx` component at `frontend/src/components/dashboard/projects/CreateProjectDialog.tsx`. This component will manage the project creation modal, form, and submission logic.
**Files to be created/modified:**

- `frontend/src/components/dashboard/projects/CreateProjectDialog.tsx` (new)
- `frontend/src/app/dashboard/projects/page.tsx` (modified - remove dialog logic, import new component)
**Timestamp (Updated):** 2025-05-20 10:14:00

---

## Ticket 3: Create ProjectList Component

**Status:** Done
**Description:** Create the `ProjectList.tsx` component at `frontend/src/components/dashboard/projects/ProjectList.tsx`. This component will render a grid of `ProjectCard` components.
**Files to be created/modified:**

- `frontend/src/components/dashboard/projects/ProjectList.tsx` (new)
**Timestamp (Updated):** 2025-05-20 10:14:00

---

## Ticket 4: Create ProjectTabs Component

**Status:** Done
**Description:** Create the `ProjectTabs.tsx` component at `frontend/src/components/dashboard/projects/ProjectTabs.tsx`. This component will manage the tabbed interface for displaying projects.
**Files to be created/modified:**

- `frontend/src/components/dashboard/projects/ProjectTabs.tsx` (new)
**Timestamp (Updated):** 2025-05-20 10:14:00

---

## Ticket 5: Refactor ProjectsPage (page.tsx)

**Status:** Done
**Description:** Update `frontend/src/app/dashboard/projects/page.tsx` to use the newly created components (`ProjectCard`, `CreateProjectDialog`, `ProjectList`, `ProjectTabs`).
**Files to be created/modified:**

- `frontend/src/app/dashboard/projects/page.tsx` (modified)
**Timestamp (Updated):** 2025-05-20 10:14:00

---

## Ticket 6: Update Memory Files

**Status:** Done
**Description:** Update relevant `.mbk` files, cache memory, and LTM as per `GUARDRAILS.md` after refactoring is complete.
**Files to be created/modified:**

- `.memory_bank/frontend_src_components_dashboard_projects.mbk` (new, for the new components directory)
- `TECHARCH.mbk` (if high-level changes, likely minor updates)
- `.cache_memory/CURRENT_CONTEXT.md`
- `.cache_memory/CURRENT_DECISIONS.md`
- `.cache_memory/CURRENT_TODO.md`
**Timestamp (Updated):** 2025-05-20 10:14:00

---
---

# Task: Full Frontend Codebase Refactor

**Description:** Systematically refactor the frontend codebase to improve maintainability, efficiency, component reuse, and adherence to SOLID principles, without altering functionality or UI, as per the approved detailed plan.

**Assigned to:** cline
**Assigned by:** user
**Timestamp (Created):** 2025-05-20 10:29:00

---

## Ticket F1: Refactor Core Hooks & Contexts

**Status:** pending
**Description:** Review and refactor foundational hooks (`useApi.ts`, `useForm.ts`) and contexts (`MaterialContext.tsx`). Standardize API call patterns and form handling.
**Key Files/Areas:**
- `frontend/src/hooks/useApi.ts` (Clarify SWR usage, enhance mutation hooks)
- `frontend/src/hooks/useForm.ts` (Plan deprecation in favor of `react-hook-form`)
- `frontend/src/context/MaterialContext.tsx` (Implement or remove stub)
**Timestamp (Updated):** 2025-05-20 10:29:00

---

## Ticket F2: Refactor User Management Section

**Status:** pending
**Description:** Refactor components related to user and role management for SRP, API consistency, and UI consistency.
**Key Files/Areas:**
- `frontend/src/components/dashboard/users/UserList.tsx`
- `frontend/src/components/dashboard/users/RoleManagement/RolesPage.tsx`
- `frontend/src/components/dashboard/users/RoleManagement/RoleTab.tsx`
- `frontend/src/components/dashboard/users/RoleManagement/CreateRoleDialog.tsx`
**Timestamp (Updated):** 2025-05-20 10:29:00

---

## Ticket F3: Refactor Catalogue / Model Management Section

**Status:** pending
**Description:** Refactor components related to the catalogue and model building for SRP, API consistency, and better state management.
**Key Files/Areas:**
- `frontend/src/app/dashboard/catalogue/page.tsx`
- `frontend/src/app/dashboard/catalogue/new/page.tsx`
- `frontend/src/components/dashboard/model-management/ModelBuilderForm.tsx`
- `frontend/src/components/dashboard/model-management/ModelInputParameterListEditor.tsx`
- `frontend/src/components/dashboard/model-management/BillOfMaterialListEditor.tsx`
- `frontend/src/components/dashboard/model-management/ExpressionInput.tsx` (Review)
- `frontend/src/components/dashboard/model-management/CollapsibleVariables.tsx` (Minor review)
**Timestamp (Updated):** 2025-05-20 10:29:00

---

## Ticket F4: Refactor Project Detail Page & Components

**Status:** pending
**Description:** Refactor the project detail page and its sub-components for API consistency, UI consistency, and SRP.
**Key Files/Areas:**
- `frontend/src/app/dashboard/projects/[id]/page.tsx`
- `frontend/src/app/dashboard/projects/[id]/components/ProjectDetails.tsx`
- `frontend/src/components/dashboard/CollapsibleTaskCard.tsx` (Shared, but heavily used here)
- `frontend/src/app/dashboard/projects/[id]/components/EditProjectModal.tsx`
- `frontend/src/app/dashboard/projects/[id]/components/DeleteConfirmModal.tsx`
**Timestamp (Updated):** 2025-05-20 10:29:00

---

## Ticket F5: Refactor Other Shared Components (e.g., ModelSelector)

**Status:** pending
**Description:** Refactor other key shared components identified during analysis.
**Key Files/Areas:**
- `frontend/src/components/dashboard/ModelSelector.tsx`
- `frontend/src/components/dashboard/BoxComponent.tsx`
**Timestamp (Updated):** 2025-05-20 10:29:00

---

## Ticket F6: Ongoing - Update Memory Files & Documentation

**Status:** pending
**Description:** Continuously update relevant `.mbk` files, cache memory (`CURRENT_CONTEXT.md`, `CURRENT_DECISIONS.md`, `CURRENT_TODO.md`), and potentially LTM (`PROJECT_CONTEXT_AND_ROADMAP.md`, `TECHARCH.mbk` if structure changes significantly) as refactoring progresses.
**Timestamp (Updated):** 2025-05-20 10:29:00
