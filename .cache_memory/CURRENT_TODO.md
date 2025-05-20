# Cline's Current TODO List

## Previous Task: Fix Project Creation API Issues (Completed)

*All sub-tasks completed and documented in previous versions of this file and in `CURRENT_CONTEXT.md` / `CURRENT_DECISIONS.md`.*

## Build Errors: Module not found for '@constants/faqData' and '@constants/navLinks' (Resolved)

**Status:** Resolved.

**Summary of Fixes:**
- **faqData:**
    - The import `import { faqData } from "@constants/faqData";` in `frontend/src/components/landing-page/Faq.tsx` was failing.
    - The path alias `@constants/*` in `frontend/tsconfig.json` pointed to `frontend/src/constants/*`.
    - The actual location of `faqData` was `frontend/constants/faqData/index.tsx`.
    - **Resolution:** Moved the `frontend/constants/faqData` directory to `frontend/src/constants/faqData`.
- **navLinks:**
    - The import `import {links} from "@constants/navLinks";` in `frontend/src/components/landing-page/Footer.tsx` was failing.
    - The path alias `@constants/*` in `frontend/tsconfig.json` pointed to `frontend/src/constants/*`.
    - The actual location of `navLinks` was `frontend/constants/navLinks/index.ts`.
    - **Resolution:** Moved the `frontend/constants/navLinks` directory to `frontend/src/constants/navLinks`.

## Current Task: Admin User Missing Permissions - Unable to Access /dashboard/users

**Status:** Investigation Complete. Solution Identified.

**Summary of Investigation:**

- The admin user (`admin@nestup.com`, roleId: 1) is redirected from `/dashboard/users` due to an empty `permissions` array, failing the `users.view` check.
- The backend script `backend/src/scripts/setupAdminRoleAndUser.ts` is designed to:
  - Ensure all permissions from `constants/permissions.ts` exist in the `UserPermission` table.
  - Create/update an "admin" role with `id: 1`.
  - Grant *all* permissions to this admin role.
  - Assign this admin role to `admin@nestup.com`.
- The issue likely arises from this script not being run, not completing successfully, or its effects being undone.

**Next Steps:**

1. **Advise user to run the setup script:**
    Command: `npx ts-node backend/src/scripts/setupAdminRoleAndUser.ts`
    (This step is pending user confirmation/action)
2. **Verify resolution:** After the script is run, check if the admin user can access `/dashboard/users` and if their permissions array is populated correctly.
    (This step is pending user confirmation/action)
3. **Update LTM:** If the solution is successful, update `PROJECT_CONTEXT_AND_ROADMAP.md` or `DECISION_LOG.md` if this fix reveals a broader pattern or a permanent change in how admin permissions are managed (though it seems like an operational step rather than a design change).
4. **Update Work Ticket:** Mark the ticket in `.work_tickets/likely.tickets.for.2025-05-18.md` as "Done" or "Resolved".

---

## Current Task: Refactor frontend/src/app/dashboard/projects/page.tsx (Completed - Pending Final Memory Updates)

**Status:** Component refactoring complete. Memory file updates in progress.

**Summary of Refactoring:**
- Decomposed `frontend/src/app/dashboard/projects/page.tsx` into smaller, reusable components.
- Created new components in `frontend/src/components/dashboard/projects/`:
    - `ProjectCard.tsx` (Ticket 1 - Done)
    - `CreateProjectDialog.tsx` (Ticket 2 - Done)
    - `ProjectList.tsx` (Ticket 3 - Done)
    - `ProjectTabs.tsx` (Ticket 4 - Done)
- Updated `frontend/src/app/dashboard/projects/page.tsx` to use these new components and removed redundant code/imports. (Ticket 5 - Done)
- Created `.memory_bank/frontend_src_components_dashboard_projects.mbk`. (Part of Ticket 6 - In Progress)

**Next Steps (Ticket 6 - In Progress):**
1. Update `.cache_memory/CURRENT_CONTEXT.md` with a summary of the refactoring. (Pending)
2. Update `.cache_memory/CURRENT_DECISIONS.md` with the decision to refactor and the chosen component structure. (Pending)
3. Update `.work_tickets/likely.tickets.for.2025-05-20.md` to mark all tickets as "Done". (Pending)
4. Final review and attempt completion. (Pending)
