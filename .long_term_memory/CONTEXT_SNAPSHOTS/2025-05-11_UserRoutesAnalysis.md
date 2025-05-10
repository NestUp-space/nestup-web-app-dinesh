# User Routes (user.routes.ts) Analysis (as of 2025-05-11)

This document summarizes the key characteristics of `backend/src/routes/user.routes.ts`.

## Overview
The `user.routes.ts` file defines the Express router for API endpoints related to user management and profile retrieval. It maps HTTP requests to static methods of the `UserController`.

## Key Characteristics
*   **Controller Usage:** Uses static methods directly from the `UserController` class (e.g., `UserController.getCurrentUserProfile`).
*   **Global Authentication:** The `isAuthenticated` middleware (from `../middlewares/auth.middleware`) is applied globally to all routes defined in this router using `router.use(isAuthenticated)`. This ensures that a user must be authenticated to access any user-related endpoint.
*   **Route-Specific Authorization:**
    *   The `GET /profile` route is accessible to any authenticated user.
    *   All other user management routes (CRUD operations, status toggling, password updates, fetching users by role) have the `adminMiddleware` (from `../middlewares/admin.middleware`) applied individually, restricting these operations to users with administrative privileges.

## Key Routes Defined

*   **`GET /profile`**
    *   **Controller Function:** `UserController.getCurrentUserProfile`
    *   **Purpose:** Retrieves the profile of the currently authenticated user.
    *   **Middleware:** `isAuthenticated` (global to this router).

*   **Admin-Only Routes (all protected by `isAuthenticated` globally and `adminMiddleware` individually):**
    *   **`GET /`**
        *   Controller: `UserController.getUsers`
        *   Purpose: Retrieves a list of users (supports pagination and role filtering).
    *   **`POST /`**
        *   Controller: `UserController.createUser`
        *   Purpose: Creates a new user.
    *   **`PATCH /:id/toggle-active`**
        *   Controller: `UserController.toggleUserActiveStatus`
        *   Purpose: Toggles the active status of a user.
    *   **`PATCH /:id/update-password`**
        *   Controller: `UserController.updateUserPassword`
        *   Purpose: Updates a user's password.
    *   **`GET /by-role`**
        *   Controller: `UserController.getUsersByRole`
        *   Purpose: Retrieves users filtered by a specific role name.
    *   **`GET /:id`**
        *   Controller: `UserController.getUserById`
        *   Purpose: Retrieves a specific user by their ID.

## Dependencies
*   `express` (Router)
*   `../controllers/user.controller` (`UserController` class)
*   `../middlewares/admin.middleware` (`adminMiddleware`)
*   `../middlewares/auth.middleware` (`isAuthenticated`)

## General Observations
*   The routes provide comprehensive user management capabilities.
*   A clear distinction is made between general authenticated user access (for their own profile) and admin-restricted operations for managing all users.
*   This router is typically mounted under a base path like `/api/users` in the main application setup (e.g., `server.ts`).
