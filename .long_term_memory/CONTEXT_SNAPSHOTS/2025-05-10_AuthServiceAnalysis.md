# Authentication Service (auth.service.ts) Analysis (as of 2025-05-10)

This document summarizes the key functionalities and characteristics of `backend/src/services/auth.service.ts`.

## Key Functions & Logic

* **`registerUser(data: RegisterUserData)`:**
  * **Input:** `name`, `email`, `phoneNumber`, `password`, optional `roleName` (defaults to 'client' via hardcoded `roleId=1`).
  * **Logic:**
        1. Checks if a user already exists with the given email OR phone number using `prisma.user.findFirst`.
        2. If user exists, returns a `ServiceResponse.failure` with `StatusCodes.BAD_REQUEST`.
        3. **Hardcodes `roleId = 1` for new users.** (A TODO comment indicates this needs to be made more robust).
        4. Hashes the provided password using `bcrypt.hash(data.password, 10)`.
        5. Creates a new user record in the database via `prisma.user.create` with:
            *`verified: false` (default)
            * `isActive: true` (default)
        6. Excludes the password from the user object returned in the success response.
  * **Output:** `ServiceResponse<Omit<User, 'password'>>` on success (status `CREATED`), or `ServiceResponse<null>` on failure.

* **`loginUser(data: LoginUserData)`:**
  * **Input:** `email`, `password`.
  * **Logic:**
        1. Finds user by `email` using `prisma.user.findUnique`, including `role` details.
        2. If user not found, returns `ServiceResponse.failure` (`UNAUTHORIZED`).
        3. Checks if `user.isActive`. If not, returns `ServiceResponse.failure` (`FORBIDDEN`).
        4. (An email verification check `!user.verified` is commented out for later implementation).
        5. Compares the provided password with the stored hash using `bcrypt.compare`. If invalid, returns `ServiceResponse.failure` (`UNAUTHORIZED`).
        6. Ensures `process.env.JWT_SECRET` is defined. If not, logs an error and returns `ServiceResponse.failure` (`INTERNAL_SERVER_ERROR`).
        7. **JWT Generation:** Creates a JWT payload containing `id`, `email`, `name`, and `user.role.roleType`.
        8. Signs the token using `jsonwebtoken.sign` with the `JWT_SECRET` and an expiry of `'1h'`. (A TODO comment suggests considering longer expiry or refresh tokens).
        9. Excludes the password from the user object returned in the success response.
  * **Output:** `ServiceResponse<{ token: string; user: Omit<User, 'password'> }>` on success (status `OK`), or `ServiceResponse<null>` on failure.

* **`resetPassword(email: string)`:**
  * Currently a placeholder function. Logs the request and returns `ServiceResponse.failure` (`NOT_IMPLEMENTED`).
  * A TODO comment indicates the need to implement token generation, email sending, and secure token storage.

* **`getUserById(id: number)`:**
  * **Input:** User `id`.
  * **Logic:** Fetches user by `id` using `prisma.user.findUnique`, including `role` details.
  * Excludes password from the returned user object.
  * **Output:** `ServiceResponse<(Omit<User, 'password'> & { role: UserRole }) | null>` on success (status `OK`), or `ServiceResponse<null>` on failure.

## Security Mechanisms Employed

* **Password Hashing:** `bcrypt` is used with a cost factor of 10.
* **Token-based Authentication:** JSON Web Tokens (JWTs) are used for session management.
* **JWT Secret:** The secret key for signing JWTs is loaded from the `JWT_SECRET` environment variable.
* **HTTPS:** (Assumed, but critical for token transmission security).

## Dependencies

* `bcrypt`: For password hashing.
* `jsonwebtoken`: For JWT creation and management.
* `prisma`: For database interaction (via the client instance from `../config/db`).
* `http-status-codes`: For standardized HTTP status codes in responses.
* `ServiceResponse`: A custom wrapper likely used for standardizing API response structures across services.

## Error Handling

* The service uses the custom `ServiceResponse.failure(message, data, statusCode)` pattern to return structured error responses with appropriate HTTP status codes.
* Internal server errors (e.g., missing `JWT_SECRET`, database errors during registration) are logged to `console.error` and typically result in a `StatusCodes.INTERNAL_SERVER_ERROR` response.

## Noted TODOs & Areas for Future Improvement (from code comments)

* **Robust Role Assignment:** The hardcoding of `roleId = 1` during user registration needs to be replaced with a more dynamic or configurable mechanism.
* **Email Verification:** The check for `user.verified` during login is currently commented out, indicating a planned email verification flow is not yet active.
* **JWT Expiry/Refresh Tokens:** The current JWT expiry is '1h'. The code includes a comment to consider longer expiry times or implement a refresh token strategy for better user experience and security.
* **Password Reset Functionality:** The `resetPassword` function is a placeholder and needs full implementation.
