# Current TODOs: 2025-05-12

- **Task: Login Issue Resolution & Roadmap Update**
  - **Status:** Completed.
  - **Context:** Login fixed, main roadmap doc updated with reprioritization and new Phase 0.5.
  - **Next Steps (Cline):** Done with this specific meta-task.

- **Task: Implement Persistent Multi-Box Configuration in ModelSelector UI (New Feature - Phase 0.5 from Roadmap)**
  - **Status:** Pending. This is the new active high-level task.
  - **Context:** User requires `ModelSelector.tsx` to support multiple configurable boxes that are saved to/loaded from the backend using the `ProjectModelInstance` model (with a new `uiDisplayOrder` field). Each box should have individual save/delete functionality, and plank IDs should be prefixed with box numbers.
  
  - **Sub-Tasks (Backend - Phase 0.5.A):**
    - `0.5.A.1`: Modify `ProjectModelInstance` Prisma Model (add `uiDisplayOrder`), create/run migration. (Status: Completed)
    - `0.5.A.2`: Create Backend API Endpoints:
      - POST `/api/catalogue/projects/{projectId}/model-instances` (create one)
      - PUT `/api/catalogue/projects/{projectId}/model-instances/{instanceId}` (update one)
      - DELETE `/api/catalogue/projects/{projectId}/model-instances/{instanceId}` (delete one)
      - GET `/api/catalogue/projects/{projectId}/model-instances` (list all, ordered) (Status: Already Exists, Handles uiDisplayOrder, Uses uiDisplayOrder in DTOs)
    - `0.5.A.3`: Update Plank Generation Service to prefix plank IDs with box numbers (Status: Already Implemented)
  
  - **Sub-Tasks (Frontend - Phase 0.5.B):**
    - `0.5.B.1`: Update BoxItem Interface & State:
      - Add `dbId`, `isModified`, `isSaving`, `saveError` fields (Status: Completed)
      - Update state management for individual box operations (Status: Completed)
    - `0.5.B.2`: Extract Box Component:
      - Create reusable BoxComponent with save/delete buttons (Status: Completed)
      - Implement loading states and error handling per box (Status: Completed)
    - `0.5.B.3`: Implement Individual Box Operations:
      - Save This Box functionality (create/update) (Status: Completed)
      - Delete This Box functionality (Status: Completed)
      - Move Up/Down (local reordering) (Status: Completed)
    - `0.5.B.4`: Update "Generate Plank List":
      - Only allow generation when all boxes are saved (Status: Completed)
      - Use box numbers in plank identifiers (Status: Backend Verified, Frontend CSV already handles)
      - Update CSV download to handle prefixed plank IDs (Status: Frontend CSV already handles prefixed ID and box number columns)
      - **Investigate Empty Plank Values:** Plank list generates, but values (Width, Height, MC) are empty. Requires debugging `itemLogicScript` for PLANK `BillOfMaterialItem`s. (Status: Pending Investigation)

- **Task: Implement Box Number Prefixing in Plank IDs**
  - **Status:** New requirement, part of Phase 0.5
  - **Context:** When plank list is generated, each plank ID needs to be prefixed with its box number
  - **Implementation Details:**
    - Backend will prefix each plank's identifier with its box number during generation
    - Format: "{boxNumber}-{originalPlankId}"
    - Affects both plank list generation and CSV export
  - **Dependencies:**
    - Must be implemented alongside individual box save/delete functionality
    - Requires coordination between frontend box numbering and backend plank generation

- **Task: (From Updated Roadmap) Task 1.4: InputQA CSV Generation - Address API Issue**
  - **Status:** Addressed. (The "create planks api not returning 200 response" issue was likely due to refetch logic in `useApi` hook not bypassing the initial `skip` flag. This has been fixed. Plank generation API call should now work correctly.)
  - **Context:** Original issue: "create planks api not returing 200 response in the model selector ui needs resolution."

- **Detailed Implementation Plan for Plank List Generation Process**

  - **Backend Changes:**
    1. **Project Model Instance API Endpoints**
       - Create single instance endpoint (POST)
       - Update single instance endpoint (PUT)
       - Delete single instance endpoint (DELETE)
       - List all instances endpoint (GET)

    2. **BOM Item Logic**
       - Update plank generation to include box number in plank identifier
       - Modify context interface to include box number
       - Update generated plank interface

    3. **Plank List Generation Service**
       - Update to handle multiple boxes
       - Ensure box numbers are properly passed to BOM item service

    4. **API Response Types**
       - Update to include prefixed plank identifiers

  - **Frontend Changes:**
    1. **ModelSelector Component State**
       - Update BoxItem interface with new fields
       - Add state for tracking saving status and errors

    2. **Box Management Functions**
       - Implement individual box CRUD operations
       - Add error handling and loading states

    3. **Plank List Generation and CSV Export**
       - Update to handle prefixed plank identifiers
       - Add validation for unsaved boxes

    4. **UI Updates**
       - Extract Box component
       - Add individual save/delete buttons
       - Add loading indicators
       - Add error messages
