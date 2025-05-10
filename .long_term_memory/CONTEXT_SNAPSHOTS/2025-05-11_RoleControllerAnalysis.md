# Role Controller (role.controller.ts) Analysis (as of 2025-05-11)

This document summarizes the key functionalities and characteristics of `backend/src/controllers/role.controller.ts`.

## Overview
The `RoleController` is a class-based controller with static methods responsible for managing user roles (`UserRole` model) and their associated permissions (via `UserPermission` and `RolePermissionMapping` models). A notable characteristic is its direct use of a locally instantiated Prisma client for all database operations, bypassing a dedicated service layer for this module.

## Key Characteristics
*   **Static Methods:** All controller methods (`createRole`, `getRoles`, `getRoleById`, `updateRole`, `deleteRole`) are static.
*   **Direct Prisma Usage:** The controller instantiates its own `PrismaClient` at the module level (`const prisma = new PrismaClient();`) and uses it directly for database interactions. This differs from other controllers that might use a shared Prisma instance or a service layer.
*   **Comprehensive Role & Permission Management:**
    *   **Creation:** Creates new roles and can simultaneously create associated permissions and their mappings. If a permission doesn't exist in `UserPermission`, it's created.
    *   **Retrieval:** Fetches roles with their assigned permissions, transforming the data into a user-friendly format (e.g., `{ "permissionName": true }`).
    *   **Update:** Updates role names. For permissions, it adopts a "delete all existing then create new" strategy for simplicity when updating a role's permission set.
    *   **Deletion:** Deletes roles.
*   **Superadmin Role Protection:** Includes specific checks to prevent modification or deletion of a role if its `roleType` is 'superadmin'.
*   **Deletion Constraint (User Assignment):** Prevents deletion of a role if any users are currently assigned to it by checking `prisma.user.count({ where: { roleId } })`.

## Key Endpoints Handled (Inferred)
*   **`POST /roles`** (handled by `RoleController.createRole`)
    *   Expects `name` (string, required) and `permissions` (object, e.g., `{ "view_users": true }`) in `req.body`.
*   **`GET /roles`** (handled by `RoleController.getRoles`)
*   **`GET /roles/:id`** (handled by `RoleController.getRoleById`)
    *   Expects `id` (number) in `req.params`.
*   **`PUT /roles/:id`** (handled by `RoleController.updateRole`)
    *   Expects `id` (number) in `req.params`.
    *   Expects optional `name` (string) and `permissions` (object) in `req.body`.
*   **`DELETE /roles/:id`** (handled by `RoleController.deleteRole`)
    *   Expects `id` (number) in `req.params`.

## Dependencies
*   `express` (Request, Response types)
*   `@prisma/client` (PrismaClient and generated types)
*   `http-status-codes` (for standardized HTTP status codes)

## Error Handling
*   Each method uses `try...catch` blocks.
*   Specific client-side errors are handled with appropriate status codes (e.g., `StatusCodes.BAD_REQUEST`, `StatusCodes.CONFLICT`, `StatusCodes.NOT_FOUND`, `StatusCodes.FORBIDDEN`).
*   Generic server-side errors caught in `catch` blocks log the error and return `StatusCodes.INTERNAL_SERVER_ERROR`.

## Potential Areas for Review/Refinement
*   **Prisma Client Instantiation:** Using a local `PrismaClient` instance in each module that needs DB access can lead to an excessive number of database connections if not managed carefully (e.g., if many such modules are loaded). The recommended practice is usually a single, shared PrismaClient instance for the application (as seen in `src/config/db.ts` used by other services). This deviation should be reviewed for consistency and potential performance implications.
*   **Service Layer Abstraction:** The direct use of Prisma in the controller couples controller logic tightly with data access logic. Introducing a `RoleService` could improve separation of concerns, make the controller thinner, and allow for easier unit testing of business logic independent of the database.
*   **Permission Deletion on Update:** The "delete all then create new" strategy for updating role permissions is simple but might not be the most efficient for minor changes, though for typical numbers of permissions per role, it's often acceptable.
*   **Cascade Deletes for Mappings:** When deleting a role, `RolePermissionMapping` entries are not explicitly deleted in the `deleteRole` method. This relies on database-level cascade deletes (if `ON DELETE CASCADE` is set on the foreign keys in `schema.prisma`) or risks orphaned records. Given `updateRole` *does* explicitly manage mappings, this is an inconsistency.
