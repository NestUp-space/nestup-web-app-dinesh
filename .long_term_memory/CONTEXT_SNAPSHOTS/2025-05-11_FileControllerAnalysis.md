# File Controller (file.controller.ts) Analysis (as of 2025-05-11)

This document summarizes the key functionalities and characteristics of `backend/src/controllers/file.controller.ts`.

## Overview
The `FileController` is responsible for handling HTTP requests related to file uploads and retrieval. It primarily interacts with `file.service.ts` to manage these operations. Files are associated with tasks via a `taskId`.

## Key Endpoints Handled (Inferred)

*   **`POST /files` (or similar, e.g., `/tasks/:taskId/files`)** (handled by `uploadFile` function)
    *   **Purpose:** Uploads a file and associates it with a task.
    *   **Request Type:** Expects `multipart/form-data`. Multer middleware is inferred to be used at the route level to process the uploaded file, making it available as `req.file`.
    *   **Request Body:** Expects `taskId` in the request body (`req.body.taskId`) to associate the file with a specific task.
    *   **Logic:**
        1.  Defines a local `CustomRequest` interface that extends `express.Request` to include `req.file?: Express.Multer.File`.
        2.  Checks if `req.file` exists. If not, returns HTTP 400 ("No file uploaded").
        3.  Calls `uploadFileService(Number(req.body.taskId), req.file)` from `../services/file.service`.
    *   **Response:**
        *   Success: HTTP 201 (`CREATED`) with JSON `{ file: fileMetadata }` (where `fileMetadata` is the result from the service).
        *   Failure: HTTP 400 (`BAD_REQUEST`) with JSON `{ message: errorMessage }`.

*   **`GET /tasks/:taskId/files` (or similar)** (handled by `getFiles` function)
    *   **Purpose:** Retrieves a list of files associated with a specific task.
    *   **Request Parameters:** Expects `taskId` as a route parameter (`req.params.taskId`).
    *   **Logic:**
        1.  Calls `getFilesService(Number(req.params.taskId))` from `../services/file.service`.
    *   **Response:**
        *   Success: HTTP 200 (`OK`) with JSON `{ files: fileList }` (where `fileList` is the result from the service).
        *   Failure: HTTP 400 (`BAD_REQUEST`) with JSON `{ message: errorMessage }`.

## Dependencies
*   `express` (Request, Response types)
*   `../services/file.service` (`uploadFileService`, `getFilesService`)
*   `multer` (imported for `Express.Multer.File` type, implying its use as middleware at the routing layer)

## Key Patterns & Observations
*   **Controller-Service Architecture:** Delegates file processing and storage logic to `file.service.ts`.
*   **Multer for File Uploads:** The use of `Express.Multer.File` type strongly indicates that Multer middleware is configured at the route level for handling `multipart/form-data` requests.
*   **Task Association:** Files are directly associated with tasks via `taskId`.
*   **Local `CustomRequest` Type:** This controller defines its own `CustomRequest` for `req.file`. This is distinct from the `CustomRequest` used in other controllers (like `auth.controller.ts` or `project.controller.ts`) which includes `req.user`. This might imply that file upload/retrieval endpoints handled by this controller do not pass through the standard authentication middleware, or that user context is not directly needed by these specific controller methods (though the service layer might still perform user-based authorization if needed).
*   **Error Handling:** Basic `try...catch` blocks that return HTTP 400 with the error message.

## Potential Areas for Review/Refinement
*   **Authentication/Authorization:** Clarify if authentication is required for file operations and how user-based authorization is handled (e.g., can any authenticated user upload/view files for any task, or are there ownership/project membership checks?). If auth is needed, using the standard `CustomRequest` with `req.user` might be more consistent.
*   **Input Validation:** While `taskId` is converted to a number, consider adding more robust validation for `taskId` (e.g., using Zod or checking if it's a positive integer) in both methods.
