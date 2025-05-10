# Site Visit Box Routes (siteVisitBox.routes.ts) Analysis (as of 2025-05-11)

This document summarizes the key characteristics of `backend/src/routes/siteVisitBox.routes.ts`.

## Overview
The `siteVisitBox.routes.ts` file defines the Express router for API endpoints related to "Site Visit Box" configurations. These boxes are associated with tasks and allow for detailed data input, reordering, and generation of outputs like plank lists.

## Key Characteristics
*   **Controller Usage:** Uses the singleton instance `siteVisitBoxController` from `../controllers/siteVisitBox.controller.ts`.
*   **Authentication:** The `authMiddleware` (presumably `isAuthenticated`) is commented out (`// siteVisitBoxRouter.use(authMiddleware);`). This means, as of this analysis, all site visit box routes defined in this file are **publicly accessible**. This is a critical security consideration, especially for routes that modify data or generate outputs.
*   **OpenAPI Documentation:** Each route is extensively documented using JSDoc comments formatted for OpenAPI specification generation. These comments detail tags, summaries, descriptions, parameters (path and requestBody with schemas), and potential responses (including 401 Unauthorized, which is inconsistent with the current lack of applied authentication middleware).
*   **Controller Method Style:** Controller methods are directly assigned (e.g., `siteVisitBoxRouter.get(..., siteVisitBoxController.getBoxesByTask)`). This is suitable because the methods in `SiteVisitBoxController` are defined as arrow functions.

## Key Routes Defined

All routes are currently **public** due to commented-out authentication.

### Task-Scoped Routes:
*   **`GET /tasks/:taskId/site-visit/boxes`**
    *   Controller: `siteVisitBoxController.getBoxesByTask`
    *   Purpose: Retrieves all box configurations for a specific task.
*   **`POST /tasks/:taskId/site-visit/boxes`**
    *   Controller: `siteVisitBoxController.createBox`
    *   Purpose: Creates a new box configuration for a task.
*   **`POST /tasks/:taskId/site-visit/boxes/reorder`**
    *   Controller: `siteVisitBoxController.reorderBoxes`
    *   Purpose: Reorders boxes within a task.
*   **`POST /tasks/:taskId/site-visit/generate-planklist`**
    *   Controller: `siteVisitBoxController.generatePlankList`
    *   Purpose: Generates a combined plank list from all boxes in a task.
*   **`GET /tasks/:taskId/site-visit/download-planklist-csv`**
    *   Controller: `siteVisitBoxController.downloadPlankListCsv`
    *   Purpose: Downloads the combined plank list as a CSV file.

### Box-Specific Routes:
*   **`GET /site-visit/boxes/:boxId`**
    *   Controller: `siteVisitBoxController.getBoxById`
    *   Purpose: Retrieves a specific site visit box by its ID.
*   **`PUT /site-visit/boxes/:boxId`**
    *   Controller: `siteVisitBoxController.updateBox`
    *   Purpose: Updates a specific site visit box.
*   **`DELETE /site-visit/boxes/:boxId`**
    *   Controller: `siteVisitBoxController.deleteBox`
    *   Purpose: Deletes a specific site visit box.

## Dependencies
*   `express` (Router)
*   `../controllers/siteVisitBox.controller` (`siteVisitBoxController` instance)
*   `../middlewares/auth.middleware` (Imported as `authMiddleware` but its usage is commented out)

## Critical Observation
*   **Public Routes:** The most significant finding is that the authentication middleware is commented out, making all Site Visit Box operations publicly accessible. This should be reviewed immediately to determine if authentication is intended and, if so, to apply the `isAuthenticated` middleware.

## General Observations
*   The routes are well-documented with OpenAPI specifications.
*   The route structure logically groups operations by task and by individual box.
*   This router is typically mounted under a base path like `/api` in the main application setup.
