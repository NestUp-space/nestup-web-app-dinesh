---
ticket_id: 20250521-001
task_name: Fix Designer Role Project Access
description: User 'designer@nestup.space' is unable to access the project list (403 Forbidden). The 'designer' role in `seed.ts` is intended to have `projects.view` permission. Re-running the seed script to ensure correct role-permission mapping in the database.
timestamps:
  created: 2025-05-21T10:42:00Z
  started: 2025-05-21T10:42:00Z
status: pending-verification
assigned_to: cline
assigned_by: user
dependencies: None
related_files:
  - backend/prisma/seed.ts
  - backend/src/middlewares/permission.middleware.ts
  - backend/src/routes/project.routes.ts
  - backend/src/constants/permissions.ts
  - backend/prisma/migrations/20250521225100_standardize_project_view_permission/migration.sql
updates:
  - 2025-05-21T10:42:00Z: Initiating task. Plan is to re-run prisma db seed.
  - 2025-05-21T10:42:51Z: Prisma db seed command executed successfully. The 'designer' role should now have 'projects.view' permission. Awaiting user verification.
  - 2025-05-21T10:51:00Z: Identified permission string inconsistency ('project.view' vs 'projects.view').
  - 2025-05-21T10:51:26Z: Created and applied SQL migration to update 'project.view' to 'projects.view' in UserPermission table. Re-ran seed. Awaiting user verification.
---
