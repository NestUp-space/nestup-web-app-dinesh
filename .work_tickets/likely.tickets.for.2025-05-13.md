# Work Tickets for 2025-05-13

## Ticket 1: Enhance Item Logic Script UI for PLANKs in ModelBuilderForm

- **Task Name:** Enhance Item Logic Script UI for PLANKs
- **Description:** Improve the user interface for defining `itemLogicScript` for PLANK items within the `ModelBuilderForm`. This includes creating a more user-friendly way to input calculation logic for width, length, and material code, moving away from requiring users to write full JavaScript functions directly.
- **Assigned to:** cline
- **Assigned by:** user
- **Status:** Done
- **Timestamps:**
  - Created: 2025-05-13
  - Started: 2025-05-13
  - Completed: 2025-05-13
- **Updates:**
  - **Initial Enhancements:**
    - `CollapsibleVariables.tsx`: Improved variable display, added input types, updated default adjacency, enhanced styling, removed "Sample Usage".
    - `plankScripts.ts`: Updated with new default calculation logic for all plank types.
    - `BillOfMaterialListEditor.tsx`: Modified to auto-populate all standard plank types and resolved `BomItemType` import.
    - `PlankLogicEditor.tsx`: Initially modified to display full `itemLogicScript`.
  - **Reversion to Individual Logic Fields:**
    - `PlankLogicEditor.tsx`: Reverted to use three separate `LogicInput.tsx` fields for Width, Length, and Material Code calculations, with pre-filled default JavaScript logic.
  - **Development of `ExpressionInput.tsx`:**
    - Created new `ExpressionInput.tsx` component featuring:
      - Text area for simplified logic input.
      - "Format" button for code beautification.
      - "Show/Hide Code" toggle with syntax highlighting (keywords, variables, constants, etc.).
      - Clickable runtime variable chips for easy insertion.
  - **Final Integration:**
    - `PlankLogicEditor.tsx`: Updated to use three instances of the new `ExpressionInput.tsx` for width, length, and material code logic.
- **Affected Files:**
  - `frontend/src/components/dashboard/model-management/CollapsibleVariables.tsx`
  - `frontend/src/components/dashboard/model-management/plankScripts.ts`
  - `frontend/src/components/dashboard/model-management/BillOfMaterialListEditor.tsx`
  - `frontend/src/components/dashboard/model-management/PlankLogicEditor.tsx`
  - `frontend/src/components/dashboard/model-management/LogicInput.tsx` (initially used, then replaced by ExpressionInput for this task)
  - `frontend/src/components/dashboard/model-management/ExpressionInput.tsx` (newly created)

## Ticket 2: Await User for Next UI Changes

- **Task Name:** Standby for further UI modification requests
- **Description:** User has indicated more UI changes are planned. Awaiting specific instructions.
- **Assigned to:** cline
- **Assigned by:** user
- **Status:** Pending
- **Timestamps:**
  - Created: 2025-05-13
- **Updates:** None yet.

## Ticket 3: Re-evaluate Empty Plank Values in Plank List Generation

- **Task Name:** Investigate Empty Plank Data in CSV Output
- **Description:** The issue of empty data fields (Width, Height, etc.) in the generated plank list CSV needs to be re-evaluated in light of the new `ExpressionInput.tsx` and how `itemLogicScript` is constructed.
- **Assigned to:** cline
- **Assigned by:** user
- **Status:** Pending
- **Timestamps:**
  - Created: 2025-05-13 (carried over from previous context)
- **Updates:**
  - This task is dependent on the new logic input mechanism. Investigation will proceed once the current UI work is stable and testable.
