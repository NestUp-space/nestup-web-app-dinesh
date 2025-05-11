# Current Session Decisions Log (Append-Only)

---

**Decision ID:** 20250511-173500-TSCONFIG-FIX
**Timestamp:** 2025-05-11 05:35 PM (Asia/Calcutta)
**Context:** TypeScript error "Cannot find name 'process'" in `backend/prisma/seed.ts`. `@types/node` was installed, but `backend/tsconfig.json` had `compilerOptions.types` set to `["vitest/globals"]`, restricting other global types.
**Decision:** Modify `backend/tsconfig.json` to include `"node"` in the `compilerOptions.types` array.
**Rationale:** Explicitly adding `"node"` to the `types` array makes Node.js global types (like `process`) available to the TypeScript compiler, resolving the error.
**Affected Files:**
    - `backend/tsconfig.json` (Modified)
    - `backend/prisma/seed.ts` (Error resolved)
**Status:** Implemented
---

**Decision ID:** 20250511-175300-CATALOGUE-IMAGE-UPLOAD-API
**Timestamp:** 2025-05-11 05:53 PM (Asia/Calcutta)
**Context:** Need to implement backend API for uploading images for Catalogue Items (ModelDefinitions).
**Decision:**
    1. Added a new route `POST /catalogue/:modelId/image-upload` to `backend/src/catalogue/routes/model.routes.ts`.
    2. Used `isAuthenticated` middleware for authentication.
    3. Configured `multer` for in-memory storage and image file type filtering, using `upload.single('catalogueImage')` middleware.
    4. Added a new method `uploadModelImage(modelId: string, file: Express.Multer.File)` to `backend/src/catalogue/services/model.service.ts`.
    5. The `uploadModelImage` service method uses `uploadToS3` utility to upload the file to S3 and then updates the `imageUrl` field of the corresponding `ModelDefinition` record.
**Rationale:** Provides a dedicated, authenticated endpoint for catalogue item image uploads, leveraging existing S3 upload utilities and consistent service patterns.
**Affected Files:**
    - `backend/src/catalogue/routes/model.routes.ts` (Modified)
    - `backend/src/catalogue/services/model.service.ts` (Modified)
**Status:** Implemented
---
