-- Update singular 'project.view' to plural 'projects.view'
UPDATE "UserPermission"
SET "permission" = 'projects.view'
WHERE "permission" = 'project.view';
