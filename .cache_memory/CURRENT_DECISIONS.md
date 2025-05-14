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
