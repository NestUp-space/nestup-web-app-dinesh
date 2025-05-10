# Site Visit Controller (siteVisit.controller.ts) Analysis (as of 2025-05-11)

This document summarizes the key functionalities and characteristics of `backend/src/controllers/siteVisit.controller.ts`.

## Overview
The `siteVisit.controller.ts` module exports a single asynchronous function, `bookSiteVisit`. This function handles the logic for booking a site visit, which involves creating or updating a user record and then creating an associated draft project with the site visit details.

## Key Endpoint Handled (Inferred)

*   **`POST /site-visits/book` (or a similar route)** (handled by `bookSiteVisit` function)
    *   **Purpose:** Allows users (potentially unauthenticated public users) to book a site visit.
    *   **Request Body:** Expects data conforming to the `BookSiteVisitInput` type (defined in `../validations/siteVisit.validation.ts`). This includes:
        *   `name` (string): User's name.
        *   `phone` (string): User's phone number.
        *   `projectName` (string): Name for the potential project.
        *   `projectAddress` (string): Address for the site visit/project.
        *   `projectLocation` (string): Location details for the site visit/project.
        *   `preferredSlot` (string/Date): Preferred date and time for the site visit.
    *   **Logic Flow:**
        1.  Extracts data from `req.body` and types it as `BookSiteVisitInput`.
        2.  Calls `createOrUpdateUser(name, phone)` from `../services/siteVisit.service` to find an existing user by phone number or create a new one.
            *   If user creation/retrieval fails (service returns null/undefined), it throws a `NotFoundError`.
        3.  Calls `createDraftProject(user.id, projectName, projectAddress, projectLocation, new Date(preferredSlot))` from `../services/siteVisit.service` to create a new project record, associating it with the user and storing the `preferredSlot` (converted to a Date object) likely in the project's `estimatedTime` field.
            *   If project creation fails (service returns null/undefined), it throws a `BadRequestError`.
        4.  On success, responds with HTTP status `StatusCodes.CREATED` (201). The JSON response includes a success message and summarized user and project details (e.g., user name/phone, project id/name/address/location/preferredSlot).
    *   **Error Handling:**
        *   Uses a `try...catch` block to handle errors.
        *   Specifically catches instances of `BadRequestError` and `NotFoundError` (custom error classes from `../common/errors/customErrors`) and responds with their respective `statusCode` and `message`.
        *   For any other errors, it logs the error and responds with `StatusCodes.INTERNAL_SERVER_ERROR` (500) and a generic failure message.
        *   **Important Note:** The `catch` block calls `next(error)` *after* potentially sending a response with `res.status().json()`. This could lead to a "headers already sent" error if the global error handler also tries to send a response. Typically, `next(error)` is used to delegate to an error middleware *without* the current handler sending a response.

## Dependencies
*   `express` (Request, Response, NextFunction types)
*   `../services/siteVisit.service` (for `createOrUpdateUser`, `createDraftProject` functions)
*   `http-status-codes` (for `StatusCodes`)
*   `../validations/siteVisit.validation` (for `BookSiteVisitInput` type)
*   `../common/errors/customErrors` (for `BadRequestError`, `NotFoundError`)

## Key Patterns & Observations
*   **Functional Controller:** This controller exports a single function rather than being class-based.
*   **Service Layer Delegation:** Core business logic (user creation/update, project creation) is delegated to `siteVisit.service`.
*   **Custom Error Handling:** Utilizes custom error classes (`BadRequestError`, `NotFoundError`) for more specific error reporting from the service layer or controller logic.
*   **Input Typing:** Uses `BookSiteVisitInput` type for the request body, implying validation might be handled by this type definition or at the service layer.
*   **No Explicit Authentication:** The `req` object is typed as `Request` (from Express) and not `CustomRequest` (from auth middleware). This suggests that the `bookSiteVisit` endpoint is likely intended to be unauthenticated, allowing public users to book site visits.
*   **Potential Issue in Error Handling:** The call to `next(error)` after `res.json()` in the `catch` block is a potential issue that might cause problems with Express error handling flow.

## Potential Areas for Review/Refinement
*   **Error Handling Flow:** Review the `next(error)` call in the `catch` block. If a response is sent, `next()` should typically not be called with an error, or the global error handler needs to be aware that headers might have already been sent.
*   **Input Validation:** While `BookSiteVisitInput` provides type information, ensure robust validation of all input fields (e.g., phone number format, date format for `preferredSlot`, string lengths) is performed, either in the controller (e.g., using Zod, as seen in `auth.controller.ts`) or consistently in the service layer.
*   **User Experience on Failure:** Consider if more specific error messages or codes should be returned for different failure scenarios in `createOrUpdateUser` or `createDraftProject` beyond generic "not found" or "bad request".
