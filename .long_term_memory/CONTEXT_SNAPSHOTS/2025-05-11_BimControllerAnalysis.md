# BIM Controller (bim.controller.ts) Analysis (as of 2025-05-11)

This document summarizes the key functionalities and characteristics of `backend/src/controllers/bim.controller.ts`.

## Overview

The `BimController` is a class-based controller responsible for handling HTTP requests related to Building Information Modeling (BIM) functionalities. This includes retrieving BIM model templates and generating plank lists based on selected models and inputs. It utilizes a `BimService` for core logic and interacts with `SubtaskRepository` to update related subtasks.

## Key Endpoints Handled (from OpenAPI comments & method names)

* **`GET /api/bim/model-templates`** (handled by `getModelTemplates` method)
  * **Purpose:** Retrieves all available BIM model templates.
  * **Logic:**
        1. Casts `req` to `CustomRequest` (though `req.user` is not explicitly used in this method's current logic, it's available for future enhancements like role-based access).
        2. Calls `this.bimService.getModelTemplates()` to fetch the templates.
        3. Logs the templates to be sent (debug log).
        4. Responds with a JSON array of `ModelTemplate` objects and HTTP status 200.
  * **Error Handling:** Catches errors and passes them to the global Express error handler via `next(error)`.

* **`POST /api/bim/generate-plank-list`** (handled by `generatePlankListAndUpdateSubtask` method)
  * **Purpose:** Generates a plank list based on a selected BIM model and runtime inputs, then updates a specified subtask with the results.
  * **Request Body Schema (expected):**
    * `modelName` (string, required)
    * `inputs` (object, required): Key-value pairs of runtime inputs for the model.
    * `subtaskId` (integer, required): ID of the subtask to update.
    * `boxNumber` (string, required): Box number for plank ID generation.
    * `packetNumber` (string, required): Packet number for plank ID generation.
  * **Logic:**
        1. Casts `req` to `CustomRequest`.
        2. Validates the presence of required parameters in `req.body`. If missing, responds with HTTP 400.
        3. Calls `this.bimService.generatePlankList(modelName, inputs, boxNumber, packetNumber)` to get the plank list.
        4. Calls `this.subtaskRepository.update(subtaskId, updatePayload)` to:
            *Store the generated plank list in the subtask's `metadataJson` (e.g., `{ plankListGenerated: true, generatedPlanks: plankList }`).
            * Mark the subtask as `completed: true`.
        5. If subtask update fails (e.g., subtask not found), responds with HTTP 404.
        6. Responds with a success message, the generated `plankList`, and HTTP status 200.
  * **Error Handling:** Catches errors and passes them to the global Express error handler via `next(error)`. Handles specific 400/404 cases directly.

## Dependencies

* `express` (Request, Response, NextFunction types)
* `../middlewares/auth.middleware` (`CustomRequest` type)
* `../services/bim.service` (`BimService`, `ModelTemplate` type)
* `../repositories/subtask.repository` (`SubtaskRepository` singleton instance `globalSubtaskRepository`)
* `../config/db` (`prisma` - though not directly used by controller, likely by repository)

## Key Patterns & Observations

* **Class-Based Controller:** Organizes related request handlers as methods of a class.
* **Service Injection/Initialization:** `BimService` is instantiated in the constructor. `SubtaskRepository` uses an imported singleton.
* **OpenAPI Documentation:** JSDoc comments are used to define OpenAPI specifications for the endpoints, facilitating API documentation.
* **Global Error Handling:** Uses `next(error)` to delegate unhandled errors to a centralized Express error handler.
* **Direct Repository Interaction:** The `generatePlankListAndUpdateSubtask` method directly calls `subtaskRepository.update()`. While pragmatic for this specific workflow, in a stricter layered architecture, this update might go through a `SubtaskService`.
* **Data Storage in Metadata:** Generated plank lists are stored within the `metadataJson` field of the `Subtask` model.

## Potential Areas for Review/Refinement

* Consider if the direct update to `SubtaskRepository` from the controller aligns with the overall architectural strategy for service layer responsibilities.
* Ensure robust validation of the `inputs` object in `generatePlankListAndUpdateSubtask`, possibly using Zod schemas if the structure is complex or varies.
