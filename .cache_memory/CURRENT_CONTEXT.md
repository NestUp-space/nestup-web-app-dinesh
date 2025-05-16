## Current Task: Resolve API errors on user pages

**Summary of Work (2025-05-16):**

* **Initial Issue (CORS):** Frontend making API calls to `http://localhost:8080` for `/api/roles` and `/api/users/create`, resulting in CORS errors. Main backend is on `http://localhost:5001`.
  * **Cause:** Usage of `NEXT_PUBLIC_API_BASE_URL` (from `frontend/.env`, value `http://localhost:8080`) in direct `fetch` calls in `roles/page.tsx` and `[id]/page.tsx`, instead of `NEXT_PUBLIC_API_URL` (from `frontend/.env.local`, value `http://localhost:5001`).
  * **Resolution (Completed):**
    * Refactored affected pages to use centralized `apiClient`.
    * Updated `frontend/.env` to align `NEXT_PUBLIC_API_BASE_URL` with `http://localhost:5001`.

* **New Issue (400 Bad Request on Create User Page):** After fixing CORS, navigating to `/dashboard/users/create` resulted in a `GET http://localhost:5001/api/users/create` call, which returned a 400 Bad Request: "Valid user ID parameter is required."
  * **Cause:** The `frontend/src/app/dashboard/users/[id]/page.tsx` component was attempting to fetch user details even when `params.id` was "create". The backend route `GET /api/users/:id` expects a numeric ID.
  * **Investigation:**
    * Confirmed `frontend/src/app/dashboard/users/[id]/page.tsx` calls `apiClient.get(\`/users/\${userId}\`)` unconditionally if `userId` is present.
    * Confirmed backend route `GET /api/users/:id` (in `backend/src/routes/user.routes.ts`) is for fetching a user by a numeric ID, and `POST /api/users` is for creating users.
  * **Resolution (Partially Implemented):**
    * Modified `frontend/src/app/dashboard/users/[id]/page.tsx`'s `useEffect` hook to check if `userId === 'create'`.
    * If `userId` is "create", it now bypasses the user detail fetch and sets `loading` to `false` and `user` to `null`.
    * Added a placeholder conditional rendering block for the "create" mode, indicating where the actual create user form should be implemented.
  * **Outcome:** The erroneous `GET /api/users/create` call is prevented. The page now shows a placeholder for the create user form.

**Next Steps:**

* Update `CURRENT_DECISIONS.md`.
* Update `CURRENT_TODO.md`.
* The full implementation of the "Create User" form (input fields, validation, POST request on submit) is a pending sub-task.
* Attempt completion for the fix of the 400 error.
