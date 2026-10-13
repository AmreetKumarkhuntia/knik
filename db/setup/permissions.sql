-- Optional, manual setup step: not a migration, and scripts/migrate.sh never runs it.
--
-- Grants an application role access to the knik database when the app connects as a role other than
-- the one that owns the tables. Replace "user" (and the database name "knik") with your own, then run
-- it once as the table owner or a superuser:
--
--   psql -h <host> -U <owner> -d knik -f db/setup/permissions.sql

GRANT CONNECT ON DATABASE knik TO "user";

GRANT USAGE ON SCHEMA public TO "user";

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "user";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO "user";

-- SERIAL ids (schedules, executions, node_executions) draw from sequences, which the table grants do not cover.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "user";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO "user";
