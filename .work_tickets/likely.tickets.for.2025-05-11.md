# Task: Update ModelSelector.tsx UI for Plank List

**Description:**

- Modify the button text from "Generate Plank List & Complete Subtask" to "Generate Plank List".
- Display the generated plank list in a downloadable CSV format.

**Timestamps:**

- Created: 2025-05-11
- Updated: 2025-05-11 (Added diagnostic logs to server.ts for bimRouter mounting)

**Status:** Blocked (Backend API Issue - Awaiting Diagnostic Results for Router Mounting)

**Assigned to:** User (Testing) / cline (Backend/Frontend)
**Assigned by:** user

**Files Affected:**

- `frontend/src/components/dashboard/ModelSelector.tsx`
- `backend/src/routes/bim.routes.ts` (Ping route added)
- `backend/src/bim/controllers/bim.controller.ts` (Diagnostic log added)
- `backend/src/server.ts` (Diagnostic logs added for `bimRouter` mounting)

**Backend Investigation & Fixes (2025-05-11):**

- **`POST /api/bim/generate-plank-list` (404 Error):**
  - User confirmed TS error in `bim.routes.ts` is resolved.
  - Ping route `GET /api/bim/ping-bim-debug` also returns 404, indicating `bimRouter` is not being mounted/reached correctly.
  - Added `console.log` statements in `server.ts` to inspect `bimRouter` object during application startup and mounting.
- **Catalogue Loading (`GET /v1/catalogue`):**
  - Confirmed working (304). Models should be loading in UI.
  - The 404 for `GET /api/catalogue/project-instances/by-project/70` is likely a separate, lower-priority issue.

**Next Steps:**

- **User - CRITICAL & IMMEDIATE:**
    1. **Fully STOP and RESTART backend server** to apply changes in `server.ts`.
    2. **Provide backend server terminal output from startup**, specifically the new logs:
        - `--- [SERVER.TS] Attempting to mount bimRouter ---`
        - `--- [SERVER.TS] typeof bimRouter: ...`
        - `--- [SERVER.TS] bimRouter object: ...`
        - `--- [SERVER.TS] bimRouter mounted for /api/bim ---`
    3. Test the ping route: `http://localhost:5001/api/bim/ping-bim-debug`. Report browser result and if its specific log appears in backend terminal.
- **Backend/Frontend (Cline):** Analyze server startup logs.
  - If `bimRouter` is undefined or not a function: Problem with import or file `bim.routes.ts`.
  - If `bimRouter` looks correct but ping still 404s: Deeper Express routing issue or server not running latest code.
