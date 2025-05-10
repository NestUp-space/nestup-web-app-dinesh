# Site Visit Box Controller (siteVisitBox.controller.ts) Analysis (as of 2025-05-11)

This document summarizes the key functionalities and characteristics of `backend/src/controllers/siteVisitBox.controller.ts`.

## Overview
The `SiteVisitBoxController` is a class-based controller, exporting a singleton instance (`siteVisitBoxController`). It manages HTTP requests for "Site Visit Boxes," which appear to be configurable units associated with tasks, likely for collecting site-specific data or generating outputs like plank lists. The controller handles CRUD operations for these boxes, supports reordering them within a task, and provides functionality to generate a combined plank list from all boxes in a task, including an option to download this list as a CSV file.

## Key Endpoints Handled (Inferred)

*   **`POST /tasks/:taskId/site-visit-boxes`** (handled by `createBox` method)
    *   **Purpose:** Creates a new site visit box configuration for a specified task.
    *   **Request:** `taskId` from `req.params`; box data (conforming to `CreateSiteVisitBoxDto` from `../bim/types/bim.types`) in `req.body`.
    *   **Logic:** Parses `taskId`, calls `siteVisitBoxService.createSiteVisitBox()`, uses `handleServiceResponse`.

*   **`GET /tasks/:taskId/site-visit-boxes`** (handled by `getBoxesByTask` method)
    *   **Purpose:** Retrieves all site visit boxes for a specific task.
    *   **Request:** `taskId` from `req.params`.
    *   **Logic:** Parses `taskId`, calls `siteVisitBoxService.getBoxesByTask()`, uses `handleServiceResponse`.

*   **`GET /site-visit-boxes/:boxId`** (handled by `getBoxById` method)
    *   **Purpose:** Retrieves a specific site visit box by its ID.
    *   **Request:** `boxId` from `req.params`.
    *   **Logic:** Parses `boxId`, calls `siteVisitBoxService.getBoxById()`, uses `handleServiceResponse`.

*   **`PUT /site-visit-boxes/:boxId`** (handled by `updateBox` method)
    *   **Purpose:** Updates an existing site visit box.
    *   **Request:** `boxId` from `req.params`; box data (conforming to `UpdateSiteVisitBoxDto` from `../bim/types/bim.types`) in `req.body`.
    *   **Logic:** Parses `boxId`, calls `siteVisitBoxService.updateBox()`, uses `handleServiceResponse`.

*   **`DELETE /site-visit-boxes/:boxId`** (handled by `deleteBox` method)
    *   **Purpose:** Deletes a site visit box.
    *   **Request:** `boxId` from `req.params`.
    *   **Logic:** Parses `boxId`, calls `siteVisitBoxService.deleteBox()`, uses `handleServiceResponse`.

*   **`PATCH /tasks/:taskId/site-visit-boxes/reorder`** (handled by `reorderBoxes` method)
    *   **Purpose:** Reorders site visit boxes within a task.
    *   **Request:** `taskId` from `req.params`; `{ orderedIds: number[] }` in `req.body`.
    *   **Logic:** Parses `taskId`, validates `orderedIds` is an array, calls `siteVisitBoxService.reorderBoxes()`, uses `handleServiceResponse`.

*   **`GET /tasks/:taskId/site-visit-boxes/plank-list`** (handled by `generatePlankList` method)
    *   **Purpose:** Generates a combined plank list from all site visit boxes associated with a task.
    *   **Request:** `taskId` from `req.params`.
    *   **Logic:** Parses `taskId`, calls `siteVisitBoxService.generateCombinedPlankList()`, uses `handleServiceResponse`.

*   **`GET /tasks/:taskId/site-visit-boxes/plank-list/download`** (handled by `downloadPlankListCsv` method)
    *   **Purpose:** Generates and provides a combined plank list as a downloadable CSV file.
    *   **Request:** `taskId` from `req.params`.
    *   **Logic:**
        1.  Parses `taskId`.
        2.  Calls `siteVisitBoxService.generateCombinedPlankList()`.
        3.  If successful, **manually constructs a CSV string from the plank list data within the controller method.**
        4.  Sets `Content-Type: text/csv` and `Content-Disposition: attachment; filename="planklist.csv"` headers.
        5.  Sends the CSV data via `res.send(csv)`.
    *   **Note:** Imports `formatCutListAsCsv` from `../bim/reference/CreateCutlist` but does not use it in this method.

## Dependencies
*   `express` (Request, Response types)
*   `http-status-codes`
*   `../services/siteVisitBox.service` (`siteVisitBoxService`)
*   `../common/utils/httpHandlers` (`handleServiceResponse` utility)
*   `../bim/types/bim.types` (for `CreateSiteVisitBoxDto`, `UpdateSiteVisitBoxDto`)
*   `../bim/reference/CreateCutlist` (for `formatCutListAsCsv`, though currently unused in `downloadPlankListCsv`)

## Key Patterns & Observations
*   **Class-Based Controller with Singleton Export.**
*   **Controller-Service Architecture:** Delegates most logic to `siteVisitBoxService`.
*   **Centralized Response Handling:** Uses `handleServiceResponse` for most JSON API responses.
*   **DTO Usage:** DTOs are sourced from `bim/types`, similar to `MaterialController`.
*   **CSV Generation in Controller:** The `downloadPlankListCsv` method contains logic to format data into CSV directly. This is a deviation from keeping controllers strictly for request/response orchestration.
*   **Authentication Context:** Uses standard Express `Request` type, not `CustomRequest`. This suggests these endpoints might not be directly protected by the standard user authentication middleware, or user context is handled differently.
*   **Unused Import:** `formatCutListAsCsv` is imported but not utilized in the `downloadPlankListCsv` method, which implements its own CSV formatting.

## Potential Areas for Review/Refinement
*   **CSV Generation Logic:** Consider moving the CSV formatting logic from `downloadPlankListCsv` into a utility function (like the imported but unused `formatCutListAsCsv`) or into the service layer to keep the controller thinner and logic more reusable.
*   **Authentication/Authorization:** Clarify if and how authentication/authorization is applied to these endpoints. If user context is needed (e.g., to ensure a user can only access boxes for tasks they are assigned to), the standard `CustomRequest` and auth middleware should be used.
*   **DTO Location:** Similar to `MaterialController`, review if DTOs in `bim/types` is the most appropriate location if "Site Visit Boxes" have a broader application.
*   **Error Handling in CSV Download:** Ensure robust error handling if `siteVisitBoxService.generateCombinedPlankList()` fails within `downloadPlankListCsv`, before attempting to set headers or send data.
