# Current TODOs

- **Task: Update ModelSelector.tsx UI for Plank List (Backend Investigation)**
  - Status: **Blocked - Backend API Issue - Awaiting Diagnostic Results for Router Mounting.**
  - **Context:**
    - User confirmed TypeScript error in `bim.routes.ts` is resolved.
    - `GET /api/v1/catalogue` is working; models should load in UI.
    - `POST /api/bim/generate-plank-list` and diagnostic `GET /api/bim/ping-bim-debug` are 404.
  - **Diagnostic Action Taken:** Added `console.log` statements in `backend/src/server.ts` to inspect `bimRouter` during startup and mounting.
  - **Next Steps (User - CRITICAL & IMMEDIATE):**
    1. **Fully STOP and RESTART Backend Server** to activate new logs in `server.ts`.
    2. **Provide Backend Server Terminal Output from Startup:** Capture and share the logs related to `bimRouter` mounting:
        - `--- [SERVER.TS] Attempting to mount bimRouter ---`
        - `--- [SERVER.TS] typeof bimRouter: ...`
        - `--- [SERVER.TS] bimRouter object: ...`
        - `--- [SERVER.TS] bimRouter mounted for /api/bim ---`
    3. **Test Ping Route:** Access `http://localhost:5001/api/bim/ping-bim-debug`. Report browser result and if its specific log (`--- /api/bim/ping-bim-debug HIT ---`) appears in backend terminal.
  - **Next Steps (Backend - Cline, based on diagnostic logs):**
    - Analyze server startup logs:
      - If `bimRouter` is `undefined` or not a function: Problem with the import `import bimRouter from "@/bim/routes/bim.routes";` in `server.ts` or an issue with the `bim.routes.ts` file itself (e.g., not exporting router correctly, or a runtime error during its import).
      - If `bimRouter` appears to be a valid router object: The issue might be more subtle, like middleware order or a very specific Express configuration problem.
    - Address the `/api/catalogue/project-instances/by-project/70` 404 if it's deemed relevant after confirming main catalogue loading.
