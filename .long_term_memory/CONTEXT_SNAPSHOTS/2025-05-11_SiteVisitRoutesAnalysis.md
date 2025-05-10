# Site Visit Routes (site-visit.routes.ts) Analysis (as of 2025-05-11)

This document summarizes the key characteristics of `backend/src/routes/site-visit.routes.ts`.

## Overview

The `site-visit.routes.ts` file defines the Express router for the public API endpoint used for booking a site visit. It utilizes a specific validation middleware for the request body.

## Key Route Defined

* **`POST /book`**
  * **Controller Function:** `bookSiteVisit` (from `../controllers/siteVisit.controller`)
  * **Purpose:** Allows users (presumably external clients or prospects) to book a site visit.
  * **Middleware:**
    * `validateRequest(bookSiteVisitSchema)`: This middleware, imported from `../common/middleware/validateRequest`, is applied to validate the request body against the `bookSiteVisitSchema` (a Zod schema from `../validations/siteVisit.validation`). This ensures that the data submitted for booking a site visit conforms to the expected structure and types before the controller logic is executed.
  * **Authentication:** This route is **public** as no `isAuthenticated` middleware is applied, which is appropriate for an initial booking form.

## Dependencies

* `express` (Router)
* `../controllers/siteVisit.controller` (`bookSiteVisit` function)
* `../common/middleware/validateRequest` (`validateRequest` middleware)
* `../validations/siteVisit.validation` (`bookSiteVisitSchema` Zod schema)

## General Observations

* The route is singular, focused on the "book site visit" action.
* The use of a dedicated `validateRequest` middleware with a Zod schema (`bookSiteVisitSchema`) is a good practice for ensuring data integrity and providing clear validation errors.
* The public nature of the route is suitable for its purpose.
* This router is typically mounted under a base path like `/api/site-visit` in the main application setup (e.g., `server.ts`).
