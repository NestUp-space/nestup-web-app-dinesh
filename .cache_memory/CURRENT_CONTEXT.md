# Current Session Context: 2025-05-12

**Active Task:** Phase 0.5 - Persistent Multi-Box UI & Plank List Generation. Currently paused debugging empty plank values, awaiting user input.

**Summary of Progress:**
- **Multi-Box UI (`ModelSelector.tsx`):**
  - Backend routes for `ProjectModelInstance` CRUD and batch operations are correctly mounted under `/api/projects/:projectId/model-instances`.
  - Frontend API calls in `ModelSelector.tsx` use these corrected paths.
  - `projectId` prop handling in `ModelSelector.tsx` is refined.
  - User confirmed individual box saving, updating, and deleting are working.
  - Initial fetching of box configurations is working.
  - A sample unit test for `ModelSelector.tsx` (save functionality) has been created (`frontend/src/components/dashboard/ModelSelector.test.tsx`). Full test coverage deferred.
  - A `simple-box-model-template.json` has been created as an example.
- **Plank List Generation:**
  - API call (`/api/bim/plank-generation/projects/:projectId`) is triggered correctly after `useApi` hook's refetch logic was fixed.
  - Plank list is generated and downloadable as CSV.
  - Backend `PlankGenerationService` correctly prefixes plank IDs with box numbers.
  - Frontend CSV generation is structured to handle prefixed IDs and box numbers.
  - **ISSUE:** Specific plank data fields (Width, Height, Material Code, etc.) are empty in the generated list and CSV.
  - **NEXT STEP (Paused):** Debug `itemLogicScript` within `BillOfMaterialItem` records. Awaiting example scripts and data from the user.
- **Lingering Issue:** An erroneous initial GET request to `/api/catalogue/project-instances/by-project/70` is still observed in browser logs. This does not seem to affect the primary functionality of `ModelSelector`'s data fetching or operations, which now use the correct `/api/projects/...` paths. This is a low-priority cleanup item.

**Pending Actions (Cline):**
1. Await user input (`itemLogicScript`, `details` JSON, `runtimeInputsJson`) to debug empty plank values.
2. Once plank values are populated, proceed to InputQA CSV Generation (Task 1.4 from Roadmap).
3. Address full unit test coverage for ModelSelector and related services when prioritized by the user.
4. Investigate and remove the source of the erroneous GET `/api/catalogue/project-instances/by-project/70` call when prioritized.
