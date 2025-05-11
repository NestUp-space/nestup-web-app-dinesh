# Current TODOs

## Catalogue Management - End-to-End Flow (Parent Ticket: TICKET-CATALOGUE-E2E-001)

- [ ] **Phase 1: Finalize Model Creation Flow (New Page)** (Sub-Ticket: TICKET-CATALOGUE-E2E-001-P1)
  - [ ] Task 1.1: Update `frontend/src/app/dashboard/catalogue/new/page.tsx`:
    - [ ] Import `useRouter` from `next/navigation`.
    - [ ] Implement `onSaveSuccess` handler to navigate to `/dashboard/catalogue`.
    - [ ] Implement `onCancel` handler to navigate to `/dashboard/catalogue`.
    - [ ] Pass handlers to `ModelBuilderForm` props.

- [ ] **Phase 2: Implement Catalogue List Page** (Sub-Ticket: TICKET-CATALOGUE-E2E-001-P2)
  - [ ] Task 2.1: Update `frontend/src/app/dashboard/catalogue/page.tsx`:
    - [ ] Import `useSWR`, `apiClient`, `Link`, and necessary UI components.
    - [ ] Define an interface for `ListedModelData` (id, modelType, description, imageUrl).
    - [ ] Implement SWR hook to fetch data from `/api/v1/catalogue`.
    - [ ] Display loading and error states.
    - [ ] Render a list/grid of fetched models:
      - [ ] Display model image (or placeholder).
      - [ ] Display model type/name.
      - [ ] Display model description.
      - [ ] Add "Edit" button linking to `/dashboard/catalogue/[modelId]/edit`.
    - [ ] Ensure "Create New Model" button is present and functional.

- [ ] **Phase 3: Finalize Model Edit Flow (Edit Page)** (Sub-Ticket: TICKET-CATALOGUE-E2E-001-P3)
  - [ ] Task 3.1: Update `frontend/src/app/dashboard/catalogue/[modelId]/edit/page.tsx`:
    - [ ] Import `useRouter` from `next/navigation`.
    - [ ] Implement `onSaveSuccess` handler to navigate to `/dashboard/catalogue`.
    - [ ] Implement `onCancel` handler to navigate to `/dashboard/catalogue`.
    - [ ] Pass handlers to `ModelBuilderForm` props.
    - [ ] Verify existing data fetching in `ModelBuilderForm` for edit mode.

- [ ] **Phase 4: Testing and Refinement** (Sub-Ticket: TICKET-CATALOGUE-E2E-001-P4)
  - [ ] Task 4.1: Test model creation flow.
  - [ ] Task 4.2: Test model listing and navigation to edit page.
  - [ ] Task 4.3: Test model editing flow.
  - [ ] Task 4.4: Address any UI/UX issues identified during testing.

---
*Previous tasks related to initial form setup and error fixing are considered complete and have been cleared from this active TODO list.*
