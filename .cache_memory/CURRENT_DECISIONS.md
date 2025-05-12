# Session Decisions Log: 2025-05-12

## **Task: Fix Login Error -> Roadmap Update -> Plan Persistent Multi-Box UI**

## **Task: Implement Persistent Multi-Box Configuration in ModelSelector UI**

1. **Implementation Approach (2025-05-12 3:34 PM):**
   * **Completed Components:**
     * Created reusable BoxComponent with proper UI indicators
     * Implemented individual box operations (save, delete, move)
     * Added validation to prevent plank generation with unsaved boxes
   * **Technical Decisions:**
     * Used isModified flag to track changes in box configurations
     * Implemented per-box error handling and loading states
     * Added box number prefixing for plank identifiers
   * **Status:** Core functionality implemented, awaiting bug reports and testing

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
