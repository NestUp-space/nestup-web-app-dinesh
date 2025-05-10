# Role Routes (role.routes.ts) Analysis (as of 2025-05-11)

This document summarizes the key characteristics of `backend/src/routes/role.routes.ts`.

## Overview

The `role.routes.ts` file defines the Express router for API endpoints related to managing user roles and permissions. It maps HTTP requests to static methods of the `RoleController`.

## Key Characteristics

* **Controller Usage:** Uses static methods directly from the `RoleController` class (e.g., `RoleController.createRole`).
* **Middleware Application:**
  * `router.use(isAuthenticated);`: This middleware is applied globally to all routes defined in this router, ensuring that a user must be authenticated to access any role management endpoint.
  * `router.use(adminMiddleware);`: This middleware is also applied globally to all routes in this router, further restricting access to users with administrative privileges (as determined by `adminMiddleware`).
* **Security:** All role management operations are protected and require admin-level access.

## Key Routes Defined

All routes below are protected by both `isAuthenticated` and `adminMiddleware`.

* **`POST /`**
  * **Controller Function:** `RoleController.createRole`
  * **Purpose:** Creates a new user role.

* **`GET /`**
  * **Controller Function:** `RoleController.getRoles`
  * **Purpose:** Retrieves a list of all user roles.

* **`GET /:id`**
  * **Controller Function:** `RoleController.getRoleById`
  * **Purpose:** Retrieves a specific user role by its ID.
  * **Request Parameter:** `id` (role ID).

* **`PUT /:id`**
  * **Controller Function:** `RoleController.updateRole`
  * **Purpose:** Updates an existing user role.
  * **Request Parameter:** `id` (role ID).

* **`DELETE /:id`**
  * **Controller Function:** `RoleController.deleteRole`
  * **Purpose:** Deletes a user role.
  * **Request Parameter:** `id` (role ID).

## Dependencies

* `express` (Router)
* `../controllers/role.controller` (`RoleController` class)
* `../middlewares/admin.middleware` (`adminMiddleware`)
* `../middlewares/auth.middleware` (`isAuthenticated`)

## General Observations

* The routes provide comprehensive CRUD capabilities for user roles.
* The application of both `isAuthenticated` and `adminMiddleware` globally to this router ensures strong access control for these sensitive operations.
* This router is typically mounted under a base path like `/api/roles` in the main application setup (e.g., `server.ts`).
