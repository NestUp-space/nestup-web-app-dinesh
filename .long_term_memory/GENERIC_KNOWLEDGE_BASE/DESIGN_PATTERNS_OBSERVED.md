# Design Patterns Observed

This document records general software design patterns observed during project analyses, along with their context, components, benefits, and considerations.

---

## Role-Based Access Control (RBAC)

**Context:** Observed in the Prisma schema with `UserRole`, `UserPermission`, and `RolePermissionMapping` models (e.g., Nestup Web App project).
**Pattern:** A standard security design pattern that restricts system access to authorized users based on their assigned roles.
**Components:**

- **User:** The entity requesting access.
- **Role:** A collection of permissions typically corresponding to a job function or user category (e.g., "Admin", "Engineer", "Client").
- **Permission:** A specific authorization to perform an action on a resource (e.g., "create_project", "view_task_files").
- **Role-Permission Mapping:** Assigns permissions to roles.
- **User-Role Mapping:** Assigns roles to users (e.g., via a foreign key like `User.roleId`).
**Benefits:**
- Simplifies permission management by grouping permissions into roles.
- Enhances security by enforcing the principle of least privilege.
- Improves maintainability as user capabilities can be modified by changing role assignments or the permissions associated with roles, rather than managing permissions per user.

---

## Extensible Entity Metadata via JSON Fields

**Context:** Observed with fields like `Task.metadataJson`, `SiteVisitBox.inputs`, `ProjectCatalogueItemInstance.runtimeInputsJson` in projects utilizing Prisma or similar ORMs that support JSON types (e.g., Nestup Web App project).
**Pattern:** Storing entity-specific, variable, or evolving structured data in a `Json` typed database column.
**Use Case:** Ideal when different instances of an entity (e.g., different types of Tasks, various catalogue items) require distinct sets of metadata, or when these metadata requirements are expected to change frequently or vary significantly across instances.
**Benefits:**

