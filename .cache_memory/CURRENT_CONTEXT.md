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
