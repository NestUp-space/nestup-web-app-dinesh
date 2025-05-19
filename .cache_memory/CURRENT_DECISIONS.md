# Session Decisions Log

## 2025-05-16

### Fix Project Creation Status Error (400 Bad Request)

* **Decision 1:** Modify backend DTO (`project.types.ts`) and Controller (`project.controller.ts`) to correctly handle `statusId` (number) sent by the frontend, instead of expecting `projectStatus` (string).
* **Rationale:**
  * Aligns backend with frontend's existing data structure for project creation.
  * Corrects the lookup logic for project status in the database.
  * Prevents an attempt to save a non-existent `projectStatus` string field to the `Project` model, which violates the Prisma schema.
* **Details:**
    1. In `backend/src/types/project.types.ts`:
        * Change `ProjectCreateInput` interface: replace `projectStatus?: string;` with `statusId?: number;`.
    2. In `backend/src/controllers/project.controller.ts` (`createProject` method):
        * Update request body destructuring from `projectStatus` to `statusId`.
        * Use the provided `statusId`, defaulting to `1` if not sent by the client (matching Prisma schema default for `Project.statusId`).
        * Validate the `statusId` against the `Status` table using `prisma.status.findUnique({ where: { id: finalStatusId } })`.
        * Remove the line `projectStatus: statusStringToUse` from the `createData` object before calling `prisma.project.create()`.

### Seed Status Table for Project Creation

* **Decision 2:** Run the existing `seedStatus.ts` script to populate the Status table with required status records.
* **Rationale:**
  * The Status table was empty, causing the validation check for `statusId: 1` to fail even after fixing the DTO and controller.
  * The seed script already existed with the correct status definitions but hadn't been run.
* **Details:**
  * Executed `npx ts-node src/scripts/seedStatus.ts` to populate the Status table with:
        1. "Pending" (ID: 1) - Default status for new projects
        2. "In Progress" (ID: 2)
        3. "Completed" (ID: 3)
        4. "On Hold" (ID: 4)
        5. "Cancelled" (ID: 5)
  * The script uses `upsert` operations, making it safe to run multiple times without duplicating records.

### Overall Resolution

The combination of these two decisions resolves the project creation issues:

1. Frontend sends `statusId: 1` (or omits it to use the default)
2. Backend correctly validates this against the now-populated Status table
3. Project is created with the correct status relationship in the database

## 2025-05-18

### Fix Admin User Missing Permissions for /dashboard/users

* **Decision 1:** Identified that the admin user (`admin@nestup.com`, roleId: 1) has an empty `permissions` array, causing a redirect from `/dashboard/users` due to a failed `users.view` permission check.
* **Decision 2:** Determined that the script `backend/src/scripts/setupAdminRoleAndUser.ts` is the correct mechanism to grant all defined permissions to the admin role (ID: 1). This script ensures all permissions from `constants/permissions.ts` are in the `UserPermission` table, creates/updates the admin role (ID: 1), and maps all permissions to this role.
* **Rationale:** The issue likely stems from `setupAdminRoleAndUser.ts` not having been run, not completing successfully, or its effects being subsequently altered. Other seeding scripts like `seedRolesAndPermissions.ts` do not grant all permissions to a specific admin role.
* **Solution Path:** Advise the user to run `backend/src/scripts/setupAdminRoleAndUser.ts`.
