# Session Decisions Log: 2025-05-13

## **Task: Enhance Item Logic Script UI for PLANKs in ModelBuilderForm**

1. **Initial UI Enhancements (2025-05-13 Morning/Afternoon):**
    * **Decision:** Enhance `CollapsibleVariables.tsx` for better variable display, including input types, default adjacency values, and improved styling. Remove "Sample Usage" section.
    * **Rationale:** Improve clarity and usability of the variable reference component.
    * **Decision:** Update `plankScripts.ts` to include new default calculation logic for all plank types (left, right, top, bottom, back, door) based on user-provided formulas.
    * **Rationale:** Ensure new models are pre-filled with correct, up-to-date logic.
    * **Decision:** Modify `BillOfMaterialListEditor.tsx` to auto-populate all standard plank types on new model creation.
    * **Rationale:** Streamline the model creation process for users.
    * **Decision:** Initially modify `PlankLogicEditor.tsx` to display the full `itemLogicScript`.
    * **Rationale:** First step towards allowing users to edit logic.

2. **Reversion of `PlankLogicEditor` to Individual Logic Fields (2025-05-13 Afternoon):**
    * **Decision:** Revert `PlankLogicEditor.tsx` from displaying the full `itemLogicScript` to having three separate `LogicInput.tsx` fields for "Width Calculation," "Length Calculation," and "Material Code Calculation."
    * **Rationale:** User feedback indicated that editing the full JavaScript script was too complex. Separating the logic into distinct, manageable parts was preferred.
    * **Decision:** Pre-fill these individual `LogicInput` fields with the default JavaScript calculation logic.
    * **Rationale:** Provide users with a working baseline that they can then customize.

3. **Development of `ExpressionInput.tsx` for User-Friendly Logic Entry (2025-05-13 Late Afternoon):**
    * **Decision:** Create a new component, `ExpressionInput.tsx`, to replace `LogicInput.tsx` for the plank calculation fields in `PlankLogicEditor.tsx`.
    * **Rationale:** To provide an even more user-friendly way to input and manage calculation logic, abstracting away direct JavaScript syntax for users not comfortable with it.
    * **Feature Set for `ExpressionInput.tsx`:**
        * Text area for logic input.
        * "Format" button: To automatically apply basic formatting (spacing, indentation) to the entered or pasted text.
        * "Show/Hide Code" toggle: Allows users to view a syntax-highlighted version of their entered expression, translating it into a more code-like appearance.
        * Syntax Highlighting (in preview mode): For keywords (if, else, return), runtimeInputs, globalConstants, operators, strings, and numbers.
        * Variable Chips: Display a subset of `runtimeInputs` as clickable chips that insert the variable name into the expression at the cursor position.
    * **Decision:** `PlankLogicEditor.tsx` to be updated to use three instances of `ExpressionInput.tsx`.
    * **Rationale:** This approach balances ease of use for non-technical users with transparency for those who want to see the underlying code structure.

---
*Previous decisions from 2025-05-12 are archived in LTM (`DECISION_LOG.md`)*

---

# Session Decisions Log: 2025-05-16

## **Task: Resolve CORS errors in frontend API calls**

1. **Investigation and Diagnosis (2025-05-16 Morning):**
    * **Decision:** Investigate CORS errors occurring for API calls to `http://localhost:8080` from the frontend (`http://localhost:3000`).
    * **Rationale:** Browser logs indicated failures for `/api/roles` and `/api/users/create` endpoints.
    * **Finding:** The issue was traced to `frontend/src/app/dashboard/users/roles/page.tsx` and `frontend/src/app/dashboard/users/[id]/page.tsx` using direct `fetch` calls with `process.env.NEXT_PUBLIC_API_BASE_URL`. This environment variable was incorrectly sourced from `frontend/.env` (value: `http://localhost:8080`) instead of the intended `NEXT_PUBLIC_API_URL` (value: `http://localhost:5001`) from `frontend/.env.local`.

2. **Resolution Strategy (2025-05-16 Morning):**
    * **Decision:** Refactor the direct `fetch` calls in the affected page components (`roles/page.tsx`, `[id]/page.tsx`) to use the existing centralized `apiClient` (`frontend/src/lib/api/client.ts`).
    * **Rationale:** The `apiClient` correctly uses `NEXT_PUBLIC_API_URL` and handles token authentication, ensuring consistency and correct API endpoint resolution.
    * **Decision:** Update the `NEXT_PUBLIC_API_BASE_URL` variable in `frontend/.env` from `http://localhost:8080` to `http://localhost:5001`.
    * **Rationale:** Align the fallback environment variable with the primary one to prevent future confusion, as per user request.

## **Task: Resolve 400 Bad Request on Create User Page**

1. **Investigation and Diagnosis (2025-05-16 Morning):**
    * **Decision:** Investigate `GET http://localhost:5001/api/users/create` returning 400 Bad Request: "Valid user ID parameter is required."
    * **Rationale:** This error occurred after fixing the previous CORS issue, indicating a problem with how the "create user" page (`/dashboard/users/create`) functions.
    * **Finding:** The `frontend/src/app/dashboard/users/[id]/page.tsx` component (which handles `/dashboard/users/create` when `id` is "create") was incorrectly attempting to fetch user details via `GET /api/users/create`. The backend route `GET /api/users/:id` expects a numeric ID for fetching user details, while user creation should be a `POST` request to `/api/users`.

2. **Resolution Strategy (2025-05-16 Morning):**
    * **Decision:** Modify `frontend/src/app/dashboard/users/[id]/page.tsx` to differentiate between "create" mode and "edit/view" mode.
    * **Rationale:** To prevent the erroneous `GET` request when `params.id` is "create" and to allow for the correct rendering of a create user form.
    * **Implementation:**
        * In the `useEffect` hook responsible for fetching user details, add a condition: if `userId === 'create'`, bypass the `apiClient.get` call and set component state appropriately for a new user form (e.g., `setUser(null)`, `setLoading(false)`).
        * Add a conditional rendering block: if `userId === 'create'`, display a placeholder for the "Create New User" form. The actual form implementation is a subsequent task.
    * **Rationale for Partial Fix:** The immediate goal is to stop the erroneous GET request. Full form implementation is a separate, larger effort.