- **Flexibility:** Allows adding new attributes or changing metadata structure for specific entities without requiring database schema migrations.
- **Reduced Schema Complexity:** Avoids creating numerous nullable columns for attributes that are only relevant to a subset of records, keeping the main table schema cleaner.
**Considerations:**
- **Data Integrity & Validation:** The structure and content of the JSON data must be validated at the application layer, as the database typically only ensures it's valid JSON, not that it adheres to a specific internal schema.
- **Querying Complexity:** Querying based on values *within* JSON fields can be less performant and more syntactically complex than querying indexed standard columns. Database support and syntax for JSON querying vary (e.g., PostgreSQL's JSONB operators).
- **Indexing:** While some databases offer indexing capabilities for JSON fields/paths, these might be less efficient than standard column indexes. Careful consideration is needed if frequent, performant querying on JSON content is required.
- **Data Type Consistency:** Ensure consistent data types within the JSON for similar attributes across different records to simplify application logic.

---

## Audit Trail (Basic Implementation)

**Context:** Observed with models like `UserAction` that link user activity to specific entities and timestamps (e.g., Nestup Web App project).
**Pattern:** A mechanism for recording significant events or changes initiated by users or system processes within an application.
**Components Typically Logged:**

- **Actor:** Who or what performed the action (e.g., `UserAction.updatedBy` linking to a `User` ID).
- **Action Type/Description:** What was done. This can be an explicit enumerated type, a descriptive string, or inferred from the context of the log entry (e.g., `UserAction.comment` might describe the action).
- **Target Entity/Resource:** What part of the system was affected (e.g., `UserAction.projectId`, `UserAction.taskId` linking to specific records).
- **Timestamp:** When the action occurred (e.g., `UserAction.updatedAt` or a dedicated `actionTimestamp`).
- **Changes (Optional but Recommended for Detailed Audits):** Specific details of what data changed (e.g., old values vs. new values). This was not explicitly detailed in the observed `UserAction` model beyond a general `comment`.
**Benefits:**
- **Traceability & History:** Helps understand the sequence of changes to important data or system states.
- **Accountability:** Identifies which user or process was responsible for a change.
- **Debugging & Troubleshooting:** Can provide crucial context when investigating issues or unexpected behavior.
- **Security & Compliance:** Often a requirement for meeting security standards or regulatory compliance.
**Considerations:**
- **Granularity:** Decide what level of detail to log. Overly verbose logging can be resource-intensive.
- **Storage:** Audit logs can grow very large; consider storage implications and archival strategies.
- **Performance:** Logging should not significantly degrade application performance. Asynchronous logging or dedicated logging services can help.
- **Security of Logs:** Audit logs themselves can contain sensitive information and need to be protected.

---

## Token-Based Authentication Flow (JWT Example)

**Context:** Observed in `auth.service.ts` of the Nestup project.
**Pattern:** A common pattern for securing web APIs where users exchange credentials for a token, which is then used for subsequent authenticated requests.
**Typical Flow:**

1. **Registration:** User provides details, password is hashed (e.g., with bcrypt), user record created.
2. **Login:** User provides credentials (e.g., email/password). Server validates credentials against stored hash.
3. **Token Generation:** Upon successful login, server generates a JWT signed with a secret key. Payload typically includes user identifier, roles/permissions, and an expiry time.
4. **Token Transmission:** Token is sent to the client (e.g., in HTTP response body).
5. **Token Storage (Client-side):** Client stores the token securely (e.g., `localStorage`, `sessionStorage`, httpOnly cookie).
6. **Authenticated Requests:** Client sends the JWT in an HTTP header (commonly `Authorization: Bearer <token>`) for subsequent requests to protected resources.
7. **Token Validation (Server-side):** Server middleware verifies the JWT's signature and expiry. If valid, allows access and may extract user info from payload for request processing.
**Key Components & Considerations:**

- **Password Hashing:** Always hash passwords with a strong, salted algorithm (e.g., bcrypt, Argon2).
- **JWT Secret Management:** The `JWT_SECRET` must be kept confidential and be sufficiently complex. Store in environment variables.
- **Token Expiry:** Tokens should have a reasonable expiry time to limit the window of opportunity if a token is compromised.
- **Refresh Tokens (Optional but Recommended):** For better UX and security, use short-lived access tokens and longer-lived refresh tokens to obtain new access tokens without requiring re-login. (This aspect was noted as a TODO in the observed service).
- **Payload Content:** Keep JWT payload concise but include necessary info to avoid excessive DB lookups on every request.
- **HTTPS:** Always transmit tokens over HTTPS.
- **Token Revocation:** Consider strategies for token revocation if needed (e.g., blocklists), though this adds state to a typically stateless mechanism.

---

## Controller-Service Pattern (with DTOs/Validation)

**Context:** Observed in `auth.controller.ts` and its interaction with `auth.service.ts` in the Nestup project. Also, a deviation noted in `RoleController` which directly uses Prisma.
**Pattern:** A common architectural pattern for organizing backend logic, especially in web applications.
**Components:**

- **Controller:** Handles incoming HTTP requests. Responsibilities typically include:
  - Parsing request data (body, params, query).
  - **Validating input** (e.g., using Data Transfer Objects (DTOs) or validation schemas like Zod).
  - Calling appropriate methods in the Service layer to perform business logic.
  - Formatting the response (often based on a result from the service layer) and sending it back to the client with the correct HTTP status code.
  - Should generally be "thin" and delegate complex logic.
- **Service:** Contains the core business logic. Responsibilities include:
  - Implementing use cases.
  - Interacting with data access layers (repositories, ORMs) or other services.
  - Performing complex calculations or orchestrating multiple steps.
  - Returning results (or errors) to the Controller, often in a structured way (e.g., a `ServiceResponse` object).
  - **Error Handling:** Service methods should clearly indicate success or failure, often returning a structured response object (e.g., `{ success: boolean, data?: T, error?: ErrorDetails }`) that controllers can then map to appropriate HTTP responses.
  - **Transaction Management:** Services are often responsible for managing database transactions if an operation involves multiple data modifications that must succeed or fail together.
- **DTOs (Data Transfer Objects) / Validation Schemas:** Used to define the expected structure and constraints of request/response data. Zod schemas, for instance, serve this purpose for input validation in controllers.
- **Repositories (Optional but Common):**
  - For more complex applications, a repository layer can be added between services and the ORM/database.
  - Repositories encapsulate data access logic (queries, direct ORM calls).
  - Services call repository methods, further decoupling business logic from specific data access technologies.
  - This makes it easier to switch ORMs or database technologies and to mock data access for testing services.
**Benefits:**
- **Separation of Concerns:** Clearly separates HTTP request/response handling from business logic.
- **Testability:** Services can be unit-tested independently of the web framework. Controllers can be tested by mocking services.
- **Reusability:** Business logic in services can potentially be reused by different controllers or entry points (e.g., CLI, scheduled jobs).
- **Maintainability:** Code is more organized and easier to understand.
- **Response Formatting:** Services may also be responsible for transforming internal entity models into Data Transfer Objects (DTOs) suitable for API responses (as seen with `transformToResponseDto` methods in Nestup services), ensuring controllers remain focused on HTTP concerns and API contracts are consistently met.
**Deviations:**
- Sometimes, for very simple CRUD operations on a single entity, developers might choose to have the controller interact directly with the ORM/database to reduce boilerplate, as seen in `RoleController`. While this can be quicker for trivial cases, it can lead to thicker controllers and less reusable business logic if the operations become more complex.
- **Presentation Logic in Controllers:** Occasionally, presentation-specific formatting logic (like CSV generation in `SiteVisitBoxController` for a download endpoint) might appear in controllers. While this can be straightforward for simple, one-off cases, for more complex or reusable formatting, moving this logic to a dedicated utility or a service method is generally preferred to maintain thinner controllers and better separation of concerns.

---

## API Endpoint Design for CRUD Operations

**Context:** Observed in `project.controller.ts` for Project, Task, and Subtask entities in the Nestup project.
**Pattern:** Standard RESTful or REST-like endpoint design for Create, Read, Update, Delete operations on resources.
**Common Structure:**

- **Create:** `POST /resource` (e.g., `POST /projects`)
- **Read (List):** `GET /resource` (e.g., `GET /projects`)
- **Read (Single):** `GET /resource/:id` (e.g., `GET /projects/:projectId`)
- **Update:** `PUT /resource/:id` or `PATCH /resource/:id` (e.g., `PUT /projects/:projectId`, `PATCH /tasks/:taskId/status`)
- **Delete:** `DELETE /resource/:id` (e.g., `DELETE /projects/:projectId`)
**Considerations:**
- **Nesting for Relationships:** Child resources are often nested under parent resources in the URI to represent hierarchy (e.g., `POST /projects/:projectId/tasks`, `GET /tasks/:taskId/subtasks`).
- **HTTP Methods:** Use appropriate HTTP methods (POST for create, GET for read, PUT for full update, PATCH for partial update, DELETE for delete).
- **Status Codes:** Use standard HTTP status codes to indicate the outcome of the operation (e.g., 201 Created, 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error).
- **Request/Response Bodies:** Typically JSON. Use DTOs (Data Transfer Objects) or validation schemas (like Zod) to define clear contracts for request payloads and ensure data integrity.
- **Idempotency:** PUT and DELETE operations should ideally be idempotent (multiple identical requests have the same effect as a single request).
- **Partial Updates:** PATCH is suitable for applying partial modifications to a resource, where only the fields to be changed are sent in the request body.

---

## Managing Join Tables for Many-to-Many Relationships (Permissions Example)

**Context:** Observed in `RoleController` for managing `RolePermissionMapping`.
**Pattern:** When handling many-to-many relationships (e.g., a role can have multiple permissions, a permission can belong to multiple roles), the controller/service needs to manage the records in the join table (`RolePermissionMapping`).
**Common Operations:**

- **Assigning Permissions (Create/Update Role):**
  - When creating a role with permissions, or updating a role's permissions:
        1. Iterate through the provided list of desired permissions.
        2. For each permission:
            - Find or create the `UserPermission` record if it doesn't exist (to ensure referential integrity and allow dynamic permission creation).
            - Create a new entry in the `RolePermissionMapping` join table linking the `roleId` and the `permissionId`.
    - If updating, it's common to first delete all existing mappings for the role and then create the new set of mappings to ensure a clean state.
- **Retrieving Permissions for a Role:**
  - Fetch the role along with its related mappings from the join table, and then include the actual permission details (e.g., permission name/key).
  - Often transformed into a more convenient format for the client (e.g., an array of permission names or an object map `{ "permissionKey": true }`).
**Considerations:**
- **Atomicity:** For updates involving deletion and re-creation of mappings, consider wrapping these operations in a database transaction if the ORM/database supports it, to ensure data consistency in case of partial failures. Prisma's `$transaction` API can be used for this.
- **Efficiency:** For bulk updates, be mindful of the number of database queries. Some ORMs offer batch operations for creating/deleting multiple join table records.

---

## Custom Error Classes for Specific HTTP Responses

**Context:** Observed in `siteVisit.controller.ts` with `BadRequestError` and `NotFoundError`.
**Pattern:** Defining custom error classes that extend the base `Error` class and include additional properties like `statusCode`. This allows services or controllers to throw specific error types that can then be caught and mapped to appropriate HTTP status codes and response messages in a centralized error handler or directly in the controller.
**Benefits:**

- **Clearer Error Semantics:** Makes the type of error explicit (e.g., `NotFoundError` clearly indicates a resource was not found).
- **Standardized Error Responses:** Helps in sending consistent error responses to the client.
- **Improved Error Handling Logic:** Allows `catch` blocks to differentiate between types of errors using `instanceof` and handle them accordingly.
**Implementation Sketch:**

```typescript
// common/errors/customErrors.ts
// export class CustomAPIError extends Error {
//   public readonly statusCode: number;
//   constructor(message: string, statusCode: number) {
//     super(message);
//     this.statusCode = statusCode;
//     Object.setPrototypeOf(this, CustomAPIError.prototype); // For correct instanceof behavior
//   }
// }
// export class BadRequestError extends CustomAPIError {
//   constructor(message: string = 'Bad Request') {
//     super(message, StatusCodes.BAD_REQUEST);
//   }
// }
// export class NotFoundError extends CustomAPIError {
//   constructor(message: string = 'Not Found') {
//     super(message, StatusCodes.NOT_FOUND);
//   }
// }

// In a service or controller:
// if (!entity) {
//   throw new NotFoundError('Entity not found');
// }

// In controller's catch block or error middleware:
// catch (error) {
//   if (error instanceof CustomAPIError) { // or specific types like NotFoundError
//     return res.status(error.statusCode).json({ message: error.message });
//   }
//   // Handle other errors
// }
```
