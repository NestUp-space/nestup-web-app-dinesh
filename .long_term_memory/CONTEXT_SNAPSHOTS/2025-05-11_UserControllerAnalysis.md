# User Controller (user.controller.ts) Analysis (as of 2025-05-11)

This document summarizes the key functionalities and characteristics of `backend/src/controllers/user.controller.ts`.

## Overview
The `UserController` is a class-based controller with static methods. It is responsible for handling HTTP requests related to user management, including user creation, retrieval (all users with pagination, by ID, by role, current user's profile), toggling active status, and updating passwords. It delegates business logic to a static `UserService`.

## Key Characteristics & Endpoints Handled (Inferred)

*   **Static Methods:** All controller methods are static (e.g., `UserController.createUser`).
*   **Service Layer Delegation:** All operations are delegated to static methods on `UserService`.
*   **Local `CustomRequest` Definition:**
    ```typescript
    interface CustomRequest extends Request {
      user?: {
        id: number;
        role: string; // Likely roleType, e.g., "admin", "superadmin"
      };
    }
    ```
    This is used in `updateUserPassword` and `getCurrentUserProfile`. The `user.role` being a simple `string` here is inconsistent with the `CustomRequest` from `auth.middleware.ts` where `req.user.role` is an object (`{ id: number; roleType: string; }`). This inconsistency should be addressed.

*   **Endpoints:**
    *   **`POST /users`** (handled by `createUser`)
        *   **Purpose:** Creates a new user.
        *   **Request Body:** Expects `{ email, password, name, phoneNumber, roleId }`.
        *   **Response:** 201 CREATED with new user data.
    *   **`GET /users`** (handled by `getUsers`)
        *   **Purpose:** Retrieves a paginated list of users, optionally filtered by `roleName`.
        *   **Query Params:** `page` (number, default 1), `pageSize` (number, default 10), `roleName` (string, optional).
        *   **Response:** 200 OK with `{ data: { users, total } }`.
    *   **`PATCH /users/:id/status`** (handled by `toggleUserActiveStatus`)
        *   **Purpose:** Activates or deactivates a user.
        *   **Request Params:** `id` (user ID).
        *   **Request Body:** Expects `{ isActive: boolean }`.
        *   **Logic:** Contains a check intended to prevent disabling 'superadmin'. The current logic `if (!user || user.role.roleType !== 'superadmin')` seems flawed for this purpose. It should likely be `if (user && user.role.roleType === 'superadmin')` to prevent action, or if the intent is to *only* allow superadmin to be toggled, the logic is reversed. The `!user` part could lead to a 403 FORBIDDEN instead of a 404 NOT_FOUND if the user doesn't exist.
        *   **Response:** 200 OK with updated user data.
    *   **`PATCH /users/:id/password`** (handled by `updateUserPassword`)
        *   **Purpose:** Updates a user's password.
        *   **Request Params:** `id` (user ID).
        *   **Request Body:** Expects `{ newPassword: string }`.
        *   **Authorization:** Explicitly checks if `requestingUser.role` (from local `CustomRequest`) is 'superadmin' or 'admin'.
        *   **Response:** 200 OK with updated user data.
    *   **`GET /users/:id`** (handled by `getUserById`)
        *   **Purpose:** Retrieves a specific user by ID.
        *   **Request Params:** `id` (user ID).
        *   **Response:** 200 OK with user data, or 404 NOT_FOUND.
    *   **`GET /users/me` (or `/profile`)** (handled by `getCurrentUserProfile`)
        *   **Purpose:** Retrieves the profile of the currently authenticated user.
        *   **Logic:** Uses `req.user.id` from the local `CustomRequest`.
        *   **Response Handling:** Directly uses properties from the `ServiceResponse` object (e.g., `serviceResponse.statusCode`, `serviceResponse.success`) to construct the HTTP response, rather than using the `handleServiceResponse` utility.
        *   **Response:** Based on service response, typically 200 OK with user profile data.
    *   **`GET /users/by-role`** (handled by `getUsersByRole`)
        *   **Purpose:** Retrieves users filtered by a specific role name.
        *   **Query Params:** `roleName` (string, required).
        *   **Response:** 200 OK with an array of user data.

## Dependencies
*   `express` (Request, Response types)
*   `../services/user.service` (`UserService`)
*   `http-status-codes`

## Error Handling
*   Standard `try...catch` blocks.
*   Generic errors result in HTTP 500 (Internal Server Error).
*   Specific client errors (400, 401, 403, 404) are handled with appropriate status codes and messages.

## Potential Areas for Review/Refinement
*   **`CustomRequest` Inconsistency:** The local `CustomRequest` definition (especially `user.role: string`) should be reconciled with the global `CustomRequest` from `auth.middleware.ts` (`user.role: { id: number; roleType: string; }`) to ensure type safety and consistent access to authenticated user details.
*   **Logic in `toggleUserActiveStatus`:** The condition to protect the 'superadmin' role (`if (!user || user.role.roleType !== 'superadmin')`) needs review as it seems logically flawed for its stated purpose.
*   **Response Handling in `getCurrentUserProfile`:** Consider using the `handleServiceResponse` utility for consistency, if applicable, instead of manually constructing the response from service object properties.
*   **Authorization Granularity:** While `updateUserPassword` has role checks, review if other user management endpoints require more granular authorization (e.g., can any admin toggle status/update password for any other user, including other admins or superadmins?).
