# File Routes (file.routes.ts) Analysis (as of 2025-05-11)

This document summarizes the key characteristics of `backend/src/routes/file.routes.ts`.

## Overview
The `file.routes.ts` file defines the Express router for API endpoints related to file management, specifically for uploading files and retrieving files associated with tasks.

## Key Routes Defined

*   **`POST /upload`**
    *   **Controller Function:** `uploadFile` (from `../controllers/file.controller`)
    *   **Purpose:** Handles file uploads. The associated controller logic expects `req.body.taskId` to link the file to a task.
    *   **Middleware:** `isAuthenticated` (from `../middlewares/auth.middleware`).
    *   **Note on Multer:** The `file.controller.uploadFile` function expects `req.file` to be populated, which is typically done by Multer middleware. However, the Multer middleware setup for parsing `multipart/form-data` is not explicitly shown in this route definition. This setup must exist elsewhere (e.g., applied globally before this router, or more commonly, applied specifically to this route where this router is used or within this file) for the file upload to function correctly.

*   **`GET /:taskId`**
    *   **Controller Function:** `getFiles` (from `../controllers/file.controller`)
    *   **Purpose:** Retrieves files associated with a specific `taskId`.
    *   **Request Parameter:** `taskId` is expected as a route parameter.
    *   **Middleware:** `isAuthenticated`.

## Middleware
*   Both defined routes (`/upload` and `/:taskId`) are protected by the `isAuthenticated` middleware, ensuring that only authenticated users can perform file operations.

## Dependencies
*   `express` (Router)
*   Controller functions (`uploadFile`, `getFiles`) from `../controllers/file.controller`.
*   `isAuthenticated` middleware from `../middlewares/auth.middleware`.

## General Observations
*   The routes provide basic file management capabilities linked to tasks.
*   The primary point for review is ensuring that Multer middleware is correctly configured and applied to the `POST /upload` route to handle the `multipart/form-data` and populate `req.file` as expected by the controller.
*   This router is typically mounted under a base path like `/api/files` in the main application setup (e.g., `server.ts`).
