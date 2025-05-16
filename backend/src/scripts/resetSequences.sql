-- Reset sequences for UserRole table
SELECT setval(pg_get_serial_sequence('"UserRole"', 'id'), coalesce(max(id), 0) + 1, false) FROM "UserRole";
