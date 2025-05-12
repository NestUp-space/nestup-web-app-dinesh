# Session Decisions Log: 2025-05-12

## **Task: Fix Login Error -> Roadmap Update -> Plan Persistent Multi-Box UI**

## **Task: Implement Persistent Multi-Box Configuration in ModelSelector UI**

1. **API Routing and `projectId` Handling (2025-05-12 4:20 PM):**
    * **Decision:** Mount `projectModelInstanceRoutes` under `/api/projects/:projectId/model-instances` in `backend/src/routes/project.routes.ts`.
    * **Rationale:** Aligns with RESTful practices for nested resources and resolves 404 errors.
    * **Frontend Impact:** Updated `ModelSelector.tsx` to use these new API paths. Refined `numericProjectId` derivation from props.
    * **Status:** Box saving confirmed working by user. Plank generation API call fixed by correcting `useApi` refetch logic.

2. **Plank List Generation - Empty Values (2025-05-12 5:20 PM):**
    * **Observation:** Plank list generates and CSV downloads, but specific plank data (Width, Height, MC) is empty.
    * **Hypothesis:** Issue lies in the `itemLogicScript` of `BillOfMaterialItem` records or the data passed to them.
    * **Decision:** Pause debugging this issue. Awaiting user to provide example `itemLogicScript`, `details` JSON, and `runtimeInputsJson` for a problematic model.
    * **Status:** Paused.

3. **Unit Testing (2025-05-12 5:18 PM):**
    * **Action:** Created a sample unit test file (`frontend/src/components/dashboard/ModelSelector.test.tsx`) with basic tests for save/update functionality.
    * **Decision:** Defer full unit test coverage as per user's preference to prioritize functional tasks.
    * **Status:** Sample created.

4. **Default Model Data (2025-05-12 5:18 PM):**
    * **Action:** Created `simple-box-model-template.json` as an example of prefilled data for creating a "Simple Box" model, as `ModelService.createModel` does not add defaults itself.
    * **Status:** Template file created.

1. **Login Issue Resolution (2025-05-12 12:11 PM):**
    * Login issue resolved (attributed to dev environment caching of `.env`). Debug log removed.
2. **Roadmap Reprioritization & Update (2025-05-12 11:20 AM - 11:28 AM):**
    * User requested roadmap update: Phase 0 marked done, Phase 1 reprioritized with new manufacturing outputs at top.
    * Action: `PROJECT_CONTEXT_AND_ROADMAP.md` updated.
3. **New Feature Request - Persistent Multi-Box UI (2025-05-12 12:19 PM onwards):**
    * **Requirement:** User wants `ModelSelector.tsx` to allow configuration of multiple "boxes" that persist in the backend.
    * **Chosen Approach (Scalable, Best Practice):**
        * Utilize existing `ProjectModelInstance` Prisma model.
        * Add a `uiDisplayOrder: Int? @default(0)` field to `ProjectModelInstance` for sequencing.
        * Store `inputValues` for each box in the `inputValuesJson` field of its `ProjectModelInstance` record.
        * Backend APIs:
            * `GET /api/catalogue/projects/{projectId}/model-instances` (fetches ordered by `uiDisplayOrder`).
            * `PUT /api/catalogue/projects/{projectId}/model-instances/batch` (for batch create/update/delete of instances, transactional).
        * Frontend `ModelSelector.tsx`:
            * State to manage an array of `BoxItem` objects.
            * Fetch existing config on load.
            * UI for add/remove/reorder/edit boxes.
            * "Save Box Setup" button to call the batch PUT API.
            * "Generate Plank List" to use client-side state (after encouraging save) and call `/bim/generate-plank-list` with an array of box data.
    * **Decision:** Proceed with this detailed plan. Document in roadmap, cache files, and create a new detailed work ticket.
