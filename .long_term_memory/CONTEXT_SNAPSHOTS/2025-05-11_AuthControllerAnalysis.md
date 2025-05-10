# Authentication Controller (auth.controller.ts) Analysis (as of 2025-05-11)

This document summarizes the key functionalities and characteristics of `backend/src/controllers/auth.controller.ts`.

## Key Endpoints Handled (Inferred from functions)
*   `POST /auth/register` (handled by `register` function)
*   `POST /auth/login` (handled by `login` function)
*   `POST /auth/reset-password-request` (handled by `handlePasswordResetRequest` function)

## Request Handling Flow (Common Pattern)
1.  Receives `Request` and `Response` objects from Express.
2.  Validates `req.body` using a corresponding Zod schema (`RegisterBodySchema`, `LoginBodySchema`, `EmailBodySchema`).
3.  If validation fails, returns `StatusCodes.BAD_REQUEST` with detailed error messages.
4.  If validation succeeds, calls the appropriate function from `auth.service.ts` with the validated data.
5.  Constructs and sends an HTTP JSON response based on the `ServiceResponse` object returned by the service layer. This includes the HTTP status code, a success flag, a message, and relevant data (e.g., user object without password, JWT token).

## Key Zod Schemas Used for Validation
*   **`RegisterBodySchema`:**
    *   `name`: string, min 1 char
    *   `email`: string, valid email format
    *   `phoneNumber`: string, regex `^\d{10}$` (10 digits)
    *   `password`: string, min 8 chars
    *   `roleName`: string, defaults to 'client'
*   **`LoginBodySchema`:**
    *   `email`: string, valid email format
    *   `password`: string, min 1 char
*   **`EmailBodySchema`:** (for password reset request)
    *   `email`: string, valid email format

## Dependencies
*   `express`: Web framework.
*   `http-status-codes`: For standardized HTTP status codes.
*   `zod`: For input validation.
*   `../services/auth.service`: Contains the business logic for authentication.
*   `@/common/models/serviceResponse`: Custom type for standardized service layer responses.

## Noted TODOs
*   A controller function for handling the actual password reset (e.g., verifying a reset token and updating the password) is needed.
