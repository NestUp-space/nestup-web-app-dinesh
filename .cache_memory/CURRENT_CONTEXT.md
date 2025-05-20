# Current Task: Admin User Missing Permissions - Unable to Access /dashboard/users

**Problem:**
The admin user (`admin@nestup.com`, roleId: 1) is being redirected from the `/dashboard/users` page.
Console logs show `UsersPage - User Permissions: undefined` and `UsersPage - Has users.view permission: undefined`.
The `UserContext.tsx` logs indicate that the `/api/users/profile` endpoint returns `permissions: []` (an empty array) for the admin user.

**Investigation Summary:**

1. `frontend/src/app/dashboard/users/page.tsx`: Redirects if `user.permissions` does not include `users.view`.
2. `frontend/src/context/UserContext.tsx`: Populates `user` (including `permissions`) by calling `getUserProfile()` from `@/lib/api/auth`.
3. `frontend/src/lib/api/auth.ts`: `getUserProfile()` calls the backend GET `/api/users/profile`.
4. `backend/src/routes/user.routes.ts`: `/api/users/profile` maps to `UserController.getCurrentUserProfile`.
5. `backend/src/controllers/user.controller.ts`: `getCurrentUserProfile` calls `UserService.getCurrentUserProfile(userId)`.
6. `backend/src/services/user.service.ts`: `UserService.getCurrentUserProfile` fetches the user and their role, including `roleMappings` to `UserPermission`. It then constructs a flat `permissions` array. The code correctly attempts to include all permissions associated with the user's role.
7. `backend/prisma/schema.prisma`: Defines `User`, `UserRole`, `UserPermission`, and `RolePermissionMapping` tables, which are correctly queried by the `UserService`.
8. `backend/src/constants/permissions.ts`: Defines all available permission strings using `PERMISSION_GROUPS` and `ACTIONS`, and provides `getAllPermissions()` to retrieve them as a flat array.
9. `backend/src/constants/roles.ts`: Defines `INTERNAL_ROLES` and `EXTERNAL_ROLES`. No explicit "Admin" or "Superadmin" role is listed here for use by `seedRolesAndPermissions.ts` in a way that would grant all permissions.
10. `backend/src/scripts/seedRolesAndPermissions.ts`: This script seeds roles from `constants/roles.ts` and assigns them `basePermissions`. It does *not* have a specific section to grant *all* permissions to an Admin role. It creates all unique permissions found in `basePermissions` values.
11. `backend/src/scripts/setupAdminRoleAndUser.ts`: This script is specifically designed to:
    * Ensure all permissions from `constants/permissions.ts` (via `getAllPermissions()`) exist in the `UserPermission` table.
    * Upsert an "admin" role with `id: 1` and `roleType: "admin"`.
    * Grant *all* permissions from the `UserPermission` table to this admin role (ID 1) by creating the necessary `RolePermissionMapping` entries (after clearing existing ones).
    * Ensure the user `admin@nestup.com` exists and is assigned to this admin role (ID 1).

**Conclusion:**
The `setupAdminRoleAndUser.ts` script is the correct mechanism for ensuring the admin user has all permissions. The current issue (empty permissions array for admin) strongly suggests this script was not run, did not complete successfully, or its effects were later undone.

**Next Steps (from .work_tickets/likely.tickets.for.2025-05-18.md):**

1. Advise the user to run the script: `npx ts-node backend/src/scripts/setupAdminRoleAndUser.ts`
2. Verify with the user if the issue is resolved after running the script.

---

## Current Task: Refactor frontend/src/app/dashboard/projects/page.tsx

**Date:** 2025-05-20

**Summary of Refactoring:**

The `frontend/src/app/dashboard/projects/page.tsx` component was refactored to improve maintainability and code organization by breaking it down into smaller, specialized components. This aligns with the project's `GUARDRAILS.md` which encourages modular frontend architecture.

**Changes Made:**

1. **New Directory Created:**
    * `frontend/src/components/dashboard/projects/` was created to house the new project-specific components.

2. **New Components Created:**
    * **`frontend/src/components/dashboard/projects/ProjectCard.tsx`**:
        * Responsibilities: Displays individual project details in a card format, handles navigation to the project detail page.
        * Extracted from the original `page.tsx`.
    * **`frontend/src/components/dashboard/projects/CreateProjectDialog.tsx`**:
        * Responsibilities: Manages the modal dialog for creating new projects, including form state, input fields (name, description, address, location, sqft, estimated time, personnel selection), and API submission logic.
        * Logic and JSX for the dialog were moved from `page.tsx`.
    * **`frontend/src/components/dashboard/projects/ProjectList.tsx`**:
        * Responsibilities: Renders a grid of `ProjectCard` components. Accepts a list of projects and an empty message as props.
    * **`frontend/src/components/dashboard/projects/ProjectTabs.tsx`**:
        * Responsibilities: Manages the tabbed interface (All, Active, Draft, Archived) for displaying projects. Uses `ProjectList` for rendering projects within each tab.

3. **`frontend/src/app/dashboard/projects/page.tsx` (ProjectsPage) Modifications:**
    * Now acts as a container component.
    * Retains responsibility for fetching project data and user lists (designers, project managers, engineers) for dropdowns.
    * Imports and utilizes the new components (`CreateProjectDialog`, `ProjectTabs`).
    * State related to the "Create Project" form and the `handleCreateProject` function were moved into `CreateProjectDialog.tsx`.
    * The rendering of project lists via tabs is now delegated to `ProjectTabs.tsx`.
    * Unused imports were removed.

**Benefits Achieved:**

* **Improved Readability:** Each component now has a more focused responsibility.
* **Enhanced Maintainability:** Changes to specific UI sections (e.g., project card appearance, creation form) are isolated.
* **Better Reusability:** Components like `ProjectCard` and `ProjectList` are more easily reusable.
* **Simplified `ProjectsPage`:** The main page component is now less cluttered and easier to understand.

**Memory Files Updated:**

* `.memory_bank/frontend_src_components_dashboard_projects.mbk` created to document the new module.
* `.cache_memory/CURRENT_TODO.md` updated to reflect task progress.
* This file (`.cache_memory/CURRENT_CONTEXT.md`) updated with this summary.
