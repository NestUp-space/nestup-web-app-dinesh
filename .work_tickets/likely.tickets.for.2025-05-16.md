# Likely Tickets for 2025-05-16

## Ticket 1: Fix Project Creation API (400 Bad Request - Invalid Status)

- **Description:** Resolved an issue where project creation failed with a 400 Bad Request due to "Invalid project status: DRAFT". The frontend was sending `statusId` (number), while the backend DTO expected `projectStatus` (string) and incorrectly tried to look up "DRAFT" in the `Status` table. Additionally, the controller attempted to save a non-existent `projectStatus` field to the `Project` model.
- **Changes Made:**
    1. **`backend/src/types/project.types.ts`**:
        - Modified `ProjectCreateInput` interface to expect `statusId?: number;` instead of `projectStatus?: string;`.
    2. **`backend/src/controllers/project.controller.ts` (`createProject` method):**
        - Updated request body destructuring to get `statusId`.
        - Used the provided `statusId`, defaulting to `1` if not sent (matching Prisma schema default).
        - Validated `statusId` against the `Status` table.
        - Removed the attempt to save the non-existent `projectStatus: string` field to the `Project` model.
- **Timestamps:**
  - Assigned: 2025-05-16 11:15 AM
  - Started: 2025-05-16 11:23 AM
  - Completed: 2025-05-16 11:25 AM
- **Status:** Done
- **Assigned to:** cline
- **Assigned by:** user (implicitly via error report)
- **Updates:**
  - Initial investigation and fix implemented for 400 "Invalid project status: DRAFT" error.
  - **New Issue (2025-05-16 11:28 AM):** After fixing the 400 error, a 500 Internal Server Error started occurring, with the client reporting "SyntaxError: JSON.parse: unexpected character...".
  - **Debugging Step (2025-05-16 11:31 AM):** Modified the `catch` block in `project.controller.ts`'s `createProject` method to return a simplified, guaranteed-valid JSON error response. This is to help determine if the 500 error is due to error object serialization issues or a deeper problem. The MBK for `project.controller.ts` was updated to reflect this change.
  - **Root Cause & Fix (2025-05-16 11:39 AM):** The issue was that the Status table was empty, causing the validation check for `statusId: 1` to fail. The `seedStatus.ts` script existed but hadn't been run. Running `npx ts-node src/scripts/seedStatus.ts` successfully populated the Status table with the required statuses (ID 1-5: Pending, In Progress, Completed, On Hold, Cancelled).
  - **Additional Fix (2025-05-16 11:46 AM):** Fixed mismatched field handling in project creation:
    - Added `estimatedTime` and `vbCount` to the `ProjectCreateInput` DTO
    - Updated `createProject` controller to properly handle these fields
    - Added `projectIncludes` to the create response to include relations
    - Properly handle date conversion for `estimatedTime`
