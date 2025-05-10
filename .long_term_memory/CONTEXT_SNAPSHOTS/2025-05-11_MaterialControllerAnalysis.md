# Material Controller (material.controller.ts) Analysis (as of 2025-05-11)

This document summarizes the key functionalities and characteristics of `backend/src/controllers/material.controller.ts`.

## Overview

The `MaterialController` is a class-based controller, exporting a singleton instance (`materialController`). It handles HTTP requests for CRUD operations on materials, which are associated with projects. It relies on `materialService` for business logic and uses a common `handleServiceResponse` utility for sending HTTP responses.

## Key Endpoints Handled (Inferred)

* **`POST /projects/:projectId/materials`** (handled by `createMaterial` method)
  * **Purpose:** Creates a new material for a specified project.
  * **Request:**
    * `projectId` from `req.params`.
    * Material data (conforming to `CreateMaterialDto` from `../bim/types/bim.types`) in `req.body`.
  * **Logic:**
        1. Casts `req` to `CustomRequest`.
        2. Parses `projectId` and validates it's a number.
        3. Calls `materialService.createMaterial(projectId, materialData)`.
        4. Uses `handleServiceResponse` to send the HTTP response.
  * **Error Handling:** Catches errors, logs them, and sends `INTERNAL_SERVER_ERROR`. `handleServiceResponse` likely handles service-level error statuses.

* **`GET /projects/:projectId/materials`** (handled by `getMaterialsByProject` method)
  * **Purpose:** Retrieves all materials associated with a specific project.
  * **Request:** `projectId` from `req.params`.
  * **Logic:**
        1. Casts `req` to `CustomRequest`.
        2. Parses `projectId` and validates it's a number.
        3. Calls `materialService.getMaterialsByProject(projectId)`.
        4. Uses `handleServiceResponse` to send the HTTP response.
  * **Error Handling:** Similar to `createMaterial`.

* **`GET /materials/:materialId`** (handled by `getMaterialById` method)
  * **Purpose:** Retrieves a specific material by its ID.
  * **Request:** `materialId` from `req.params`.
  * **Logic:**
        1. Casts `req` to `CustomRequest`.
        2. Parses `materialId` and validates it's a number.
        3. Calls `materialService.getMaterialById(materialId)`.
        4. Uses `handleServiceResponse` to send the HTTP response.
  * **Error Handling:** Similar to `createMaterial`.

* **`PUT /materials/:materialId`** (handled by `updateMaterial` method)
  * **Purpose:** Updates an existing material.
  * **Request:**
    * `materialId` from `req.params`.
    * Material data (conforming to `UpdateMaterialDto` from `../bim/types/bim.types`) in `req.body`.
  * **Logic:**
        1. Casts `req` to `CustomRequest`.
        2. Parses `materialId` and validates it's a number.
        3. Calls `materialService.updateMaterial(materialId, materialData)`.
        4. Uses `handleServiceResponse` to send the HTTP response.
  * **Error Handling:** Similar to `createMaterial`.

* **`DELETE /materials/:materialId`** (handled by `deleteMaterial` method)
  * **Purpose:** Deletes a material.
  * **Request:** `materialId` from `req.params`.
  * **Logic:**
        1. Casts `req` to `CustomRequest`.
        2. Parses `materialId` and validates it's a number.
        3. Calls `materialService.deleteMaterial(materialId)`.
        4. Uses `handleServiceResponse` to send the HTTP response.
  * **Error Handling:** Similar to `createMaterial`.

## Dependencies

* `express` (Request, Response types)
* `http-status-codes`
* `../services/material.service` (`materialService`)
* `../middlewares/auth.middleware` (`CustomRequest` type)
* `../common/utils/httpHandlers` (`handleServiceResponse` utility)
* `../bim/types/bim.types` (for `CreateMaterialDto`, `UpdateMaterialDto`)

## Key Patterns & Observations

* **Class-Based Controller with Singleton Export:** Standardizes controller structure.
* **Controller-Service Architecture:** Business logic is delegated to `materialService`.
* **Centralized Response Handling:** The `handleServiceResponse` utility is used for consistent HTTP response formatting based on service outcomes.
* **DTO Usage:** Types `CreateMaterialDto` and `UpdateMaterialDto` are used for request body data, though explicit validation (e.g., Zod) is not performed at the controller level. These DTOs are notably sourced from `bim/types`, which might be unusual if materials are a more general concept than BIM-specific.
* **Authentication Context:** `CustomRequest` is used, making `req.user` available, but it's not directly used for authorization checks within the controller methods. Authorization is likely handled by middleware or within the service layer.
* **Error Handling:** Basic `try...catch` blocks for unexpected errors, with primary reliance on `handleServiceResponse` for service-level success/failure reporting.

## Potential Areas for Review/Refinement

* **DTO Location:** Consider if DTOs for general materials (`CreateMaterialDto`, `UpdateMaterialDto`) should reside in a more common `dtos` directory rather than `bim/types` if they are not strictly BIM-specific.
* **Controller-Level Validation:** Adding explicit validation for request bodies (e.g., using Zod) within the controller could provide earlier error feedback and clearer API contracts, even if services also perform validation.
* **Authorization Checks:** Clarify where and how authorization is performed for material operations (e.g., ensuring a user can only manage materials for projects they have access to).
